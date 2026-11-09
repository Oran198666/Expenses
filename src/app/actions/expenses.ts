"use server";
// Server Actions for the Home screen: list, create, update and delete expenses.
// Every action checks the signed-in user and re-validates its input. Queries
// run as that user, so Row Level Security limits them to their own rows.
import { unstable_rethrow } from "next/navigation";
import { addDays, isValidIsoDate, utcToday } from "@/lib/dates";
import {
  isSortDir,
  isSortKey,
  type SortDir,
  type SortKey,
} from "@/lib/expenses/constants";
import { fetchExpensePage, type ExpenseRow } from "@/lib/expenses/query";
import {
  validateExpense,
  type ExpenseInput,
  type FieldErrors,
} from "@/lib/expenses/validation";
import { GENERIC_ERROR, requireUser } from "@/lib/supabase/session";

export type { ExpenseRow };

export type ListExpensesResult =
  | { ok: true; rows: ExpenseRow[]; hasMore: boolean }
  | { ok: false; error: string };

export type MutationResult =
  | { ok: true }
  | { ok: false; error?: string; fieldErrors?: FieldErrors };

function cleanOffset(offset: unknown): number {
  return Number.isInteger(offset) && (offset as number) >= 0 ? (offset as number) : 0;
}

/** One page (25) of the user's expenses, sorted as requested. */
export async function listExpenses(
  sort: SortKey = "date",
  dir: SortDir = "desc",
  offset = 0,
): Promise<ListExpensesResult> {
  const key = isSortKey(sort) ? sort : "date";
  const order = isSortDir(dir) ? dir : "desc";
  const start = cleanOffset(offset);

  try {
    const { supabase } = await requireUser();
    const page = await fetchExpensePage(supabase, {}, key, order, start);
    if (!page) return { ok: false, error: GENERIC_ERROR };
    return { ok: true, ...page };
  } catch (error) {
    unstable_rethrow(error);
    return { ok: false, error: GENERIC_ERROR };
  }
}

/**
 * The latest allowed expense date: the browser's local "today", kept within
 * one day of the server's UTC date so it can't be used to allow far-future dates (ADR-11).
 */
function latestAllowedDate(clientToday: unknown): string {
  const today = utcToday();
  const min = addDays(today, -1);
  const max = addDays(today, 1);
  if (isValidIsoDate(clientToday) && clientToday >= min && clientToday <= max) {
    return clientToday;
  }
  return today;
}

function cleanInput(input: ExpenseInput): ExpenseInput {
  const str = (v: unknown) => (typeof v === "string" ? v : "");
  return {
    amount: str(input?.amount),
    currency: str(input?.currency),
    categoryId: str(input?.categoryId),
    date: str(input?.date),
    description: str(input?.description),
  };
}

async function saveExpense(
  id: string | null,
  rawInput: ExpenseInput,
  clientToday: string,
): Promise<MutationResult> {
  const input = cleanInput(rawInput);
  try {
    const { supabase, userId } = await requireUser();

    // Look up the category (own rows only, through RLS) for the "Other" rule.
    let categoryName: string | undefined;
    if (input.categoryId) {
      const { data, error } = await supabase
        .from("categories")
        .select("name")
        .eq("id", input.categoryId)
        .maybeSingle();
      if (error && error.code !== "22P02") return { ok: false, error: GENERIC_ERROR };
      categoryName = data?.name;
    }

    const { errors, value } = validateExpense(
      input,
      latestAllowedDate(clientToday),
      categoryName,
    );
    if (!value) return { ok: false, fieldErrors: errors };

    const record = {
      amount: value.amount,
      currency: value.currency,
      category_id: value.categoryId,
      expense_date: value.date,
      description: value.description,
    };

    if (id === null) {
      const { error } = await supabase
        .from("expenses")
        .insert({ ...record, user_id: userId });
      if (error) return dbError(error.code);
    } else {
      const { data, error } = await supabase
        .from("expenses")
        .update(record)
        .eq("id", id)
        .select("id");
      if (error) return dbError(error.code);
      if (!data || data.length === 0) {
        return { ok: false, error: "This expense no longer exists." };
      }
    }
    return { ok: true };
  } catch (error) {
    unstable_rethrow(error);
    return { ok: false, error: GENERIC_ERROR };
  }
}

function dbError(code: string | undefined): MutationResult {
  // 23503: the category was deleted (or isn't the user's) in the meantime.
  if (code === "23503") {
    return { ok: false, fieldErrors: { categoryId: "Please choose a category." } };
  }
  // 23514: a database check failed (amount, currency, date, description).
  if (code === "23514") {
    return { ok: false, error: "Please check the values and try again." };
  }
  return { ok: false, error: GENERIC_ERROR };
}

export async function createExpense(
  input: ExpenseInput,
  clientToday: string,
): Promise<MutationResult> {
  return saveExpense(null, input, clientToday);
}

export async function updateExpense(
  id: string,
  input: ExpenseInput,
  clientToday: string,
): Promise<MutationResult> {
  if (typeof id !== "string" || !id) return { ok: false, error: GENERIC_ERROR };
  return saveExpense(id, input, clientToday);
}

export async function deleteExpense(id: string): Promise<MutationResult> {
  if (typeof id !== "string" || !id) return { ok: false, error: GENERIC_ERROR };
  try {
    const { supabase } = await requireUser();
    const { data, error } = await supabase
      .from("expenses")
      .delete()
      .eq("id", id)
      .select("id");
    if (error) return { ok: false, error: GENERIC_ERROR };
    if (!data || data.length === 0) {
      return { ok: false, error: "This expense no longer exists." };
    }
    return { ok: true };
  } catch (error) {
    unstable_rethrow(error);
    return { ok: false, error: GENERIC_ERROR };
  }
}
