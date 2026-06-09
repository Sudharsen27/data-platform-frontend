"use client";

import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";

function riskClass(level) {
  if (level === "High Risk") {
    return "text-rose-700 dark:text-rose-400";
  }
  if (level === "Medium Risk") {
    return "text-amber-700 dark:text-amber-400";
  }
  return "text-emerald-700 dark:text-emerald-400";
}

function RuleCard({ rule, onApprove, onReject, showActions = true }) {
  return (
    <li className="rounded-lg border border-[var(--border-subtle)] bg-[var(--color-surface)] p-3 text-xs">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-mono font-semibold text-[var(--foreground)]">{rule.field_name}</p>
          <p className="mt-1 text-[var(--foreground)]">{rule.rule_text}</p>
        </div>
        <div className="text-right">
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold uppercase dark:bg-zinc-800">
            {rule.rule_type}
          </span>
          <p className="mt-1 text-[10px] text-[var(--text-muted)]">{rule.confidence}% confidence</p>
        </div>
      </div>
      {rule.business_reason ? (
        <p className="mt-2 text-[var(--text-muted)]">
          <span className="font-semibold">Reason: </span>
          {rule.business_reason}
        </p>
      ) : null}
      {rule.governance_importance ? (
        <p className="mt-1 text-[var(--text-muted)]">
          <span className="font-semibold">Governance: </span>
          {rule.governance_importance}
        </p>
      ) : null}
      {rule.compliance_impact ? (
        <p className="mt-1 text-[var(--text-muted)]">
          <span className="font-semibold">Compliance: </span>
          {rule.compliance_impact}
        </p>
      ) : null}
      {rule.status ? (
        <p className="mt-2 text-[10px] capitalize text-[var(--text-subtle)]">Status: {rule.status}</p>
      ) : null}
      {showActions && rule.id && rule.status === "pending" ? (
        <div className="mt-2 flex flex-wrap gap-1">
          <Button type="button" size="sm" onClick={() => onApprove?.(rule)}>
            Accept Rule
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={() => onReject?.(rule)}>
            Reject Rule
          </Button>
        </div>
      ) : null}
    </li>
  );
}

export default function RuleRecommendationPanel({
  loading,
  result,
  fieldRules,
  fieldLoading,
  onGenerateDataset,
  onSuggestField,
  onApprove,
  onReject,
}) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 py-4 text-sm text-[var(--text-muted)]">
        <Spinner size="sm" />
        Generating rule recommendations…
      </div>
    );
  }

  const risk = result?.risk_analysis;
  const rules = result?.recommended_rules || [];

  return (
    <div className="space-y-3 rounded-lg border border-violet-100 bg-violet-50/40 p-3 dark:border-violet-900/40 dark:bg-violet-950/20">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-violet-800 dark:text-violet-300">
            Rule recommendations
          </p>
          {result?.dataset_name ? (
            <p className="mt-1 text-sm font-semibold text-[var(--foreground)]">{result.dataset_name}</p>
          ) : null}
        </div>
        {onGenerateDataset ? (
          <Button type="button" variant="secondary" size="sm" onClick={onGenerateDataset}>
            Generate Rules
          </Button>
        ) : null}
      </div>

      {risk ? (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {[
            ["Data Quality", risk.data_quality_risk_level, risk.data_quality_risk_score],
            ["Governance", risk.governance_risk_level, risk.governance_risk_score],
            ["Compliance", risk.compliance_risk_level, risk.compliance_risk_score],
          ].map(([label, level, score]) => (
            <div
              key={label}
              className="rounded-lg border border-[var(--border-subtle)] bg-[var(--color-surface)] px-2 py-2 text-center"
            >
              <p className="text-[10px] font-semibold uppercase text-[var(--text-subtle)]">{label}</p>
              <p className={`text-sm font-bold ${riskClass(level)}`}>{level}</p>
              <p className="text-[10px] text-[var(--text-muted)]">{score}/100</p>
            </div>
          ))}
        </div>
      ) : null}

      {rules.length > 0 ? (
        <ul className="space-y-2">
          {rules.map((rule, idx) => (
            <RuleCard
              key={`${rule.field_name}-${rule.rule_text}-${idx}`}
              rule={rule}
              onApprove={onApprove}
              onReject={onReject}
              showActions={Boolean(rule.id)}
            />
          ))}
        </ul>
      ) : result ? (
        <p className="text-xs text-[var(--text-muted)]">No new rule gaps detected for this dataset.</p>
      ) : null}

      {fieldRules && Object.keys(fieldRules).length > 0 ? (
        <div className="space-y-2 border-t border-violet-100 pt-2 dark:border-violet-900/40">
          <p className="text-[10px] font-semibold uppercase text-[var(--text-subtle)]">Field suggestions</p>
          {Object.entries(fieldRules).map(([field, payload]) => (
            <div key={field} className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs">{field}</span>
                {onSuggestField ? (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => onSuggestField(field)}
                    disabled={fieldLoading === field}
                  >
                    {fieldLoading === field ? "…" : "Suggest Rules"}
                  </Button>
                ) : null}
              </div>
              {(payload?.rules || []).length > 0 ? (
                <ul className="space-y-1">
                  {payload.rules.map((rule, idx) => (
                    <RuleCard
                      key={`${field}-${idx}`}
                      rule={rule}
                      onApprove={onApprove}
                      onReject={onReject}
                      showActions={Boolean(rule.id)}
                    />
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
