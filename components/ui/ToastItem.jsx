"use client";

const STYLES = {
  success: {
    wrap: "border-emerald-200/80 bg-emerald-50 text-emerald-950 dark:border-emerald-800/60 dark:bg-emerald-950/90 dark:text-emerald-100",
    badge: "bg-emerald-200 text-emerald-900 dark:bg-emerald-800 dark:text-emerald-100",
    icon: "✓",
  },
  error: {
    wrap: "border-rose-200/80 bg-rose-50 text-rose-950 dark:border-rose-800/60 dark:bg-rose-950/90 dark:text-rose-100",
    badge: "bg-rose-200 text-rose-900 dark:bg-rose-800 dark:text-rose-100",
    icon: "!",
  },
  info: {
    wrap: "border-indigo-200/80 bg-indigo-50 text-indigo-950 dark:border-indigo-800/60 dark:bg-indigo-950/90 dark:text-indigo-100",
    badge: "bg-indigo-200 text-indigo-900 dark:bg-indigo-800 dark:text-indigo-100",
    icon: "…",
  },
};

export default function ToastItem({ message, type = "success", title, onDismiss }) {
  if (!message) {
    return null;
  }

  const style = STYLES[type] || STYLES.success;

  return (
    <div
      role="status"
      className={`pointer-events-auto rounded-xl border px-4 py-3 text-sm shadow-lg backdrop-blur-sm ${style.wrap}`}
      style={{ animation: "toastSlideIn 0.28s ease-out" }}
    >
      <div className="flex gap-3">
        <span
          className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${style.badge}`}
          aria-hidden
        >
          {type === "info" ? (
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-current" />
          ) : (
            style.icon
          )}
        </span>
        <div className="min-w-0 flex-1">
          {title ? <p className="text-xs font-semibold uppercase tracking-wide opacity-80">{title}</p> : null}
          <p className={`leading-snug ${title ? "mt-0.5" : ""}`}>{message}</p>
        </div>
        {onDismiss ? (
          <button
            type="button"
            onClick={onDismiss}
            className="shrink-0 rounded-md px-1.5 text-lg leading-none opacity-60 transition hover:opacity-100"
            aria-label="Dismiss notification"
          >
            ×
          </button>
        ) : null}
      </div>
    </div>
  );
}
