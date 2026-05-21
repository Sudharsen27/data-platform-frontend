"use client";

import Link from "next/link";

function severityClass(severity) {
  if (severity === "high") {
    return "border-rose-200 bg-rose-50 text-rose-900";
  }
  if (severity === "medium") {
    return "border-amber-200 bg-amber-50 text-amber-900";
  }
  return "border-blue-200 bg-blue-50 text-blue-900";
}

export default function AttentionStrip({ alerts = [], pipelineStatus = null, slaStatus = null }) {
  const items = [];

  for (const alert of alerts.slice(0, 3)) {
    if (alert?.href) {
      items.push({
        key: alert.name,
        label: alert.name,
        detail: alert.detail,
        href: alert.href,
        severity: alert.severity || "medium",
      });
    }
  }

  const pipeline = pipelineStatus?.status;
  if (items.length < 3 && (pipeline === "failed" || pipeline === "idle")) {
    items.push({
      key: "pipeline",
      label: pipeline === "failed" ? "Pipeline failed" : "Pipeline not run recently",
      detail: pipelineStatus?.last_message || "Run pipeline to process quarantine.",
      href: "/pipeline",
      severity: pipeline === "failed" ? "high" : "low",
    });
  }

  const widgets = slaStatus?.widgets || [];
  for (const w of widgets) {
    if (items.length >= 3) {
      break;
    }
    if (w.status === "fail" || w.status === "warning") {
      items.push({
        key: w.key,
        label: w.label,
        detail: w.detail,
        href: w.href || "/dashboard",
        severity: w.status === "fail" ? "high" : "medium",
      });
    }
  }

  const unique = [];
  const seen = new Set();
  for (const item of items) {
    if (seen.has(item.key)) {
      continue;
    }
    seen.add(item.key);
    unique.push(item);
    if (unique.length >= 3) {
      break;
    }
  }

  if (unique.length === 0) {
    return (
      <section className="rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3 text-sm text-emerald-900">
        <span className="font-medium">All clear</span> — no urgent governance actions right now.
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">Needs attention</p>
      <ul className="mt-3 grid gap-2 sm:grid-cols-3">
        {unique.map((item) => (
          <li key={item.key}>
            <Link
              href={item.href}
              className={`block rounded-lg border p-3 transition hover:shadow-sm ${severityClass(item.severity)}`}
            >
              <p className="text-sm font-semibold">{item.label}</p>
              {item.detail ? (
                <p className="mt-1 line-clamp-2 text-xs opacity-90">{item.detail}</p>
              ) : null}
              <span className="mt-2 inline-block text-xs font-medium underline decoration-current/30">
                Open →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
