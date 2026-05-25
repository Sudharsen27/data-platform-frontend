"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import PageShell from "@/components/layout/PageShell";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import ToastStack from "@/components/ui/ToastStack";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import GovernanceFlowJourney from "@/components/governance/GovernanceFlowJourney";
import PipelineTimeline from "@/components/governance/PipelineTimeline";
import { getPipelineStatus, runPipeline } from "@/lib/api";
import { useRequireAuth } from "@/lib/auth";
import { useToast } from "@/lib/useToast";
import { usePipelineProgressToast } from "@/lib/usePipelineProgressToast";

const DEFAULT_STEPS = [
  { key: "ingest", label: "Ingest", status: "pending", count: 0 },
  { key: "validation", label: "Validate", status: "pending", count: 0 },
  { key: "matching", label: "Match", status: "pending", count: 0 },
  { key: "stewardship", label: "Review", status: "pending", count: 0 },
  { key: "golden", label: "Golden", status: "pending", count: 0 },
];

export default function FlowPage() {
  const { isCheckingAuth } = useRequireAuth();
  const [pipelineState, setPipelineState] = useState({
    status: "idle",
    last_message: "Pipeline has not run yet.",
    progress_percent: 0,
    total_records: 0,
    processed_records: 0,
    steps: DEFAULT_STEPS,
    stage_counts: {},
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const { toasts, push: pushToast, dismiss: dismissToast } = useToast();

  const applyPipelineStatus = useCallback((data) => {
    setPipelineState((current) => ({
      ...current,
      ...data,
      steps: data?.steps?.length ? data.steps : DEFAULT_STEPS,
    }));
  }, []);

  usePipelineProgressToast({
    pushToast,
    dismissToast,
    enabled: true,
    onStatus: applyPipelineStatus,
  });

  async function fetchStatus() {
    const data = await getPipelineStatus();
    applyPipelineStatus(data);
    return data;
  }

  useEffect(() => {
    async function loadStatus() {
      try {
        setIsLoading(true);
        await fetchStatus();
      } catch (error) {
        pushToast(error.message || "Failed to load pipeline flow status.", { type: "error" });
      } finally {
        setIsLoading(false);
      }
    }

    loadStatus();
  }, []);

  const steps = useMemo(
    () => (pipelineState.steps?.length ? pipelineState.steps : DEFAULT_STEPS),
    [pipelineState.steps]
  );

  async function handleRunPipeline() {
    try {
      setIsRunning(true);
      pushToast("Starting governance pipeline…", {
        type: "info",
        id: "pipeline-run",
        title: "Pipeline running",
        duration: 0,
      });
      await runPipeline();
      await fetchStatus();
    } catch (error) {
      const normalizedError = String(error.message || "").toLowerCase();
      if (normalizedError.includes("already running")) {
        await fetchStatus().catch(() => null);
        pushToast("Pipeline is already running — live progress in the top-right toast.", {
          type: "info",
          id: "pipeline-run",
          title: "Pipeline running",
          duration: 0,
        });
      } else {
        pushToast(error.message || "Failed to run full pipeline.", {
          type: "error",
          id: "pipeline-run",
          title: "Pipeline error",
          duration: 8000,
        });
      }
    } finally {
      setIsRunning(false);
    }
  }

  if (isCheckingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 text-sm text-zinc-600">
        Checking authentication...
      </div>
    );
  }

  return (
    <>
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
      <PageShell title="Data Flow Orchestration">
            <Breadcrumbs items={[{ label: "Home" }, { label: "Flow", current: true }]} />
            <Card title="Governance journey" subtitle="How data moves through the platform">
              <GovernanceFlowJourney />
            </Card>
            <section className="mdm-flow-banner">
              <div>
                <h2 className="mdm-page-title">End-to-End Data Flow</h2>
                <p className="mdm-page-desc">
                  Ingest to Golden Record orchestration with stage-level status and counts.
                </p>
              </div>
              <Button onClick={handleRunPipeline} disabled={isRunning || pipelineState.status === "running"}>
                {isRunning || pipelineState.status === "running" ? "Running…" : "Run Full Pipeline"}
              </Button>
            </section>

            <Card title="Pipeline progress" subtitle={pipelineState.last_message || "Awaiting run"}>
              <div className="mb-4 h-2.5 w-full overflow-hidden rounded-full bg-[var(--color-surface-hover)]">
                <div
                  className="h-full rounded-full bg-[var(--color-primary)] transition-all duration-500"
                  style={{ width: `${pipelineState.progress_percent || 0}%` }}
                />
              </div>
              <div className="mdm-pipeline-summary">
                <span>
                  Status: <strong>{pipelineState.status}</strong>
                </span>
                <span>
                  Total: <strong>{(pipelineState.total_records || 0).toLocaleString()}</strong>
                </span>
                <span>
                  Processed: <strong>{(pipelineState.processed_records || 0).toLocaleString()}</strong>
                </span>
                <span>
                  Progress: <strong>{pipelineState.progress_percent || 0}%</strong>
                </span>
              </div>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <div key={n} className="h-[4.5rem] animate-pulse rounded-[var(--radius-card)] bg-[var(--color-surface-hover)]" />
                  ))}
                </div>
              ) : (
                <PipelineTimeline steps={steps} />
              )}
            </Card>
      </PageShell>
    </>
  );
}
