"use client";

import { useCallback, useEffect, useState } from "react";
import PageShell from "@/components/layout/PageShell";
import { exportAuditCsv, getAuditLogs } from "@/lib/api";
import { useRequireAuth } from "@/lib/auth";
import { useAuth } from "@/context/AuthContext";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Toast from "@/components/ui/Toast";
import Spinner from "@/components/ui/Spinner";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import StatusBadge from "@/components/ui/StatusBadge";

const ACTION_OPTIONS = [
  { value: "", label: "All actions" },
  { value: "update", label: "update" },
  { value: "create", label: "create" },
  { value: "delete", label: "delete" },
  { value: "pipeline_run", label: "pipeline_run" },
  { value: "role_change", label: "role_change" },
  { value: "status_change", label: "status_change" },
];

function formatTime(value) {
  if (!value) {
    return "—";
  }
  return new Date(value).toLocaleString();
}

function ChangeCell({ oldValue, newValue }) {
  const hasOld = oldValue && String(oldValue).trim() !== "";
  const hasNew = newValue && String(newValue).trim() !== "";
  if (!hasOld && !hasNew) {
    return <span className="text-zinc-400">—</span>;
  }
  return (
    <div className="max-w-md space-y-1 text-xs">
      {hasOld ? (
        <p className="rounded border border-rose-100 bg-rose-50/80 px-2 py-1 font-mono text-rose-900 line-through decoration-rose-400/60">
          {String(oldValue)}
        </p>
      ) : null}
      {hasNew ? (
        <p className="rounded border border-emerald-100 bg-emerald-50/90 px-2 py-1 font-mono text-emerald-900">
          {String(newValue)}
        </p>
      ) : null}
    </div>
  );
}

export default function AuditPage() {
  const { isCheckingAuth } = useRequireAuth();
  const { isReady, isAuthenticated } = useAuth();
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [userInput, setUserInput] = useState("");
  const [userQuery, setUserQuery] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");

  const loadLogs = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");
      const data = await getAuditLogs({
        action: actionFilter,
        user: userQuery,
        limit: 300,
      });
      setLogs(data);
    } catch (error) {
      setErrorMessage(error.message || "Failed to load audit logs.");
    } finally {
      setIsLoading(false);
    }
  }, [actionFilter, userQuery]);

  useEffect(() => {
    if (!isReady || !isAuthenticated) {
      return;
    }
    loadLogs();
  }, [loadLogs, isReady, isAuthenticated]);

  useEffect(() => {
    if (!toastMessage) {
      return;
    }
    const timer = setTimeout(() => setToastMessage(""), 2500);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  function applyUserFilter() {
    setUserQuery(userInput.trim());
  }

  async function handleExportCsv() {
    try {
      setIsExporting(true);
      setErrorMessage("");
      await exportAuditCsv({
        action: actionFilter,
        user: userQuery,
        limit: 300,
      });
      setToastType("success");
      setToastMessage("Audit CSV exported.");
    } catch (error) {
      setErrorMessage(error.message || "Failed to export audit CSV.");
      setToastType("error");
      setToastMessage(error.message || "Failed to export audit CSV.");
    } finally {
      setIsExporting(false);
    }
  }

  const filteredLogs = logs.filter((log) => {
    const needle = searchTerm.trim().toLowerCase();
    if (!needle) {
      return true;
    }
    return (
      String(log.user_id || "").toLowerCase().includes(needle) ||
      String(log.action || "").toLowerCase().includes(needle) ||
      String(log.entity || "").toLowerCase().includes(needle)
    );
  });

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
      <PageShell title="Audit Logs">
            <Breadcrumbs items={[{ label: "Home" }, { label: "Audit", current: true }]} />
            <div>
              <h2 className="text-lg font-semibold text-zinc-900">Activity trail</h2>
              <p className="mt-1 text-sm text-zinc-600">
                Governance events: data changes, rules, pipeline runs, and user administration.
              </p>
            </div>

            <Card>
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
                <div className="min-w-[160px]">
                  <label htmlFor="audit-action" className="mb-1 block text-xs font-semibold text-zinc-600">
                    Action
                  </label>
                  <select
                    id="audit-action"
                    value={actionFilter}
                    onChange={(e) => setActionFilter(e.target.value)}
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {ACTION_OPTIONS.map((opt) => (
                      <option key={opt.label} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="min-w-[200px] flex-1">
                  <label htmlFor="audit-user" className="mb-1 block text-xs font-semibold text-zinc-600">
                    User (email contains)
                  </label>
                  <input
                    id="audit-user"
                    type="search"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        applyUserFilter();
                      }
                    }}
                    placeholder="e.g. admin@company.com"
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="min-w-[200px] flex-1">
                  <label htmlFor="audit-search" className="mb-1 block text-xs font-semibold text-zinc-600">
                    Table search
                  </label>
                  <input
                    id="audit-search"
                    type="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search loaded rows"
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <Button type="button" variant="secondary" size="sm" onClick={applyUserFilter}>
                  Apply user filter
                </Button>
                <Button type="button" variant="secondary" size="sm" onClick={loadLogs} disabled={isLoading}>
                  {isLoading ? "Loading…" : "Refresh"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleExportCsv}
                  disabled={isExporting}
                >
                  {isExporting ? "Exporting..." : "Export CSV"}
                </Button>
              </div>

              {errorMessage ? (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                  {errorMessage}
                </div>
              ) : null}

              {isLoading ? (
                <div className="py-4 text-sm text-zinc-600">
                  <div className="flex items-center gap-2">
                    <Spinner />
                    Loading audit logs...
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-zinc-200">
                  <table className="min-w-full divide-y divide-zinc-200 text-sm">
                    <thead className="bg-zinc-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">
                          User
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">
                          Action
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">
                          Entity
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">
                          Change
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">
                          Time
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 bg-white">
                      {filteredLogs.map((log) => (
                        <tr key={log.id} className="align-top hover:bg-zinc-50/80">
                          <td className="whitespace-nowrap px-4 py-3 font-medium text-zinc-900">
                            {log.user_id}
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={log.action} />
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-zinc-700">{log.entity}</td>
                          <td className="px-4 py-3">
                            <ChangeCell oldValue={log.old_value} newValue={log.new_value} />
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-zinc-600">
                            {formatTime(log.timestamp)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredLogs.length === 0 ? (
                    <p className="p-8 text-center text-sm text-zinc-500">No events match your filters.</p>
                  ) : null}
                </div>
              )}
            </Card>
      </PageShell>
    </>
  );
}
