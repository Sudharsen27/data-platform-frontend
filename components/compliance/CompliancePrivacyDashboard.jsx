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

function distributionBarColor(colorKey) {
  if (colorKey === "rose") {
    return "bg-rose-500 dark:bg-rose-400";
  }
  if (colorKey === "amber") {
    return "bg-amber-500 dark:bg-amber-400";
  }
  return "bg-emerald-500 dark:bg-emerald-400";
}

function severityBadge(severity) {
  const value = (severity || "medium").toLowerCase();
  if (value === "high") {
    return "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200";
  }
  if (value === "low") {
    return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200";
  }
  return "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200";
}

function priorityBadge(priority) {
  const value = (priority || "medium").toLowerCase();
  if (value === "high") {
    return "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200";
  }
  if (value === "low") {
    return "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200";
  }
  return "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200";
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

function KpiCard({ title, value, subtitle, accent = "default" }) {
  const accentClass =
    accent === "danger"
      ? "text-rose-600 dark:text-rose-400"
      : accent === "warning"
        ? "text-amber-600 dark:text-amber-400"
        : "text-[var(--foreground)]";

  return (
    <Card className="min-w-0 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-[var(--text-muted)]">{title}</p>
      <p className={`mt-2 text-3xl font-bold tabular-nums ${accentClass}`}>{value}</p>
      {subtitle ? <p className="mt-2 text-xs text-[var(--text-subtle)]">{subtitle}</p> : null}
    </Card>
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

function AssetDistributionChart({ distribution, datasetCount }) {
  const total = Math.max(datasetCount || 0, 1);
  return (
    <Card className="min-w-0 p-4">
      <p className="text-sm font-semibold text-[var(--foreground)]">Asset sensitivity distribution</p>
      {!distribution?.length ? (
        <p className="mt-4 text-sm text-[var(--text-muted)]">No catalog datasets to analyze.</p>
      ) : (
        <div className="mt-4 space-y-4">
          {distribution.map((row) => {
            const pct = Math.round((row.count / total) * 100);
            return (
              <div key={row.label} className="min-w-0">
                <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                  <span className="truncate text-[var(--foreground)]">{row.label}</span>
                  <span className="shrink-0 font-semibold tabular-nums text-[var(--text-muted)]">
                    {row.count} ({pct}%)
                  </span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                  <div
                    className={`h-full rounded-full ${distributionBarColor(row.color_key)}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

function CoverageChart({ rows }) {
  return (
    <Card className="min-w-0 p-4">
      <p className="text-sm font-semibold text-[var(--foreground)]">Privacy compliance coverage</p>
      <div className="mt-4 space-y-3">
        {(rows || []).map((row) => (
          <div key={row.key} className="min-w-0">
            <div className="mb-1 flex items-center justify-between gap-2 text-xs">
              <span className="truncate text-[var(--foreground)]">{row.label}</span>
              <span className={`shrink-0 font-semibold tabular-nums ${scoreColor(row.score)}`}>
                {clampScore(row.score)}%
              </span>
            </div>
            <ProgressBar score={row.score} heightClass="h-2.5" label={row.label} />
          </div>
        ))}
      </div>
    </Card>
  );
}

function ResponsiveTable({ columns, rows, rowKey, emptyMessage }) {
  if (!rows?.length) {
    return <p className="mt-3 text-sm text-[var(--text-muted)]">{emptyMessage}</p>;
  }
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

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Loading compliance dashboard">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-32 rounded-xl border border-[var(--border-subtle)] bg-[var(--color-surface)]"
          />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="h-56 rounded-xl border border-[var(--border-subtle)] bg-[var(--color-surface)]"
          />
        ))}
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <Card className="flex flex-col items-center gap-4 p-8 text-center">
      <p className="text-sm font-semibold text-[var(--foreground)]">Unable to load compliance dashboard</p>
      <p className="max-w-md text-sm text-[var(--text-muted)]">{message}</p>
      {onRetry ? (
        <Button type="button" variant="secondary" size="sm" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </Card>
  );
}

const datasetLinkColumns = [
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
    render: (row) => row.domain || "—",
  },
  {
    key: "pii_tier",
    label: "PII tier",
    render: (row) => row.pii_tier || "—",
  },
];

export default function CompliancePrivacyDashboard({ loading, data, error, onRetry }) {
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center gap-2 py-4 text-sm text-[var(--text-muted)]">
          <Spinner size="md" />
          Calculating compliance & privacy metrics…
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
        <p className="text-sm text-[var(--text-muted)]">No compliance data available.</p>
        {onRetry ? (
          <Button type="button" variant="secondary" size="sm" className="mt-4" onClick={onRetry}>
            Reload
          </Button>
        ) : null}
      </Card>
    );
  }

  const complianceScore = clampScore(data.compliance_score);
  const isEmptyCatalog = (data.dataset_count ?? 0) === 0;

  return (
    <div className="min-w-0 space-y-6">
      <div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <ScoreRing
          score={complianceScore}
          label="Compliance Score"
          sublabel={`${data.risk_level || "—"} · Governance ${clampScore(data.governance_overall_score)}%`}
        />
        <KpiCard
          title="PII assets"
          value={data.pii_asset_count ?? 0}
          subtitle="Datasets with personal data indicators"
          accent={data.pii_asset_count > 0 ? "warning" : "default"}
        />
        <KpiCard
          title="Sensitive assets"
          value={data.sensitive_asset_count ?? 0}
          subtitle="PII, sensitive, or confidential classifications"
          accent={data.sensitive_asset_count > 0 ? "warning" : "default"}
        />
        <KpiCard
          title="Missing classification"
          value={data.datasets_missing_classification ?? 0}
          subtitle="Below 70% classification coverage"
          accent={data.datasets_missing_classification > 0 ? "danger" : "default"}
        />
        <KpiCard
          title="Missing documentation"
          value={data.datasets_missing_documentation ?? 0}
          subtitle="No approved privacy documentation"
          accent={data.datasets_missing_documentation > 0 ? "danger" : "default"}
        />
      </div>

      {isEmptyCatalog ? (
        <Card className="border-dashed p-8 text-center">
          <p className="text-sm font-semibold text-[var(--foreground)]">No datasets to assess</p>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Register catalog assets to measure compliance and privacy posture.
          </p>
          <Link
            href="/catalog"
            className="mt-4 inline-block text-sm font-medium text-violet-700 hover:underline dark:text-violet-300"
          >
            Go to Data Catalog →
          </Link>
        </Card>
      ) : null}

      <div className="grid min-w-0 gap-4 lg:grid-cols-2">
        <AssetDistributionChart
          distribution={data.asset_distribution}
          datasetCount={data.dataset_count}
        />
        <CoverageChart rows={data.coverage_chart} />
      </div>

      <div className="grid min-w-0 gap-4 lg:grid-cols-2">
        <Card className="min-w-0 p-4">
          <p className="text-sm font-semibold text-[var(--foreground)]">Governance risks</p>
          {!data.governance_risks?.length ? (
            <p className="mt-3 text-sm text-[var(--text-muted)]">No elevated privacy risks detected.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {data.governance_risks.map((risk) => (
                <li
                  key={risk.risk_id}
                  className="rounded-lg border border-[var(--border-subtle)] bg-[var(--color-surface)] p-3"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-[var(--foreground)]">{risk.title}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${severityBadge(risk.severity)}`}
                    >
                      {risk.severity}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">{risk.description}</p>
                  {risk.affected_datasets?.length ? (
                    <p className="mt-2 text-xs text-[var(--text-subtle)]">
                      Affected: {risk.affected_datasets.join(", ")}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="min-w-0 p-4">
          <p className="text-sm font-semibold text-[var(--foreground)]">Compliance recommendations</p>
          {!data.compliance_recommendations?.length ? (
            <p className="mt-3 text-sm text-[var(--text-muted)]">
              Compliance posture meets current targets.
            </p>
          ) : (
            <ul className="mt-3 space-y-3">
              {data.compliance_recommendations.map((rec, index) => (
                <li
                  key={`${rec.title}-${index}`}
                  className="rounded-lg border border-[var(--border-subtle)] bg-[var(--color-surface)] p-3"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-[var(--foreground)]">{rec.title}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${priorityBadge(rec.priority)}`}
                    >
                      {rec.priority}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">{rec.description}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid min-w-0 gap-4 lg:grid-cols-2">
        <Card className="min-w-0 p-4">
          <p className="text-sm font-semibold text-[var(--foreground)]">Datasets missing classification</p>
          <ResponsiveTable
            columns={[
              ...datasetLinkColumns,
              {
                key: "score",
                label: "Coverage",
                render: (row) => (
                  <span className={scoreColor(row.classification_score)}>{row.classification_score}%</span>
                ),
              },
            ]}
            rows={data.missing_classification_datasets}
            rowKey={(row) => row.dataset_id}
            emptyMessage="All datasets meet classification coverage targets."
          />
        </Card>

        <Card className="min-w-0 p-4">
          <p className="text-sm font-semibold text-[var(--foreground)]">Datasets missing documentation</p>
          <ResponsiveTable
            columns={[
              ...datasetLinkColumns,
              {
                key: "score",
                label: "Coverage",
                render: (row) => (
                  <span className={scoreColor(row.documentation_score)}>{row.documentation_score}%</span>
                ),
              },
            ]}
            rows={data.missing_documentation_datasets}
            rowKey={(row) => row.dataset_id}
            emptyMessage="All datasets have adequate documentation coverage."
          />
        </Card>
      </div>

      <Card className="min-w-0 p-4">
        <p className="text-sm font-semibold text-[var(--foreground)]">PII asset inventory</p>
        <ResponsiveTable
          columns={[
            ...datasetLinkColumns,
            {
              key: "pii_fields",
              label: "PII fields",
              render: (row) => row.pii_field_count ?? 0,
            },
            {
              key: "risk",
              label: "Risk",
              render: (row) => (
                <span className={scoreColor(100 - (row.risk_score ?? 0))}>{row.risk_level}</span>
              ),
            },
          ]}
          rows={data.pii_assets}
          rowKey={(row) => row.dataset_id}
          emptyMessage="No PII assets detected in the catalog."
        />
      </Card>
    </div>
  );
}
