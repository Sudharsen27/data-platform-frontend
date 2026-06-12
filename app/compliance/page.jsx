"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRegisterAiPageContext } from "@/context/AiAssistantContext";
import PageShell from "@/components/layout/PageShell";
import CompliancePrivacyDashboard from "@/components/compliance/CompliancePrivacyDashboard";
import { getComplianceDashboard } from "@/lib/api";
import { useRequireAuth } from "@/lib/auth";

export default function ComplianceDashboardPage() {
  const { isCheckingAuth } = useRequireAuth();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [reloadToken, setReloadToken] = useState(0);

  const loadDashboard = useCallback(async (cancelledRef) => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const payload = await getComplianceDashboard();
      if (!cancelledRef?.cancelled) {
        setData(payload);
      }
    } catch (err) {
      if (!cancelledRef?.cancelled) {
        setData(null);
        setErrorMessage(err?.message || "Failed to load compliance dashboard");
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
      page: "compliance",
      compliance_score: data?.compliance_score,
      pii_asset_count: data?.pii_asset_count,
      sensitive_asset_count: data?.sensitive_asset_count,
      risk_level: data?.risk_level,
    }),
    [data],
  );
  useRegisterAiPageContext(aiPageContext);

  return (
    <PageShell title="Compliance & Privacy Dashboard">
      <p className="mb-6 max-w-3xl text-sm text-[var(--text-muted)]">
        Privacy posture across PII assets, classification coverage, documentation gaps,
        governance risks, and compliance recommendations — powered by the same governance
        health metrics used in AI Governance.
      </p>
      <CompliancePrivacyDashboard
        loading={isLoading || isCheckingAuth}
        data={errorMessage ? null : data}
        error={errorMessage || null}
        onRetry={handleRetry}
      />
    </PageShell>
  );
}
