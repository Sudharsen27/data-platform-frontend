"use client";

import ToastItem from "@/components/ui/ToastItem";

export default function ToastStack({ toasts = [], onDismiss }) {
  if (!toasts.length) {
    return null;
  }

  return (
    <div
      aria-live="polite"
      aria-relevant="additions text"
      className="pointer-events-none fixed top-4 right-4 z-[100] flex w-[min(calc(100vw-2rem),22rem)] flex-col gap-2"
    >
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          message={toast.message}
          type={toast.type}
          title={toast.title}
          onDismiss={onDismiss ? () => onDismiss(toast.id) : undefined}
        />
      ))}
    </div>
  );
}
