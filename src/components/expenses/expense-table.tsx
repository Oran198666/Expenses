"use client";
// Expense table with sortable headers. Row actions (Update / Delete) are
// optional, so the Filters screen reuses it view-only.
import { ArrowDown, ArrowUp, ArrowUpDown, Pencil, Trash2 } from "lucide-react";
import type { ExpenseRow } from "@/app/actions/expenses";
import { formatAmount, type SortDir, type SortKey } from "@/lib/expenses/constants";

function SortHeader({
  label,
  column,
  sort,
  onSort,
  className,
}: {
  label: string;
  column: SortKey;
  sort: { key: SortKey; dir: SortDir };
  onSort: (key: SortKey) => void;
  className?: string;
}) {
  const active = sort.key === column;
  const Icon = !active ? ArrowUpDown : sort.dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <th
      scope="col"
      className={className}
      aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}
    >
      <button type="button" className="sort-btn" onClick={() => onSort(column)}>
        {label}
        <Icon
          aria-hidden
          size={14}
          className={active ? "text-cyan" : "opacity-50"}
        />
        <span className="sr-only">
          {active
            ? `, sorted ${sort.dir === "asc" ? "ascending" : "descending"}`
            : ", sortable"}
        </span>
      </button>
    </th>
  );
}

export function ExpenseTable({
  rows,
  sort,
  onSort,
  editingId,
  onEdit,
  onDelete,
}: {
  rows: ExpenseRow[];
  sort: { key: SortKey; dir: SortDir };
  onSort: (key: SortKey) => void;
  editingId?: string | null;
  onEdit?: (row: ExpenseRow) => void;
  onDelete?: (row: ExpenseRow) => void;
}) {
  const withActions = Boolean(onEdit && onDelete);
  return (
    // Wide tables scroll sideways inside the card, never the whole page.
    <div className="relative overflow-x-auto">
      <table className="data-table min-w-[30rem]">
        <thead>
          <tr>
            <SortHeader label="Date" column="date" sort={sort} onSort={onSort} />
            <SortHeader
              label="Amount"
              column="amount"
              sort={sort}
              onSort={onSort}
              className="text-right!"
            />
            <SortHeader label="Category" column="category" sort={sort} onSort={onSort} />
            <th scope="col" className="hidden md:table-cell">
              Description
            </th>
            {withActions && (
              <th scope="col" className="text-right!">
                <span className="sr-only">Actions</span>
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} data-editing={editingId != null && row.id === editingId}>
              <td className="whitespace-nowrap">{row.date}</td>
              <td className="whitespace-nowrap text-right text-white tabular-nums">
                {formatAmount(row.amount, row.currency)}
              </td>
              <td>{row.categoryName}</td>
              <td className="hidden max-w-[16rem] truncate md:table-cell" title={row.description ?? ""}>
                {row.description || <span className="opacity-50">—</span>}
              </td>
              {withActions && (
              <td>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    className="btn-sm"
                    onClick={() => onEdit?.(row)}
                    aria-label={`Update expense ${formatAmount(row.amount, row.currency)} ${row.categoryName} ${row.date}`}
                  >
                    <Pencil aria-hidden size={14} />
                    Update
                  </button>
                  <button
                    type="button"
                    className="btn-sm btn-danger"
                    onClick={() => onDelete?.(row)}
                    aria-label={`Delete expense ${formatAmount(row.amount, row.currency)} ${row.categoryName} ${row.date}`}
                  >
                    <Trash2 aria-hidden size={14} />
                    Delete
                  </button>
                </div>
              </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
