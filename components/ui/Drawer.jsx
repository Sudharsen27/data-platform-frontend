"use client";

import { useEffect } from "react";
import Button from "@/components/ui/Button";

export default function Drawer({
  open,
  onClose,
  title,
  subtitle = "",
  children,
  footer = null,
  width = "max-w-lg",
}) {
  useEffect(() => {
    if (!open) {
      return undefined;
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[90] flex justify-end" role="dialog" aria-modal="true">
      <button
        type="button"
        className="absolute inset-0 bg-[var(--overlay)] backdrop-blur-[1px]"
        onClick={onClose}
        aria-label="Close panel"
      />
      <div
        className={`relative flex h-full w-full flex-col border-l border-[var(--border-color)] bg-[var(--color-surface)] shadow-2xl ${width}`}
      >
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-[var(--border-subtle)] px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">{title}</h2>
            {subtitle ? <p className="mt-1 text-sm text-[var(--text-muted)]">{subtitle}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--border-color)] text-[var(--text-muted)] hover:bg-[var(--color-surface-hover)]"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer ? (
          <footer className="shrink-0 border-t border-[var(--border-subtle)] bg-[var(--shell-bg)] px-5 py-4">{footer}</footer>
        ) : null}
      </div>
    </div>
  );
}

export function DrawerFooterActions({ children }) {
  return <div className="flex flex-wrap justify-end gap-2">{children}</div>;
}
