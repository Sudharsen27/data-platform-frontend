"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import { getAuditLogs } from "@/lib/api";
import { useRequireAuth } from "@/lib/auth";

function formatDate(value) {
  if (!value) {
    return "-";
  }
  return new Date(value).toLocaleString();
}

export default function AuditPage() {
  const { isCheckingAuth } = useRequireAuth();
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadLogs() {
      try {
        setIsLoading(true);
        const data = await getAuditLogs();
        setLogs(data);
      } catch (error) {
        setErrorMessage(error.message || "Failed to load audit logs.");
      } finally {
        setIsLoading(false);
      }
    }

    loadLogs();
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
          <Navbar title="Audit Logs" />
          <main className="space-y-4 p-6">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900">Change History</h2>
              <p className="mt-1 text-sm text-zinc-600">
                Track who changed quarantine data and when.
              </p>
            </div>

            {errorMessage ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorMessage}
              </div>
            ) : null}

            {isLoading ? (
              <div className="rounded-xl border border-zinc-200 bg-white p-5 text-sm text-zinc-500 shadow-sm">
                Loading audit logs...
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
                <table className="min-w-full divide-y divide-zinc-200 text-sm">
                  <thead className="bg-zinc-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-zinc-600">User</th>
                      <th className="px-4 py-3 text-left font-semibold text-zinc-600">Field</th>
                      <th className="px-4 py-3 text-left font-semibold text-zinc-600">Old Value</th>
                      <th className="px-4 py-3 text-left font-semibold text-zinc-600">New Value</th>
                      <th className="px-4 py-3 text-left font-semibold text-zinc-600">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {logs.map((log) => (
                      <tr key={log.id}>
                        <td className="px-4 py-3 font-medium text-zinc-800">{log.user_id}</td>
                        <td className="px-4 py-3 text-zinc-700">{log.field_changed}</td>
                        <td className="px-4 py-3 text-zinc-700">{log.old_value || "-"}</td>
                        <td className="px-4 py-3 text-zinc-700">{log.new_value || "-"}</td>
                        <td className="px-4 py-3 text-zinc-700">{formatDate(log.timestamp)}</td>
                      </tr>
                    ))}
                    {logs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-6 text-center text-zinc-500">
                          No audit logs found yet.
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
