"use client";
// Asks whether to export all expenses or only those matching the report
// filters, then builds the CSV / PDF and starts the download.
import { useEffect, useRef, useState } from "react";
import { CircleAlert, Download } from "lucide-react";
import { getExportRows } from "@/app/actions/reports";
import { downloadCsv, downloadPdf, exportFileName } from "@/lib/expenses/export";
import type { ExportScope, ReportCriteria } from "@/lib/expenses/reports";

const GENERIC_ERROR = "Something went wrong. Please try again.";
const NOTHING = "There are no expenses to export.";

export function ExportDialog({
  format,
  criteria,
  filteredLine,
  filteredCount,
  totalCount,
  today,
  onClose,
}: {
  format: "csv" | "pdf" | null;
  criteria: ReportCriteria;
  filteredLine: string;
  filteredCount: number;
  totalCount: number;
  today: string;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [scope, setScope] = useState<ExportScope>("filtered");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (format && !dialog.open) dialog.showModal();
    if (!format && dialog.open) dialog.close();
  }, [format]);

  const count = scope === "all" ? totalCount : filteredCount;
  const label = format === "pdf" ? "PDF" : "CSV";

  function close() {
    if (busy) return;
    setError(null);
    onClose();
  }

  async function run() {
    if (!format || busy || count === 0) return;
    setBusy(true);
    setError(null);
    try {
      const result = await getExportRows(scope, criteria);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (result.rows.length === 0) {
        setError(NOTHING);
        return;
      }
      const fileName = exportFileName(scope, format, today);
      if (format === "csv") {
        downloadCsv(result.rows, fileName);
      } else {
        const line = scope === "all" ? "All expenses, all currencies" : filteredLine;
        await downloadPdf(result.rows, fileName, line, today);
      }
      onClose();
    } catch {
      setError(GENERIC_ERROR);
    } finally {
      setBusy(false);
    }
  }

  return (
    <dialog
      ref={ref}
      className="card confirm-dialog"
      aria-labelledby="export-title"
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
    >
      <h2 id="export-title" className="mb-4 text-lg text-neon-pink">
        Export to {label}
      </h2>
      <fieldset className="space-y-3">
        <legend className="mb-2 text-sm">Which expenses?</legend>
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="radio"
            name="export-scope"
            className="mt-1 accent-cyan"
            checked={scope === "all"}
            onChange={() => {
              setScope("all");
              setError(null);
            }}
          />
          <span>
            <span className="text-white">All expenses</span>
            <span className="block text-sm">
              Every expense, in every currency — {totalCount} expense{totalCount === 1 ? "" : "s"}
            </span>
          </span>
        </label>
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="radio"
            name="export-scope"
            className="mt-1 accent-cyan"
            checked={scope === "filtered"}
            onChange={() => {
              setScope("filtered");
              setError(null);
            }}
          />
          <span>
            <span className="text-white">Only expenses matching the current report filters</span>
            <span className="block text-sm">
              {filteredLine} — {filteredCount} expense{filteredCount === 1 ? "" : "s"}
            </span>
          </span>
        </label>
      </fieldset>

      {(error || count === 0) && (
        <p role="alert" className="form-error mt-4 flex items-start gap-2">
          <CircleAlert aria-hidden size={18} className="mt-0.5 shrink-0" />
          {error ?? NOTHING}
        </p>
      )}

      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <button type="button" className="btn-secondary" onClick={close} disabled={busy}>
          Cancel
        </button>
        <button
          type="button"
          className="btn-primary"
          onClick={() => void run()}
          disabled={busy || count === 0}
          aria-busy={busy}
          autoFocus
        >
          <Download aria-hidden size={18} />
          {busy ? "Preparing…" : "Download"}
        </button>
      </div>
    </dialog>
  );
}
