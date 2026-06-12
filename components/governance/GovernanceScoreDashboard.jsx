"use client";

import Link from "next/link";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Spinner from "@/components/ui/Spinner";

function clampScore(value) {
  const n = Number(value);
  if (Number.isNaN(n)) {
    return 0;
  }
  return Math.min(100, Math.max(0, Math.round(n)));
}

function scoreColor(score) {
  const s = clampScore(score);
  if (s >= 80) {
    return "text-emerald-600 dark:text-emerald-400";
  }
  if (s >= 60) {
    return "text-amber-600 dark:text-amber-400";
  }
  return "text-rose-600 dark:text-rose-400";
}

function barColor(score) {
  const s = clampScore(score);
  if (s >= 80) {
    return "bg-emerald-500 dark:bg-emerald-400";
  }
  if (s >= 60) {
    return "bg-amber-500 dark:bg-amber-400";
  }
  return "bg-rose-500 dark:bg-rose-400";
}

function ProgressBar({ score, heightClass = "h-2", label }) {
  const value = clampScore(score);
  return (
    <div
      className={`overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800 ${heightClass}`}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label ? `${label}: ${value}%` : `${value}%`}
    >
      <div
        className={`h-full rounded-full transition-all duration-300 ${barColor(value)}`}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

function ScoreRing({ score, label, sublabel }) {
  const value = clampScore(score);
  return (
    <div className="flex min-w-0 flex-col items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--color-surface)] p-4 text-center sm:p-6">
      <p className="text-xs font-bold uppercase tracking-wide text-[var(--text-muted)]">{label}</p>
      <p className={`mt-2 text-4xl font-bold tabular-nums sm:text-5xl ${scoreColor(value)}`}>{value}</p>
      <p className="mt-1 text-sm text-[var(--text-muted)]">/ 100</p>
      {sublabel ? (
        <p className="mt-2 line-clamp-2 text-xs text-[var(--text-subtle)]">{sublabel}</p>
      ) : null}
    </div>
  );
}

function DimensionBar({ label, score }) {
  const value = clampScore(score);
  return (
    <div className="min-w-0">
      <div className="mb-1 flex items-center justify-between gap-2 text-xs">
        <span className="truncate text-[var(--foreground)]">{label}</span>
        <span className={`shrink-0 font-semibold tabular-nums ${scoreColor(value)}`}>{value}%</span>
      </div>
      <ProgressBar score={value} label={label} />
    </div>
  );
}

function KpiWidget({ title, score, detail, trend }) {
  const value = clampScore(score);
  const trendUp = trend?.direction === "up";
  const trendDown = trend?.direction === "down";
  const trendLabel =
    trend?.unit === "events"
      ? `${trend.delta >= 0 ? "+" : ""}${trend.delta} ${trend.unit}`
      : `${trend?.delta >= 0 ? "+" : ""}${trend?.delta ?? 0} vs target`;

  return (
    <Card className="min-w-0 p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-wide text-[var(--text-muted)]">{title}</p>
        {trend ? (
          <span
            className={`shrink-0 text-[10px] font-semibold ${
              trendUp
                ? "text-emerald-600 dark:text-emerald-400"
                : trendDown
                  ? "text-rose-600 dark:text-rose-400"
                  : "text-[var(--text-subtle)]"
            }`}
            title={trendLabel}
          >
            {trendUp ? "▲" : trendDown ? "▼" : "—"} {trendLabel}
          </span>
        ) : null}
      </div>
      <p className={`mt-2 text-2xl font-bold tabular-nums sm:text-3xl ${scoreColor(value)}`}>{value}%</p>
      <div className="mt-2">
        <ProgressBar score={value} heightClass="h-1.5" label={title} />
      </div>
      {detail ? <p className="mt-2 text-xs text-[var(--text-subtle)]">{detail}</p> : null}
    </Card>
  );
}

function DatasetScoreChart({ datasets }) {
  return (
    <Card className="min-w-0 p-4">
      <p className="text-sm font-semibold text-[var(--foreground)]">Dataset governance scores</p>
      {!datasets?.length ? (
        <p className="mt-4 text-sm text-[var(--text-muted)]">
          No catalog datasets registered yet. Add assets in the Data Catalog to see scores here.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {datasets.slice(0, 8).map((row) => {
            const value = clampScore(row.overall_score ?? row.governance_score);
            return (
              <div key={row.dataset_id} className="min-w-0">
                <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                  <Link
                    href={`/catalog?asset=${row.dataset_id}`}
                    className="min-w-0 truncate font-medium text-violet-700 hover:underline dark:text-violet-300"
                  >
                    {row.dataset_name}
                  </Link>
                  <span className={`shrink-0 font-semibold tabular-nums ${scoreColor(value)}`}>
                    {value}/100
                  </span>
                </div>
                <ProgressBar score={value} heightClass="h-3" label={row.dataset_name} />
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Loading governance dashboard">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-36 rounded-xl border border-[var(--border-subtle)] bg-[var(--color-surface)]"
          />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div
            key={i}
            className="h-28 rounded-xl border border-[var(--border-subtle)] bg-[var(--color-surface)]"
          />
        ))}
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <Card className="flex flex-col items-center gap-4 p-8 text-center">
      <p className="text-sm font-semibold text-[var(--foreground)]">Unable to load governance dashboard</p>
      <p className="max-w-md text-sm text-[var(--text-muted)]">{message}</p>
      {onRetry ? (
        <Button type="button" variant="secondary" size="sm" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </Card>
  );
}

function EmptyCatalogState() {
  return (
    <Card className="border-dashed p-8 text-center">
      <p className="text-sm font-semibold text-[var(--foreground)]">No datasets to score</p>
      <p className="mt-2 text-sm text-[var(--text-muted)]">
        Register catalog assets to begin measuring governance maturity across your data estate.
      </p>
      <Link
        href="/catalog"
        className="mt-4 inline-block text-sm font-medium text-violet-700 hover:underline dark:text-violet-300"
      >
        Go to Data Catalog →
      </Link>
    </Card>
  );
}

function trendForKey(trends, key) {
  return (trends || []).find((row) => row.key === key);
}

function ResponsiveTable({ columns, rows, rowKey }) {
  return (
    <>
      <div className="mt-3 space-y-3 md:hidden">
        {rows.map((row) => (
          <div
            key={rowKey(row)}
            className="rounded-lg border border-[var(--border-subtle)] bg-[var(--color-surface)] p-3 text-sm"
          >
            {columns.map((col) => (
              <div key={col.key} className="flex justify-between gap-3 py-1">
                <span className="text-xs uppercase text-[var(--text-muted)]">{col.label}</span>
                <span className="min-w-0 text-right text-[var(--foreground)]">{col.render(row)}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="mt-3 hidden overflow-x-auto md:block">
        <table className="w-full min-w-[32rem] text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border-subtle)] text-xs uppercase text-[var(--text-muted)]">
              {columns.map((col) => (
                <th key={col.key} className="py-2 pr-4 last:pr-0">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={rowKey(row)} className="border-b border-[var(--border-subtle)]">
                {columns.map((col) => (
                  <td key={col.key} className="py-2 pr-4 last:pr-0">
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default function GovernanceScoreDashboard({ loading, data, error, onRetry }) {
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center gap-2 py-4 text-sm text-[var(--text-muted)]">
          <Spinner size="md" />
          Calculating governance health scores…
        </div>
        <DashboardSkeleton />
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={onRetry} />;
  }

  if (!data) {
    return (
      <Card className="p-8 text-center">
        <p className="text-sm text-[var(--text-muted)]">No governance score data available.</p>
        {onRetry ? (
          <Button type="button" variant="secondary" size="sm" className="mt-4" onClick={onRetry}>
            Reload
          </Button>
        ) : null}
      </Card>
    );
  }

  const dims = data.dimensions || {};
  const details = data.dimension_details || [];
  const trends = data.trends || [];
  const governanceGaps = data.governance_gaps || [];
  const overallScore = clampScore(data.overall_score);
  const riskScore = clampScore(data.risk_score ?? 100 - overallScore);
  const overallTrend = trendForKey(trends, "overall_score");
  const isEmptyCatalog = (data.dataset_count ?? 0) === 0;

  const dimensionRows =
    details.length > 0
      ? details
      : Object.entries(dims).map(([key, score]) => ({
          key,
          label: key.replace(/_/g, " "),
          score,
        }));

  return (
    <div className="min-w-0 space-y-6">
      {isEmptyCatalog ? <EmptyCatalogState /> : null}

      <div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ScoreRing
          score={overallScore}
          label="Overall Governance Score"
          sublabel={`${data.risk_level || "—"}${
            overallTrend
              ? ` · ${overallTrend.delta >= 0 ? "+" : ""}${overallTrend.delta} vs target`
              : ""
          }`}
        />
        <ScoreRing score={riskScore} label="Risk Score" sublabel="Lower is better" />
        <Card className="flex min-w-0 flex-col justify-center p-4 sm:p-6">
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--text-muted)]">
            Catalog coverage
          </p>
          <p className="mt-2 text-2xl font-bold text-[var(--foreground)]">{data.dataset_count ?? 0}</p>
          <p className="text-sm text-[var(--text-muted)]">datasets scored</p>
          <p className="mt-2 text-sm text-[var(--text-muted)]">{data.domain_count ?? 0} domains</p>
        </Card>
        <Card className="flex min-w-0 flex-col justify-center p-4 sm:p-6">
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--text-muted)]">
            Governance gaps
          </p>
          <p className="mt-2 text-2xl font-bold text-rose-600 dark:text-rose-400">
            {governanceGaps.length || (data.missing_governance_areas || []).length}
          </p>
          <p className="text-sm text-[var(--text-muted)]">dimensions below 70%</p>
        </Card>
      </div>

      <div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiWidget
          title="Metadata Coverage"
          score={dims.metadata_coverage}
          detail="Owners, descriptions, schema fields"
          trend={trendForKey(trends, "metadata_coverage")}
        />
        <KpiWidget
          title="Classification Coverage"
          score={dims.classification_coverage}
          detail="Field-level sensitivity classification"
          trend={trendForKey(trends, "classification_coverage")}
        />
        <KpiWidget
          title="Documentation Coverage"
          score={dims.documentation_coverage}
          detail="Approved dataset documentation"
          trend={trendForKey(trends, "documentation_coverage")}
        />
        <KpiWidget
          title="Rule Coverage"
          score={dims.rule_coverage}
          detail="Active quality rules per field"
          trend={trendForKey(trends, "rule_coverage")}
        />
        <KpiWidget
          title="Stewardship Resolution"
          score={dims.stewardship_resolution_rate}
          detail="Resolution rate for stewardship tasks"
          trend={trendForKey(trends, "stewardship_resolution_rate")}
        />
        <KpiWidget
          title="Lineage Coverage"
          score={dims.lineage_coverage}
          detail="Assets linked to lineage graph"
          trend={trendForKey(trends, "lineage_coverage")}
        />
        <KpiWidget
          title="Glossary Coverage"
          score={dims.glossary_coverage}
          detail="Approved business glossary terms"
          trend={trendForKey(trends, "glossary_coverage")}
        />
        <KpiWidget
          title="Audit Compliance"
          score={dims.audit_compliance}
          detail="Recent governance audit activity"
          trend={trendForKey(trends, "audit_compliance")}
        />
      </div>

      <div className="grid min-w-0 gap-4 lg:grid-cols-2">
        <DatasetScoreChart datasets={data.datasets} />
        <Card className="min-w-0 p-4">
          <p className="text-sm font-semibold text-[var(--foreground)]">Scoring dimensions</p>
          <div className="mt-4 space-y-3">
            {dimensionRows.map((row) => (
              <DimensionBar key={row.key} label={row.label} score={row.score} />
            ))}
          </div>
        </Card>
      </div>

      <Card className="min-w-0 p-4">
        <p className="text-sm font-semibold text-[var(--foreground)]">Improvement recommendations</p>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-[var(--text-muted)]">
          {(data.recommendations || []).length ? (
            data.recommendations.map((rec) => <li key={rec}>{rec}</li>)
          ) : (
            <li>Governance posture is healthy across measured dimensions.</li>
          )}
        </ul>
        {governanceGaps.length ? (
          <div className="mt-4">
            <p className="text-xs font-bold uppercase tracking-wide text-rose-700 dark:text-rose-400">
              Governance gap analysis
            </p>
            <ul className="mt-2 space-y-2 text-xs text-[var(--text-muted)]">
              {governanceGaps.map((gap) => (
                <li
                  key={gap.dimension}
                  className="rounded-lg border border-[var(--border-subtle)] bg-[var(--color-surface)] p-2 dark:bg-zinc-900/40"
                >
                  <p className="font-semibold text-[var(--foreground)]">
                    {gap.label} — {clampScore(gap.score)}%{" "}
                    <span className="capitalize text-rose-600 dark:text-rose-400">({gap.severity})</span>
                  </p>
                  <p className="mt-1">
                    Gap: {gap.gap} points below target ({gap.target}%)
                  </p>
                  {gap.affected_datasets?.length ? (
                    <p className="mt-1 break-words">Affected: {gap.affected_datasets.join(", ")}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ) : (data.missing_governance_areas || []).length ? (
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

      {(data.datasets_needing_attention || []).length ? (
        <Card className="min-w-0 p-4">
          <p className="text-sm font-semibold text-[var(--foreground)]">Datasets needing attention</p>
          <ResponsiveTable
            rowKey={(row) => row.dataset_id}
            rows={data.datasets_needing_attention}
            columns={[
              {
                key: "name",
                label: "Dataset",
                render: (row) => (
                  <Link
                    href={`/catalog?asset=${row.dataset_id}`}
                    className="font-medium text-violet-700 hover:underline dark:text-violet-300"
                  >
                    {row.dataset_name}
                  </Link>
                ),
              },
              {
                key: "score",
                label: "Score",
                render: (row) => (
                  <span className={`font-semibold tabular-nums ${scoreColor(row.overall_score)}`}>
                    {clampScore(row.overall_score)}/100
                  </span>
                ),
              },
              {
                key: "gaps",
                label: "Gaps",
                render: (row) => (
                  <span className="text-xs text-[var(--text-muted)]">
                    {(row.missing_governance_areas || []).join(", ") || "—"}
                  </span>
                ),
              },
            ]}
          />
        </Card>
      ) : null}

      {(data.domains || []).length ? (
        <Card className="min-w-0 p-4">
          <p className="text-sm font-semibold text-[var(--foreground)]">Domain governance scores</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {data.domains.map((domain) => {
              const value = clampScore(domain.overall_score);
              return (
                <div
                  key={domain.domain}
                  className="min-w-0 rounded-lg border border-[var(--border-subtle)] bg-[var(--color-surface)] p-3 dark:bg-zinc-900/40"
                >
                  <p className="truncate font-medium text-[var(--foreground)]">{domain.domain}</p>
                  <p className={`mt-1 text-2xl font-bold tabular-nums ${scoreColor(value)}`}>
                    {value}/100
                  </p>
                  <div className="mt-2">
                    <ProgressBar score={value} heightClass="h-2" label={domain.domain} />
                  </div>
                  <p className="mt-2 text-xs text-[var(--text-muted)]">
                    {domain.dataset_count} dataset{domain.dataset_count === 1 ? "" : "s"}
                  </p>
                </div>
              );
            })}
          </div>
        </Card>
      ) : null}

      {(data.datasets || []).length ? (
        <Card className="min-w-0 p-4">
          <p className="text-sm font-semibold text-[var(--foreground)]">All datasets</p>
          <ResponsiveTable
            rowKey={(row) => row.dataset_id}
            rows={data.datasets}
            columns={[
              {
                key: "name",
                label: "Dataset",
                render: (row) => (
                  <Link
                    href={`/catalog?asset=${row.dataset_id}`}
                    className="font-medium text-violet-700 hover:underline dark:text-violet-300"
                  >
                    {row.dataset_name}
                  </Link>
                ),
              },
              {
                key: "domain",
                label: "Domain",
                render: (row) => (
                  <span className="text-[var(--text-muted)]">{row.domain || "—"}</span>
                ),
              },
              {
                key: "score",
                label: "Score",
                render: (row) => (
                  <span className={`font-semibold tabular-nums ${scoreColor(row.overall_score)}`}>
                    {clampScore(row.overall_score)}/100
                  </span>
                ),
              },
            ]}
          />
        </Card>
      ) : null}
    </div>
  );
}
