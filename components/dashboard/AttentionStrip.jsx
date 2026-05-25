"use client";

import Link from "next/link";

function severityModifier(severity) {
  if (severity === "high") return "mdm-alert--high";
  if (severity === "medium") return "mdm-alert--medium";
  return "mdm-alert--low";
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
      <section className="mdm-alert mdm-alert--ok px-4 py-3.5">
        <p className="mdm-alert-title">All clear</p>
        <p className="mdm-alert-detail">No urgent governance actions right now.</p>
      </section>
    );
  }

  return (
    <section className="mdm-attention-panel">
      <div className="mdm-attention-header">
        <p className="mdm-section-label">Needs attention</p>
        <span className="mdm-attention-count" aria-label={`${unique.length} items`}>
          {unique.length}
        </span>
      </div>
      <ul className="mt-3 grid gap-3 sm:grid-cols-3">
        {unique.map((item) => (
          <li key={item.key}>
            <Link
              href={item.href}
              className={`mdm-alert ${severityModifier(item.severity)}`}
            >
              <p className="mdm-alert-title">{item.label}</p>
              {item.detail ? (
                <p className="mdm-alert-detail line-clamp-2">{item.detail}</p>
              ) : null}
              <span className="mdm-alert-action">View details →</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
