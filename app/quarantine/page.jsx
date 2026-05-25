"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PageShell from "@/components/layout/PageShell";
import DataTable from "@/components/table/DataTable";
import {
  explainQuarantineError,
  exportQuarantineCsv,
  getQuarantinePage,
  getRules,
  updateQuarantine,
} from "@/lib/api";
import { useRequireAuth } from "@/lib/auth";
import { useAuth } from "@/context/AuthContext";
import { validateRowWithRules } from "@/utils/validation";
import Card from "@/components/ui/Card";
import Toast from "@/components/ui/Toast";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import Drawer, { DrawerFooterActions } from "@/components/ui/Drawer";
import {
  MDM_ERROR_BADGE,
  MDM_INFO_LABEL,
  MDM_INFO_PANEL,
  MDM_PAGE_DESC,
  MDM_PAGE_TITLE,
  MDM_PAGINATION,
  MDM_SEARCH,
  MDM_TOOLBAR,
} from "@/lib/themeClasses";

export default function QuarantinePage() {
  const router = useRouter();
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
  const [explainingId, setExplainingId] = useState(null);
  const [explainDrawer, setExplainDrawer] = useState(null);

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

  async function handleExplain(row) {
    if (!row?.error) {
      return;
    }
    setExplainDrawer({ row, result: null, error: "" });
    try {
      setExplainingId(row.id);
      setErrorMessage("");
      const result = await explainQuarantineError(row);
      setExplainDrawer({ row, result, error: "" });
    } catch (error) {
      setExplainDrawer({
        row,
        result: null,
        error: error.message || "Failed to explain error.",
      });
    } finally {
      setExplainingId(null);
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

  const drawerRow = explainDrawer?.row;

  return (
    <>
      <Toast message={message} type="success" />
      <Toast message={errorMessage} type="error" />
      <Drawer
        open={Boolean(explainDrawer)}
        onClose={() => setExplainDrawer(null)}
        title={drawerRow ? `Record #${drawerRow.id}` : "Quarantine record"}
        subtitle="AI-assisted error explanation"
        width="max-w-lg"
        footer={
          <DrawerFooterActions>
            <Button type="button" variant="secondary" onClick={() => router.push("/rules")}>
              View rules
            </Button>
            <Button type="button" onClick={() => setExplainDrawer(null)}>
              Close
            </Button>
          </DrawerFooterActions>
        }
      >
        {drawerRow ? (
          <div className="space-y-4 text-sm">
            <div className={MDM_INFO_PANEL}>
              <p className={MDM_INFO_LABEL}>Record</p>
              <p className="mt-1 font-medium text-[var(--foreground)]">
                {drawerRow.name} · {drawerRow.email || "no email"}
              </p>
            </div>
            <div>
              <p className={MDM_INFO_LABEL}>Error</p>
              <p className={`mt-1 ${MDM_ERROR_BADGE}`}>{drawerRow.error}</p>
            </div>
            {explainingId === drawerRow.id ? (
              <div className="flex items-center gap-2 text-[var(--text-muted)]">
                <Spinner />
                Generating explanation…
              </div>
            ) : null}
            {explainDrawer?.error ? (
              <p className="text-rose-700">{explainDrawer.error}</p>
            ) : null}
            {explainDrawer?.result ? (
              <div className="space-y-2">
                <p className={MDM_INFO_LABEL}>Explanation</p>
                <p className="leading-relaxed text-[var(--foreground)]">{explainDrawer.result.explanation}</p>
                <p className="text-xs text-[var(--text-muted)]">
                  Source:{" "}
                  <span className="font-medium text-[var(--foreground)]">{explainDrawer.result.source}</span>
                </p>
              </div>
            ) : null}
            {!explainDrawer?.result && !explainingId && !explainDrawer?.error ? (
              <p className="text-[var(--text-muted)]">No explanation yet.</p>
            ) : null}
          </div>
        ) : null}
      </Drawer>
      <PageShell title="Quarantine">
        <Breadcrumbs items={[{ label: "Home" }, { label: "Quarantine", current: true }]} />
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className={MDM_PAGE_TITLE}>Quarantined Records</h2>
            <p className={MDM_PAGE_DESC}>
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
        <div className={MDM_TOOLBAR}>
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by id, name, email, or error"
            className={MDM_SEARCH}
          />
        </div>
        {!isAdmin ? (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Read-only mode for your account.
          </div>
        ) : null}
        {isLoading ? (
          <Card>
            <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
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
              onExplain={handleExplain}
              explainingId={explainingId}
              savingId={savingId}
              readOnly={!isAdmin}
            />
            <div className={MDM_PAGINATION}>
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
