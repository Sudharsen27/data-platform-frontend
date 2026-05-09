"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import PageShell from "@/components/layout/PageShell";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Toast from "@/components/ui/Toast";
import {
  approveStewardship,
  bulkApproveStewardship,
  bulkRejectStewardship,
  exportStewardshipCsv,
  getStewardshipPage,
  rejectStewardship,
} from "@/lib/api";
import { useRequireAuth } from "@/lib/auth";
import { useAuth } from "@/context/AuthContext";

const PAGE_SIZE = 50;

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending only" },
  { value: "all", label: "All statuses" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

function statusBadge(status) {
  if (status === "approved") {
    return "bg-emerald-50 text-emerald-700";
  }
  if (status === "rejected") {
    return "bg-rose-50 text-rose-700";
  }
  return "bg-amber-50 text-amber-700";
}

export default function StewardshipPage() {
  const { isCheckingAuth } = useRequireAuth();
  const { isReady, isAuthenticated } = useAuth();
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [pendingTotal, setPendingTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [isLoading, setIsLoading] = useState(true);
  const [activeId, setActiveId] = useState(null);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkWorking, setBulkWorking] = useState(false);
  const [exportWorking, setExportWorking] = useState(false);
  const [confirmBulkRejectOpen, setConfirmBulkRejectOpen] = useState(false);

  const pendingOnPage = useMemo(
    () => rows.filter((r) => r.status === "pending").map((r) => r.id),
    [rows]
  );
  const allPendingOnPageSelected =
    pendingOnPage.length > 0 && pendingOnPage.every((id) => selectedIds.includes(id));

  const loadPage = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");
      const data = await getStewardshipPage({
        offset,
        limit: PAGE_SIZE,
        status: statusFilter,
      });
      setRows(Array.isArray(data.items) ? data.items : []);
      setTotal(typeof data.total === "number" ? data.total : 0);
      setPendingTotal(typeof data.pending_total === "number" ? data.pending_total : 0);
    } catch (error) {
      setErrorMessage(error.message || "Failed to load stewardship queue.");
    } finally {
      setIsLoading(false);
    }
  }, [offset, statusFilter]);

  useEffect(() => {
    setSelectedIds([]);
  }, [offset, statusFilter]);

  useEffect(() => {
    if (!isReady || !isAuthenticated) {
      return;
    }
    loadPage();
  }, [isReady, isAuthenticated, loadPage]);

  useEffect(() => {
    if (!message && !errorMessage) {
      return;
    }
    const timer = setTimeout(() => {
      setMessage("");
      setErrorMessage("");
    }, 4200);
    return () => clearTimeout(timer);
  }, [message, errorMessage]);

  async function handleApprove(id) {
    try {
      setActiveId(id);
      await approveStewardship(id);
      setSelectedIds((s) => s.filter((x) => x !== id));
      await loadPage();
      setMessage(`Record ${id} approved and moved to master data.`);
    } catch (error) {
      setErrorMessage(error.message || "Failed to approve record.");
    } finally {
      setActiveId(null);
    }
  }

  async function handleReject(id) {
    try {
      setActiveId(id);
      await rejectStewardship(id);
      setSelectedIds((s) => s.filter((x) => x !== id));
      await loadPage();
      setMessage(`Record ${id} rejected.`);
    } catch (error) {
      setErrorMessage(error.message || "Failed to reject record.");
    } finally {
      setActiveId(null);
    }
  }

  function toggleSelected(id) {
    setSelectedIds((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  function toggleSelectAllPendingOnPage() {
    if (allPendingOnPageSelected) {
      setSelectedIds((s) => s.filter((id) => !pendingOnPage.includes(id)));
      return;
    }
    setSelectedIds((s) => Array.from(new Set([...s, ...pendingOnPage])));
  }

  async function handleBulkApprove() {
    const ids = selectedIds.filter((id) => rows.some((r) => r.id === id && r.status === "pending"));
    if (!ids.length) {
      setErrorMessage("Select at least one pending row.");
      return;
    }
    if (ids.length > 500) {
      setErrorMessage("Select at most 500 rows per bulk action.");
      return;
    }
    try {
      setBulkWorking(true);
      const result = await bulkApproveStewardship(ids);
      setSelectedIds([]);
      await loadPage();
      setMessage(
        `Bulk approve: ${result.success_count} updated, ${result.skipped_not_pending} skipped, ${result.missing_count} missing.`
      );
    } catch (error) {
      setErrorMessage(error.message || "Bulk approve failed.");
    } finally {
      setBulkWorking(false);
    }
  }

  function openBulkRejectConfirm() {
    const ids = selectedIds.filter((id) => rows.some((r) => r.id === id && r.status === "pending"));
    if (!ids.length) {
      setErrorMessage("Select at least one pending row.");
      return;
    }
    if (ids.length > 500) {
      setErrorMessage("Select at most 500 rows per bulk action.");
      return;
    }
    setConfirmBulkRejectOpen(true);
  }

  async function confirmBulkReject() {
    const ids = selectedIds.filter((id) => rows.some((r) => r.id === id && r.status === "pending"));
    try {
      setBulkWorking(true);
      setConfirmBulkRejectOpen(false);
      const result = await bulkRejectStewardship(ids);
      setSelectedIds([]);
      await loadPage();
      setMessage(
        `Bulk reject: ${result.success_count} updated, ${result.skipped_not_pending} skipped, ${result.missing_count} missing.`
      );
    } catch (error) {
      setErrorMessage(error.message || "Bulk reject failed.");
    } finally {
      setBulkWorking(false);
    }
  }

  async function handleExportCsv() {
    try {
      setExportWorking(true);
      setErrorMessage("");
      await exportStewardshipCsv({ status: statusFilter, maxRows: 50000 });
      setMessage("Export started — check your downloads.");
    } catch (error) {
      setErrorMessage(error.message || "Export failed.");
    } finally {
      setExportWorking(false);
    }
  }

  const rangeStart = total === 0 ? 0 : offset + 1;
  const rangeEnd = offset + rows.length;
  const canPrev = offset > 0;
  const canNext = offset + PAGE_SIZE < total;

  function onFilterChange(next) {
    setStatusFilter(next);
    setOffset(0);
  }

  if (isCheckingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 text-sm text-zinc-600">
        Checking authentication...
      </div>
    );
  }

  const pendingBulkRejectCount = selectedIds.filter((id) =>
    rows.some((r) => r.id === id && r.status === "pending")
  ).length;

  return (
    <>
      <Toast message={message} type="success" />
      <Toast message={errorMessage} type="error" />
      <ConfirmModal
        open={confirmBulkRejectOpen}
        title="Reject selected records?"
        message={`This will mark ${pendingBulkRejectCount} pending record(s) as rejected. They will not be published to master data.`}
        confirmLabel="Reject all selected"
        cancelLabel="Cancel"
        danger
        busy={bulkWorking}
        onCancel={() => setConfirmBulkRejectOpen(false)}
        onConfirm={confirmBulkReject}
      />
      <PageShell title="Stewardship Queue">
            <section>
              <h2 className="text-lg font-semibold text-zinc-900">Human-in-the-loop Queue</h2>
              <p className="mt-1 text-sm text-zinc-600">
                When the <strong>pipeline</strong> processes quarantine records, items that need a
                human decision are placed here. You <strong>approve</strong> to publish them to master
                data, or <strong>reject</strong> to decline.
              </p>
              <p className="mt-2 text-xs text-zinc-500">
                Large queues load in pages ({PAGE_SIZE} rows per page). Use checkboxes for bulk
                actions (up to 500 per request). Export respects the current status filter (up to
                50k rows per download).
              </p>
            </section>

            <Card>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-zinc-600">
                  <span className="font-medium text-zinc-800">
                    {statusFilter === "all"
                      ? `Total in queue: ${total.toLocaleString()}`
                      : `Matching filter: ${total.toLocaleString()}`}
                  </span>
                  <span className="mx-2 text-zinc-300">|</span>
                  <span>
                    Pending (all pages):{" "}
                    <span className="font-semibold text-amber-700">
                      {pendingTotal.toLocaleString()}
                    </span>
                  </span>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                  <label className="flex items-center gap-2 text-sm text-zinc-700">
                    <span className="whitespace-nowrap">Show</span>
                    <select
                      value={statusFilter}
                      onChange={(e) => onFilterChange(e.target.value)}
                      className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={exportWorking || total === 0}
                    onClick={() => handleExportCsv()}
                  >
                    {exportWorking ? "Exporting…" : "Export CSV"}
                  </Button>
                </div>
              </div>
            </Card>

            {!isLoading && rows.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm shadow-sm">
                <span className="text-zinc-600">
                  Selected: <strong className="text-zinc-900">{selectedIds.length}</strong>
                </span>
                <Button
                  type="button"
                  size="sm"
                  disabled={bulkWorking || selectedIds.length === 0}
                  onClick={() => handleBulkApprove()}
                >
                  {bulkWorking ? "Working…" : "Bulk approve"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={bulkWorking || selectedIds.length === 0}
                  onClick={() => openBulkRejectConfirm()}
                >
                  Bulk reject
                </Button>
              </div>
            ) : null}

            {errorMessage && !isLoading ? (
              <div className="flex flex-col gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 sm:flex-row sm:items-center sm:justify-between">
                <span className="min-w-0 flex-1">{errorMessage}</span>
                <Button type="button" size="sm" variant="secondary" onClick={() => loadPage()}>
                  Retry
                </Button>
              </div>
            ) : null}

            {isLoading ? (
              <Card>
                <div className="h-6 w-52 animate-pulse rounded bg-zinc-200" />
                <div className="mt-3 h-24 animate-pulse rounded bg-zinc-100" />
              </Card>
            ) : (
              <>
                <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
                  <table className="min-w-full text-sm">
                    <thead className="sticky top-0 z-10 border-b border-zinc-200 bg-zinc-50/95 backdrop-blur-sm">
                      <tr>
                        <th className="w-10 px-2 py-3 text-left">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-zinc-300"
                            checked={allPendingOnPageSelected}
                            disabled={pendingOnPage.length === 0}
                            onChange={() => toggleSelectAllPendingOnPage()}
                            title="Select all pending on this page"
                            aria-label="Select all pending on this page"
                          />
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">
                          ID
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">
                          Name
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">
                          Email
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">
                          Issue
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => (
                        <tr key={row.id} className="border-b border-zinc-100 hover:bg-zinc-50/70">
                          <td className="px-2 py-3 align-middle">
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-zinc-300"
                              checked={selectedIds.includes(row.id)}
                              disabled={row.status !== "pending"}
                              onChange={() => toggleSelected(row.id)}
                              aria-label={`Select row ${row.id}`}
                            />
                          </td>
                          <td className="px-4 py-3 font-medium text-zinc-800">#{row.id}</td>
                          <td className="px-4 py-3 text-zinc-700">{row.name}</td>
                          <td className="px-4 py-3 text-zinc-700">{row.email || "-"}</td>
                          <td className="px-4 py-3 text-zinc-700">{row.issue || "-"}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${statusBadge(
                                row.status
                              )}`}
                            >
                              {row.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleApprove(row.id)}
                                disabled={activeId === row.id || row.status !== "pending"}
                              >
                                {activeId === row.id ? "Working..." : "Approve"}
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleReject(row.id)}
                                disabled={activeId === row.id || row.status !== "pending"}
                              >
                                Reject
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {rows.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-10 text-center text-sm text-zinc-600">
                            <p className="font-medium text-zinc-800">No rows for this filter</p>
                            <p className="mt-2 max-w-lg mx-auto text-zinc-500">
                              Try &quot;All statuses&quot; or another filter, or run the pipeline if the
                              queue is new.
                            </p>
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>

                {total > 0 ? (
                  <div className="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
                    <p className="text-sm text-zinc-600">
                      Showing{" "}
                      <strong className="text-zinc-900">
                        {rangeStart.toLocaleString()}–{rangeEnd.toLocaleString()}
                      </strong>{" "}
                      of <strong className="text-zinc-900">{total.toLocaleString()}</strong>
                    </p>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        disabled={!canPrev || isLoading}
                        onClick={() => setOffset((o) => Math.max(0, o - PAGE_SIZE))}
                      >
                        Previous
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        disabled={!canNext || isLoading}
                        onClick={() => setOffset((o) => o + PAGE_SIZE)}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                ) : null}
              </>
            )}
      </PageShell>
    </>
  );
}
