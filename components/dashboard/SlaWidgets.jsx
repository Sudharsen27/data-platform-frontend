"use client";

import Link from "next/link";

function cardModifier(status) {
  if (status === "pass") return "mdm-sla-card--pass";
  if (status === "fail") return "mdm-sla-card--fail";
  return "mdm-sla-card--warning";
}

function bannerModifier(overall) {
  if (overall === "breach") return "mdm-status-banner--breach";
  if (overall === "at_risk") return "mdm-status-banner--warning";
  return "mdm-status-banner--healthy";
}

const DOT_COLORS = {
  pass: "bg-emerald-500",
  warning: "bg-amber-500",
  fail: "bg-rose-500",
};

export default function SlaWidgets({ sla }) {
  if (!sla) {
    return null;
  }

  const widgets = sla.widgets || [];
  const overall = sla.overall_status || "healthy";

  return (
    <section className="mdm-surface-panel">
      <header className="mdm-surface-panel-header">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mdm-section-label">Service levels</p>
            <h3 className="mt-1 text-lg font-semibold tracking-tight text-[var(--foreground)]">
              Operational SLAs
            </h3>
          </div>
          <p
            className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold ${bannerModifier(overall)}`}
          >
            {sla.overall_label || "SLA status"}
          </p>
        </div>
      </header>

      <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-5">
        {widgets.map((widget) => {
          const modifier = cardModifier(widget.status);
          const dot = DOT_COLORS[widget.status] || DOT_COLORS.warning;

          const inner = (
            <>
              <div className="flex items-start justify-between gap-2">
                <span className={`h-2 w-2 shrink-0 rounded-full ${dot}`} aria-hidden />
                <span className="mdm-sla-badge">{widget.status_label}</span>
              </div>
              <p className="mt-3 text-xs font-medium text-[var(--text-muted)]">{widget.label}</p>
              <p className="mdm-sla-metric mt-1">{widget.metric}</p>
              {widget.sla_target ? (
                <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-[var(--text-subtle)]">
                  SLA: {widget.sla_target}
                </p>
              ) : null}
              <p className="mt-2 text-xs leading-relaxed text-[var(--text-muted)]">{widget.detail}</p>
            </>
          );

          const cardClass = `mdm-sla-card ${modifier}`;

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
