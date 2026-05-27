"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PageShell from "@/components/layout/PageShell";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Toast from "@/components/ui/Toast";
import Spinner from "@/components/ui/Spinner";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { useRequireAuth } from "@/lib/auth";
import {
  getDuplicateCandidates,
  mergeDuplicateCandidate,
  rejectDuplicateCandidate,
} from "@/lib/api";

function confidenceBadgeClass(value) {
  if (value >= 0.9) return "bg-rose-100 text-rose-700";
  if (value >= 0.8) return "bg-amber-100 text-amber-700";
  return "bg-blue-100 text-blue-700";
}

export default function DuplicatesWorkbenchPage() {
  const { isCheckingAuth } = useRequireAuth();
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isActioningKey, setIsActioningKey] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  async function loadCandidates() {
    try {
      setIsLoading(true);
      setErrorMessage("");
      const data = await getDuplicateCandidates({ minConfidence: 0.7, limit: 80 });
      setRows(Array.isArray(data.items) ? data.items : []);
      setTotal(typeof data.total === "number" ? data.total : 0);
    } catch (error) {
      setErrorMessage(error.message || "Failed to load duplicate candidates.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadCandidates();
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const id = window.setTimeout(() => setToastMessage(""), 2500);
    return () => window.clearTimeout(id);
  }, [toastMessage]);

  async function handleMerge(row, survivorId) {
    const actionKey = `merge-${row.left_id}-${row.right_id}-${survivorId}`;
    try {
      setIsActioningKey(actionKey);
      const result = await mergeDuplicateCandidate({
        left_id: row.left_id,
        right_id: row.right_id,
        survivor_id: survivorId,
      });
      setToastMessage(result.message || "Candidate merged");
      setRows((prev) =>
        prev.filter(
          (item) =>
            !(
              item.left_id === row.left_id &&
              item.right_id === row.right_id
            )
        )
      );
      setTotal((value) => Math.max(0, value - 1));
    } catch (error) {
      setErrorMessage(error.message || "Merge failed.");
    } finally {
      setIsActioningKey("");
    }
  }

  async function handleReject(row) {
    const actionKey = `reject-${row.left_id}-${row.right_id}`;
    try {
      setIsActioningKey(actionKey);
      const result = await rejectDuplicateCandidate({
        left_id: row.left_id,
        right_id: row.right_id,
      });
      setToastMessage(result.message || "Candidate dismissed");
      setRows((prev) =>
        prev.filter(
          (item) =>
            !(
              item.left_id === row.left_id &&
              item.right_id === row.right_id
            )
        )
      );
      setTotal((value) => Math.max(0, value - 1));
    } catch (error) {
      setErrorMessage(error.message || "Dismiss failed.");
    } finally {
      setIsActioningKey("");
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
    <>
      <Toast message={toastMessage} type="success" />
      <PageShell title="Duplicate Workbench">
        <Breadcrumbs items={[{ label: "Home" }, { label: "Duplicates", current: true }]} />
        <section>
          <h2 className="text-lg font-semibold text-zinc-900">Duplicate Detection Workbench</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Review likely duplicate golden records, then merge survivors or dismiss false positives.
          </p>
        </section>

        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-zinc-600">
              {total.toLocaleString()} candidate pair(s) detected.
            </p>
            <Button type="button" variant="secondary" size="sm" onClick={loadCandidates}>
              Refresh
            </Button>
          </div>
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
        ) : rows.length === 0 ? (
          <Card>
            <p className="text-sm text-zinc-600">
              No unresolved duplicates found. You can review published records in{" "}
              <Link href="/master-data" className="font-semibold text-blue-700 hover:underline">
                Master Data
              </Link>
              .
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {rows.map((row) => {
              const pairKey = `${row.left_id}-${row.right_id}`;
              return (
                <Card key={pairKey}>
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-sm font-medium text-zinc-800">
                        Candidate #{row.left_id} ↔ #{row.right_id}
                      </div>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${confidenceBadgeClass(
                          row.confidence
                        )}`}
                      >
                        confidence {(row.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500">{row.reason}</p>
                    <div className="grid gap-2 md:grid-cols-2">
                      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                        <p className="text-xs text-zinc-500">Record #{row.left_id}</p>
                        <p className="mt-1 font-medium text-zinc-800">{row.left_name || "—"}</p>
                        <p className="mt-0.5 font-mono text-xs text-zinc-600">{row.left_email || "—"}</p>
                      </div>
                      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                        <p className="text-xs text-zinc-500">Record #{row.right_id}</p>
                        <p className="mt-1 font-medium text-zinc-800">{row.right_name || "—"}</p>
                        <p className="mt-0.5 font-mono text-xs text-zinc-600">{row.right_email || "—"}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleMerge(row, row.left_id)}
                        disabled={isActioningKey.startsWith(`merge-${row.left_id}-${row.right_id}`)}
                      >
                        Keep #{row.left_id}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => handleMerge(row, row.right_id)}
                        disabled={isActioningKey.startsWith(`merge-${row.left_id}-${row.right_id}`)}
                      >
                        Keep #{row.right_id}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => handleReject(row)}
                        disabled={isActioningKey === `reject-${row.left_id}-${row.right_id}`}
                      >
                        Not duplicate
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </PageShell>
    </>
  );
}
