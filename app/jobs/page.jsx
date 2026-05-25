"use client";

import { useEffect, useState } from "react";
import PageShell from "@/components/layout/PageShell";
import { getHealthStatus, getSyncJobs, retrySyncJob, triggerSnowflakeSync } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useRequireAuth } from "@/lib/auth";
import JobSchedulerPanel from "@/components/jobs/JobSchedulerPanel";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import ToastStack from "@/components/ui/ToastStack";
import { useToast } from "@/lib/useToast";
import { usePipelineProgressToast } from "@/lib/usePipelineProgressToast";
import { Table } from "@/components/ui/Table";
import { MDM_MUTED, MDM_TABLE_TD } from "@/lib/themeClasses";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import StatusBadge from "@/components/ui/StatusBadge";
import Spinner from "@/components/ui/Spinner";

function formatDate(value) {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(date);
}

export default function JobsPage() {
  const { isCheckingAuth } = useRequireAuth();
  const { isAdmin } = useAuth();
  const { toasts, push: pushToast, dismiss: dismissToast } = useToast();
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [retryingId, setRetryingId] = useState(null);
  const [isManualSyncRunning, setIsManualSyncRunning] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [snowflakeReady, setSnowflakeReady] = useState(true);

  usePipelineProgressToast({ pushToast, dismissToast, enabled: true });

  function notify(message, options = {}) {
    if (!message) {
      return;
    }
    pushToast(message, options);
  }

  async function loadJobs() {
    try {
      setIsLoading(true);
      const data = await getSyncJobs();
      setJobs(data);
    } catch (error) {
      notify(error.message || "Failed to load jobs.", { type: "error" });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadJobs();
  }, []);

  useEffect(() => {
    getHealthStatus()
      .then((health) => {
        setSnowflakeReady(health.snowflake === "ok");
      })
      .catch(() => setSnowflakeReady(false));
  }, []);

  async function handleManualSync() {
    try {
      setIsManualSyncRunning(true);
      notify("Starting Snowflake sync…", { type: "info", title: "Sync", duration: 0, id: "snowflake-sync" });
      await triggerSnowflakeSync();
      notify("Manual sync completed successfully.", {
        type: "success",
        title: "Sync complete",
        id: "snowflake-sync",
        duration: 6000,
      });
      await loadJobs();
    } catch (error) {
      notify(error.message || "Failed to run manual sync.", {
        type: "error",
        title: "Sync failed",
        id: "snowflake-sync",
        duration: 8000,
      });
    } finally {
      setIsManualSyncRunning(false);
    }
  }

  async function handleRetry(jobId) {
    try {
      setRetryingId(jobId);
      notify(`Retrying sync job #${jobId}…`, {
        type: "info",
        title: "Sync",
        duration: 0,
        id: "snowflake-sync",
      });
      await retrySyncJob(jobId);
      notify(`Sync job #${jobId} completed.`, {
        type: "success",
        title: "Sync complete",
        id: "snowflake-sync",
        duration: 6000,
      });
      await loadJobs();
    } catch (error) {
      notify(error.message || "Failed to retry sync job.", {
        type: "error",
        title: "Sync failed",
        id: "snowflake-sync",
        duration: 8000,
      });
    } finally {
      setRetryingId(null);
    }
  }

  if (isCheckingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 text-sm text-zinc-600">
        Checking authentication...
      </div>
    );
  }

  const filteredJobs = jobs.filter((job) => {
    const needle = searchTerm.trim().toLowerCase();
    if (!needle) {
      return true;
    }
    return (
      String(job.id).includes(needle) ||
      String(job.status || "").toLowerCase().includes(needle) ||
      String(job.triggered_by || "").toLowerCase().includes(needle)
    );
  });

  return (
    <>
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
      <PageShell title="Sync Jobs">
            <Breadcrumbs items={[{ label: "Home" }, { label: "Jobs", current: true }]} />
            <JobSchedulerPanel
              isAdmin={isAdmin}
              snowflakeReady={snowflakeReady}
              onNotify={notify}
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-zinc-900">Sync Job History</h2>
                <p className="mt-1 text-sm text-zinc-600">
                  Track Snowflake sync runs and retry failed jobs.
                </p>
              </div>
              <Button onClick={handleManualSync} disabled={isManualSyncRunning || !snowflakeReady}>
                {isManualSyncRunning ? "Processing..." : "Run Manual Sync"}
              </Button>
            </div>

            {isLoading ? (
              <Card>
                <div className="flex items-center gap-2 text-sm text-zinc-600">
                  <Spinner />
                  Loading sync jobs...
                </div>
              </Card>
            ) : (
              <Table
                columns={[
                  "Job ID",
                  "Status",
                  "Error",
                  "Start",
                  "End",
                  "Rows",
                  "Triggered By",
                  "Action",
                ]}
                data={filteredJobs}
                emptyMessage="No sync jobs available."
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                searchPlaceholder="Search by job id, status, or trigger user"
                renderRow={(job) => (
                  <>
                    <td className={`${MDM_TABLE_TD} font-medium tabular-nums`}>#{job.id}</td>
                    <td className={MDM_TABLE_TD}>
                      <StatusBadge status={job.status} />
                    </td>
                    <td className={MDM_TABLE_TD}>
                      {job.error_message ? (
                        <span
                          className="block max-w-[14rem] truncate text-xs text-red-600 dark:text-red-400"
                          title={job.error_message}
                        >
                          {job.error_message}
                        </span>
                      ) : (
                        <span className={MDM_MUTED}>—</span>
                      )}
                    </td>
                    <td className={MDM_TABLE_TD}>{formatDate(job.start_time)}</td>
                    <td className={MDM_TABLE_TD}>{formatDate(job.end_time)}</td>
                    <td className={MDM_TABLE_TD}>
                      Q: {job.quarantine_rows_synced}, R: {job.rules_synced}
                    </td>
                    <td className={MDM_TABLE_TD}>{job.triggered_by}</td>
                    <td className={`${MDM_TABLE_TD} mdm-table-td--action`}>
                      {job.status === "failed" ? (
                        <Button
                          onClick={() => handleRetry(job.id)}
                          disabled={retryingId === job.id || !snowflakeReady}
                          variant="secondary"
                          size="sm"
                          title={snowflakeReady ? "Run sync again" : "Snowflake sync unavailable"}
                        >
                          {retryingId === job.id ? "Retrying…" : "Retry"}
                        </Button>
                      ) : (
                        <span className={MDM_MUTED}>—</span>
                      )}
                    </td>
                  </>
                )}
              />
            )}
      </PageShell>
    </>
  );
}
