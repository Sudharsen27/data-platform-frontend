"use client";

import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Toast from "@/components/ui/Toast";
import { approveStewardship, getStewardship, rejectStewardship } from "@/lib/api";
import { useRequireAuth } from "@/lib/auth";

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
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeId, setActiveId] = useState(null);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function loadRows() {
    try {
      setIsLoading(true);
      const data = await getStewardship();
      setRows(data);
    } catch (error) {
      setErrorMessage(error.message || "Failed to load stewardship queue.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadRows();
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

  async function handleApprove(id) {
    try {
      setActiveId(id);
      await approveStewardship(id);
      setRows((currentRows) =>
        currentRows.map((row) => (row.id === id ? { ...row, status: "approved" } : row))
      );
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
      setRows((currentRows) =>
        currentRows.map((row) => (row.id === id ? { ...row, status: "rejected" } : row))
      );
      setMessage(`Record ${id} rejected.`);
    } catch (error) {
      setErrorMessage(error.message || "Failed to reject record.");
    } finally {
      setActiveId(null);
    }
  }

  const pendingCount = useMemo(
    () => rows.filter((item) => item.status === "pending").length,
    [rows]
  );

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
          <Navbar title="Stewardship Queue" />
          <main className="space-y-6 p-6">
            <section>
              <h2 className="text-lg font-semibold text-zinc-900">Human-in-the-loop Queue</h2>
              <p className="mt-1 text-sm text-zinc-600">
                Review moderate-confidence records and decide whether to approve or reject.
              </p>
            </section>

            <Card>
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-600">Total records in queue: {rows.length}</span>
                <span className="rounded-full bg-amber-50 px-2 py-1 font-semibold text-amber-700">
                  Pending: {pendingCount}
                </span>
              </div>
            </Card>

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
                        <td colSpan={6} className="px-4 py-6 text-center text-zinc-500">
                          No stewardship records available.
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
