// Reports screen: the criteria shape and its checks (browser + server), the
// summary line, and helpers to shape chart data. One currency at a time (ADR-16).
import { isValidIsoDate } from "@/lib/dates";
import { isCurrency, type CurrencyCode } from "@/lib/expenses/constants";

export type ReportCriteria = {
  currency: CurrencyCode;
  startDate?: string; // "YYYY-MM-DD"
  endDate?: string;
  categoryId?: string;
};

export type ReportInput = {
  currency: string;
  startDate: string;
  endDate: string;
  categoryId: string;
};

export type ReportErrors = Partial<Record<keyof ReportInput, string>>;

export type ExportScope = "all" | "filtered";

export type ReportData = {
  total: number;
  count: number;
  byCategory: { name: string; amount: number }[]; // largest first
  byYear: { year: number; amount: number }[]; // every year first→last, gaps as 0
  byMonth: { year: number; month: number; amount: number }[]; // only months with spending
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
] as const;

/**
 * Checks the report selectors and turns them into clean criteria.
 * @param today the latest allowed date ("YYYY-MM-DD")
 */
export function validateReport(
  input: ReportInput,
  today: string,
): { errors: ReportErrors; value?: ReportCriteria } {
  const errors: ReportErrors = {};
  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

  const currency = str(input?.currency);
  if (!isCurrency(currency)) {
    errors.currency = "Please choose a currency.";
    return { errors };
  }
  const value: ReportCriteria = { currency };

  const start = str(input?.startDate);
  const end = str(input?.endDate);
  if (start) {
    if (!isValidIsoDate(start)) errors.startDate = "Please enter a valid date.";
    else if (start > today) errors.startDate = "The date can't be in the future.";
    else value.startDate = start;
  }
  if (end) {
    if (!isValidIsoDate(end)) errors.endDate = "Please enter a valid date.";
    else if (end > today) errors.endDate = "The date can't be in the future.";
    else if (value.startDate && end < value.startDate) {
      errors.endDate = "The end date can't be before the start date.";
    } else value.endDate = end;
  }

  const categoryId = str(input?.categoryId);
  if (categoryId) {
    if (!UUID.test(categoryId)) errors.categoryId = "Please choose a valid category.";
    else value.categoryId = categoryId;
  }

  if (Object.keys(errors).length > 0) return { errors };
  return { errors, value };
}

/** Re-checks criteria that came from a request. Null if invalid. */
export function parseReportCriteria(raw: unknown, today: string): ReportCriteria | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;
  const s = (v: unknown) => (typeof v === "string" ? v : "");
  return (
    validateReport(
      {
        currency: s(r.currency),
        startDate: s(r.startDate),
        endDate: s(r.endDate),
        categoryId: s(r.categoryId),
      },
      today,
    ).value ?? null
  );
}

/** e.g. "ILS only · 2026-10-01 to 2026-10-31 · Food" */
export function describeReport(c: ReportCriteria, categoryName?: string): string {
  const parts = [`${c.currency} only`];
  if (c.startDate && c.endDate) parts.push(`${c.startDate} to ${c.endDate}`);
  else if (c.startDate) parts.push(`from ${c.startDate}`);
  else if (c.endDate) parts.push(`until ${c.endDate}`);
  else parts.push("all dates");
  parts.push(c.categoryId ? (categoryName ?? "selected category") : "all categories");
  return parts.join(" · ");
}

/** Adds two money amounts without floating-point drift (cents). */
export function addMoney(a: number, b: number): number {
  return Math.round(a * 100 + b * 100) / 100;
}

/** The 12 months of a year (only up to today's month in the current year). */
export function monthSeries(
  data: ReportData["byMonth"],
  year: number,
  today: string,
): { label: string; month: number; amount: number }[] {
  const [ty, tm] = today.split("-").map(Number);
  const last = year === ty ? tm : year > ty ? 0 : 12;
  return Array.from({ length: last }, (_, i) => {
    const month = i + 1;
    const hit = data.find((m) => m.year === year && m.month === month);
    return { label: MONTH_SHORT[i], month, amount: hit?.amount ?? 0 };
  });
}
