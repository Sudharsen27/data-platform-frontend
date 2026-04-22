"use client";

import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import StatsCard from "@/components/dashboard/StatsCard";
import PieChart from "@/components/charts/PieChart";
import LineChart from "@/components/charts/LineChart";
import BarChart from "@/components/charts/BarChart";
import {
  getDashboardData,
  getPipelineStatus,
  getSyncJobs,
  runPipeline,
} from "@/lib/api";
import { useRequireAuth } from "@/lib/auth";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Toast from "@/components/ui/Toast";

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
  const { isCheckingAuth } = useRequireAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [syncJobs, setSyncJobs] = useState([]);
  const [isDashboardLoading, setIsDashboardLoading] = useState(true);
  const [isJobsLoading, setIsJobsLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState("");
  const [jobsError, setJobsError] = useState("");
  const [pipelineStatus, setPipelineStatus] = useState({
    status: "idle",
    last_run_at: null,
    last_message: "Pipeline has not run yet.",
    total_records: 0,
    processed_records: 0,
    progress_percent: 0,
    run_count: 0,
    success_count: 0,
    failed_count: 0,
  });
  const [isRunningPipeline, setIsRunningPipeline] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setIsDashboardLoading(true);
        setDashboardError("");
        const data = await getDashboardData();
        setDashboardData(data);
      } catch (error) {
        setDashboardError(error.message || "Unable to load dashboard data.");
      } finally {
        setIsDashboardLoading(false);
      }
    }

    async function loadJobsData() {
      try {
        setIsJobsLoading(true);
        setJobsError("");
        const jobs = await getSyncJobs();
        setSyncJobs(jobs);
      } catch (error) {
        setJobsError(error.message || "Unable to load sync jobs.");
      } finally {
        setIsJobsLoading(false);
      }
    }

    async function loadPipelineData() {
      try {
        const status = await getPipelineStatus();
        setPipelineStatus(status);
      } catch (error) {
        setPipelineStatus((current) => ({
          ...current,
          status: "failed",
          last_message: error.message || "Unable to fetch pipeline status.",
        }));
      }
    }

    loadDashboardData();
    loadJobsData();
    loadPipelineData();
  }, []);

  useEffect(() => {
    if (pipelineStatus.status !== "running") {
      return;
    }

    const intervalId = setInterval(async () => {
      try {
        const status = await getPipelineStatus();
        setPipelineStatus(status);
        if (status.status !== "running") {
          setIsRunningPipeline(false);
        }
      } catch (error) {
        setPipelineStatus((current) => ({
          ...current,
          status: "failed",
          last_message: error.message || "Unable to fetch pipeline status.",
        }));
        setIsRunningPipeline(false);
      }
    }, 1500);

    return () => clearInterval(intervalId);
  }, [pipelineStatus.status]);

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
      const latestStatus = await getPipelineStatus();
      setPipelineStatus(latestStatus);
      setToastType("success");
      setToastMessage(
        `Pipeline completed: ${result.merged} merged, ${result.review} review, ${result.new} new.`
      );
      const refreshedDashboard = await getDashboardData();
      setDashboardData(refreshedDashboard);
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
        title: "Success Rate",
        value: `${normalized.successRate}%`,
      },
      {
        title: "Failed Records",
        value: normalized.failedRecords,
      },
      {
        title: "Active Jobs",
        value: normalized.activeJobs,
      },
    ];
  }, [dashboardData]);

  const pieData = dashboardData?.success_vs_failed || [];
  const trendData = dashboardData?.records_trend || [];
  const errorDistributionData = dashboardData?.error_distribution || [];
  const lastSyncJob = dashboardData?.last_sync_job;

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
            {isDashboardLoading ? (
              <Card>
                <div className="h-6 w-52 animate-pulse rounded bg-zinc-200" />
                <div className="mt-3 h-24 animate-pulse rounded bg-zinc-100" />
              </Card>
            ) : dashboardError ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 shadow-sm">
                {dashboardError}
              </div>
            ) : null}

            {!isDashboardLoading && !dashboardError ? (
              <>
                <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {kpis.map((kpi) => (
                    <StatsCard key={kpi.title} title={kpi.title} value={kpi.value} />
                  ))}
                </section>
                <section className="grid gap-4 xl:grid-cols-2">
                  <PieChart data={pieData} />
                  <BarChart data={errorDistributionData} />
                </section>
                <section>
                  <LineChart data={trendData} />
                </section>
              </>
            ) : null}

            <section className="grid gap-4 xl:grid-cols-3">
              <Card title="Last Sync Run">
                {!isDashboardLoading && !dashboardError && lastSyncJob ? (
                  <div className="space-y-2 text-sm text-zinc-700">
                    <p>
                      <span className="font-medium">Status:</span> {lastSyncJob.status}
                    </p>
                    <p>
                      <span className="font-medium">Rows:</span> Q{" "}
                      {lastSyncJob.quarantine_rows_synced}, R {lastSyncJob.rules_synced}
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
                ) : jobsError ? (
                  <p className="text-sm text-red-700">{jobsError}</p>
                ) : (
                  <ul className="space-y-2 text-sm text-zinc-700">
                    {syncJobs.slice(0, 5).map((job) => (
                      <li key={job.id} className="flex items-center justify-between">
                        <span>Job #{job.id}</span>
                        <span className="text-zinc-500">{job.status}</span>
                      </li>
                    ))}
                    {syncJobs.length === 0 ? (
                      <li className="text-zinc-500">No jobs available.</li>
                    ) : null}
                  </ul>
                )}
              </Card>
              <Card
                title="Pipeline Job Status"
                subtitle="Run ETL-style pipeline on quarantine records."
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
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        pipelineStatus.status === "success"
                          ? "bg-emerald-50 text-emerald-700"
                          : pipelineStatus.status === "failed"
                          ? "bg-rose-50 text-rose-700"
                          : pipelineStatus.status === "running"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-zinc-100 text-zinc-700"
                      }`}
                    >
                      {pipelineStatus.status}
                    </span>
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
                    disabled={isRunningPipeline || pipelineStatus.status === "running"}
                  >
                    {isRunningPipeline || pipelineStatus.status === "running"
                      ? "Running Pipeline..."
                      : "Run Pipeline"}
                  </Button>
                </div>
              </Card>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
