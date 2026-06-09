"use client";

import { useEffect, useMemo, useState } from "react";
import { useRegisterAiPageContext } from "@/context/AiAssistantContext";
import PageShell from "@/components/layout/PageShell";
import Toast from "@/components/ui/Toast";
import GovernanceScoreDashboard from "@/components/governance/GovernanceScoreDashboard";
import { getGovernanceScore } from "@/lib/api";
import { useRequireAuth } from "@/lib/auth";

export default function GovernanceDashboardPage() {
  const { isCheckingAuth } = useRequireAuth();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const aiPageContext = useMemo(
    () => ({
      page: "governance",
      overall_score: data?.overall_score,
      dataset_count: data?.dataset_count,
      risk_level: data?.risk_level,
    }),
    [data],
  );
  useRegisterAiPageContext(aiPageContext);

  useEffect(() => {
    if (isCheckingAuth) {
      return;
    }
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      setErrorMessage("");
      try {
        const score = await getGovernanceScore();
        if (!cancelled) {
          setData(score);
        }
      } catch (err) {
        if (!cancelled) {
          setErrorMessage(err?.message || "Failed to load governance dashboard");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isCheckingAuth]);

  return (
    <PageShell title="Governance Health Dashboard">
      <p className="mb-6 max-w-3xl text-sm text-[var(--text-muted)]">
        Executive view of governance maturity across metadata, glossary, documentation,
        classification, lineage, rules, data quality, stewardship, and audit compliance.
      </p>
      {errorMessage ? <Toast message={errorMessage} variant="error" /> : null}
      <GovernanceScoreDashboard loading={isLoading} data={data} />
    </PageShell>
  );
}
