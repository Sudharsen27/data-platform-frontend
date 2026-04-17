"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import { getSyncJobs, retrySyncJob, triggerSnowflakeSync } from "@/lib/api";
import { useRequireAuth } from "@/lib/auth";

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
      <div className="flex min-h-screen flex-col md:flex-row">
        <Sidebar />
        <div className="flex-1">
          <Navbar title="Sync Jobs" />
          <main className="space-y-4 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-zinc-900">Sync Job History</h2>
                <p className="mt-1 text-sm text-zinc-600">
                  Track Snowflake sync runs and retry failed jobs.
                </p>
              </div>
              <button
                type="button"
                onClick={handleManualSync}
                disabled={isManualSyncRunning}
                className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-500"
              >
                {isManualSyncRunning ? "Running..." : "Run Manual Sync"}
              </button>
            </div>

            {message ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {message}
              </div>
            ) : null}
            {errorMessage ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorMessage}
              </div>
            ) : null}

            {isLoading ? (
              <div className="rounded-xl border border-zinc-200 bg-white p-5 text-sm text-zinc-500 shadow-sm">
                Loading sync jobs...
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
                <table className="min-w-full divide-y divide-zinc-200 text-sm">
                  <thead className="bg-zinc-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-zinc-600">Job ID</th>
                      <th className="px-4 py-3 text-left font-semibold text-zinc-600">Status</th>
                      <th className="px-4 py-3 text-left font-semibold text-zinc-600">Start</th>
                      <th className="px-4 py-3 text-left font-semibold text-zinc-600">End</th>
                      <th className="px-4 py-3 text-left font-semibold text-zinc-600">Rows</th>
                      <th className="px-4 py-3 text-left font-semibold text-zinc-600">Triggered By</th>
                      <th className="px-4 py-3 text-left font-semibold text-zinc-600">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {jobs.map((job) => (
                      <tr key={job.id}>
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
                            <button
                              type="button"
                              onClick={() => handleRetry(job.id)}
                              disabled={retryingId === job.id}
                              className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {retryingId === job.id ? "Retrying..." : "Retry"}
                            </button>
                          ) : (
                            <span className="text-zinc-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
