"use client";

import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Toast from "@/components/ui/Toast";
import { getPipelineStatus, runPipeline } from "@/lib/api";
import { useRequireAuth } from "@/lib/auth";

const DEFAULT_STEPS = [
  { key: "ingest", label: "Ingest", status: "pending", count: 0 },
  { key: "validation", label: "Validate", status: "pending", count: 0 },
  { key: "matching", label: "Match", status: "pending", count: 0 },
  { key: "stewardship", label: "Review", status: "pending", count: 0 },
  { key: "golden", label: "Golden", status: "pending", count: 0 },
];

function getStepStyle(status) {
  if (status === "completed") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }
  if (status === "running") {
    return "border-blue-200 bg-blue-50 text-blue-800";
  }
  return "border-zinc-200 bg-white text-zinc-700";
}

function getDotStyle(status) {
  if (status === "completed") {
    return "bg-emerald-500";
  }
  if (status === "running") {
    return "bg-blue-500";
  }
  return "bg-zinc-300";
}

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
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function fetchStatus() {
    const data = await getPipelineStatus();
    setPipelineState((current) => ({
      ...current,
      ...data,
      steps: data.steps?.length ? data.steps : DEFAULT_STEPS,
    }));
    return data;
  }

  useEffect(() => {
    async function loadStatus() {
      try {
        setIsLoading(true);
        await fetchStatus();
      } catch (error) {
        setErrorMessage(error.message || "Failed to load pipeline flow status.");
      } finally {
        setIsLoading(false);
      }
    }

    loadStatus();
  }, []);

  useEffect(() => {
    if (pipelineState.status !== "running") {
      return undefined;
    }

    const intervalId = setInterval(() => {
      fetchStatus().catch(() => {
        // Keep polling simple; UI already surfaces explicit run errors.
      });
    }, 2000);

    return () => clearInterval(intervalId);
  }, [pipelineState.status]);

  useEffect(() => {
    if (!message && !errorMessage) {
      return;
    }
    const timer = setTimeout(() => {
      setMessage("");
      setErrorMessage("");
    }, 2500);
    return () => clearTimeout(timer);
  }, [message, errorMessage]);

  async function handleRunPipeline() {
    try {
      setIsRunning(true);
      setErrorMessage("");
      setMessage("");
      await runPipeline();
      const status = await fetchStatus();
      setMessage(status.last_message || "Pipeline completed successfully.");
    } catch (error) {
      const normalizedError = String(error.message || "").toLowerCase();
      if (normalizedError.includes("already running")) {
        await fetchStatus().catch(() => null);
        setMessage("Pipeline is already running. Live status is now refreshing.");
      } else {
        setErrorMessage(error.message || "Failed to run full pipeline.");
      }
    } finally {
      setIsRunning(false);
    }
  }

  const steps = useMemo(
    () => (pipelineState.steps?.length ? pipelineState.steps : DEFAULT_STEPS),
    [pipelineState.steps]
  );

  if (isCheckingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 text-sm text-zinc-600">
        Checking authentication...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <Toast message={message} type="success" />
      <Toast message={errorMessage} type="error" />
      <div className="flex min-h-screen flex-col md:flex-row">
        <Sidebar />
        <div className="flex-1">
          <Navbar title="Data Flow Orchestration" />
          <main className="space-y-6 p-6">
            <section className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-zinc-900">
                  End-to-End Data Flow
                </h2>
                <p className="mt-1 text-sm text-zinc-600">
                  Ingest to Golden Record orchestration with stage-level status and counts.
                </p>
              </div>
              <Button onClick={handleRunPipeline} disabled={isRunning || pipelineState.status === "running"}>
                {isRunning || pipelineState.status === "running" ? "Running..." : "Run Full Pipeline"}
              </Button>
            </section>

            <Card title="Pipeline Progress" subtitle={pipelineState.last_message || "Awaiting run"}>
              <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-zinc-100">
                <div
                  className="h-full rounded-full bg-blue-600 transition-all"
                  style={{ width: `${pipelineState.progress_percent || 0}%` }}
                />
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-zinc-600">
                <span>Status: <strong className="text-zinc-900">{pipelineState.status}</strong></span>
                <span>Total: <strong className="text-zinc-900">{pipelineState.total_records || 0}</strong></span>
                <span>Processed: <strong className="text-zinc-900">{pipelineState.processed_records || 0}</strong></span>
                <span>Progress: <strong className="text-zinc-900">{pipelineState.progress_percent || 0}%</strong></span>
              </div>
            </Card>

            {isLoading ? (
              <Card>
                <div className="h-6 w-52 animate-pulse rounded bg-zinc-200" />
                <div className="mt-3 h-24 animate-pulse rounded bg-zinc-100" />
              </Card>
            ) : (
              <div className="grid gap-3">
                {steps.map((step, index) => (
                  <div key={step.key} className="relative">
                    {index < steps.length - 1 ? (
                      <span className="absolute left-5 top-10 h-10 w-px bg-zinc-200" />
                    ) : null}
                    <div className={`flex items-center justify-between rounded-xl border p-4 ${getStepStyle(step.status)}`}>
                      <div className="flex items-center gap-3">
                        <span className={`h-3 w-3 rounded-full ${getDotStyle(step.status)}`} />
                        <div>
                          <p className="text-sm font-semibold">{step.label}</p>
                          <p className="text-xs uppercase tracking-wide opacity-80">{step.status}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs uppercase tracking-wide opacity-75">Records</p>
                        <p className="text-lg font-bold">{step.count || 0}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
