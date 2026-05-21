"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import PageShell from "@/components/layout/PageShell";
import { getMasterDataCompare, getMasterDataPage } from "@/lib/api";
import { useRequireAuth } from "@/lib/auth";
import { useAuth } from "@/context/AuthContext";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Toast from "@/components/ui/Toast";
import Spinner from "@/components/ui/Spinner";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import Drawer, { DrawerFooterActions } from "@/components/ui/Drawer";
import CompareThreeColumn from "@/components/governance/CompareThreeColumn";

const PAGE_SIZE = 50;

function formatTime(value) {
  if (!value) {
    return "—";
  }
  return new Date(value).toLocaleString();
}

function MasterDataPageContent() {
  const searchParams = useSearchParams();
  const { isCheckingAuth } = useRequireAuth();
  const { isReady, isAuthenticated } = useAuth();
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [compareData, setCompareData] = useState(null);
  const [compareLoadingId, setCompareLoadingId] = useState(null);
  const [toastMessage, setToastMessage] = useState("");

  const handleCompare = useCallback(async (sourceQueueId) => {
    try {
      setCompareLoadingId(sourceQueueId);
      setErrorMessage("");
      const data = await getMasterDataCompare(sourceQueueId);
      setCompareData(data);
    } catch (error) {
      setErrorMessage(error.message || "Failed to load comparison.");
    } finally {
      setCompareLoadingId(null);
    }
  }, []);

  const loadPage = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");
      const data = await getMasterDataPage({
        offset,
        limit: PAGE_SIZE,
        q: searchQuery,
      });
      setRows(data.items || []);
      setTotal(typeof data.total === "number" ? data.total : 0);
    } catch (error) {
      setErrorMessage(error.message || "Failed to load master data.");
    } finally {
      setIsLoading(false);
    }
  }, [offset, searchQuery]);

  useEffect(() => {
    if (!isReady || !isAuthenticated) {
      return;
    }
    loadPage();
  }, [loadPage, isReady, isAuthenticated]);

  useEffect(() => {
    const compareId = searchParams.get("compare");
    if (!compareId || !isReady || !isAuthenticated) {
      return;
    }
    const id = parseInt(compareId, 10);
    if (Number.isFinite(id)) {
      handleCompare(id);
    }
  }, [searchParams, isReady, isAuthenticated, handleCompare]);

  useEffect(() => {
    if (!toastMessage) {
      return;
    }
    const timer = setTimeout(() => setToastMessage(""), 2500);
    return () => clearTimeout(timer);
  }, [toastMessage]);

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
      <Drawer
        open={Boolean(compareData)}
        onClose={() => setCompareData(null)}
        title={
          compareData?.source_queue_id
            ? `Compare source #${compareData.source_queue_id}`
            : "Golden record compare"
        }
        subtitle="Quarantine → stewardship → published master"
        width="max-w-2xl"
        footer={
          <DrawerFooterActions>
            <Button type="button" variant="secondary" size="sm" onClick={() => setCompareData(null)}>
              Close
            </Button>
          </DrawerFooterActions>
        }
      >
        {compareLoadingId ? (
          <div className="flex items-center gap-2 text-sm text-zinc-600">
            <Spinner />
            Loading…
          </div>
        ) : null}
        {compareData ? <CompareThreeColumn data={compareData} /> : null}
      </Drawer>
      <PageShell title="Master Data">
        <Breadcrumbs items={[{ label: "Home" }, { label: "Master Data", current: true }]} />

        <section>
          <h2 className="text-lg font-semibold text-zinc-900">Golden records</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Authoritative customer records published from stewardship approval. Duplicate emails
            merge via survivorship instead of creating a second golden row.
          </p>
        </section>

        <Card>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="flex min-w-[240px] flex-1 flex-col gap-1 text-sm text-zinc-700">
              Search name or email
              <input
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (setSearchQuery(searchInput.trim()), setOffset(0))}
                placeholder="e.g. user7@mail.com"
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </label>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setSearchQuery(searchInput.trim());
                setOffset(0);
              }}
            >
              Search
            </Button>
            <Button type="button" size="sm" variant="secondary" onClick={() => loadPage()}>
              Refresh
            </Button>
          </div>
          <p className="mt-3 text-xs text-zinc-500">
            {total.toLocaleString()} golden record(s) · Page {currentPage} of {pageCount}
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
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-zinc-600">
                    ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-zinc-600">
                    Source #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-zinc-600">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-zinc-600">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-zinc-600">
                    Published
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-zinc-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                      No golden records yet. Approve items in{" "}
                      <Link href="/stewardship" className="font-semibold text-blue-700 hover:underline">
                        Stewardship
                      </Link>
                      .
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row.id} className="border-b border-zinc-100 hover:bg-zinc-50/70">
                      <td className="px-4 py-3 font-medium text-zinc-800">#{row.id}</td>
                      <td className="px-4 py-3 text-zinc-600">#{row.source_queue_id}</td>
                      <td className="px-4 py-3 text-zinc-800">{row.name}</td>
                      <td className="px-4 py-3 font-mono text-xs text-zinc-700">{row.email || "—"}</td>
                      <td className="px-4 py-3 text-zinc-600">{formatTime(row.created_at)}</td>
                      <td className="px-4 py-3">
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          disabled={compareLoadingId === row.source_queue_id}
                          onClick={() => handleCompare(row.source_queue_id)}
                        >
                          {compareLoadingId === row.source_queue_id ? "Loading…" : "Compare"}
                        </Button>
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
              {offset + 1}–{Math.min(offset + PAGE_SIZE, total)} of {total}
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

export default function MasterDataPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-zinc-50 text-sm text-zinc-600">
          Loading master data…
        </div>
      }
    >
      <MasterDataPageContent />
    </Suspense>
  );
}
