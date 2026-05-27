"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import PageShell from "@/components/layout/PageShell";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import Toast from "@/components/ui/Toast";
import { useRequireAdmin } from "@/lib/auth";
import {
  getIngestionJob,
  listIngestionJobs,
  getLatestIngestionJob,
  uploadCsvAndStartIngestion,
} from "@/lib/api";

const ACTIVE_STATUSES = new Set(["queued", "running"]);

function percent(job) {
  if (!job || !job.total_rows) return 0;
  return Math.min(100, Math.round((job.processed_rows / job.total_rows) * 100));
}

export default function UploadPage() {
  const { isCheckingAuth } = useRequireAdmin();
  const [file, setFile] = useState(null);
  const [job, setJob] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [jobStartedAtMs, setJobStartedAtMs] = useState(0);
  const [etaSeconds, setEtaSeconds] = useState(null);

  useEffect(() => {
    Promise.all([getLatestIngestionJob(), listIngestionJobs({ limit: 8 })])
      .then(([latest, list]) => {
        setJob(latest || null);
        setJobs(Array.isArray(list) ? list : []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!job || !ACTIVE_STATUSES.has((job.status || "").toLowerCase())) return;
    if (!jobStartedAtMs) {
      setJobStartedAtMs(Date.now());
    }
    const id = window.setInterval(async () => {
      try {
        const updated = await getIngestionJob(job.id);
        setJob(updated);
        const list = await listIngestionJobs({ limit: 8 });
        setJobs(Array.isArray(list) ? list : []);
      } catch {
        // keep polling best-effort
      }
    }, 2000);
    return () => window.clearInterval(id);
  }, [job, jobStartedAtMs]);

  useEffect(() => {
    if (!job || !ACTIVE_STATUSES.has((job.status || "").toLowerCase())) {
      setEtaSeconds(null);
      setJobStartedAtMs(0);
      return;
    }
    const total = Number(job.total_rows || 0);
    const processed = Number(job.processed_rows || 0);
    if (!total || !processed || !jobStartedAtMs) {
      setEtaSeconds(null);
      return;
    }
    const elapsed = Math.max(1, (Date.now() - jobStartedAtMs) / 1000);
    const rate = processed / elapsed;
    if (rate <= 0) {
      setEtaSeconds(null);
      return;
    }
    const remaining = Math.max(0, total - processed);
    setEtaSeconds(Math.round(remaining / rate));
  }, [job, jobStartedAtMs]);

  useEffect(() => {
    if (!toastMessage) return;
    const id = window.setTimeout(() => setToastMessage(""), 2500);
    return () => window.clearTimeout(id);
  }, [toastMessage]);

  const progressPct = useMemo(() => percent(job), [job]);
  const status = String(job?.status || "").toLowerCase();
  const statusStyle =
    status === "completed"
      ? "bg-emerald-100 text-emerald-700"
      : status === "failed"
        ? "bg-rose-100 text-rose-700"
        : status === "running"
          ? "bg-blue-100 text-blue-700"
          : "bg-zinc-100 text-zinc-700";

  async function handleUpload(event) {
    event.preventDefault();
    if (!file) {
      setErrorMessage("Please choose a CSV file.");
      return;
    }
    try {
      setErrorMessage("");
      setIsUploading(true);
      const created = await uploadCsvAndStartIngestion(file);
      setJob(created);
      setJobStartedAtMs(Date.now());
      setToastMessage("Upload accepted. Ingestion job started.");
      setFile(null);
      const list = await listIngestionJobs({ limit: 8 });
      setJobs(Array.isArray(list) ? list : []);
      const input = document.getElementById("csv-file-input");
      if (input) input.value = "";
    } catch (error) {
      setErrorMessage(error.message || "Upload failed.");
    } finally {
      setIsUploading(false);
    }
  }

  function formatEta(seconds) {
    if (seconds == null || seconds < 0) return "Estimating...";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) return `${mins}m ${secs}s remaining`;
    return `${secs}s remaining`;
  }

  function formatDateTime(value) {
    if (!value) return "—";
    return new Date(value).toLocaleString();
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
      <Toast message={toastMessage} type="success" />
      <PageShell title="Upload">
        <Breadcrumbs items={[{ label: "Home" }, { label: "Upload", current: true }]} />
        <section>
          <h2 className="text-lg font-semibold text-zinc-900">CSV Upload & Ingestion Job</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Upload a large CSV file, run ingestion in background, then review results in{" "}
            <Link href="/duplicates" className="font-semibold text-blue-700 hover:underline">
              Duplicates
            </Link>
            .
          </p>
        </section>

        <Card>
          <form className="space-y-3" onSubmit={handleUpload}>
            <div
              className={`rounded-xl border border-dashed p-4 transition ${
                isDragActive
                  ? "border-blue-400 bg-blue-50"
                  : "border-zinc-300 bg-zinc-50"
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragActive(true);
              }}
              onDragEnter={(e) => {
                e.preventDefault();
                setIsDragActive(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                if (e.currentTarget.contains(e.relatedTarget)) return;
                setIsDragActive(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragActive(false);
                const dropped = e.dataTransfer?.files?.[0] || null;
                if (!dropped) return;
                if (!dropped.name.toLowerCase().endsWith(".csv")) {
                  setErrorMessage("Only CSV files are supported.");
                  return;
                }
                setErrorMessage("");
                setFile(dropped);
              }}
            >
              <label className="flex min-w-[260px] flex-1 flex-col gap-1 text-sm text-zinc-700">
                <span className="font-medium">CSV file</span>
                <input
                  id="csv-file-input"
                  type="file"
                  accept=".csv,text/csv"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
                />
                <span className="text-xs text-zinc-500">
                  Drag and drop a CSV here, or browse files. Large files are processed asynchronously.
                </span>
              </label>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button type="submit" disabled={isUploading}>
                {isUploading ? "Uploading..." : "Upload & Run"}
              </Button>
              {file ? (
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                  Selected: {file.name}
                </span>
              ) : null}
            </div>
          </form>
          {errorMessage ? (
            <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorMessage}
            </p>
          ) : null}
        </Card>

        <Card title="Latest ingestion job" subtitle="Progress and completion status">
          {!job ? (
            <p className="text-sm text-zinc-500">No ingestion job yet.</p>
          ) : (
            <div className="space-y-3 text-sm text-zinc-700">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p>
                  <span className="font-medium">Job:</span> #{job.id} · {job.filename}
                </p>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase ${statusStyle}`}>
                  {job.status}
                </span>
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between text-xs text-zinc-500">
                  <span>Progress</span>
                  <span>{progressPct}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200">
                  <div
                    className="h-full rounded-full bg-blue-600 transition-all"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-zinc-500">
                  processed {job.processed_rows?.toLocaleString() || 0} /{" "}
                  {job.total_rows?.toLocaleString() || 0} · inserted{" "}
                  {job.inserted_rows?.toLocaleString() || 0}
                </p>
                {ACTIVE_STATUSES.has(status) ? (
                  <p className="mt-1 text-xs font-medium text-blue-700">{formatEta(etaSeconds)}</p>
                ) : null}
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2">
                  <p className="text-xs text-zinc-500">Processed</p>
                  <p className="text-base font-semibold text-zinc-800">
                    {job.processed_rows?.toLocaleString() || 0}
                  </p>
                </div>
                <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2">
                  <p className="text-xs text-zinc-500">Inserted</p>
                  <p className="text-base font-semibold text-zinc-800">
                    {job.inserted_rows?.toLocaleString() || 0}
                  </p>
                </div>
                <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2">
                  <p className="text-xs text-zinc-500">Total rows</p>
                  <p className="text-base font-semibold text-zinc-800">
                    {job.total_rows?.toLocaleString() || 0}
                  </p>
                </div>
              </div>
              {job.error_message ? (
                <p className="rounded border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-700">
                  {job.error_message}
                </p>
              ) : null}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={async () => {
                    try {
                      const updated = await getIngestionJob(job.id);
                      setJob(updated);
                    } catch (err) {
                      setErrorMessage(err.message || "Failed to refresh job status");
                    }
                  }}
                >
                  Refresh status
                </Button>
                <Link href="/duplicates" className="mdm-chip-link">
                  Open Duplicates
                </Link>
              </div>
            </div>
          )}
        </Card>
        <Card title="Recent ingestion jobs" subtitle="Latest runs and outcomes">
          {jobs.length === 0 ? (
            <p className="text-sm text-zinc-500">No jobs yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500">
                  <tr>
                    <th className="px-2 py-2 text-left">Job</th>
                    <th className="px-2 py-2 text-left">Status</th>
                    <th className="px-2 py-2 text-left">Rows</th>
                    <th className="px-2 py-2 text-left">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((item) => (
                    <tr key={item.id} className="border-b border-zinc-100">
                      <td className="px-2 py-2">
                        #{item.id} · {item.filename}
                      </td>
                      <td className="px-2 py-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-semibold uppercase ${
                            String(item.status || "").toLowerCase() === "completed"
                              ? "bg-emerald-100 text-emerald-700"
                              : String(item.status || "").toLowerCase() === "failed"
                                ? "bg-rose-100 text-rose-700"
                                : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="px-2 py-2">
                        {(item.inserted_rows || 0).toLocaleString()} /{" "}
                        {(item.total_rows || 0).toLocaleString()}
                      </td>
                      <td className="px-2 py-2 text-zinc-600">{formatDateTime(item.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </PageShell>
    </>
  );
}

