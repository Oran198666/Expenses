"use server";
// Server Actions for the Filters screen: search expenses, list and save filters.
// Every action checks the signed-in user and re-validates its input. Queries
// run as that user, so Row Level Security limits them to their own rows.
import { unstable_rethrow } from "next/navigation";
import { addDays, utcToday } from "@/lib/dates";
import { isSortDir, isSortKey, type SortDir, type SortKey } from "@/lib/expenses/constants";
import {
  FILTER_NAME_MAX,
  isEmptyCriteria,
  parseCriteria,
  type FilterCriteria,
} from "@/lib/expenses/filters";
import { fetchExpensePage } from "@/lib/expenses/query";
import { GENERIC_ERROR, requireUser } from "@/lib/supabase/session";
import type { ListExpensesResult } from "@/app/actions/expenses";

export type SavedFilter = { id: string; name: string; criteria: FilterCriteria };

export type ListSavedFiltersResult =
  | { ok: true; filters: SavedFilter[] }
  | { ok: false; error: string };

export type SaveFilterResult =
  | { ok: true; filter: SavedFilter }
  | { ok: false; error?: string; nameError?: string };

/** Latest date a filter may use: one day past UTC today covers every time zone (ADR-11). */
function serverToday(): string {
  return addDays(utcToday(), 1);
}

function cleanOffset(offset: unknown): number {
  return Number.isInteger(offset) && (offset as number) >= 0 ? (offset as number) : 0;
}

/** One page (25) of the user's expenses that match all the given criteria. */
export async function searchExpenses(
  criteria: FilterCriteria,
  sort: SortKey = "date",
  dir: SortDir = "desc",
  offset = 0,
): Promise<ListExpensesResult> {
  const clean = parseCriteria(criteria ?? {}, serverToday());
  if (!clean) return { ok: false, error: "Please check the filter values and try again." };
  try {
    const { supabase } = await requireUser();
    const page = await fetchExpensePage(
      supabase,
      clean,
      isSortKey(sort) ? sort : "date",
      isSortDir(dir) ? dir : "desc",
      cleanOffset(offset),
    );
    if (!page) return { ok: false, error: GENERIC_ERROR };
    return { ok: true, ...page };
  } catch (error) {
    unstable_rethrow(error);
    return { ok: false, error: GENERIC_ERROR };
  }
}

/** The year of the user's oldest expense (null if they have none). */
export async function getOldestExpenseYear(): Promise<number | null> {
  try {
    const { supabase } = await requireUser();
    const { data, error } = await supabase
      .from("expenses")
      .select("expense_date")
      .order("expense_date", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (error || !data) return null;
    return Number(String(data.expense_date).slice(0, 4)) || null;
  } catch (error) {
    unstable_rethrow(error);
    return null;
  }
}

function sortByName(filters: SavedFilter[]): SavedFilter[] {
  return filters.sort((a, b) =>
    a.name.localeCompare(b.name, "en", { sensitivity: "base" }),
  );
}

/** The user's saved filters, A→Z. Broken entries are skipped. */
export async function listSavedFilters(): Promise<ListSavedFiltersResult> {
  try {
    const { supabase } = await requireUser();
    const { data, error } = await supabase
      .from("saved_filters")
      .select("id, name, filter_criteria");
    if (error) return { ok: false, error: GENERIC_ERROR };
    const today = serverToday();
    const filters: SavedFilter[] = [];
    for (const row of data ?? []) {
      const criteria = parseCriteria(row.filter_criteria, today);
      if (criteria && !isEmptyCriteria(criteria)) {
        filters.push({ id: row.id, name: row.name, criteria });
      }
    }
    return { ok: true, filters: sortByName(filters) };
  } catch (error) {
    unstable_rethrow(error);
    return { ok: false, error: GENERIC_ERROR };
  }
}

/** Returns an error message, or null if the name is fine. */
function checkName(name: string): string | null {
  if (!name) return "Please enter a name for this filter.";
  if (name.length > FILTER_NAME_MAX) {
    return `Filter names can be up to ${FILTER_NAME_MAX} characters.`;
  }
  return null;
}

export async function saveFilter(
  rawName: string,
  criteria: FilterCriteria,
): Promise<SaveFilterResult> {
  const name = typeof rawName === "string" ? rawName.trim() : "";
  const nameError = checkName(name);
  if (nameError) return { ok: false, nameError };

  const clean = parseCriteria(criteria ?? {}, serverToday());
  if (!clean) return { ok: false, error: "Please check the filter values and try again." };
  if (isEmptyCriteria(clean)) {
    return { ok: false, error: "Fill in at least one filter before saving." };
  }

  try {
    const { supabase, userId } = await requireUser();
    const { data, error } = await supabase
      .from("saved_filters")
      .insert({ user_id: userId, name, filter_criteria: clean })
      .select("id, name")
      .single();
    if (error) {
      if (error.code === "23505") {
        return { ok: false, nameError: "A saved filter with this name already exists." };
      }
      if (error.code === "23514") {
        return { ok: false, nameError: "Please enter a name for this filter." };
      }
      return { ok: false, error: GENERIC_ERROR };
    }
    return { ok: true, filter: { id: data.id, name: data.name, criteria: clean } };
  } catch (error) {
    unstable_rethrow(error);
    return { ok: false, error: GENERIC_ERROR };
  }
}
