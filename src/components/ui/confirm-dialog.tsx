"use client";
// Themed confirmation dialog built on the native <dialog> element
// (focus trapping, Escape to cancel and the backdrop come for free).
import { useEffect, useRef, type ReactNode } from "react";
import { CircleAlert } from "lucide-react";

export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  busy = false,
  error,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  children?: ReactNode;
  confirmLabel: string;
  busy?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="card confirm-dialog"
      aria-labelledby="confirm-title"
      onCancel={(e) => {
        // Escape key: treat as Cancel (unless the action is running).
        e.preventDefault();
        if (!busy) onCancel();
      }}
    >
      <h2 id="confirm-title" className="mb-3 text-lg text-neon-pink">
        {title}
      </h2>
      <div className="text-silver">{children}</div>
      {error && (
        <p role="alert" className="form-error mt-3 flex items-start gap-2">
          <CircleAlert aria-hidden size={18} className="mt-0.5 shrink-0" />
          {error}
        </p>
      )}
      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <button
          type="button"
          className="btn-secondary"
          onClick={onCancel}
          disabled={busy}
          autoFocus
        >
          Cancel
        </button>
        <button
          type="button"
          className="btn-primary border-neon-pink! text-neon-pink!"
          onClick={onConfirm}
          disabled={busy}
          aria-busy={busy}
        >
          {busy ? "Working…" : confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
