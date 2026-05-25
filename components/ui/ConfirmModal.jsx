"use client";

import Button from "@/components/ui/Button";

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false,
  onConfirm,
  onCancel,
  busy = false,
}) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-[var(--overlay)] backdrop-blur-[1px]"
        onClick={onCancel}
        aria-label="Close dialog"
      />
      <div
        className="relative z-10 w-full max-w-md rounded-2xl border border-[var(--border-color)] bg-[var(--color-surface)] p-5 shadow-xl"
        style={{ animation: "fadeIn 0.2s ease-out" }}
      >
        <h2 id="confirm-modal-title" className="text-lg font-semibold text-[var(--foreground)]">
          {title}
        </h2>
        {message ? <p className="mt-2 text-sm text-[var(--text-muted)]">{message}</p> : null}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </Button>
          <Button type="button" variant={danger ? "danger" : "primary"} onClick={onConfirm} disabled={busy}>
            {busy ? "Please wait…" : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
