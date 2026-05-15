"use client";

import Link from "next/link";

const STATUS_STYLES = {
  pass: {
    ring: "ring-emerald-200/80",
    bg: "bg-gradient-to-br from-emerald-50/90 to-white",
    badge: "bg-emerald-100 text-emerald-800",
    dot: "bg-emerald-500",
    metric: "text-emerald-800",
  },
  warning: {
    ring: "ring-amber-200/80",
    bg: "bg-gradient-to-br from-amber-50/90 to-white",
    badge: "bg-amber-100 text-amber-900",
    dot: "bg-amber-500",
    metric: "text-amber-900",
  },
  fail: {
    ring: "ring-rose-200/80",
    bg: "bg-gradient-to-br from-rose-50/90 to-white",
    badge: "bg-rose-100 text-rose-800",
    dot: "bg-rose-500",
    metric: "text-rose-800",
  },
};

const OVERALL_BANNER = {
  healthy: "border-emerald-200 bg-emerald-50/80 text-emerald-900",
  at_risk: "border-amber-200 bg-amber-50/80 text-amber-950",
  breach: "border-rose-200 bg-rose-50/80 text-rose-900",
};

function styleFor(status) {
  return STATUS_STYLES[status] || STATUS_STYLES.warning;
}

export default function SlaWidgets({ sla }) {
  if (!sla) {
    return null;
  }

  const widgets = sla.widgets || [];
  const overall = sla.overall_status || "healthy";
  const bannerClass = OVERALL_BANNER[overall] || OVERALL_BANNER.healthy;

  return (
    <section className="overflow-hidden rounded-[var(--radius-shell)] border border-zinc-200/80 bg-white shadow-[var(--shadow-card)]">
      <header className="border-b border-zinc-200/70 px-5 py-4 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              Service levels
            </p>
            <h3 className="mt-1 text-lg font-semibold tracking-tight text-zinc-900">
              Operational SLAs
            </h3>
          </div>
          <p
            className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold ${bannerClass}`}
          >
            {sla.overall_label || "SLA status"}
          </p>
        </div>
      </header>

      <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-5">
        {widgets.map((widget) => {
          const styles = styleFor(widget.status);
          const inner = (
            <>
              <div className="flex items-start justify-between gap-2">
                <span className={`h-2 w-2 shrink-0 rounded-full ${styles.dot}`} />
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${styles.badge}`}>
                  {widget.status_label}
                </span>
              </div>
              <p className="mt-3 text-xs font-medium text-zinc-600">{widget.label}</p>
              <p className={`mt-1 text-2xl font-semibold tabular-nums tracking-tight ${styles.metric}`}>
                {widget.metric}
              </p>
              {widget.sla_target ? (
                <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-zinc-400">
                  SLA: {widget.sla_target}
                </p>
              ) : null}
              <p className="mt-2 text-xs leading-relaxed text-zinc-500">{widget.detail}</p>
            </>
          );

          const cardClass = `block rounded-xl border border-transparent p-4 ring-1 transition hover:shadow-md ${styles.ring} ${styles.bg}`;

          return widget.href ? (
            <Link key={widget.key} href={widget.href} className={cardClass}>
              {inner}
            </Link>
          ) : (
            <div key={widget.key} className={cardClass}>
              {inner}
            </div>
          );
        })}
      </div>
    </section>
  );
}
