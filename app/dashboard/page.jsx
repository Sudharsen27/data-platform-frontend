"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PageShell from "@/components/layout/PageShell";
import {
  getDashboardOverview,
  getAiFailedJobsSummary,
  getAiStatus,
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
import DashboardTrendChart from "@/components/charts/DashboardTrendChart";
import BarChart from "@/components/charts/BarChart";
import AuditActivityFeed from "@/components/dashboard/AuditActivityFeed";
import SlaWidgets from "@/components/dashboard/SlaWidgets";

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

export default function DashboardPage() {
  const router = useRouter();
  const { isCheckingAuth } = useRequireAuth();
  const { isAdmin, isReady, isAuthenticated, userName } = useAuth();
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
  const [kpiCards, setKpiCards] = useState([]);
  const [dashboardAlerts, setDashboardAlerts] = useState([]);
  const [complianceStatus, setComplianceStatus] = useState(null);
  const [dashboardTrends, setDashboardTrends] = useState(null);
  const [auditActivity, setAuditActivity] = useState([]);
  const [slaStatus, setSlaStatus] = useState(null);
  const [aiActionLoading, setAiActionLoading] = useState("");
  const [aiStatus, setAiStatus] = useState(null);

  useEffect(() => {
    if (!isReady || !isAuthenticated) {
      return;
    }

    async function loadOverviewData() {
      const cached = readCache("dashboard:overview");
      if (cached) {
        setDashboardData({
          kpi_summary: cached.kpi_summary ?? cached.kpis,
          last_sync_job: cached.last_sync_job,
        });
        setKpiCards(cached.kpi_cards || []);
        setDashboardAlerts(cached.alerts || []);
        setComplianceStatus(cached.compliance || null);
        setDashboardTrends(cached.trends || null);
        setAuditActivity(cached.audit_activity || []);
        setSlaStatus(cached.sla || null);
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
        setDashboardData({
          kpi_summary: overview.kpi_summary ?? overview.kpis,
          last_sync_job: overview.last_sync_job,
        });
        setKpiCards(overview.kpi_cards || []);
        setDashboardAlerts(overview.alerts || []);
        setComplianceStatus(overview.compliance || null);
        setDashboardTrends(overview.trends || null);
        setAuditActivity(overview.audit_activity || []);
        setSlaStatus(overview.sla || null);
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
    if (!isReady || !isAuthenticated) {
      return;
    }
    getAiStatus()
      .then(setAiStatus)
      .catch(() => setAiStatus(null));
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
      setDashboardData({
        kpi_summary: overview.kpi_summary ?? overview.kpis,
        last_sync_job: overview.last_sync_job,
      });
      setKpiCards(overview.kpi_cards || []);
      setDashboardAlerts(overview.alerts || []);
      setComplianceStatus(overview.compliance || null);
      setDashboardTrends(overview.trends || null);
      setAuditActivity(overview.audit_activity || []);
      setSlaStatus(overview.sla || null);
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

  const lastSyncJob = dashboardData?.last_sync_job;
  const recentStewardship = stewardshipRows.slice(0, 5);
  const displayKpis = kpiCards.length > 0 ? kpiCards : [];
  const displayAlerts = dashboardAlerts;
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

  function complianceStyle(status) {
    if (status === "pass") {
      return "text-emerald-600";
    }
    if (status === "fail") {
      return "text-rose-600";
    }
    return "text-amber-600";
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
    <>
      <Toast message={toastMessage} type={toastType} />
      <PageShell title="Dashboard">
        <Breadcrumbs items={[{ label: "Home" }, { label: "Dashboard", current: true }]} />

        {!isDashboardLoading && !dashboardError ? (
          <section className="rounded-2xl border border-blue-100/80 bg-gradient-to-br from-blue-50/90 via-white to-zinc-50/50 p-5 shadow-sm sm:p-6">
            <p className="text-[11px] font-bold uppercase tracking-widest text-blue-700">Overview</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl">
              Welcome back{userName ? `, ${userName}` : ""}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-600">
              Track data quality, lineage, stewardship, and pipeline health from a single control center.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {[
                { href: "/quarantine", label: "Quarantine" },
                { href: "/catalog", label: "Catalog" },
                { href: "/lineage", label: "Lineage" },
                { href: "/stewardship", label: "Stewardship" },
              ].map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="inline-flex items-center rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-800"
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </section>
        ) : null}
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
              {displayKpis.map((kpi) => {
                const deltaClass =
                  kpi.delta_positive === false
                    ? "text-rose-600"
                    : kpi.delta_positive === true
                      ? "text-emerald-600"
                      : "text-zinc-500";
                const inner = (
                  <>
                    <p className="text-sm font-medium text-zinc-500">{kpi.title}</p>
                    <p className="mt-2 text-3xl font-semibold text-blue-700">{kpi.value}</p>
                    <p className="mt-2 text-xs text-zinc-500">
                      <span className={deltaClass}>{kpi.delta}</span>{" "}
                      {kpi.delta_label || "vs last 7 days"}
                    </p>
                  </>
                );
                return kpi.href ? (
                  <Link key={kpi.key || kpi.title} href={kpi.href} className="block">
                    <Card className="p-4 transition hover:border-blue-200 hover:shadow-md">{inner}</Card>
                  </Link>
                ) : (
                  <Card key={kpi.key || kpi.title} className="p-4">
                    {inner}
                  </Card>
                );
              })}
            </section>

            {!isDashboardLoading && !dashboardError && slaStatus ? (
              <section>
                <SlaWidgets sla={slaStatus} />
              </section>
            ) : null}

            {!isDashboardLoading && !dashboardError ? (
              <>
                <section>
                  <DashboardTrendChart data={dashboardTrends?.records_trend || []} />
                </section>
                <section>
                  <BarChart data={dashboardTrends?.error_distribution || []} />
                </section>
                <section>
                  <AuditActivityFeed items={auditActivity} />
                </section>
              </>
            ) : null}

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
                {aiStatus ? (
                  <p className="mb-3 text-xs text-zinc-500">
                    Engine:{" "}
                    <span
                      className={
                        aiStatus.available
                          ? "font-semibold text-emerald-700"
                          : "font-semibold text-amber-700"
                      }
                    >
                      {!aiStatus.enabled
                        ? "AI disabled in API (.env)"
                        : aiStatus.provider === "ollama" && aiStatus.available
                          ? `Ollama (${aiStatus.model})`
                          : aiStatus.provider === "ollama"
                            ? "Ollama offline — rule-based fallback"
                            : `Rule-based (${aiStatus.model || "heuristics"})`}
                    </span>
                  </p>
                ) : null}
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
                  Works without Azure or a GPU. Optional upgrade: set{" "}
                  <span className="font-mono">AI_PROVIDER=ollama</span> and run{" "}
                  <span className="font-mono">ollama pull llama3.2:3b</span>.
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
              <Card
                title="Compliance & Policy"
                subtitle="Rules, catalog, audit, and stewardship"
              >
                {!complianceStatus ? (
                  <p className="text-sm text-zinc-500">Loading compliance checks...</p>
                ) : (
                  <div className="space-y-3 text-sm">
                    <div>
                      <div className="mb-1 flex items-center justify-between text-xs text-zinc-500">
                        <span>Overall compliance score</span>
                        <span className="font-semibold text-zinc-700">
                          {complianceStatus.overall_percent}%
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-zinc-200">
                        <div
                          className="h-full rounded-full bg-teal-600 transition-all"
                          style={{ width: `${complianceStatus.overall_percent}%` }}
                        />
                      </div>
                    </div>
                    {(complianceStatus.checks || []).map((check) => {
                      const row = (
                        <div className="flex items-start justify-between gap-2">
                          <span>
                            <span className="text-zinc-700">{check.label}</span>
                            {check.detail ? (
                              <span className="mt-0.5 block text-xs text-zinc-500">{check.detail}</span>
                            ) : null}
                          </span>
                          <span
                            className={`shrink-0 font-medium ${complianceStyle(check.status)}`}
                          >
                            {check.status_label}
                          </span>
                        </div>
                      );
                      return check.href ? (
                        <Link
                          key={check.key}
                          href={check.href}
                          className="block rounded border border-zinc-200 p-2 transition hover:border-blue-200 hover:bg-blue-50/50"
                        >
                          {row}
                        </Link>
                      ) : (
                        <div key={check.key} className="rounded border border-zinc-200 p-2">
                          {row}
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>

              <Card title="Alerts / Incidents" subtitle="From jobs, quarantine, and stewardship">
                {displayAlerts.length === 0 ? (
                  <p className="text-sm text-zinc-500">No active alerts. Data quality looks healthy.</p>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {displayAlerts.map((alert) => (
                      <li key={alert.name}>
                        {alert.href ? (
                          <Link
                            href={alert.href}
                            className="flex items-start justify-between gap-2 rounded border border-zinc-200 p-2 transition hover:border-blue-200 hover:bg-blue-50/50"
                          >
                            <span>
                              <span className="font-medium text-zinc-800">{alert.name}</span>
                              {alert.detail ? (
                                <span className="mt-0.5 block text-xs text-zinc-500">{alert.detail}</span>
                              ) : null}
                            </span>
                            <span
                              className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${severityStyle(alert.severity)}`}
                            >
                              {alert.severity}
                            </span>
                          </Link>
                        ) : (
                          <div className="flex items-start justify-between gap-2 rounded border border-zinc-200 p-2">
                            <span className="text-zinc-700">{alert.name}</span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-medium ${severityStyle(alert.severity)}`}
                            >
                              {alert.severity}
                            </span>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
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
      </PageShell>
    </>
  );
}
