"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import { getAuditLogs } from "@/lib/api";
import { useRequireAuth } from "@/lib/auth";
import Card from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";

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
          <main className="space-y-6 p-6">
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
              <Card>
                <div className="h-6 w-52 animate-pulse rounded bg-zinc-200" />
                <div className="mt-3 h-24 animate-pulse rounded bg-zinc-100" />
              </Card>
            ) : (
              <Table
                columns={["User", "Field", "Old Value", "New Value", "Timestamp"]}
                data={logs}
                emptyMessage="No audit logs found yet."
                renderRow={(log) => (
                  <>
                    <td className="px-4 py-3 font-medium text-zinc-800">{log.user_id}</td>
                    <td className="px-4 py-3 text-zinc-700">{log.field_changed}</td>
                    <td className="px-4 py-3 text-zinc-700">{log.old_value || "-"}</td>
                    <td className="px-4 py-3 text-zinc-700">{log.new_value || "-"}</td>
                    <td className="px-4 py-3 text-zinc-700">{formatDate(log.timestamp)}</td>
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
