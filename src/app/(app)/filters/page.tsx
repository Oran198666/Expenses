// Filters: search expenses by built-in and custom criteria and save filters.
import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { Loader } from "lucide-react";
import {
  getOldestExpenseYear,
  listSavedFilters,
  searchExpenses,
} from "@/app/actions/filters";
import { FilterManager } from "@/components/filters/filter-manager";
import { PageHeading } from "@/components/ui/page-heading";
import { utcToday } from "@/lib/dates";

export const metadata: Metadata = { title: "Filters · Expense Tracker" };

async function FiltersData() {
  // Per-user data: always read fresh at request time.
  await connection();
  const [expenses, oldestYear, saved] = await Promise.all([
    searchExpenses({}, "date", "desc", 0),
    getOldestExpenseYear(),
    listSavedFilters(),
  ]);
  return (
    <FilterManager
      initialRows={expenses.ok ? expenses.rows : []}
      initialHasMore={expenses.ok ? expenses.hasMore : false}
      initialError={expenses.ok ? null : expenses.error}
      oldestYear={oldestYear}
      serverToday={utcToday()}
      initialSavedFilters={saved.ok ? saved.filters : []}
      savedFiltersError={saved.ok ? null : "Couldn't load your saved filters. Reload the page to try again."}
    />
  );
}

export default function FiltersPage() {
  return (
    <>
      <PageHeading title="Filters" subtitle="Search, filter and save custom views of your expenses." />
      <Suspense
        fallback={
          <p className="flex items-center gap-2">
            <Loader aria-hidden size={20} className="animate-spin" />
            Loading your expenses…
          </p>
        }
      >
        <FiltersData />
      </Suspense>
    </>
  );
}
