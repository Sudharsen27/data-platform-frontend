"use client";

import Link from "next/link";

const CATEGORY_STYLES = {
  data: { dot: "bg-blue-500", badge: "bg-blue-500/15 text-blue-700 dark:text-blue-300", label: "Data" },
  pipeline: {
    dot: "bg-violet-500",
    badge: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
    label: "Pipeline",
  },
  stewardship: {
    dot: "bg-teal-500",
    badge: "bg-teal-500/15 text-teal-700 dark:text-teal-300",
    label: "Stewardship",
  },
  rules: {
    dot: "bg-indigo-500",
    badge: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300",
    label: "Rules",
  },
  ai: {
    dot: "bg-fuchsia-500",
    badge: "bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-300",
    label: "AI",
  },
  admin: {
    dot: "bg-amber-500",
    badge: "bg-amber-500/15 text-amber-800 dark:text-amber-300",
    label: "Admin",
  },
  governance: {
    dot: "bg-slate-500",
    badge: "bg-slate-500/15 text-slate-700 dark:text-slate-300",
    label: "Governance",
  },
};

function formatRelativeTime(value) {
  if (!value) {
    return "";
  }
  const then = new Date(value).getTime();
  const diffSec = Math.round((Date.now() - then) / 1000);
  if (diffSec < 60) {
    return "Just now";
  }
  if (diffSec < 3600) {
    return `${Math.floor(diffSec / 60)}m ago`;
  }
  if (diffSec < 86400) {
    return `${Math.floor(diffSec / 3600)}h ago`;
  }
  return new Date(value).toLocaleString();
}

function categoryStyle(category) {
  return CATEGORY_STYLES[category] || CATEGORY_STYLES.governance;
}

export default function AuditActivityFeed({ items = [] }) {
  const feed = Array.isArray(items) ? items : [];

  return (
    <section className="mdm-surface-panel">
      <header className="mdm-surface-panel-header flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="mdm-section-label">Audit trail</p>
          <h3 className="mt-1 text-lg font-semibold tracking-tight text-[var(--foreground)]">
            Recent governance activity
          </h3>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Who did what — imports, pipeline runs, stewardship, and rule changes.
          </p>
        </div>
        <Link
          href="/audit"
          className="inline-flex shrink-0 items-center justify-center rounded-lg border border-[var(--border-color)] bg-[var(--color-surface-hover)] px-3 py-2 text-xs font-semibold text-[var(--foreground)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
        >
          View full audit log
        </Link>
      </header>

      {feed.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <p className="text-sm font-medium text-[var(--foreground)]">No audit events yet</p>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Import quarantine data, run the pipeline, or change rules to populate this feed.
          </p>
        </div>
      ) : (
        <ol className="relative divide-y divide-[var(--border-subtle)]">
          {feed.map((item, index) => {
            const style = categoryStyle(item.category);
            const row = (
              <div className="flex gap-4 py-4">
                <div className="relative flex w-3 shrink-0 justify-center pt-1.5">
                  <span
                    className={`z-10 h-2.5 w-2.5 rounded-full ring-4 ring-[var(--color-surface)] ${style.dot}`}
                  />
                  {index < feed.length - 1 ? (
                    <span
                      className="absolute top-4 h-[calc(100%+1rem)] w-px bg-[var(--border-color)]"
                      aria-hidden
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${style.badge}`}
                    >
                      {style.label}
                    </span>
                    <span className="font-mono text-[10px] text-[var(--text-subtle)]">{item.action}</span>
                    <span className="text-xs text-[var(--text-subtle)]">
                      {formatRelativeTime(item.timestamp)}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm font-medium text-[var(--foreground)]">{item.summary}</p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    <span className="font-medium text-[var(--foreground)]">{item.user_id}</span>
                    {item.entity ? (
                      <>
                        {" "}
                        · <span>{item.entity}</span>
                      </>
                    ) : null}
                  </p>
                </div>
              </div>
            );

            return (
              <li key={item.id}>
                {item.href ? (
                  <Link
                    href={item.href}
                    className="block px-5 transition hover:bg-[var(--color-surface-hover)] sm:px-6"
                  >
                    {row}
                  </Link>
                ) : (
                  <div className="px-5 sm:px-6">{row}</div>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
