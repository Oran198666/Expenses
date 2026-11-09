"use client";
// Filters screen state: the filter panel, saved filters and the results table
// (its own sorting and Load More, separate from the Home table).
import { useRef, useState, useSyncExternalStore } from "react";
import { CircleAlert, Eraser, Loader, RefreshCw } from "lucide-react";
import type { ExpenseRow } from "@/app/actions/expenses";
import {
  saveFilter,
  searchExpenses,
  type SavedFilter,
} from "@/app/actions/filters";
import { ExpenseTable } from "@/components/expenses/expense-table";
import { FilterPanel } from "@/components/filters/filter-panel";
import { localToday } from "@/lib/dates";
import type { SortDir, SortKey } from "@/lib/expenses/constants";
import {
  criteriaToInput,
  dayOptions,
  describeFilters,
  EMPTY_FILTER_INPUT,
  isEmptyCriteria,
  monthOptions,
  validateFilters,
  yearOptions,
  type FilterCriteria,
  type FilterErrors,
  type FilterInput,
} from "@/lib/expenses/filters";

const GENERIC_ERROR = "Something went wrong. Please try again.";

// First click on a new column: newest dates / largest amounts / A→Z categories.
const DEFAULT_DIR: Record<SortKey, SortDir> = {
  date: "desc",
  amount: "desc",
  category: "asc",
};

function noopSubscribe() {
  return () => {};
}

