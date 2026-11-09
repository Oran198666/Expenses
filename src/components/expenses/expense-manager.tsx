"use client";
// Home screen state: the expense form, the Recent Expenses table, sorting,
// Load More and delete confirmation. After every change the table reloads
// from the first page, so it always matches the database.
import { useRef, useState } from "react";
import { CircleAlert, Loader, RefreshCw } from "lucide-react";
import type { Category } from "@/app/actions/categories";
import {
  deleteExpense,
  listExpenses,
  type ExpenseRow,
} from "@/app/actions/expenses";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ExpenseForm } from "@/components/expenses/expense-form";
import { ExpenseTable } from "@/components/expenses/expense-table";
import { formatAmount, type SortDir, type SortKey } from "@/lib/expenses/constants";

const GENERIC_ERROR = "Something went wrong. Please try again.";

// First click on a new column: newest dates / largest amounts / A→Z categories.
const DEFAULT_DIR: Record<SortKey, SortDir> = {
  date: "desc",
  amount: "desc",
  category: "asc",
};

export function ExpenseManager({
  initialCategories,
  initialRows,
  initialHasMore,
  initialError,
}: {
  initialCategories: Category[];
  initialRows: ExpenseRow[];
  initialHasMore: boolean;
  initialError: string | null;
}) {
  const [rows, setRows] = useState(initialRows);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({
    key: "date",
    dir: "desc",
  });
  const [listError, setListError] = useState<string | null>(initialError);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [editing, setEditing] = useState<ExpenseRow | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);

  const [toDelete, setToDelete] = useState<ExpenseRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const formCardRef = useRef<HTMLElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);
  // Ignore answers to older requests (e.g. after clicking sort twice quickly).
  const requestId = useRef(0);

  async function reload(nextSort = sort) {
    const id = ++requestId.current;
    setLoading(true);
    try {
      const result = await listExpenses(nextSort.key, nextSort.dir, 0);
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
      const result = await listExpenses(sort.key, sort.dir, rows.length);
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
    void reload(next);
  }

  function startEdit(row: ExpenseRow) {
    setEditing(row);
    setNotice(null);
    setFormKey((k) => k + 1);
    formCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    // Wait for the form to re-render with the row's values.
    setTimeout(() => amountRef.current?.focus({ preventScroll: true }), 50);
  }

  function stopEdit() {
    setEditing(null);
    setFormKey((k) => k + 1);
  }

  function onSaved(message: string) {
    setNotice(message);
    if (editing) stopEdit();
    void reload();
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const result = await deleteExpense(toDelete.id);
      if (!result.ok) {
        setDeleteError(result.error ?? GENERIC_ERROR);
        return;
      }
      if (editing?.id === toDelete.id) stopEdit();
      setToDelete(null);
      setNotice("Expense deleted.");
      void reload();
    } catch {
      setDeleteError(GENERIC_ERROR);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <section
        ref={formCardRef}
        aria-labelledby="expense-form-title"
        className="card scroll-mt-20 p-4 sm:p-6"
      >
        <h2 id="expense-form-title" className="mb-4 text-xl text-neon-pink sm:text-2xl">
          {editing ? "Edit Expense" : "New Expense"}
        </h2>
        {initialCategories.length === 0 && !initialError && (
          <p className="form-error mb-4">
            You have no categories yet. Add one on the Categories page first.
          </p>
        )}
        <ExpenseForm
          key={formKey}
          categories={initialCategories}
          editing={editing}
          notice={notice}
          amountRef={amountRef}
          onSaved={onSaved}
          onCancelEdit={() => {
            setNotice(null);
            stopEdit();
          }}
        />
      </section>

      <section aria-labelledby="recent-title" className="card p-4 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 id="recent-title" className="text-xl text-neon-pink sm:text-2xl">
            Recent Expenses
          </h2>
          {loading && (
            <span className="flex items-center gap-2 text-sm" role="status">
              <Loader aria-hidden size={16} className="animate-spin" />
              Loading…
            </span>
          )}
        </div>

        {listError && (
          <div role="alert" className="form-error mb-4 flex flex-wrap items-center gap-3">
            <span className="flex items-start gap-2">
              <CircleAlert aria-hidden size={18} className="mt-0.5 shrink-0" />
              {listError}
            </span>
            <button type="button" className="btn-sm" onClick={() => void reload()}>
              <RefreshCw aria-hidden size={14} />
              Retry
            </button>
          </div>
        )}

        {rows.length === 0 && !listError ? (
          <p className="py-6 text-center">No expenses yet — add your first one above.</p>
        ) : (
          rows.length > 0 && (
            <ExpenseTable
              rows={rows}
              sort={sort}
              onSort={changeSort}
              editingId={editing?.id ?? null}
              onEdit={startEdit}
              onDelete={(row) => {
                setDeleteError(null);
                setToDelete(row);
              }}
            />
          )
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

      <ConfirmDialog
        open={toDelete !== null}
        title="Delete this expense?"
        confirmLabel="Delete"
        busy={deleting}
        error={deleteError}
        onConfirm={() => void confirmDelete()}
        onCancel={() => {
          setToDelete(null);
          setDeleteError(null);
        }}
      >
        {toDelete && (
          <p>
            <span className="text-white">
              {formatAmount(toDelete.amount, toDelete.currency)}
            </span>{" "}
            · {toDelete.categoryName} · {toDelete.date}
            {toDelete.description && (
              <>
                <br />
                <span className="text-sm">{toDelete.description}</span>
              </>
            )}
            <br />
            <span className="text-sm opacity-80">This can&apos;t be undone.</span>
          </p>
        )}
      </ConfirmDialog>
    </div>
  );
}
