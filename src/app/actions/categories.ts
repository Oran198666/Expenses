"use server";
// Server Actions for the Categories screen. Each action checks the signed-in
// user and runs as that user, so Row Level Security limits it to their rows.
import { unstable_rethrow } from "next/navigation";
import { PAGE_SIZE } from "@/lib/expenses/constants";
import { validateCategoryName } from "@/lib/expenses/validation";
import { GENERIC_ERROR, requireUser } from "@/lib/supabase/session";

export type Category = {
  id: string;
  name: string;
  isPredefined: boolean;
  expenseCount: number;
};

export type CategoryExpense = {
  id: string;
  amount: number;
  currency: string;
  date: string;
  description: string | null;
};

export type ListCategoriesResult =
  | { ok: true; categories: Category[] }
  | { ok: false; error: string };

export type ListCategoryExpensesResult =
  | { ok: true; rows: CategoryExpense[]; hasMore: boolean }
  | { ok: false; error: string };

export type CategoryResult = { ok: true; id?: string } | { ok: false; error: string };

type DbCategory = {
  id: string;
  name: string;
  is_predefined: boolean;
  expenses: { count: number }[];
};

const DUPLICATE_NAME = "A category with this name already exists.";

/** All of the user's categories, in creation order, with how many expenses use each. */
export async function listCategories(): Promise<ListCategoriesResult> {
  try {
    const { supabase } = await requireUser();
    const { data, error } = await supabase
      .from("categories")
      .select("id, name, is_predefined, expenses(count)")
      .order("created_at", { ascending: true })
      .order("name", { ascending: true });
    if (error) return { ok: false, error: GENERIC_ERROR };
    return {
      ok: true,
      categories: (data as unknown as DbCategory[]).map((c) => ({
        id: c.id,
        name: c.name,
        isPredefined: c.is_predefined,
        expenseCount: c.expenses?.[0]?.count ?? 0,
      })),
    };
  } catch (error) {
    unstable_rethrow(error);
    return { ok: false, error: GENERIC_ERROR };
  }
}

async function existingNames(
  supabase: Awaited<ReturnType<typeof requireUser>>["supabase"],
  exceptId?: string,
): Promise<string[] | null> {
  const { data, error } = await supabase.from("categories").select("id, name");
  if (error) return null;
  return data.filter((c) => c.id !== exceptId).map((c) => c.name);
}

export async function createCategory(name: string): Promise<CategoryResult> {
  const clean = typeof name === "string" ? name.trim() : "";
  try {
    const { supabase, userId } = await requireUser();
    const names = await existingNames(supabase);
    if (!names) return { ok: false, error: GENERIC_ERROR };
    const problem = validateCategoryName(clean, names);
    if (problem) return { ok: false, error: problem };

    const { data, error } = await supabase
      .from("categories")
      .insert({ user_id: userId, name: clean })
      .select("id")
      .single();
    if (error) {
      return { ok: false, error: error.code === "23505" ? DUPLICATE_NAME : GENERIC_ERROR };
    }
    return { ok: true, id: data.id };
  } catch (error) {
    unstable_rethrow(error);
    return { ok: false, error: GENERIC_ERROR };
  }
}

export async function renameCategory(id: string, name: string): Promise<CategoryResult> {
  if (typeof id !== "string" || !id) return { ok: false, error: GENERIC_ERROR };
  const clean = typeof name === "string" ? name.trim() : "";
  try {
    const { supabase } = await requireUser();
    const names = await existingNames(supabase, id);
    if (!names) return { ok: false, error: GENERIC_ERROR };
    const problem = validateCategoryName(clean, names);
    if (problem) return { ok: false, error: problem };

    const { data, error } = await supabase
      .from("categories")
      .update({ name: clean })
      .eq("id", id)
      .select("id");
    if (error) {
      return { ok: false, error: error.code === "23505" ? DUPLICATE_NAME : GENERIC_ERROR };
    }
    if (!data || data.length === 0) {
      return { ok: false, error: "This category no longer exists." };
    }
    return { ok: true, id };
  } catch (error) {
    unstable_rethrow(error);
    return { ok: false, error: GENERIC_ERROR };
  }
}

function usedMessage(count: number): string {
  return `Used by ${count} expense${count === 1 ? "" : "s"} — move or delete them first.`;
}

export async function deleteCategory(id: string): Promise<CategoryResult> {
  if (typeof id !== "string" || !id) return { ok: false, error: GENERIC_ERROR };
  try {
    const { supabase } = await requireUser();
    const { count, error: countError } = await supabase
      .from("expenses")
      .select("id", { count: "exact", head: true })
      .eq("category_id", id);
    if (countError) return { ok: false, error: GENERIC_ERROR };
    if (count && count > 0) return { ok: false, error: usedMessage(count) };

    const { data, error } = await supabase
      .from("categories")
      .delete()
      .eq("id", id)
      .select("id");
    if (error) {
      // 23503: an expense started using it in the meantime (the database blocks it).
      return {
        ok: false,
        error: error.code === "23503" ? "This category is used by expenses — move or delete them first." : GENERIC_ERROR,
      };
    }
    if (!data || data.length === 0) {
      return { ok: false, error: "This category no longer exists." };
    }
    return { ok: true };
  } catch (error) {
    unstable_rethrow(error);
    return { ok: false, error: GENERIC_ERROR };
  }
}

/** One page (25) of the expenses in a category, newest first. */
export async function listCategoryExpenses(
  categoryId: string,
  offset = 0,
): Promise<ListCategoryExpensesResult> {
  if (typeof categoryId !== "string" || !categoryId) {
    return { ok: false, error: GENERIC_ERROR };
  }
  const start = Number.isInteger(offset) && offset >= 0 ? offset : 0;
  try {
    const { supabase } = await requireUser();
    const { data, error } = await supabase
      .from("expenses")
      .select("id, amount, currency, expense_date, description")
      .eq("category_id", categoryId)
      .order("expense_date", { ascending: false })
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range(start, start + PAGE_SIZE);
    if (error) return { ok: false, error: GENERIC_ERROR };
    const rows = data.map((e) => ({
      id: e.id as string,
      amount: Number(e.amount),
      currency: e.currency as string,
      date: e.expense_date as string,
      description: e.description as string | null,
    }));
    return { ok: true, rows: rows.slice(0, PAGE_SIZE), hasMore: rows.length > PAGE_SIZE };
  } catch (error) {
    unstable_rethrow(error);
    return { ok: false, error: GENERIC_ERROR };
  }
}