export function FilterManager({
  initialRows,
  initialHasMore,
  initialError,
  oldestYear,
  serverToday,
  initialSavedFilters,
  savedFiltersError,
}: {
  initialRows: ExpenseRow[];
  initialHasMore: boolean;
  initialError: string | null;
  oldestYear: number | null;
  serverToday: string;
  initialSavedFilters: SavedFilter[];
  savedFiltersError: string | null;
}) {
  // The browser's local date (the server's date while rendering on the server).
  const today = useSyncExternalStore(noopSubscribe, localToday, () => serverToday);

  const [values, setValues] = useState<FilterInput>(EMPTY_FILTER_INPUT);
  const [errors, setErrors] = useState<FilterErrors>({});
  const [applied, setApplied] = useState<FilterCriteria>({});

  const [rows, setRows] = useState(initialRows);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({
    key: "date",
    dir: "desc",
  });
  const [listError, setListError] = useState<string | null>(initialError);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [savedFilters, setSavedFilters] = useState(initialSavedFilters);
  const [selectedSavedId, setSelectedSavedId] = useState("");
  const [saveName, setSaveName] = useState("");
  const [nameError, setNameError] = useState<string | undefined>();
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Ignore answers to older requests (e.g. Apply clicked twice quickly).
  const requestId = useRef(0);

  async function reload(criteria: FilterCriteria, nextSort = sort) {
    const id = ++requestId.current;
    setLoading(true);
    try {
      const result = await searchExpenses(criteria, nextSort.key, nextSort.dir, 0);
      if (id !== requestId.current) return;
      if (result.ok) {
        setRows(result.rows);
        setHasMore(result.hasMore);
        setListError(null);
      } else {
        setListError(result.error);
      }
    } catch {
      if (id === requestId.current) setListError(GENERIC_ERROR);
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }

  async function loadMore() {
    const id = ++requestId.current;
    setLoadingMore(true);
    try {
      const result = await searchExpenses(applied, sort.key, sort.dir, rows.length);
      if (id !== requestId.current) return;
      if (result.ok) {
        // Skip rows already shown (in case the list changed in between).
        setRows((current) => {
          const seen = new Set(current.map((r) => r.id));
          return [...current, ...result.rows.filter((r) => !seen.has(r.id))];
        });
        setHasMore(result.hasMore);
        setListError(null);
      } else {
        setListError(result.error);
      }
    } catch {
      if (id === requestId.current) setListError(GENERIC_ERROR);
    } finally {
      if (id === requestId.current) setLoadingMore(false);
    }
  }

  function changeSort(key: SortKey) {
    const next = {
      key,
      dir: sort.key === key ? (sort.dir === "asc" ? "desc" : "asc") : DEFAULT_DIR[key],
    } as const;
    setSort(next);
    // A new sort starts again from the first 25.
    void reload(applied, next);
  }

  function change(name: keyof FilterInput, value: string) {
    setValues((current) => {
      const next = { ...current, [name]: value };
      // Drop a month / day that no longer fits the chosen year / month.
      const year = Number(next.year);
      if (!next.year || !monthOptions(year, today).includes(Number(next.month))) {
        next.month = "";
      }
      if (!next.month || !dayOptions(year, Number(next.month), today).includes(Number(next.day))) {
        next.day = "";
      }
      return next;
    });
    setErrors((current) => {
      if (Object.keys(current).length === 0) return current;
      const next = { ...current };
      delete next[name];
      if (name === "startDate") delete next.endDate;
      if (name === "year") delete next.month;
      if (name === "month") delete next.day;
      return next;
    });
    setSelectedSavedId("");
  }

  /** Checks the panel; returns clean criteria or null (errors shown). */
  function check(input: FilterInput): FilterCriteria | null {
    const result = validateFilters(input, localToday());
    setErrors(result.errors);
    return result.value ?? null;
  }

  function apply(input = values) {
    const criteria = check(input);
    if (!criteria) return;
    setApplied(criteria);
    void reload(criteria);
  }

  function clear() {
    setValues(EMPTY_FILTER_INPUT);
    setErrors({});
    setSelectedSavedId("");
    setApplied({});
    void reload({});
  }

  function pickSaved(id: string) {
    setSelectedSavedId(id);
    const saved = savedFilters.find((f) => f.id === id);
    if (!saved) return;
    const input = criteriaToInput(saved.criteria);
    setValues(input);
    setSaveNotice(null);
    setSaveError(null);
    apply(input);
  }

  async function save() {
    if (saving) return;
    setSaveNotice(null);
    setSaveError(null);
    const name = saveName.trim();
    if (!name) {
      setNameError("Please enter a name for this filter.");
      return;
    }
    if (savedFilters.some((f) => f.name.toLowerCase() === name.toLowerCase())) {
      setNameError("A saved filter with this name already exists.");
      return;
    }
    setNameError(undefined);
    const criteria = check(values);
    if (!criteria) return;
    if (isEmptyCriteria(criteria)) {
      setSaveError("Fill in at least one filter before saving.");
      return;
    }

    setSaving(true);
    try {
      const result = await saveFilter(name, criteria);
      if (!result.ok) {
        setNameError(result.nameError);
        setSaveError(result.error ?? null);
        return;
      }
      setSavedFilters((current) =>
        [...current, result.filter].sort((a, b) =>
          a.name.localeCompare(b.name, "en", { sensitivity: "base" }),
        ),
      );
      setSelectedSavedId(result.filter.id);
      setSaveName("");
      setSaveNotice(`Filter "${result.filter.name}" saved.`);
    } catch {
      setSaveError(GENERIC_ERROR);
    } finally {
      setSaving(false);
    }
  }

  const filtered = !isEmptyCriteria(applied);

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <section
        aria-labelledby="filter-panel-title"
        className="card p-4 sm:p-6 lg:order-2"
      >
        <h2 id="filter-panel-title" className="mb-4 text-xl text-neon-pink sm:text-2xl">
          Filter
        </h2>
        <FilterPanel
          values={values}
          errors={errors}
          years={yearOptions(oldestYear, today)}
          today={today}
          busy={loading}
          onChange={change}
          onApply={() => apply()}
          onClear={clear}
          saveName={saveName}
          nameError={nameError}
          saveError={saveError}
          saveNotice={saveNotice}
          saving={saving}
          onSaveNameChange={(value) => {
            setSaveName(value);
            setNameError(undefined);
            setSaveError(null);
            setSaveNotice(null);
          }}
          onSave={() => void save()}
          savedFilters={savedFilters}
          savedFiltersError={savedFiltersError}
          selectedSavedId={selectedSavedId}
          onPickSaved={pickSaved}
        />
      </section>

      <section aria-labelledby="results-title" className="card min-w-0 p-4 sm:p-6 lg:order-1">
        <div className="mb-2 flex items-center justify-between gap-4">
          <h2 id="results-title" className="text-xl text-neon-pink sm:text-2xl">
            Filtered Expenses
          </h2>
          {loading && (
            <span className="flex items-center gap-2 text-sm" role="status">
              <Loader aria-hidden size={16} className="animate-spin" />
              Loading…
            </span>
          )}
        </div>
        <p className="mb-4 text-sm">
          <span className="text-cyan">Showing:</span> {describeFilters(applied)}
        </p>

        {listError && (
          <div role="alert" className="form-error mb-4 flex flex-wrap items-center gap-3">
            <span className="flex items-start gap-2">
              <CircleAlert aria-hidden size={18} className="mt-0.5 shrink-0" />
              {listError}
            </span>
            <button type="button" className="btn-sm" onClick={() => void reload(applied)}>
              <RefreshCw aria-hidden size={14} />
              Retry
            </button>
          </div>
        )}

        {rows.length === 0 && !listError ? (
          filtered ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <p>No expenses match these filters.</p>
              <button type="button" className="btn-secondary" onClick={clear}>
                <Eraser aria-hidden size={18} />
                Clear
              </button>
            </div>
          ) : (
            <p className="py-6 text-center">No expenses yet — add some on the Home page.</p>
          )
        ) : (
          rows.length > 0 && <ExpenseTable rows={rows} sort={sort} onSort={changeSort} />
        )}

        {hasMore && (
          <div className="mt-4 flex justify-center">
            <button
              type="button"
              className="btn-primary"
              onClick={() => void loadMore()}
              disabled={loadingMore || loading}
              aria-busy={loadingMore}
            >
              {loadingMore ? "Loading…" : "Load More"}
            </button>
          </div>
        )}
        {rows.length > 0 && (
          <p className="mt-3 text-center text-xs opacity-70">
            Showing {rows.length} expense{rows.length === 1 ? "" : "s"}
            {hasMore ? " — more available" : ""}
          </p>
        )}
      </section>
    </div>
  );
}
