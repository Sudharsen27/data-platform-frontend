"use client";

import Link from "next/link";

const CATEGORY_STYLES = {
  data: { dot: "bg-blue-500", badge: "bg-blue-50 text-blue-700", label: "Data" },
  pipeline: { dot: "bg-violet-500", badge: "bg-violet-50 text-violet-700", label: "Pipeline" },
  stewardship: { dot: "bg-teal-500", badge: "bg-teal-50 text-teal-700", label: "Stewardship" },
  rules: { dot: "bg-indigo-500", badge: "bg-indigo-50 text-indigo-700", label: "Rules" },
  ai: { dot: "bg-fuchsia-500", badge: "bg-fuchsia-50 text-fuchsia-700", label: "AI" },
  admin: { dot: "bg-amber-500", badge: "bg-amber-50 text-amber-800", label: "Admin" },
  governance: { dot: "bg-zinc-500", badge: "bg-zinc-100 text-zinc-700", label: "Governance" },
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
    <section className="overflow-hidden rounded-[var(--radius-shell)] border border-zinc-200/80 bg-white shadow-[var(--shadow-card)]">
      <header className="flex flex-col gap-3 border-b border-zinc-200/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
            Audit trail
          </p>
          <h3 className="mt-1 text-lg font-semibold tracking-tight text-zinc-900">
            Recent governance activity
          </h3>
          <p className="mt-1 text-sm text-zinc-500">
            Who did what — imports, pipeline runs, stewardship, and rule changes.
          </p>
        </div>
        <Link
          href="/audit"
          className="inline-flex shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-semibold text-zinc-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-800"
        >
          View full audit log
        </Link>
      </header>

      {feed.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <p className="text-sm font-medium text-zinc-800">No audit events yet</p>
          <p className="mt-1 text-sm text-zinc-500">
            Import quarantine data, run the pipeline, or change rules to populate this feed.
          </p>
        </div>
      ) : (
        <ol className="relative divide-y divide-zinc-100">
          {feed.map((item, index) => {
            const style = categoryStyle(item.category);
            const row = (
              <div className="flex gap-4 py-4">
                <div className="relative flex w-3 shrink-0 justify-center pt-1.5">
                  <span
                    className={`z-10 h-2.5 w-2.5 rounded-full ring-4 ring-white ${style.dot}`}
                  />
                  {index < feed.length - 1 ? (
                    <span
                      className="absolute top-4 h-[calc(100%+1rem)] w-px bg-zinc-200"
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
                    <span className="font-mono text-[10px] text-zinc-400">{item.action}</span>
                    <span className="text-xs text-zinc-400">{formatRelativeTime(item.timestamp)}</span>
                  </div>
                  <p className="mt-1.5 text-sm font-medium text-zinc-900">{item.summary}</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    <span className="font-medium text-zinc-600">{item.user_id}</span>
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
                    className="block px-5 transition hover:bg-blue-50/40 sm:px-6"
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
