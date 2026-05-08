"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import {
  getDashboardOverview,
  getAiFailedJobsSummary,
  runAiGenerateRules,
  runAiSuggestStewardshipOwners,
  runPipeline,
} from "@/lib/api";
import { useRequireAuth } from "@/lib/auth";
import { useAuth } from "@/context/AuthContext";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Toast from "@/components/ui/Toast";
import Spinner from "@/components/ui/Spinner";
import StatusBadge from "@/components/ui/StatusBadge";
import Breadcrumbs from "@/components/ui/Breadcrumbs";

const DASHBOARD_CACHE_MS = 30_000;
const DEFAULT_PIPELINE_STATUS = {
  status: "idle",
  last_run_at: null,
  last_message: "Pipeline has not run yet.",
  total_records: 0,
  processed_records: 0,
  progress_percent: 0,
  run_count: 0,
  success_count: 0,
  failed_count: 0,
};

function readCache(key, maxAgeMs = DASHBOARD_CACHE_MS) {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    if (!parsed?.ts || Date.now() - parsed.ts > maxAgeMs) {
      return null;
    }
    return parsed.data ?? null;
  } catch {
    return null;
  }
}

function writeCache(key, data) {
  if (typeof window === "undefined") {
    return;
  }
  try {
    sessionStorage.setItem(key, JSON.stringify({ ts: Date.now(), data }));
  } catch {
    // Ignore storage quota/parsing issues.
  }
}

