"use client";

import Link from "next/link";
import Card from "@/components/ui/Card";
import Spinner from "@/components/ui/Spinner";

function scoreColor(score) {
  if (score >= 80) {
    return "text-emerald-600 dark:text-emerald-400";
  }
  if (score >= 60) {
    return "text-amber-600 dark:text-amber-400";
  }
  return "text-rose-600 dark:text-rose-400";
}

function barColor(score) {
  if (score >= 80) {
    return "bg-emerald-500";
  }
  if (score >= 60) {
    return "bg-amber-500";
  }
  return "bg-rose-500";
}

function ScoreRing({ score, label, sublabel }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--color-surface)] p-6 text-center">
      <p className="text-xs font-bold uppercase tracking-wide text-[var(--text-muted)]">{label}</p>
      <p className={`mt-2 text-5xl font-bold tabular-nums ${scoreColor(score)}`}>{score}</p>
      <p className="mt-1 text-sm text-[var(--text-muted)]">/ 100</p>
      {sublabel ? <p className="mt-2 text-xs text-[var(--text-subtle)]">{sublabel}</p> : null}
    </div>
  );
}

function DimensionBar({ label, score }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2 text-xs">
        <span className="text-[var(--foreground)]">{label}</span>
        <span className={`font-semibold tabular-nums ${scoreColor(score)}`}>{score}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
        <div
          className={`h-full rounded-full transition-all ${barColor(score)}`}
          style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
        />
      </div>
    </div>
  );
}

function KpiWidget({ title, score, detail }) {
  return (
    <Card className="p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-[var(--text-muted)]">{title}</p>
      <p className={`mt-2 text-3xl font-bold tabular-nums ${scoreColor(score)}`}>{score}%</p>
      {detail ? <p className="mt-1 text-xs text-[var(--text-subtle)]">{detail}</p> : null}
    </Card>
  );
}

