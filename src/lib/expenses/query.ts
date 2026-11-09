// One shared expense query for the Home and Filters tables (ADR-15):
// filters + sort + one page with the same Load More rules.
import "server-only";
import type { createClient } from "@/lib/supabase/server";
import { PAGE_SIZE, type SortDir, type SortKey } from "@/lib/expenses/constants";
import { builtInDateRange, type FilterCriteria } from "@/lib/expenses/filters";

export type ExpenseRow = {
  id: string;
  amount: number;
  currency: string;
  date: string;
  description: string | null;
  categoryId: string;
  categoryName: string;
};

type DbExpense = {
  id: string;
  amount: number | string;
  currency: string;
  expense_date: string;
  description: string | null;
  category_id: string;
  category: { name: string } | null;
};

type Supabase = Awaited<ReturnType<typeof createClient>>;

const EXPENSE_COLUMNS =
  "id, amount, currency, expense_date, description, category_id, category:categories(name)";

function toRow(e: DbExpense): ExpenseRow {
  return {
    id: e.id,
    amount: Number(e.amount),
    currency: e.currency,
    date: e.expense_date,
    description: e.description,
    categoryId: e.category_id,
    categoryName: e.category?.name ?? "",
  };
}

/**
 * Makes every character match literally inside a regular expression. (A
 * case-insensitive regex is used instead of ILIKE because the database API
 * turns "*" into a wildcard in LIKE patterns.)
 */
function escapeRegex(text: string): string {
  return text.replace(/[\\^$.|?*+()[\]{}]/g, (ch) => `\\${ch}`);
}

/**
 * One page (25) of the signed-in user's expenses (RLS limits rows to theirs).
 * Returns { rows, hasMore } or null on a database error.
 */
export async function fetchExpensePage(
  supabase: Supabase,
  criteria: FilterCriteria,
  sort: SortKey,
  dir: SortDir,
  offset: number,
): Promise<{ rows: ExpenseRow[]; hasMore: boolean } | null> {
  const ascending = dir === "asc";
  let query = supabase.from("expenses").select(EXPENSE_COLUMNS);

  // All criteria combine (ADR-14).
  const range = builtInDateRange(criteria);
  if (range) query = query.gte("expense_date", range.from).lt("expense_date", range.before);
  if (criteria.startDate) query = query.gte("expense_date", criteria.startDate);
  if (criteria.endDate) query = query.lte("expense_date", criteria.endDate);
  if (criteria.maxAmount !== undefined) query = query.lte("amount", criteria.maxAmount);
  if (criteria.keyword) {
    query = query.regexIMatch("description", escapeRegex(criteria.keyword));
  }

  if (sort === "amount") query = query.order("amount", { ascending });
  // Sort by the joined category's name.
  if (sort === "category") query = query.order("category(name)", { ascending });
  // Ties (and the date sort itself) fall back to date, then entry order.
  const byDate = sort === "date" ? ascending : false;
  query = query
    .order("expense_date", { ascending: byDate })
    .order("created_at", { ascending: byDate })
    .order("id", { ascending: byDate });

  // Ask for one extra row to know whether "Load More" is needed.
  const { data, error } = await query.range(offset, offset + PAGE_SIZE);
  if (error) return null;

  const rows = (data as unknown as DbExpense[]).map(toRow);
  return { rows: rows.slice(0, PAGE_SIZE), hasMore: rows.length > PAGE_SIZE };
}
