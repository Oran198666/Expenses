"use server";
// Server Actions for the Reports screen: report totals, export rows and setup.
// Every action checks the signed-in user and re-validates its input. Queries
// run as that user, so Row Level Security limits them to their own rows.
import { unstable_rethrow } from "next/navigation";
import { addDays, utcToday } from "@/lib/dates";
import { CURRENCIES, DEFAULT_CURRENCY, type CurrencyCode } from "@/lib/expenses/constants";
import {
  addMoney,
  parseReportCriteria,
  type ExportScope,
  type ReportCriteria,
  type ReportData,
} from "@/lib/expenses/reports";
import { GENERIC_ERROR, requireUser } from "@/lib/supabase/session";

export type ReportResult = { ok: true; report: ReportData } | { ok: false; error: string };

export type ExportRow = {
  date: string;
  category: string;
  description: string;
  amount: number;
  currency: string;
};

export type ExportRowsResult = { ok: true; rows: ExportRow[] } | { ok: false; error: string };

export type ReportSetup = {
  categories: { id: string; name: string }[];
  defaultCurrency: CurrencyCode;
  totalCount: number; // all expenses, every currency
};

type Supabase = Awaited<ReturnType<typeof requireUser>>["supabase"];

type DbRow = {
  amount: number | string;
  currency: string;
  expense_date: string;
  description: string | null;
  category: { name: string } | null;
};

// The database API returns at most 1,000 rows per request.
const BATCH = 1000;

/** Latest date a report may use: one day past UTC today covers every time zone (ADR-11). */
function serverToday(): string {
  return addDays(utcToday(), 1);
}

/**
 * Reads every matching row in batches (newest first). With criteria, only
 * that currency / date range / category; without, all the user's expenses.
 */
async function fetchAllRows(
  supabase: Supabase,
  criteria: ReportCriteria | null,
): Promise<DbRow[] | null> {
  const rows: DbRow[] = [];
  for (let offset = 0; ; offset += BATCH) {
    let query = supabase
      .from("expenses")
      .select("amount, currency, expense_date, description, category:categories(name)");
    if (criteria) {
      query = query.eq("currency", criteria.currency);
      if (criteria.startDate) query = query.gte("expense_date", criteria.startDate);
      if (criteria.endDate) query = query.lte("expense_date", criteria.endDate);
      if (criteria.categoryId) query = query.eq("category_id", criteria.categoryId);
    }
    const { data, error } = await query
      .order("expense_date", { ascending: false })
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range(offset, offset + BATCH - 1);
    if (error) return null;
    const batch = data as unknown as DbRow[];
    rows.push(...batch);
    if (batch.length < BATCH) return rows;
  }
}

/** Totals for one currency: by category, by year and by month (ADR-16). */
export async function getReport(criteria: ReportCriteria): Promise<ReportResult> {
  const clean = parseReportCriteria(criteria, serverToday());
  if (!clean) return { ok: false, error: "Please check the report filters and try again." };
  try {
    const { supabase } = await requireUser();
    const rows = await fetchAllRows(supabase, clean);
    if (!rows) return { ok: false, error: GENERIC_ERROR };

    let total = 0;
    const byCategory = new Map<string, number>();
    const byYear = new Map<number, number>();
    const byMonth = new Map<string, number>();
    for (const row of rows) {
      // Safety net: never add another currency in (the query already filters).
      if (row.currency !== clean.currency) continue;
      const amount = Number(row.amount);
      const year = Number(row.expense_date.slice(0, 4));
      const month = Number(row.expense_date.slice(5, 7));
      const name = row.category?.name ?? "Unknown";
      total = addMoney(total, amount);
      byCategory.set(name, addMoney(byCategory.get(name) ?? 0, amount));
      byYear.set(year, addMoney(byYear.get(year) ?? 0, amount));
      const key = `${year}-${month}`;
      byMonth.set(key, addMoney(byMonth.get(key) ?? 0, amount));
    }

    const years = [...byYear.keys()];
    const yearSeries: ReportData["byYear"] = [];
    if (years.length) {
      for (let y = Math.min(...years); y <= Math.max(...years); y++) {
        yearSeries.push({ year: y, amount: byYear.get(y) ?? 0 });
      }
    }

    return {
      ok: true,
      report: {
        total,
        count: rows.length,
        byCategory: [...byCategory]
          .map(([name, amount]) => ({ name, amount }))
          .sort((a, b) => b.amount - a.amount || a.name.localeCompare(b.name)),
        byYear: yearSeries,
        byMonth: [...byMonth].map(([key, amount]) => {
          const [year, month] = key.split("-").map(Number);
          return { year, month, amount };
        }),
      },
    };
  } catch (error) {
    unstable_rethrow(error);
    return { ok: false, error: GENERIC_ERROR };
  }
}

/** The rows to export: every expense ("all") or those matching the report filters. */
export async function getExportRows(
  scope: ExportScope,
  criteria: ReportCriteria,
): Promise<ExportRowsResult> {
  if (scope !== "all" && scope !== "filtered") return { ok: false, error: GENERIC_ERROR };
  let clean: ReportCriteria | null = null;
  if (scope === "filtered") {
    clean = parseReportCriteria(criteria, serverToday());
    if (!clean) return { ok: false, error: "Please check the report filters and try again." };
  }
  try {
    const { supabase } = await requireUser();
    const rows = await fetchAllRows(supabase, clean);
    if (!rows) return { ok: false, error: GENERIC_ERROR };
    return {
      ok: true,
      rows: rows.map((r) => ({
        date: r.expense_date,
        category: r.category?.name ?? "",
        description: r.description ?? "",
        amount: Number(r.amount),
        currency: r.currency,
      })),
    };
  } catch (error) {
    unstable_rethrow(error);
    return { ok: false, error: GENERIC_ERROR };
  }
}

/** The user's categories (creation order) and the currency they use most. */
export async function getReportSetup(): Promise<ReportSetup | null> {
  try {
    const { supabase } = await requireUser();
    const [categories, ...counts] = await Promise.all([
      supabase.from("categories").select("id, name").order("created_at"),
      ...CURRENCIES.map((c) =>
        supabase
          .from("expenses")
          .select("id", { count: "exact", head: true })
          .eq("currency", c.code),
      ),
    ]);
    if (categories.error) return null;
    let defaultCurrency: CurrencyCode = DEFAULT_CURRENCY;
    let best = 0;
    let totalCount = 0;
    counts.forEach((result, i) => {
      if (result.error) throw new Error("count failed");
      totalCount += result.count ?? 0;
      if ((result.count ?? 0) > best) {
        best = result.count ?? 0;
        defaultCurrency = CURRENCIES[i].code;
      }
    });
    return { categories: categories.data ?? [], defaultCurrency, totalCount };
  } catch (error) {
    unstable_rethrow(error);
    return null;
  }
}