export default function GovernanceScoreDashboard({ loading, data }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-[var(--text-muted)]">
        <Spinner size="md" />
        Calculating governance health scores…
      </div>
    );
  }

  if (!data) {
    return (
      <p className="py-8 text-center text-sm text-[var(--text-muted)]">
        No governance score data available.
      </p>
    );
  }

  const dims = data.dimensions || {};
  const details = data.dimension_details || [];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ScoreRing
          score={data.overall_score}
          label="Overall Governance Score"
          sublabel={data.risk_level}
        />
        <ScoreRing
          score={data.risk_score}
          label="Risk Score"
          sublabel="Lower is better"
        />
        <Card className="flex flex-col justify-center p-6">
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--text-muted)]">
            Catalog coverage
          </p>
          <p className="mt-2 text-2xl font-bold text-[var(--foreground)]">{data.dataset_count}</p>
          <p className="text-sm text-[var(--text-muted)]">datasets scored</p>
          <p className="mt-2 text-sm text-[var(--text-muted)]">{data.domain_count} domains</p>
        </Card>
        <Card className="flex flex-col justify-center p-6">
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--text-muted)]">
            Governance gaps
          </p>
          <p className="mt-2 text-2xl font-bold text-rose-600 dark:text-rose-400">
            {(data.missing_governance_areas || []).length}
          </p>
          <p className="text-sm text-[var(--text-muted)]">dimensions below 70%</p>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <KpiWidget
          title="Classification Coverage"
          score={dims.classification_coverage ?? 0}
          detail="Field-level sensitivity classification"
        />
        <KpiWidget
          title="Documentation Coverage"
          score={dims.documentation_coverage ?? 0}
          detail="Approved dataset documentation"
        />
        <KpiWidget
          title="Rule Coverage"
          score={dims.rule_coverage ?? 0}
          detail="Active quality rules per field"
        />
        <KpiWidget
          title="Stewardship Metrics"
          score={dims.stewardship_resolution_rate ?? 0}
          detail="Resolution rate for stewardship tasks"
        />
        <KpiWidget
          title="Lineage Metrics"
          score={dims.lineage_coverage ?? 0}
          detail="Assets linked to lineage graph"
        />
        <KpiWidget
          title="Glossary Coverage"
          score={dims.glossary_coverage ?? 0}
          detail="Approved business glossary terms"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <p className="text-sm font-semibold text-[var(--foreground)]">Scoring dimensions</p>
          <div className="mt-4 space-y-3">
            {(details.length ? details : Object.entries(dims).map(([key, score]) => ({
              key,
              label: key.replace(/_/g, " "),
              score,
            }))).map((row) => (
              <DimensionBar key={row.key} label={row.label} score={row.score} />
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <p className="text-sm font-semibold text-[var(--foreground)]">Recommendations</p>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-[var(--text-muted)]">
            {(data.recommendations || []).length ? (
              data.recommendations.map((rec) => <li key={rec}>{rec}</li>)
            ) : (
              <li>Governance posture is healthy across measured dimensions.</li>
            )}
          </ul>
          {(data.missing_governance_areas || []).length ? (
            <div className="mt-4">
              <p className="text-xs font-bold uppercase tracking-wide text-rose-700 dark:text-rose-400">
                Missing governance areas
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-[var(--text-muted)]">
                {data.missing_governance_areas.map((area) => (
                  <li key={area}>{area}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </Card>
      </div>

      {(data.datasets_needing_attention || []).length ? (
        <Card className="p-4">
          <p className="text-sm font-semibold text-[var(--foreground)]">Datasets needing attention</p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] text-xs uppercase text-[var(--text-muted)]">
                  <th className="py-2 pr-4">Dataset</th>
                  <th className="py-2 pr-4">Score</th>
                  <th className="py-2">Gaps</th>
                </tr>
              </thead>
              <tbody>
                {data.datasets_needing_attention.map((row) => (
                  <tr key={row.dataset_id} className="border-b border-[var(--border-subtle)]">
                    <td className="py-2 pr-4">
                      <Link
                        href={`/catalog?asset=${row.dataset_id}`}
                        className="font-medium text-violet-700 hover:underline dark:text-violet-300"
                      >
                        {row.dataset_name}
                      </Link>
                    </td>
                    <td className={`py-2 pr-4 font-semibold tabular-nums ${scoreColor(row.overall_score)}`}>
                      {row.overall_score}/100
                    </td>
                    <td className="py-2 text-xs text-[var(--text-muted)]">
                      {(row.missing_governance_areas || []).join(", ") || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}

      {(data.domains || []).length ? (
        <Card className="p-4">
          <p className="text-sm font-semibold text-[var(--foreground)]">Domain governance scores</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.domains.map((domain) => (
              <div
                key={domain.domain}
                className="rounded-lg border border-[var(--border-subtle)] bg-[var(--color-surface)] p-3"
              >
                <p className="font-medium text-[var(--foreground)]">{domain.domain}</p>
                <p className={`mt-1 text-2xl font-bold tabular-nums ${scoreColor(domain.overall_score)}`}>
                  {domain.overall_score}/100
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  {domain.dataset_count} dataset{domain.dataset_count === 1 ? "" : "s"}
                </p>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {(data.datasets || []).length ? (
        <Card className="p-4">
          <p className="text-sm font-semibold text-[var(--foreground)]">All datasets</p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] text-xs uppercase text-[var(--text-muted)]">
                  <th className="py-2 pr-4">Dataset</th>
                  <th className="py-2 pr-4">Domain</th>
                  <th className="py-2">Score</th>
                </tr>
              </thead>
              <tbody>
                {data.datasets.map((row) => (
                  <tr key={row.dataset_id} className="border-b border-[var(--border-subtle)]">
                    <td className="py-2 pr-4">
                      <Link
                        href={`/catalog?asset=${row.dataset_id}`}
                        className="font-medium text-violet-700 hover:underline dark:text-violet-300"
                      >
                        {row.dataset_name}
                      </Link>
                    </td>
                    <td className="py-2 pr-4 text-[var(--text-muted)]">{row.domain || "—"}</td>
                    <td className={`py-2 font-semibold tabular-nums ${scoreColor(row.overall_score)}`}>
                      {row.overall_score}/100
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
