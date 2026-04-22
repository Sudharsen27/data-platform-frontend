"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import { getPipelineRuns } from "@/lib/api";
import { useRequireAuth } from "@/lib/auth";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

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

function statusClassName(status) {
  if (status === "success") {
    return "bg-emerald-50 text-emerald-700";
  }
  if (status === "running") {
    return "bg-amber-50 text-amber-700";
  }
  if (status === "failed") {
    return "bg-rose-50 text-rose-700";
  }
  return "bg-zinc-100 text-zinc-700";
}

export default function PipelinePage() {
  const { isCheckingAuth } = useRequireAuth();
  const [runs, setRuns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

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

    loadPipelineRuns();
  }, []);

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
          <Navbar title="Pipeline Monitoring" />
          <main className="space-y-6 p-6">
            <section>
              <h2 className="text-lg font-semibold text-zinc-900">Pipeline Runs</h2>
              <p className="mt-1 text-sm text-zinc-600">
                Monitor run status and records processed for each pipeline execution.
              </p>
            </section>

            {errorMessage ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorMessage}
              </div>
            ) : null}

            {isLoading ? (
              <Card>
                <div className="h-6 w-52 animate-pulse rounded bg-zinc-200" />
                <div className="mt-3 h-24 animate-pulse rounded bg-zinc-100" />
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
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${statusClassName(
                              run.status
                            )}`}
                          >
                            {run.status}
                          </span>
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
          </main>
        </div>
      </div>
    </div>
  );
}
