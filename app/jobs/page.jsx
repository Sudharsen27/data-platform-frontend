"use client";

import { useEffect, useState } from "react";
import PageShell from "@/components/layout/PageShell";
import { getSyncJobs, retrySyncJob, triggerSnowflakeSync } from "@/lib/api";
import { useRequireAuth } from "@/lib/auth";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Toast from "@/components/ui/Toast";
import { Table } from "@/components/ui/Table";
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
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [retryingId, setRetryingId] = useState(null);
  const [isManualSyncRunning, setIsManualSyncRunning] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  async function loadJobs() {
    try {
      setIsLoading(true);
      const data = await getSyncJobs();
      setJobs(data);
    } catch (error) {
      setErrorMessage(error.message || "Failed to load jobs.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadJobs();
  }, []);

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

  async function handleManualSync() {
    try {
      setIsManualSyncRunning(true);
      setErrorMessage("");
      setMessage("");
      await triggerSnowflakeSync();
      setMessage("Manual sync completed successfully.");
      await loadJobs();
    } catch (error) {
      setErrorMessage(error.message || "Failed to run manual sync.");
    } finally {
      setIsManualSyncRunning(false);
    }
  }

  async function handleRetry(jobId) {
    try {
      setRetryingId(jobId);
      setErrorMessage("");
      setMessage("");
      await retrySyncJob(jobId);
      setMessage(`Retried sync job #${jobId} successfully.`);
      await loadJobs();
    } catch (error) {
      setErrorMessage(error.message || "Failed to retry sync job.");
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
      <Toast message={message} type="success" />
      <Toast message={errorMessage} type="error" />
      <PageShell title="Sync Jobs">
            <Breadcrumbs items={[{ label: "Home" }, { label: "Jobs", current: true }]} />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-zinc-900">Sync Job History</h2>
                <p className="mt-1 text-sm text-zinc-600">
                  Track Snowflake sync runs and retry failed jobs.
                </p>
              </div>
              <Button onClick={handleManualSync} disabled={isManualSyncRunning}>
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
                columns={["Job ID", "Status", "Start", "End", "Rows", "Triggered By", "Action"]}
                data={filteredJobs}
                emptyMessage="No sync jobs available."
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                searchPlaceholder="Search by job id, status, or trigger user"
                renderRow={(job) => (
                  <>
                    <td className="px-4 py-3 font-medium text-zinc-800">#{job.id}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={job.status} />
                    </td>
                    <td className="px-4 py-3 text-zinc-700">{formatDate(job.start_time)}</td>
                    <td className="px-4 py-3 text-zinc-700">{formatDate(job.end_time)}</td>
                    <td className="px-4 py-3 text-zinc-700">
                      Q: {job.quarantine_rows_synced}, R: {job.rules_synced}
                    </td>
                    <td className="px-4 py-3 text-zinc-700">{job.triggered_by}</td>
                    <td className="px-4 py-3">
                      {job.status === "failed" ? (
                        <Button
                          onClick={() => handleRetry(job.id)}
                          disabled={retryingId === job.id}
                          variant="secondary"
                          size="sm"
                        >
                          {retryingId === job.id ? "Retrying..." : "Retry"}
                        </Button>
                      ) : (
                        <span className="text-zinc-400">-</span>
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
