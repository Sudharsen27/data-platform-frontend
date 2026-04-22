"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import { getSyncJobs, retrySyncJob, triggerSnowflakeSync } from "@/lib/api";
import { useRequireAuth } from "@/lib/auth";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Toast from "@/components/ui/Toast";
import { Table } from "@/components/ui/Table";

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

  return (
    <div className="min-h-screen bg-zinc-50">
      <Toast message={message} type="success" />
      <Toast message={errorMessage} type="error" />
      <div className="flex min-h-screen flex-col md:flex-row">
        <Sidebar />
        <div className="flex-1">
          <Navbar title="Sync Jobs" />
          <main className="space-y-6 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-zinc-900">Sync Job History</h2>
                <p className="mt-1 text-sm text-zinc-600">
                  Track Snowflake sync runs and retry failed jobs.
                </p>
              </div>
              <Button onClick={handleManualSync} disabled={isManualSyncRunning}>
                {isManualSyncRunning ? "Running..." : "Run Manual Sync"}
              </Button>
            </div>

            {isLoading ? (
              <Card>
                <div className="h-6 w-52 animate-pulse rounded bg-zinc-200" />
                <div className="mt-3 h-24 animate-pulse rounded bg-zinc-100" />
              </Card>
            ) : (
              <Table
                columns={["Job ID", "Status", "Start", "End", "Rows", "Triggered By", "Action"]}
                data={jobs}
                emptyMessage="No sync jobs available."
                renderRow={(job) => (
                  <>
                    <td className="px-4 py-3 font-medium text-zinc-800">#{job.id}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                          job.status === "success"
                            ? "bg-emerald-50 text-emerald-700"
                            : job.status === "failed"
                            ? "bg-red-50 text-red-700"
                            : "bg-zinc-100 text-zinc-700"
                        }`}
                      >
                        {job.status}
                      </span>
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
          </main>
        </div>
      </div>
    </div>
  );
}
