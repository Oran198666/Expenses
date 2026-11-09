"use client";
// Category Management: list of the user's categories with Add / Rename /
// Delete, and a table of the expenses in the selected category.
import { useRef, useState, type FormEvent } from "react";
import {
  CircleAlert,
  CircleCheck,
  Loader,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  X,
} from "lucide-react";
import {
  createCategory,
  deleteCategory,
  listCategories,
  listCategoryExpenses,
  renameCategory,
  type Category,
  type CategoryExpense,
} from "@/app/actions/categories";
import { FieldError } from "@/components/auth/form-parts";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CATEGORY_NAME_MAX, formatAmount } from "@/lib/expenses/constants";
import { validateCategoryName } from "@/lib/expenses/validation";

const GENERIC_ERROR = "Something went wrong. Please try again.";

function usedMessage(count: number): string {
  return `Used by ${count} expense${count === 1 ? "" : "s"} — move or delete them first.`;
}

export function CategoryManager({
  initialCategories,
  initialError,
}: {
  initialCategories: Category[];
  initialError: string | null;
}) {
  const [categories, setCategories] = useState(initialCategories);
  const [listError, setListError] = useState<string | null>(initialError);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Add / rename inline form
  const [mode, setMode] = useState<"add" | "rename" | null>(null);
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  // Delete
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Expenses of the selected category
  const [rows, setRows] = useState<CategoryExpense[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [rowsLoading, setRowsLoading] = useState(false);
  const [rowsError, setRowsError] = useState<string | null>(null);
  const requestId = useRef(0);

  const selected = categories.find((c) => c.id === selectedId) ?? null;

  async function refreshCategories(): Promise<boolean> {
    try {
      const result = await listCategories();
      if (!result.ok) {
        setListError(result.error);
        return false;
      }
      setCategories(result.categories);
      setListError(null);
      return true;
    } catch {
      setListError(GENERIC_ERROR);
      return false;
    }
  }

  async function loadExpenses(categoryId: string, offset: number) {
    const id = ++requestId.current;
    setRowsLoading(true);
    if (offset === 0) setRowsError(null);
    try {
      const result = await listCategoryExpenses(categoryId, offset);
      if (id !== requestId.current) return;
      if (result.ok) {
        setRows((current) => {
          if (offset === 0) return result.rows;
          const seen = new Set(current.map((r) => r.id));
          return [...current, ...result.rows.filter((r) => !seen.has(r.id))];
        });
        setHasMore(result.hasMore);
        setRowsError(null);
      } else {
        setRowsError(result.error);
      }
    } catch {
      if (id === requestId.current) setRowsError(GENERIC_ERROR);
    } finally {
      if (id === requestId.current) setRowsLoading(false);
    }
  }

  function select(category: Category) {
    if (category.id === selectedId) return;
    setSelectedId(category.id);
    setNotice(null);
    if (mode === "rename") closeForm();
    setRows([]);
    setHasMore(false);
    void loadExpenses(category.id, 0);
  }

  function openForm(next: "add" | "rename") {
    setMode(next);
    setName(next === "rename" && selected ? selected.name : "");
    setNameError(null);
    setNotice(null);
    setTimeout(() => nameRef.current?.focus(), 0);
  }

  function closeForm() {
    setMode(null);
    setName("");
    setNameError(null);
  }

  async function submitName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || !mode) return;
    const others = categories
      .filter((c) => !(mode === "rename" && c.id === selectedId))
      .map((c) => c.name);
    const problem = validateCategoryName(name, others);
    if (problem) {
      setNameError(problem);
      return;
    }

    setSaving(true);
    try {
      const result =
        mode === "add"
          ? await createCategory(name)
          : await renameCategory(selectedId ?? "", name);
      if (!result.ok) {
        setNameError(result.error);
        return;
      }
      const clean = name.trim();
      await refreshCategories();
      if (mode === "add" && result.id) {
        setSelectedId(result.id);
        setRows([]);
        setHasMore(false);
        setRowsError(null);
      }
      setNotice(mode === "add" ? `Category "${clean}" added.` : `Category renamed to "${clean}".`);
      closeForm();
    } catch {
      setNameError(GENERIC_ERROR);
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!selected) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const result = await deleteCategory(selected.id);
      if (!result.ok) {
        setDeleteError(result.error);
        // The count may have changed elsewhere; refresh it.
        void refreshCategories();
        return;
      }
      const deletedName = selected.name;
      setConfirmOpen(false);
      setSelectedId(null);
      setRows([]);
      setHasMore(false);
      await refreshCategories();
      setNotice(`Category "${deletedName}" deleted.`);
    } catch {
      setDeleteError(GENERIC_ERROR);
    } finally {
      setDeleting(false);
    }
  }

  const inUse = selected !== null && selected.expenseCount > 0;

  return (
    <section aria-labelledby="category-mgmt-title" className="card p-4 sm:p-6">
      <h2 id="category-mgmt-title" className="mb-4 text-xl text-neon-pink sm:text-2xl">
        Category Management
      </h2>

      {/* Toolbar */}
      <div className="mb-3 flex flex-wrap gap-3">
        <button
          type="button"
          className="btn-primary"
          onClick={() => openForm("add")}
          disabled={saving}
        >
          <Plus aria-hidden size={18} />
          Add Category
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => openForm("rename")}
          disabled={!selected || saving}
        >
          <Pencil aria-hidden size={18} />
          Rename
        </button>
        <button
          type="button"
          className="btn-secondary border-neon-pink! text-neon-pink! shadow-[0_0_8px_#ff66ff44]!"
          onClick={() => {
            setDeleteError(null);
            setNotice(null);
            setConfirmOpen(true);
          }}
          disabled={!selected || inUse}
          aria-describedby={inUse ? "delete-reason" : undefined}
        >
          <Trash2 aria-hidden size={18} />
          Delete
        </button>
      </div>

      <div className="mb-4 min-h-6 text-sm" aria-live="polite">
        {!selected && <p>Select a category to rename or delete it.</p>}
        {inUse && (
          <p id="delete-reason" className="text-amber">
            Can&apos;t delete &quot;{selected.name}&quot;: {usedMessage(selected.expenseCount)}
          </p>
        )}
        {notice && (
          <p role="status" className="form-success flex items-start gap-2">
            <CircleCheck aria-hidden size={18} className="mt-0.5 shrink-0" />
            {notice}
          </p>
        )}
      </div>

      {/* Inline add / rename form */}
      {mode && (
        <form
          onSubmit={submitName}
          noValidate
          className="mb-5 rounded-[8px] border border-cyan/50 bg-cosmic/60 p-4"
        >
          <label htmlFor="category-name" className="label">
            {mode === "add" ? "New category name" : `Rename "${selected?.name ?? ""}" to`}
          </label>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
            <div className="flex-1">
              <input
                ref={nameRef}
                id="category-name"
                className="input"
                maxLength={CATEGORY_NAME_MAX}
                autoComplete="off"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setNameError(null);
                }}
                aria-invalid={Boolean(nameError)}
                aria-describedby={nameError ? "category-name-error" : undefined}
              />
              <FieldError id="category-name-error" message={nameError ?? undefined} />
            </div>
            <div className="flex gap-3">
              <button type="submit" className="btn-primary" disabled={saving} aria-busy={saving}>
                <Save aria-hidden size={18} />
                {saving ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={closeForm}
                disabled={saving}
              >
                <X aria-hidden size={18} />
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      {listError && (
        <div role="alert" className="form-error mb-4 flex flex-wrap items-center gap-3">
          <span className="flex items-start gap-2">
            <CircleAlert aria-hidden size={18} className="mt-0.5 shrink-0" />
            {listError}
          </span>
          <button type="button" className="btn-sm" onClick={() => void refreshCategories()}>
            <RefreshCw aria-hidden size={14} />
            Retry
          </button>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-[15rem_1fr]">
        {/* Category list */}
        <div>
          <h3 className="mb-2 font-semibold text-neon-pink">Categories</h3>
          {categories.length === 0 ? (
            <p className="text-sm">No categories yet — add one above.</p>
          ) : (
            <ul
              role="listbox"
              aria-label="Categories"
              className="overflow-hidden rounded-[8px] border border-violet"
            >
              {categories.map((c) => (
                <li key={c.id} role="none">
                  <button
                    type="button"
                    role="option"
                    aria-selected={c.id === selectedId}
                    className="list-item"
                    onClick={() => select(c)}
                  >
                    <span className="min-w-0 truncate">{c.name}</span>
                    <span className="flex shrink-0 items-center gap-2">
                      {c.isPredefined && <span className="tag">predefined</span>}
                      <span
                        className="text-xs tabular-nums opacity-70"
                        aria-label={`${c.expenseCount} expenses`}
                      >
                        {c.expenseCount}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Expenses in the selected category */}
        <div className="min-w-0">
          <h3 className="mb-2 flex items-center gap-2 font-semibold text-neon-pink">
            {selected ? `Expenses in "${selected.name}"` : "Expenses"}
            {rowsLoading && (
              <Loader aria-label="Loading" size={16} className="animate-spin text-silver" />
            )}
          </h3>

          {!selected ? (
            <p className="text-sm">Select a category to see its expenses.</p>
          ) : rowsError ? (
            <div role="alert" className="form-error flex flex-wrap items-center gap-3">
              <span>{rowsError}</span>
              <button
                type="button"
                className="btn-sm"
                onClick={() => void loadExpenses(selected.id, 0)}
              >
                <RefreshCw aria-hidden size={14} />
                Retry
              </button>
            </div>
          ) : rows.length === 0 && !rowsLoading ? (
            <p className="text-sm">No expenses in this category.</p>
          ) : (
            <>
              <div className="relative overflow-x-auto">
                <table className="data-table min-w-[24rem]">
                  <thead>
                    <tr>
                      <th scope="col">Date</th>
                      <th scope="col" className="text-right!">
                        Amount
                      </th>
                      <th scope="col">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.id}>
                        <td className="whitespace-nowrap">{r.date}</td>
                        <td className="whitespace-nowrap text-right text-white tabular-nums">
                          {formatAmount(r.amount, r.currency)}
                        </td>
                        <td className="max-w-[18rem] truncate" title={r.description ?? ""}>
                          {r.description || <span className="opacity-50">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {hasMore && (
                <div className="mt-4 flex justify-center">
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => void loadExpenses(selected.id, rows.length)}
                    disabled={rowsLoading}
                    aria-busy={rowsLoading}
                  >
                    {rowsLoading ? "Loading…" : "Load More"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete this category?"
        confirmLabel="Delete"
        busy={deleting}
        error={deleteError}
        onConfirm={() => void confirmDelete()}
        onCancel={() => {
          setConfirmOpen(false);
          setDeleteError(null);
        }}
      >
        <p>
          <span className="text-white">&quot;{selected?.name}&quot;</span> will be removed from
          your categories.
        </p>
      </ConfirmDialog>
    </section>
  );
}
