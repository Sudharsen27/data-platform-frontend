"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import PageShell from "@/components/layout/PageShell";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Toast from "@/components/ui/Toast";
import Drawer, { DrawerFooterActions } from "@/components/ui/Drawer";
import CompareThreeColumn from "@/components/governance/CompareThreeColumn";
import Spinner from "@/components/ui/Spinner";
import {
  approveStewardship,
  bulkApproveStewardship,
  bulkRejectStewardship,
  exportStewardshipCsv,
  getMasterDataCompare,
  getStewardshipPage,
  rejectStewardship,
  runAiSuggestStewardshipOwners,
} from "@/lib/api";
import { useRequireAuth } from "@/lib/auth";
import { useAuth } from "@/context/AuthContext";
import StatusBadge from "@/components/ui/StatusBadge";
import {
  MDM_MUTED,
  MDM_PAGE_DESC,
  MDM_PAGE_TITLE,
  MDM_TABLE,
  MDM_TABLE_ACTIONS,
  MDM_TABLE_HEAD,
  MDM_TABLE_ROW,
  MDM_TABLE_TD,
  MDM_TABLE_TD_ACTION,
  MDM_TABLE_TH,
  MDM_TABLE_WRAP,
} from "@/lib/themeClasses";

const PAGE_SIZE = 50;

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending only" },
  { value: "all", label: "All statuses" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

export default function StewardshipPage() {
  const router = useRouter();
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
  const [aiAssignWorking, setAiAssignWorking] = useState(false);
  const [confirmBulkRejectOpen, setConfirmBulkRejectOpen] = useState(false);
  const [compareDrawer, setCompareDrawer] = useState(null);
  const [compareLoadingId, setCompareLoadingId] = useState(null);

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

  async function handleCompare(id) {
    const row = rows.find((r) => r.id === id);
    setCompareDrawer({ id, data: null, error: "", row });
    try {
      setCompareLoadingId(id);
      setErrorMessage("");
      const data = await getMasterDataCompare(id);
      setCompareDrawer({ id, data, error: "", row });
    } catch (error) {
      setCompareDrawer({
        id,
        data: null,
        error: error.message || "Failed to load comparison.",
        row,
      });
    } finally {
      setCompareLoadingId(null);
    }
  }

  async function handleApprove(id) {
    try {
      setActiveId(id);
      const result = await approveStewardship(id);
      setSelectedIds((s) => s.filter((x) => x !== id));
      await loadPage();
      setMessage(result.message || `Record ${id} approved and moved to master data.`);
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

  async function handleAssignOwners({ assignAllPending = false } = {}) {
    const pendingSelected = selectedIds.filter((id) =>
      rows.some((r) => r.id === id && r.status === "pending")
    );
    if (!assignAllPending && pendingSelected.length === 0) {
      setErrorMessage("Select one or more pending rows, or use Assign all pending (AI).");
      return;
    }
    try {
      setAiAssignWorking(true);
      setErrorMessage("");
      const result = await runAiSuggestStewardshipOwners({
        ids: assignAllPending ? [] : pendingSelected,
        assignAllPending,
      });
      await loadPage();
      const detail = (result.details || [])[0];
      setMessage(
        detail ? `${result.summary} ${detail}` : result.summary || "Owners assigned."
      );
    } catch (error) {
      setErrorMessage(error.message || "Failed to assign owners.");
    } finally {
      setAiAssignWorking(false);
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
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)] text-sm text-[var(--text-muted)]">
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
      <Drawer
        open={Boolean(compareDrawer)}
        onClose={() => setCompareDrawer(null)}
        title={
          compareDrawer?.id ? `Compare #${compareDrawer.id}` : "Source vs golden"
        }
        subtitle="Quarantine → stewardship → master data"
        width="max-w-2xl"
        footer={
          compareDrawer?.row?.status === "pending" ? (
            <DrawerFooterActions>
              <Button
                size="sm"
                onClick={() => {
                  const id = compareDrawer.id;
                  setCompareDrawer(null);
                  handleApprove(id);
                }}
                disabled={activeId === compareDrawer?.id}
              >
                Approve
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  const id = compareDrawer.id;
                  setCompareDrawer(null);
                  handleReject(id);
                }}
                disabled={activeId === compareDrawer?.id}
              >
                Reject
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setCompareDrawer(null)}>
                Close
              </Button>
            </DrawerFooterActions>
          ) : (
            <DrawerFooterActions>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => router.push("/master-data")}
              >
                Master data
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setCompareDrawer(null)}>
                Close
              </Button>
            </DrawerFooterActions>
          )
        }
      >
        {compareLoadingId === compareDrawer?.id ? (
          <div className={`flex items-center gap-2 text-sm ${MDM_MUTED}`}>
            <Spinner />
            Loading comparison…
          </div>
        ) : null}
        {compareDrawer?.error ? (
          <p className="text-sm text-rose-700 dark:text-rose-300">{compareDrawer.error}</p>
        ) : null}
        {compareDrawer?.data ? <CompareThreeColumn data={compareDrawer.data} /> : null}
      </Drawer>
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
              <h2 className={MDM_PAGE_TITLE}>Human-in-the-loop Queue</h2>
              <p className={`mt-1 ${MDM_PAGE_DESC}`}>
                When the <strong>pipeline</strong> processes quarantine records, items that need a
                human decision are placed here. You <strong>approve</strong> to publish them to master
                data, or <strong>reject</strong> to decline.
              </p>
              <p className={`mt-2 text-xs ${MDM_MUTED}`}>
                Large queues load in pages ({PAGE_SIZE} rows per page). Select pending rows, then{" "}
                <strong>Assign selected (AI)</strong>, or use <strong>Assign all pending (AI)</strong>{" "}
                for up to 50 tasks. Bulk approve/reject uses the same checkboxes (up to 500).
              </p>
            </section>

            <Card>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className={`text-sm ${MDM_MUTED}`}>
                  <span className="font-medium text-[var(--foreground)]">
                    {statusFilter === "all"
                      ? `Total in queue: ${total.toLocaleString()}`
                      : `Matching filter: ${total.toLocaleString()}`}
                  </span>
                  <span className="mx-2 opacity-40">|</span>
                  <span>
                    Pending (all pages):{" "}
                    <span className="font-semibold text-amber-600 dark:text-amber-400">
                      {pendingTotal.toLocaleString()}
                    </span>
                  </span>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                  <label className="flex items-center gap-2 text-sm text-[var(--foreground)]">
                    <span className="whitespace-nowrap">Show</span>
                    <select
                      value={statusFilter}
                      onChange={(e) => onFilterChange(e.target.value)}
                      className="mdm-input py-1.5 text-sm"
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
                    disabled={aiAssignWorking || selectedIds.length === 0}
                    onClick={() => handleAssignOwners({ assignAllPending: false })}
                  >
                    {aiAssignWorking ? "Assigning…" : "Assign selected (AI)"}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={aiAssignWorking || pendingTotal === 0}
                    onClick={() => handleAssignOwners({ assignAllPending: true })}
                  >
                    Assign all pending (AI)
                  </Button>
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
              <div className="mdm-toolbar flex flex-wrap items-center gap-2 px-4 py-3 text-sm">
                <span className={MDM_MUTED}>
                  Selected: <strong className="text-[var(--foreground)]">{selectedIds.length}</strong>
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={aiAssignWorking || selectedIds.length === 0}
                  onClick={() => handleAssignOwners({ assignAllPending: false })}
                >
                  {aiAssignWorking ? "Assigning…" : "Assign selected (AI)"}
                </Button>
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
              <div className="flex flex-col gap-3 rounded-xl border border-rose-200/80 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-200 sm:flex-row sm:items-center sm:justify-between">
                <span className="min-w-0 flex-1">{errorMessage}</span>
                <Button type="button" size="sm" variant="secondary" onClick={() => loadPage()}>
                  Retry
                </Button>
              </div>
            ) : null}

            {isLoading ? (
              <Card>
                <div className="h-6 w-52 animate-pulse rounded bg-[var(--color-surface-hover)]" />
                <div className="mt-3 h-24 animate-pulse rounded bg-[var(--color-surface-hover)]" />
              </Card>
            ) : (
              <>
                <div className={MDM_TABLE_WRAP}>
                  <table className={MDM_TABLE}>
                    <thead className={`${MDM_TABLE_HEAD} sticky top-0 z-10`}>
                      <tr>
                        <th className={`${MDM_TABLE_TH} w-10 px-2`}>
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-[var(--border-color)] accent-[var(--color-primary)]"
                            checked={allPendingOnPageSelected}
                            disabled={pendingOnPage.length === 0}
                            onChange={() => toggleSelectAllPendingOnPage()}
                            title="Select all pending on this page"
                            aria-label="Select all pending on this page"
                          />
                        </th>
                        <th className={MDM_TABLE_TH}>ID</th>
                        <th className={MDM_TABLE_TH}>Name</th>
                        <th className={MDM_TABLE_TH}>Email</th>
                        <th className={MDM_TABLE_TH}>Issue</th>
                        <th className={MDM_TABLE_TH}>Owner</th>
                        <th className={MDM_TABLE_TH}>Status</th>
                        <th className={MDM_TABLE_TH}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => (
                        <tr key={row.id} className={MDM_TABLE_ROW}>
                          <td className={`${MDM_TABLE_TD} w-10 px-2 align-middle`}>
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-[var(--border-color)] accent-[var(--color-primary)]"
                              checked={selectedIds.includes(row.id)}
                              disabled={row.status !== "pending"}
                              onChange={() => toggleSelected(row.id)}
                              aria-label={`Select row ${row.id}`}
                            />
                          </td>
                          <td className={`${MDM_TABLE_TD} font-medium tabular-nums align-middle`}>
                            #{row.id}
                          </td>
                          <td className={`${MDM_TABLE_TD} align-middle`}>{row.name}</td>
                          <td className={`${MDM_TABLE_TD} align-middle`}>{row.email || "—"}</td>
                          <td className={`${MDM_TABLE_TD} max-w-[14rem] align-middle`}>
                            <span className="line-clamp-2" title={row.issue || undefined}>
                              {row.issue || "—"}
                            </span>
                          </td>
                          <td className={`${MDM_TABLE_TD} align-middle`}>
                            {row.owner_email ? (
                              <span className="mdm-stewardship-owner">{row.owner_email}</span>
                            ) : (
                              <span className={MDM_MUTED}>Unassigned</span>
                            )}
                          </td>
                          <td className={`${MDM_TABLE_TD} align-middle`}>
                            <StatusBadge status={row.status} />
                          </td>
                          <td className={MDM_TABLE_TD_ACTION}>
                            <div className={MDM_TABLE_ACTIONS}>
                              <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                disabled={compareLoadingId === row.id}
                                onClick={() => handleCompare(row.id)}
                              >
                                {compareLoadingId === row.id ? "…" : "Compare"}
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleApprove(row.id)}
                                disabled={activeId === row.id || row.status !== "pending"}
                              >
                                {activeId === row.id ? "…" : "Approve"}
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
                          <td colSpan={8} className={`${MDM_TABLE_TD} py-10 text-center`}>
                            <p className="font-medium text-[var(--foreground)]">No rows for this filter</p>
                            <p className={`mt-2 mx-auto max-w-lg ${MDM_MUTED}`}>
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
                    <p className={`text-sm ${MDM_MUTED}`}>
                      Showing{" "}
                      <strong className="text-[var(--foreground)]">
                        {rangeStart.toLocaleString()}–{rangeEnd.toLocaleString()}
                      </strong>{" "}
                      of <strong className="text-[var(--foreground)]">{total.toLocaleString()}</strong>
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
