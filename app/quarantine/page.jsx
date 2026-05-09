"use client";

import { useEffect, useState } from "react";
import PageShell from "@/components/layout/PageShell";
import DataTable from "@/components/table/DataTable";
import { exportQuarantineCsv, getQuarantinePage, getRules, updateQuarantine } from "@/lib/api";
import { useRequireAuth } from "@/lib/auth";
import { useAuth } from "@/context/AuthContext";
import { validateRowWithRules } from "@/utils/validation";
import Card from "@/components/ui/Card";
import Toast from "@/components/ui/Toast";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import Breadcrumbs from "@/components/ui/Breadcrumbs";

export default function QuarantinePage() {
  const { isCheckingAuth } = useRequireAuth();
  const { isAdmin } = useAuth();
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [rules, setRules] = useState([]);
  const [offset, setOffset] = useState(0);
  const [limit] = useState(50);
  const [totalRows, setTotalRows] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

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

  async function handleExportCsv() {
    try {
      setIsExporting(true);
      setErrorMessage("");
      await exportQuarantineCsv();
    } catch (error) {
      setErrorMessage(error.message || "Failed to export quarantine CSV.");
    } finally {
      setIsExporting(false);
    }
  }

  if (isCheckingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 text-sm text-zinc-600">
        Checking authentication...
      </div>
    );
  }

  const filteredRows = rows.filter((row) => {
    const needle = searchTerm.trim().toLowerCase();
    if (!needle) {
      return true;
    }
    return (
      String(row.id).includes(needle) ||
      String(row.name || "").toLowerCase().includes(needle) ||
      String(row.email || "").toLowerCase().includes(needle) ||
      String(row.error || "").toLowerCase().includes(needle)
    );
  });

  return (
    <>
      <Toast message={message} type="success" />
      <Toast message={errorMessage} type="error" />
      <PageShell title="Quarantine">
            <Breadcrumbs items={[{ label: "Home" }, { label: "Quarantine", current: true }]} />
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-zinc-900">
                  Quarantined Records
                </h2>
                <p className="mt-1 text-sm text-zinc-600">
                  {isAdmin
                    ? "Fix invalid records inline and save updates."
                    : "View quarantined records. Only admins can edit and save changes."}
                </p>
              </div>
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
            <div className="rounded-xl border border-zinc-200 bg-white p-3 shadow-sm">
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by id, name, email, or error"
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            {!isAdmin ? (
              <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                Read-only mode for your account.
              </div>
            ) : null}
            {isLoading ? (
              <Card>
                <div className="flex items-center gap-2 text-sm text-zinc-600">
                  <Spinner />
                  Loading quarantine records...
                </div>
              </Card>
            ) : (
              <div className="space-y-4">
                <DataTable
                  rows={filteredRows}
                  onFieldChange={handleFieldChange}
                  onSave={handleSave}
                  savingId={savingId}
                  readOnly={!isAdmin}
                />
                <div className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-600">
                  <span>
                    Showing {filteredRows.length === 0 ? 0 : offset + 1}-
                    {Math.min(offset + filteredRows.length, totalRows)} of {totalRows}
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
      </PageShell>
    </>
  );
}
