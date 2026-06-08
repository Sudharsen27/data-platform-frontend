"use client";

import ClassificationBadge, { riskScoreClass } from "@/components/governance/ClassificationBadge";
import Spinner from "@/components/ui/Spinner";

export default function ClassificationSummary({ loading, result }) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 py-4 text-sm text-[var(--text-muted)]">
        <Spinner size="sm" />
        Analyzing classification…
      </div>
    );
  }
  if (!result) {
    return null;
  }

  return (
    <div className="space-y-4 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <ClassificationBadge classification={result.dataset_classification} />
        <span className="text-xs text-[var(--text-muted)]">
          Risk score:{" "}
          <span className={`font-bold ${riskScoreClass(result.risk_score)}`}>
            {result.risk_score}/100
          </span>
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          ["PII", result.pii_count],
          ["Sensitive", result.sensitive_count],
          ["Financial", result.financial_count],
          ["Confidential", result.confidential_count],
        ].map(([label, count]) => (
          <div
            key={label}
            className="rounded-lg border border-[var(--border-subtle)] bg-[var(--color-surface)] px-2 py-2 text-center"
          >
            <p className="text-[10px] font-semibold uppercase text-[var(--text-subtle)]">{label}</p>
            <p className="text-lg font-bold text-[var(--foreground)]">{count ?? 0}</p>
          </div>
        ))}
      </div>

      {result.ai_summary ? (
        <div className="rounded-lg border border-[var(--border-color)] bg-[var(--color-primary-muted)]/30 p-3">
          <p className="mb-1 text-[10px] font-semibold uppercase text-[var(--text-muted)]">
            AI Summary
          </p>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--foreground)]">
            {result.ai_summary}
          </p>
        </div>
      ) : null}

      {(result.all_fields || []).length > 0 ? (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase text-[var(--text-subtle)]">
            Field classifications
          </p>
          <ul className="max-h-48 space-y-2 overflow-y-auto">
            {result.all_fields.map((field) => (
              <li
                key={field.field_name}
                className="flex items-start justify-between gap-2 rounded-md border border-[var(--border-subtle)] px-2 py-1.5"
              >
                <div className="min-w-0">
                  <p className="font-mono text-xs text-[var(--foreground)]">{field.field_name}</p>
                  <p className="text-[11px] text-[var(--text-muted)]">{field.reason}</p>
                </div>
                <ClassificationBadge classification={field.classification} size="xs" />
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {(result.recommendations || []).length > 0 ? (
        <div>
          <p className="mb-1 text-xs font-semibold uppercase text-[var(--text-subtle)]">
            Recommendations
          </p>
          <ul className="list-inside list-disc text-xs text-[var(--text-muted)]">
            {result.recommendations.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
