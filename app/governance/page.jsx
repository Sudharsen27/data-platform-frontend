"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRegisterAiPageContext } from "@/context/AiAssistantContext";
import PageShell from "@/components/layout/PageShell";
import GovernanceScoreDashboard from "@/components/governance/GovernanceScoreDashboard";
import { getGovernanceDashboard } from "@/lib/api";
import { useRequireAuth } from "@/lib/auth";

export default function GovernanceDashboardPage() {
  const { isCheckingAuth } = useRequireAuth();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [reloadToken, setReloadToken] = useState(0);

  const loadDashboard = useCallback(async (cancelledRef) => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const score = await getGovernanceDashboard();
      if (!cancelledRef?.cancelled) {
        setData(score);
      }
    } catch (err) {
      if (!cancelledRef?.cancelled) {
        setData(null);
        setErrorMessage(err?.message || "Failed to load governance dashboard");
      }
    } finally {
      if (!cancelledRef?.cancelled) {
        setIsLoading(false);
      }
    }
  }, []);

  const handleRetry = useCallback(() => {
    setReloadToken((value) => value + 1);
  }, []);

  useEffect(() => {
    if (isCheckingAuth) {
      return;
    }
    const cancelledRef = { cancelled: false };
    loadDashboard(cancelledRef);
    return () => {
      cancelledRef.cancelled = true;
    };
  }, [isCheckingAuth, loadDashboard, reloadToken]);

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

  return (
    <PageShell title="Governance Health Dashboard">
      <p className="mb-6 max-w-3xl text-sm text-[var(--text-muted)]">
        Executive view of governance maturity across metadata, glossary, documentation,
        classification, lineage, rules, stewardship, and audit compliance.
      </p>
      <GovernanceScoreDashboard
        loading={isLoading || isCheckingAuth}
        data={errorMessage ? null : data}
        error={errorMessage || null}
        onRetry={handleRetry}
      />
    </PageShell>
  );
}
