"use client";

import { useCallback, useEffect, useState } from "react";
import PageShell from "@/components/layout/PageShell";
import { getAiActionLogs } from "@/lib/api";
import { useRequireAuth } from "@/lib/auth";
import { useAuth } from "@/context/AuthContext";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Toast from "@/components/ui/Toast";
import Spinner from "@/components/ui/Spinner";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import StatusBadge from "@/components/ui/StatusBadge";

const PAGE_SIZE = 50;

const ACTION_OPTIONS = [
  { value: "", label: "All AI actions" },
  { value: "generate_rules", label: "Generate rules" },
  { value: "suggest_stewardship_owners", label: "Assign stewards" },
  { value: "explain_quarantine", label: "Explain quarantine" },
  { value: "summarize_failed_jobs", label: "Summarize failed jobs" },
];

function formatActionLabel(key) {
  const found = ACTION_OPTIONS.find((o) => o.value === key);
  return found ? found.label : key;
}

function formatTime(value) {
  if (!value) {
    return "—";
  }
  return new Date(value).toLocaleString();
}

function PayloadPreview({ payload }) {
  if (!payload || Object.keys(payload).length === 0) {
    return <span className="text-zinc-400">—</span>;
  }
  const text = JSON.stringify(payload, null, 0);
  const short = text.length > 160 ? `${text.slice(0, 160)}…` : text;
  return (
    <pre className="max-w-md overflow-x-auto rounded border border-zinc-100 bg-zinc-50 px-2 py-1 font-mono text-[11px] text-zinc-600">
      {short}
    </pre>
  );
}

export default function AiActivityPage() {
  const { isCheckingAuth } = useRequireAuth();
  const { isReady, isAuthenticated } = useAuth();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [actionFilter, setActionFilter] = useState("");
  const [userInput, setUserInput] = useState("");
  const [userQuery, setUserQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  const loadLogs = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");
      const data = await getAiActionLogs({
        offset,
        limit: PAGE_SIZE,
        actionKey: actionFilter,
        userId: userQuery,
      });
      setItems(data.items || []);
      setTotal(typeof data.total === "number" ? data.total : 0);
    } catch (error) {
      setErrorMessage(error.message || "Failed to load AI activity.");
    } finally {
      setIsLoading(false);
    }
  }, [offset, actionFilter, userQuery]);

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

  function applyFilters() {
    setUserQuery(userInput.trim());
    setOffset(0);
  }

  function onActionFilterChange(value) {
    setActionFilter(value);
    setOffset(0);
  }

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;

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
      <PageShell title="AI Activity">
        <Breadcrumbs items={[{ label: "Home" }, { label: "AI Activity", current: true }]} />

        <section>
          <h2 className="text-lg font-semibold text-zinc-900">Copilot action history</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Every AI quick action and copilot call is logged here with user, summary, and payload
            metadata for governance review.
          </p>
        </section>

        <Card>
          <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
            <label className="flex min-w-[200px] flex-1 flex-col gap-1 text-sm text-zinc-700">
              Action type
              <select
                value={actionFilter}
                onChange={(e) => onActionFilterChange(e.target.value)}
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {ACTION_OPTIONS.map((opt) => (
                  <option key={opt.value || "all"} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex min-w-[200px] flex-1 flex-col gap-1 text-sm text-zinc-700">
              User email
              <input
                type="search"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && applyFilters()}
                placeholder="Filter by user"
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </label>
            <Button type="button" size="sm" onClick={() => applyFilters()}>
              Apply filters
            </Button>
            <Button type="button" size="sm" variant="secondary" onClick={() => loadLogs()}>
              Refresh
            </Button>
          </div>
          <p className="mt-3 text-xs text-zinc-500">
            Total: <strong>{total.toLocaleString()}</strong> · Page {currentPage} of {pageCount}
          </p>
        </Card>

        {errorMessage ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : null}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
            <table className="min-w-full text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">
                    Time
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">
                    Action
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">
                    Summary
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">
                    Payload
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                      No AI actions yet. Run a copilot action from the Dashboard.
                    </td>
                  </tr>
                ) : (
                  items.map((row) => (
                    <tr key={row.id} className="border-b border-zinc-100 hover:bg-zinc-50/70">
                      <td className="whitespace-nowrap px-4 py-3 text-zinc-600">
                        {formatTime(row.created_at)}
                      </td>
                      <td className="px-4 py-3 font-medium text-zinc-800">
                        {formatActionLabel(row.action_key)}
                      </td>
                      <td className="px-4 py-3 text-zinc-700">{row.user_id}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={row.status} />
                      </td>
                      <td className="max-w-xs px-4 py-3 text-zinc-700">{row.summary}</td>
                      <td className="px-4 py-3">
                        <PayloadPreview payload={row.payload} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {total > PAGE_SIZE ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm shadow-sm">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={offset === 0 || isLoading}
              onClick={() => setOffset((o) => Math.max(0, o - PAGE_SIZE))}
            >
              Previous
            </Button>
            <span className="text-zinc-600">
              Showing {offset + 1}–{Math.min(offset + PAGE_SIZE, total)} of {total}
            </span>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={offset + PAGE_SIZE >= total || isLoading}
              onClick={() => setOffset((o) => o + PAGE_SIZE)}
            >
              Next
            </Button>
          </div>
        ) : null}
      </PageShell>
    </>
  );
}
