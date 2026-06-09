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

export default function RemediationPanel({
  loading,
  explainLoading,
  result,
  explainResult,
  onExplain,
  onRemediate,
  onAccept,
  onReject,
  onResolve,
  onAssign,
  assignEmail = "",
  onAssignEmailChange,
}) {
  if (loading || explainLoading) {
    return (
      <div className="flex items-center gap-2 py-4 text-sm text-[var(--text-muted)]">
        <Spinner size="sm" />
        {loading ? "Generating remediation…" : "Explaining failure…"}
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-lg border border-amber-100 bg-amber-50/40 p-3 dark:border-amber-900/40 dark:bg-amber-950/20">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-wide text-amber-800 dark:text-amber-300">
          AI remediation assistant
        </p>
        <div className="flex flex-wrap gap-1">
          {onExplain ? (
            <Button type="button" variant="secondary" size="sm" onClick={onExplain}>
              Explain Failure
            </Button>
          ) : null}
          {onRemediate ? (
            <Button type="button" size="sm" onClick={onRemediate}>
              Suggest Fix
            </Button>
          ) : null}
        </div>
      </div>

      {explainResult ? (
        <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--color-surface)] p-3 text-xs">
          <p className="text-[10px] font-semibold uppercase text-[var(--text-muted)]">Explanation</p>
          <p className="mt-1 text-[var(--foreground)]">{explainResult.explanation}</p>
          {explainResult.root_cause ? (
            <p className="mt-2">
              <span className="font-semibold text-[var(--text-muted)]">Root cause: </span>
              {explainResult.root_cause}
            </p>
          ) : null}
        </div>
      ) : null}

      {result ? (
        <div className="space-y-3 text-xs leading-relaxed text-[var(--foreground)]">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`font-bold ${riskClass(result.risk_level)}`}>{result.risk_level}</span>
            <span className="text-[var(--text-muted)]">Risk score: {result.risk_score}/100</span>
            {result.status ? (
              <span className="text-[10px] capitalize text-[var(--text-subtle)]">
                Status: {result.status}
              </span>
            ) : null}
          </div>

          {[
            ["failure_explanation", "Failure explanation"],
            ["root_cause", "Root cause"],
            ["suggested_fix", "Suggested fix"],
            ["business_impact", "Business impact"],
            ["governance_impact", "Governance impact"],
          ].map(([key, label]) =>
            result[key] ? (
              <div key={key}>
                <p className="text-[10px] font-semibold uppercase text-[var(--text-muted)]">{label}</p>
                <p className="mt-0.5 whitespace-pre-wrap">{result[key]}</p>
              </div>
            ) : null
          )}

          {(result.suggested_actions || []).length > 0 ? (
            <div>
              <p className="text-[10px] font-semibold uppercase text-[var(--text-muted)]">
                Suggested actions
              </p>
              <ul className="mt-1 list-disc space-y-1 pl-4">
                {result.suggested_actions.map((action) => (
                  <li key={action}>{action}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {result.id ? (
            <div className="flex flex-wrap gap-1 border-t border-amber-100 pt-2 dark:border-amber-900/40">
              {onAccept && result.status === "pending" ? (
                <Button type="button" size="sm" onClick={() => onAccept(result)}>
                  Accept Fix
                </Button>
              ) : null}
              {onReject && result.status === "pending" ? (
                <Button type="button" variant="secondary" size="sm" onClick={() => onReject(result)}>
                  Reject Fix
                </Button>
              ) : null}
              {onResolve && result.status !== "resolved" ? (
                <Button type="button" variant="secondary" size="sm" onClick={() => onResolve(result)}>
                  Mark Resolved
                </Button>
              ) : null}
            </div>
          ) : null}

          {onAssign && result.id ? (
            <div className="flex flex-wrap items-end gap-2">
              <label className="flex-1 text-xs">
                <span className="mb-1 block font-semibold text-[var(--text-muted)]">Assign steward</span>
                <input
                  type="email"
                  value={assignEmail}
                  onChange={(e) => onAssignEmailChange?.(e.target.value)}
                  placeholder="steward@company.com"
                  className="mdm-input w-full py-1.5 text-sm"
                />
              </label>
              <Button type="button" size="sm" variant="secondary" onClick={() => onAssign(result)}>
                Assign
              </Button>
            </div>
          ) : null}
        </div>
      ) : !explainResult ? (
        <p className="text-xs text-[var(--text-muted)]">
          Use Explain Failure or Suggest Fix to analyze this stewardship record.
        </p>
      ) : null}
    </div>
  );
}
