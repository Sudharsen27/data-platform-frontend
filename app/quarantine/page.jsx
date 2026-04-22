"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import DataTable from "@/components/table/DataTable";
import { getQuarantinePage, getRules, updateQuarantine } from "@/lib/api";
import { useRequireAuth } from "@/lib/auth";
import { validateRowWithRules } from "@/utils/validation";
import Card from "@/components/ui/Card";
import Toast from "@/components/ui/Toast";
import Button from "@/components/ui/Button";

export default function QuarantinePage() {
  const { isCheckingAuth } = useRequireAuth();
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [rules, setRules] = useState([]);
  const [offset, setOffset] = useState(0);
  const [limit] = useState(50);
  const [totalRows, setTotalRows] = useState(0);

  useEffect(() => {
    async function fetchQuarantineRows() {
      try {
        setIsLoading(true);
        const [pageData, validationRules] = await Promise.all([
          getQuarantinePage({ offset, limit }),
          getRules(),
        ]);

        setRules(validationRules);
        setTotalRows(pageData.total || 0);
        setRows(
          pageData.items.map((row) => {
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
  }, [offset, limit]);

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
      setRows((currentRows) =>
        currentRows.map((row) => {
          if (row.id !== id) {
            return row;
          }
          const result = validateRowWithRules(payload, rules);
          return { ...row, ...payload, ...result };
        })
      );
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
      <Toast message={message} type="success" />
      <Toast message={errorMessage} type="error" />
      <div className="flex min-h-screen flex-col md:flex-row">
        <Sidebar />
        <div className="flex-1">
          <Navbar title="Quarantine" />
          <main className="space-y-6 p-6">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900">
                Quarantined Records
              </h2>
              <p className="mt-1 text-sm text-zinc-600">
                Fix invalid records inline and save updates.
              </p>
            </div>
            {isLoading ? (
              <Card>
                <div className="h-6 w-52 animate-pulse rounded bg-zinc-200" />
                <div className="mt-3 h-24 animate-pulse rounded bg-zinc-100" />
              </Card>
            ) : (
              <div className="space-y-4">
                <DataTable
                  rows={rows}
                  onFieldChange={handleFieldChange}
                  onSave={handleSave}
                  savingId={savingId}
                />
                <div className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-600">
                  <span>
                    Showing {rows.length === 0 ? 0 : offset + 1}-
                    {Math.min(offset + rows.length, totalRows)} of {totalRows}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={offset === 0 || isLoading}
                      onClick={() => setOffset((current) => Math.max(0, current - limit))}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={offset + limit >= totalRows || isLoading}
                      onClick={() => setOffset((current) => current + limit)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