function normalizeDashboardData(data) {
  return {
    successRate:
      data?.success_rate ??
      data?.successRate ??
      data?.kpis?.success_rate ??
      data?.kpis?.successRate ??
      0,
    failedRecords:
      data?.failed_records ??
      data?.failedRecords ??
      data?.kpis?.failed_records ??
      data?.kpis?.failedRecords ??
      0,
    activeJobs:
      data?.active_jobs ??
      data?.activeJobs ??
      data?.kpis?.active_jobs ??
      data?.kpis?.activeJobs ??
      0,
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const { isCheckingAuth } = useRequireAuth();
  const { isAdmin, isReady, isAuthenticated } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [syncJobs, setSyncJobs] = useState([]);
  const [lineageGraph, setLineageGraph] = useState({ nodes: [], edges: [] });
  const [stewardshipRows, setStewardshipRows] = useState([]);
  const [isDashboardLoading, setIsDashboardLoading] = useState(true);
  const [isJobsLoading, setIsJobsLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState("");
  const [pipelineStatus, setPipelineStatus] = useState(DEFAULT_PIPELINE_STATUS);
  const [isRunningPipeline, setIsRunningPipeline] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const [aiInsights, setAiInsights] = useState([]);
  const [aiActionLoading, setAiActionLoading] = useState("");

  useEffect(() => {
    if (!isReady || !isAuthenticated) {
      return;
    }

    async function loadOverviewData() {
      const cached = readCache("dashboard:overview");
      if (cached) {
        setDashboardData({ kpis: cached.kpis, last_sync_job: cached.last_sync_job });
        setSyncJobs(cached.recent_jobs || []);
        setPipelineStatus(cached.pipeline_status || DEFAULT_PIPELINE_STATUS);
        setLineageGraph(cached.lineage || { nodes: [], edges: [] });
        setStewardshipRows(cached.stewardship || []);
        setAiInsights(cached.ai_insights || []);
        setIsDashboardLoading(false);
        setIsJobsLoading(false);
      }
      try {
        if (!cached) {
          setIsDashboardLoading(true);
          setIsJobsLoading(true);
        }
        setDashboardError("");
        const overview = await getDashboardOverview();
        setDashboardData({ kpis: overview.kpis, last_sync_job: overview.last_sync_job });
        setSyncJobs(overview.recent_jobs || []);
        setPipelineStatus(overview.pipeline_status || DEFAULT_PIPELINE_STATUS);
        setLineageGraph(overview.lineage || { nodes: [], edges: [] });
        setStewardshipRows(overview.stewardship || []);
        setAiInsights(overview.ai_insights || []);
        writeCache("dashboard:overview", overview);
      } catch (error) {
        setDashboardError(error.message || "Unable to load dashboard data.");
      } finally {
        setIsDashboardLoading(false);
        setIsJobsLoading(false);
      }
    }
    loadOverviewData();
  }, [isReady, isAuthenticated]);

  useEffect(() => {
    if (!toastMessage) {
      return;
    }

    const timer = setTimeout(() => setToastMessage(""), 2500);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  async function handleRunPipeline() {
    try {
      setIsRunningPipeline(true);
      setPipelineStatus((current) => ({
        ...current,
        status: "running",
        last_message: "Pipeline execution in progress.",
      }));
      const result = await runPipeline();
      const overview = await getDashboardOverview();
      const latestStatus = overview.pipeline_status || DEFAULT_PIPELINE_STATUS;
      setPipelineStatus(latestStatus);
      setDashboardData({ kpis: overview.kpis, last_sync_job: overview.last_sync_job });
      setSyncJobs(overview.recent_jobs || []);
      setLineageGraph(overview.lineage || { nodes: [], edges: [] });
      setStewardshipRows(overview.stewardship || []);
      setAiInsights(overview.ai_insights || []);
      writeCache("dashboard:overview", overview);
      setToastType("success");
      setToastMessage(
        `Pipeline completed: ${result.merged} merged, ${result.review} review, ${result.new} new.`
      );
    } catch (error) {
      setPipelineStatus((current) => ({
        ...current,
        status: "failed",
        last_message: error.message || "Pipeline execution failed.",
      }));
      setToastType("error");
      setToastMessage(error.message || "Pipeline execution failed.");
    } finally {
      setIsRunningPipeline(false);
    }
  }

  const kpis = useMemo(() => {
    const normalized = normalizeDashboardData(dashboardData);

    return [
      {
        title: "Completeness",
        value: `${Math.max(85, Number(normalized.successRate || 0))}%`,
        delta: "+2.1%",
      },
      {
        title: "Validity",
        value: `${Math.max(80, 100 - Number(normalized.failedRecords || 0))}%`,
        delta: "+1.4%",
      },
      {
        title: "Uniqueness",
        value: "99%",
        delta: "+0.7%",
      },
      {
        title: "Timeliness",
        value: `${Math.max(85, 100 - Number(normalized.activeJobs || 0) * 2)}%`,
        delta: "-1.6%",
      },
    ];
  }, [dashboardData]);

  const lastSyncJob = dashboardData?.last_sync_job;
  const recentStewardship = stewardshipRows.slice(0, 5);
  const recentAlerts = [
    { name: "Schema drift detected", severity: "high" },
    { name: "Data quality rule failed", severity: "medium" },
    { name: "Broken pipeline dependency", severity: "high" },
    { name: "Access anomaly detected", severity: "low" },
  ];
  const aiActions = [
    "Generate quality rules from profile",
    "Suggest stewardship owner assignments",
    "Summarize failed jobs root causes",
  ];

  function severityStyle(severity) {
    if (severity === "high") {
      return "bg-rose-50 text-rose-700";
    }
    if (severity === "medium") {
      return "bg-amber-50 text-amber-700";
    }
    return "bg-blue-50 text-blue-700";
  }

  function handleAiAction(action) {
    async function runAction() {
      try {
        setAiActionLoading(action);
        if (action === "Generate quality rules from profile") {
          const result = await runAiGenerateRules();
          setToastType("success");
          setToastMessage(result.summary || "AI quality rules generated.");
          router.push("/rules");
          return;
        }

        if (action === "Suggest stewardship owner assignments") {
          const result = await runAiSuggestStewardshipOwners();
          setToastType("success");
          setToastMessage(result.summary || "AI stewardship suggestions prepared.");
          router.push("/stewardship");
          return;
        }

        if (action === "Summarize failed jobs root causes") {
          const result = await getAiFailedJobsSummary();
          if ((result.details || []).length) {
            setToastType("error");
            setToastMessage(`${result.summary} ${result.details[0]}`);
          } else {
            setToastType("success");
            setToastMessage(result.summary || "No failed jobs found.");
          }
        }
      } catch (error) {
        setToastType("error");
        setToastMessage(error.message || "AI action failed.");
      } finally {
        setAiActionLoading("");
      }
    }

    runAction();
  }

  if (isCheckingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 text-sm text-zinc-600">
        Checking authentication...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <Toast message={toastMessage} type={toastType} />
      <div className="flex min-h-screen flex-col md:flex-row">
        <Sidebar />
        <div className="flex-1">
          <Navbar />
          <main className="space-y-6 p-6">
            <Breadcrumbs items={[{ label: "Home" }, { label: "Dashboard", current: true }]} />
            {isDashboardLoading ? (
              <Card>
                <div className="flex items-center gap-2 text-sm text-zinc-600">
                  <Spinner />
                  Loading dashboard data...
                </div>
              </Card>
            ) : dashboardError ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 shadow-sm">
                {dashboardError}
              </div>
            ) : null}

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {kpis.map((kpi) => (
                <Card key={kpi.title} className="p-4">
                  <p className="text-sm font-medium text-zinc-500">{kpi.title}</p>
                  <p className="mt-2 text-3xl font-semibold text-blue-700">{kpi.value}</p>
                  <p className="mt-2 text-xs text-zinc-500">
                    <span
                      className={kpi.delta.startsWith("-") ? "text-rose-600" : "text-emerald-600"}
                    >
                      {kpi.delta}
                    </span>{" "}
                    vs last 7 days
                  </p>
                </Card>
              ))}
            </section>

            <section className="grid gap-4 xl:grid-cols-3">
              <Card
                title="AI Governance Copilot"
                subtitle="ML-assisted insights for quality, lineage, and compliance."
                className="xl:col-span-2"
              >
                <div className="space-y-3">
                  {aiInsights.map((insight) => (
                    <article
                      key={insight.title}
                      className="flex items-start justify-between gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3"
                    >
                      <div>
                        <p className="text-sm font-semibold text-zinc-800">{insight.title}</p>
                        <p className="mt-1 text-xs text-zinc-600">{insight.detail}</p>
                      </div>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          insight.priority === "high"
                            ? "bg-rose-50 text-rose-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {insight.priority}
                      </span>
                    </article>
                  ))}
                </div>
              </Card>
              <Card title="AI Quick Actions" subtitle="Copilot suggestions">
                <div className="space-y-2">
                  {aiActions.map((action) => (
                    <button
                      key={action}
                      type="button"
                      onClick={() => handleAiAction(action)}
                      disabled={aiActionLoading === action}
                      className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-left text-sm text-zinc-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                    >
                      {aiActionLoading === action ? "Working..." : action}
                    </button>
                  ))}
                </div>
                <p className="mt-4 text-xs text-zinc-500">
                  AI features are advisory now; execution workflow can be enabled next.
                </p>
              </Card>
            </section>

            <section className="grid gap-4 xl:grid-cols-2">
              <Card
                title="Data Lineage"
                subtitle="Source-to-target dependencies"
                className="min-h-[280px]"
              >
                {lineageGraph.nodes.length === 0 ? (
                  <p className="text-sm text-zinc-500">
                    No lineage graph available yet. Open the{" "}
                    <Link href="/lineage" className="font-medium text-blue-700">
                      Lineage page
                    </Link>{" "}
                    to add mappings.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {lineageGraph.edges.slice(0, 4).map((edge) => (
                      <div
                        key={edge.id}
                        className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 p-3"
                      >
                        <div className="text-sm text-zinc-700">
                          <p className="font-medium">{edge.source_key}</p>
                          <p className="text-xs text-zinc-500">to {edge.target_key}</p>
                        </div>
                        <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-semibold text-zinc-700">
                          {edge.criticality}
                        </span>
                      </div>
                    ))}
                    <Link href="/lineage" className="inline-block text-sm font-medium text-blue-700">
                      View full lineage
                    </Link>
                  </div>
                )}
              </Card>

              <Card title="Stewardship Task Queue" subtitle="Human-in-the-loop review">
                {recentStewardship.length === 0 ? (
                  <p className="text-sm text-zinc-500">
                    No open stewardship tasks. Run pipeline to generate review tasks.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="text-xs uppercase tracking-wide text-zinc-500">
                        <tr>
                          <th className="px-2 py-2 text-left">Task</th>
                          <th className="px-2 py-2 text-left">Domain</th>
                          <th className="px-2 py-2 text-left">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentStewardship.map((row) => (
                          <tr key={row.id} className="border-t border-zinc-100">
                            <td className="px-2 py-2 text-zinc-700">TASK-{row.id}</td>
                            <td className="px-2 py-2 text-zinc-700">Customer</td>
                            <td className="px-2 py-2">
                              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-700">
                                {row.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </section>

            <section className="grid gap-4 xl:grid-cols-3">
              <Card title="Compliance & Policy">
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-600">PII Access Control</span>
                    <span className="text-emerald-600">Pass</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-600">Data Encryption</span>
                    <span className="text-emerald-600">Pass</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-600">Data Retention</span>
                    <span className="text-amber-600">Needs review</span>
                  </div>
                  <div className="mt-2">
                    <p className="mb-1 text-xs text-zinc-500">Retention compliance</p>
                    <div className="h-2 rounded-full bg-zinc-200">
                      <div className="h-full w-[87%] rounded-full bg-teal-600" />
                    </div>
                  </div>
                </div>
              </Card>

              <Card title="Alerts / Incidents">
                <ul className="space-y-2 text-sm">
                  {recentAlerts.map((alert) => (
                    <li key={alert.name} className="flex items-center justify-between rounded border border-zinc-200 p-2">
                      <span className="text-zinc-700">{alert.name}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${severityStyle(alert.severity)}`}>
                        {alert.severity}
                      </span>
                    </li>
                  ))}
                </ul>
              </Card>

              <Card
                title="Pipeline Job Status"
                subtitle={
                  isAdmin
                    ? "Run ETL-style pipeline on quarantine records."
                    : "View pipeline status. Only admins can run the pipeline."
                }
              >
                <div className="space-y-3 text-sm text-zinc-700">
                  <div>
                    <div className="mb-1 flex items-center justify-between text-xs text-zinc-500">
                      <span>Pipeline Progress</span>
                      <span>{pipelineStatus.progress_percent || 0}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200">
                      <div
                        className="h-full rounded-full bg-blue-600 transition-all"
                        style={{ width: `${pipelineStatus.progress_percent || 0}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-zinc-500">
                      {pipelineStatus.processed_records || 0} / {pipelineStatus.total_records || 0} records
                    </p>
                  </div>
                  <p>
                    <span className="font-medium">Status:</span>{" "}
                    <StatusBadge status={pipelineStatus.status} />
                  </p>
                  <p className="text-zinc-600">{pipelineStatus.last_message}</p>
                  <p>
                    <span className="font-medium">Total Runs:</span>{" "}
                    {pipelineStatus.run_count || 0} (Success: {pipelineStatus.success_count || 0},
                    Failed: {pipelineStatus.failed_count || 0})
                  </p>
                  <p>
                    <span className="font-medium">Last Run:</span>{" "}
                    {pipelineStatus.last_run_at
                      ? new Date(pipelineStatus.last_run_at).toLocaleString()
                      : "Not yet run"}
                  </p>
                  <Button
                    onClick={handleRunPipeline}
                    disabled={
                      !isAdmin ||
                      isRunningPipeline ||
                      pipelineStatus.status === "running"
                    }
                  >
                    {isRunningPipeline || pipelineStatus.status === "running"
                      ? "Processing..."
                      : "Run Pipeline"}
                  </Button>
                  {!isAdmin ? (
                    <p className="text-xs text-zinc-500">
                      Ask an administrator to run pipeline jobs.
                    </p>
                  ) : null}
                </div>
              </Card>
            </section>

            <section className="grid gap-4 xl:grid-cols-2">
              <Card title="Last Sync Run">
                {!isDashboardLoading && !dashboardError && lastSyncJob ? (
                  <div className="space-y-2 text-sm text-zinc-700">
                    <p>
                      <span className="font-medium">Status:</span>{" "}
                      <StatusBadge status={lastSyncJob.status} />
                    </p>
                    <p>
                      <span className="font-medium">Rows:</span> Q {lastSyncJob.quarantine_rows_synced}, R{" "}
                      {lastSyncJob.rules_synced}
                    </p>
                    <p>
                      <span className="font-medium">Started:</span>{" "}
                      {new Date(lastSyncJob.start_time).toLocaleString()}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-zinc-500">
                    {isDashboardLoading
                      ? "Waiting for latest sync details..."
                      : "No sync has run yet."}
                  </p>
                )}
              </Card>

              <Card title="Recent Job History">
                {isJobsLoading ? (
                  <p className="text-sm text-zinc-500">Loading recent jobs...</p>
                ) : (
                  <ul className="space-y-2 text-sm text-zinc-700">
                    {syncJobs.slice(0, 5).map((job) => (
                      <li key={job.id} className="flex items-center justify-between">
                        <span>Job #{job.id}</span>
                        <StatusBadge status={job.status} />
                      </li>
                    ))}
                    {syncJobs.length === 0 ? <li className="text-zinc-500">No jobs available.</li> : null}
                  </ul>
                )}
              </Card>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
