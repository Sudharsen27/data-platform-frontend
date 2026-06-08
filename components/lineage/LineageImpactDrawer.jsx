"use client";

import Drawer from "@/components/ui/Drawer";
import Spinner from "@/components/ui/Spinner";
import StatusBadge from "@/components/ui/StatusBadge";

function impactLevelClass(level) {
  if (level === "high") {
    return "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300";
  }
  if (level === "medium") {
    return "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300";
  }
  return "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
}

function impactScoreClass(score) {
  if (score >= 70) {
    return "text-rose-600 dark:text-rose-400";
  }
  if (score >= 40) {
    return "text-amber-600 dark:text-amber-400";
  }
  return "text-emerald-600 dark:text-emerald-400";
}

function AssetList({ title, items, emptyText }) {
  if (!items?.length) {
    return (
      <div>
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-subtle)]">
          {title}
        </h4>
        <p className="text-sm text-[var(--text-muted)]">{emptyText}</p>
      </div>
    );
  }
  return (
    <div>
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-subtle)]">
        {title}
      </h4>
      <ul className="space-y-2">
        {items.map((item) => (
          <li
            key={`${item.asset_key || item.name}-${item.lineage_node_key}`}
            className="flex items-start justify-between gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--color-surface)] px-3 py-2"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-[var(--foreground)]">{item.name}</p>
              <p className="truncate text-xs text-[var(--text-muted)]">
                {item.asset_key || item.lineage_node_key}
                {item.system ? ` · ${item.system}` : ""}
              </p>
            </div>
            <span
              className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${impactLevelClass(item.impact_level)}`}
            >
              {item.impact_level || "medium"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function LineageImpactDrawer({
  open,
  onClose,
  loading,
  impactDetail,
  aiAnalysis,
  aiEngine,
}) {
  const score = impactDetail?.impact_score ?? 0;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Lineage Impact Analysis"
      subtitle={
        impactDetail?.source_asset
          ? `Source: ${impactDetail.source_asset}`
          : "Downstream and upstream dependency analysis"
      }
      width="max-w-xl"
    >
      {loading ? (
        <div className="flex items-center gap-2 py-12 text-sm text-[var(--text-muted)]">
          <Spinner size="sm" />
          Analyzing lineage impact…
        </div>
      ) : null}

      {!loading && impactDetail ? (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--color-surface)] p-3 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-subtle)]">
                Impact Score
              </p>
              <p className={`mt-1 text-2xl font-bold ${impactScoreClass(score)}`}>{score}</p>
            </div>
            <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--color-surface)] p-3 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-subtle)]">
                Downstream
              </p>
              <p className="mt-1 text-2xl font-bold text-[var(--foreground)]">
                {impactDetail.downstream_count ?? 0}
              </p>
            </div>
            <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--color-surface)] p-3 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-subtle)]">
                Upstream
              </p>
              <p className="mt-1 text-2xl font-bold text-[var(--foreground)]">
                {impactDetail.upstream_count ?? 0}
              </p>
            </div>
            <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--color-surface)] p-3 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-subtle)]">
                Critical
              </p>
              <p className="mt-1 text-2xl font-bold text-[var(--foreground)]">
                {(impactDetail.critical_dependencies || []).length}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              ["Datasets", impactDetail.datasets_impacted],
              ["Rules", impactDetail.rules_impacted],
              ["Reports", impactDetail.reports_impacted],
              ["Master Data", impactDetail.master_data_impacted],
            ].map(([label, count]) => (
              <div
                key={label}
                className="rounded-md border border-[var(--border-subtle)] px-2 py-1.5 text-center text-xs text-[var(--text-muted)]"
              >
                <span className="font-semibold text-[var(--foreground)]">{count ?? 0}</span> {label}
              </div>
            ))}
          </div>

          {aiAnalysis ? (
            <div className="rounded-lg border border-[var(--border-color)] bg-[var(--color-primary-muted)]/40 p-4">
              <div className="mb-2 flex items-center gap-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  AI Explanation
                </p>
                <StatusBadge status={aiEngine === "groq" ? "active" : "pending"} />
              </div>
              <p className="text-sm leading-relaxed text-[var(--foreground)]">{aiAnalysis}</p>
            </div>
          ) : null}

          <AssetList
            title="Critical Dependencies"
            items={impactDetail.critical_dependencies}
            emptyText="No critical dependencies identified."
          />
          <AssetList
            title="Downstream Assets"
            items={impactDetail.downstream_assets}
            emptyText="No downstream assets in scope."
          />
          <AssetList
            title="Upstream Assets"
            items={impactDetail.upstream_assets}
            emptyText="No upstream sources in scope."
          />

          {(impactDetail.impacted_rules || []).length > 0 ? (
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-subtle)]">
                Impacted Rules
              </h4>
              <ul className="space-y-1 text-sm text-[var(--text-muted)]">
                {impactDetail.impacted_rules.map((rule) => (
                  <li key={rule.id}>
                    <span className="font-medium text-[var(--foreground)]">{rule.field}</span>:{" "}
                    {rule.rule}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </Drawer>
  );
}
