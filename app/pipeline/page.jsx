"use client";

import { useEffect, useState } from "react";
import PageShell from "@/components/layout/PageShell";
import { getHealthStatus, getPipelineRuns, getPipelineStatus } from "@/lib/api";
import { useRequireAdmin } from "@/lib/auth";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Toast from "@/components/ui/Toast";
import Spinner from "@/components/ui/Spinner";
import StatusBadge from "@/components/ui/StatusBadge";
import Breadcrumbs from "@/components/ui/Breadcrumbs";

function parseAsUtc(value) {
  if (!value) {
    return null;
  }
  // Backend pipeline run timestamps can arrive without timezone.
  // Treat them as UTC for consistent local-time display in UI.
  const normalized = value.endsWith("Z") || value.includes("+") ? value : `${value}Z`;
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDate(value) {
  const date = parseAsUtc(value);
  if (!date) {
    return "-";
  }
  return date.toLocaleString();
}

function formatDuration(startValue, endValue) {
  const start = parseAsUtc(startValue);
  const end = parseAsUtc(endValue);
  if (!start || !end) {
    return "-";
  }

  const totalSeconds = Math.max(0, Math.floor((end.getTime() - start.getTime()) / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds}s`;
}

export default function PipelinePage() {
  const { isCheckingAuth } = useRequireAdmin();
  const [runs, setRuns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [healthStatus, setHealthStatus] = useState({
    api: "unknown",
    database: "unknown",
    snowflake: "unknown",
    timestamp: null,
  });
  const [isHealthLoading, setIsHealthLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const [pipelineStatus, setPipelineStatus] = useState(null);

  useEffect(() => {
    async function loadPipelineRuns() {
      try {
        setIsLoading(true);
        setErrorMessage("");
        const data = await getPipelineRuns();
        setRuns(data);
      } catch (error) {
        setErrorMessage(error.message || "Failed to load pipeline runs.");
      } finally {
        setIsLoading(false);
      }
    }

    async function loadHealthData() {
      try {
        setIsHealthLoading(true);
        const status = await getHealthStatus();
        setHealthStatus(status);
      } catch {
        setHealthStatus({
          api: "failed",
          database: "failed",
          snowflake: "failed",
          timestamp: null,
        });
      } finally {
        setIsHealthLoading(false);
      }
    }

    async function loadPipelineStatus() {
      try {
        const status = await getPipelineStatus();
        setPipelineStatus(status);
      } catch {
        setPipelineStatus(null);
      }
    }

    loadPipelineRuns();
    loadHealthData();
    loadPipelineStatus();
  }, []);

  useEffect(() => {
    if (!toastMessage) {
      return;
    }
    const timer = setTimeout(() => setToastMessage(""), 2500);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  async function handleRefreshHealth() {
    try {
      setIsHealthLoading(true);
      const status = await getHealthStatus();
      setHealthStatus(status);
      setToastType("success");
      setToastMessage("System health updated.");
    } catch (error) {
      setToastType("error");
      setToastMessage(error.message || "Failed to refresh health.");
    } finally {
      setIsHealthLoading(false);
    }
  }

  function healthBadgeClass(status) {
    if (status === "ok") {
      return "bg-emerald-50 text-emerald-700";
    }
    if (status === "skipped") {
      return "bg-zinc-100 text-zinc-700";
    }
    if (status === "failed" || status === "degraded") {
      return "bg-rose-50 text-rose-700";
    }
    return "bg-amber-50 text-amber-700";
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
      <Toast message={toastMessage} type={toastType} />
      <PageShell title="Pipeline Monitoring">
            <Breadcrumbs items={[{ label: "Home" }, { label: "Pipeline", current: true }]} />
            <section>
              <h2 className="text-lg font-semibold text-zinc-900">Pipeline Runs</h2>
              <p className="mt-1 text-sm text-zinc-600">
                Monitor run status and records processed for each pipeline execution. Run the
                pipeline from the Dashboard to apply active rules to all quarantine rows.
              </p>
            </section>

            {pipelineStatus?.rule_execution?.active_rules > 0 ? (
              <Card
                title="Last rule execution"
                subtitle={`Pipeline status: ${pipelineStatus.status}`}
              >
                <div className="grid gap-2 text-sm text-zinc-700 sm:grid-cols-2 lg:grid-cols-4">
                  <p>
                    Active rules:{" "}
                    <strong>{pipelineStatus.rule_execution.active_rules}</strong>
                  </p>
                  <p>
                    Rows evaluated:{" "}
                    <strong>{pipelineStatus.rule_execution.records_evaluated}</strong>
                  </p>
                  <p>
                    With violations:{" "}
                    <strong className="text-rose-700">
                      {pipelineStatus.rule_execution.records_with_violations}
                    </strong>
                  </p>
                  <p>
                    Total violations:{" "}
                    <strong>{pipelineStatus.rule_execution.total_violations}</strong>
                  </p>
                </div>
                {(pipelineStatus.rule_execution.rule_hits || []).length > 0 ? (
                  <ul className="mt-3 space-y-1 text-xs text-zinc-600">
                    {pipelineStatus.rule_execution.rule_hits.slice(0, 5).map((hit) => (
                      <li key={hit.rule_id}>
                        <span className="font-medium text-zinc-800">{hit.field}</span>: {hit.rule}{" "}
                        — <strong>{hit.hits}</strong> hit(s)
                      </li>
                    ))}
                  </ul>
                ) : null}
              </Card>
            ) : null}

            {errorMessage ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorMessage}
              </div>
            ) : null}

            <Card title="System Health" subtitle="Quick checks for API, database, and Snowflake connectivity.">
              <div className="grid gap-3 text-sm text-zinc-700 sm:grid-cols-2 lg:grid-cols-4">
                <p className="flex items-center justify-between rounded-lg border border-zinc-200 px-3 py-2">
                  <span className="font-medium">API</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${healthBadgeClass(
                      healthStatus.api
                    )}`}
                  >
                    {healthStatus.api}
                  </span>
                </p>
                <p className="flex items-center justify-between rounded-lg border border-zinc-200 px-3 py-2">
                  <span className="font-medium">Database</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${healthBadgeClass(
                      healthStatus.database
                    )}`}
                  >
                    {healthStatus.database}
                  </span>
                </p>
                <p className="flex items-center justify-between rounded-lg border border-zinc-200 px-3 py-2">
                  <span className="font-medium">Snowflake</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${healthBadgeClass(
                      healthStatus.snowflake
                    )}`}
                  >
                    {healthStatus.snowflake}
                  </span>
                </p>
                <div className="flex items-center justify-between rounded-lg border border-zinc-200 px-3 py-2">
                  <div>
                    <p className="font-medium">Last Checked</p>
                    <p className="text-xs text-zinc-500">
                      {healthStatus.timestamp
                        ? new Date(healthStatus.timestamp).toLocaleString()
                        : "Not yet checked"}
                    </p>
                  </div>
                  <Button variant="secondary" size="sm" onClick={handleRefreshHealth} disabled={isHealthLoading}>
                    {isHealthLoading ? "Checking..." : "Check"}
                  </Button>
                </div>
              </div>
            </Card>

            {isLoading ? (
              <Card>
                <div className="flex items-center gap-2 text-sm text-zinc-600">
                  <Spinner />
                  Loading pipeline runs...
                </div>
              </Card>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
                <table className="min-w-full text-sm">
                  <thead className="border-b border-zinc-200 bg-zinc-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">
                        Run ID
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">
                        Records Processed
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">
                        Time
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">
                        Duration
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">
                        Logs
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {runs.map((run) => (
                      <tr key={run.id} className="border-b border-zinc-100 hover:bg-zinc-50/70">
                        <td className="px-4 py-3 font-medium text-zinc-800">#{run.id}</td>
                        <td className="px-4 py-3">
                          <StatusBadge status={run.status} />
                        </td>
                        <td className="px-4 py-3 text-zinc-700">{run.records_processed}</td>
                        <td className="px-4 py-3 text-zinc-700">
                          <div>{formatDate(run.start_time)}</div>
                          <div className="text-xs text-zinc-500">
                            End: {formatDate(run.end_time)}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-zinc-700">
                          {formatDuration(run.start_time, run.end_time)}
                        </td>
                        <td className="px-4 py-3">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() =>
                              window.alert(
                                `Run #${run.id}\nStatus: ${run.status}\nRecords Processed: ${run.records_processed}\nStart: ${formatDate(
                                  run.start_time
                                )}\nEnd: ${formatDate(run.end_time)}`
                              )
                            }
                          >
                            View Logs
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {runs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-6 text-center text-zinc-500">
                          No pipeline runs available.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            )}
      </PageShell>
    </>
  );
}
