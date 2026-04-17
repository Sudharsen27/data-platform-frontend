"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import DataTable from "@/components/table/DataTable";
import { getQuarantine, getRules, updateQuarantine } from "@/lib/api";
import { useRequireAuth } from "@/lib/auth";
import { validateRowWithRules } from "@/utils/validation";

export default function QuarantinePage() {
  const { isCheckingAuth } = useRequireAuth();
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [rules, setRules] = useState([]);

  useEffect(() => {
    async function fetchQuarantineRows() {
      try {
        setIsLoading(true);
        const [quarantineRows, validationRules] = await Promise.all([
          getQuarantine(),
          getRules(),
        ]);

        setRules(validationRules);
        setRows(
          quarantineRows.map((row) => {
            const result = validateRowWithRules(row, validationRules);
            return { ...row, ...result };
          })
        );
      } catch (error) {
        setErrorMessage(error.message || "Failed to load quarantine records.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchQuarantineRows();
  }, []);

  function handleFieldChange(id, field, value) {
    setRows((currentRows) =>
      currentRows.map((row) => {
        if (row.id !== id) {
          return row;
        }

        const nextRow = { ...row, [field]: value };
        const result = validateRowWithRules(nextRow, rules);
        return { ...nextRow, ...result };
      })
    );
  }

  async function handleSave(id) {
    const selectedRow = rows.find((row) => row.id === id);
    if (!selectedRow) {
      return;
    }

    const payload = {
      id: selectedRow.id,
      name: selectedRow.name,
      email: selectedRow.email,
      error: selectedRow.error,
    };

    try {
      setSavingId(id);
      setErrorMessage("");
      setMessage("");
      await updateQuarantine(payload);
      setMessage(`Record ${id} updated successfully.`);
    } catch (error) {
      setErrorMessage(error.message || "Failed to update record.");
    } finally {
      setSavingId(null);
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
          <Navbar title="Quarantine" />
          <main className="space-y-4 p-6">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900">
                Quarantined Records
              </h2>
              <p className="mt-1 text-sm text-zinc-600">
                Fix invalid records inline and save updates.
              </p>
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
                Loading quarantine records...
              </div>
            ) : (
              <DataTable
                rows={rows}
                onFieldChange={handleFieldChange}
                onSave={handleSave}
                savingId={savingId}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
