"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import PageShell from "@/components/layout/PageShell";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Toast from "@/components/ui/Toast";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import Spinner from "@/components/ui/Spinner";
import Drawer, { DrawerFooterActions } from "@/components/ui/Drawer";
import { createCatalogAsset, getCatalogAssetLineageImpact, getCatalogAssets } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useRequireAuth } from "@/lib/auth";
import { useAuth } from "@/context/AuthContext";

function piiTierClass(tier) {
  if (tier === "restricted") {
    return "bg-rose-100 text-rose-800";
  }
  if (tier === "confidential") {
    return "bg-amber-100 text-amber-800";
  }
  return "bg-zinc-100 text-zinc-700";
}

function CatalogPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isCheckingAuth } = useRequireAuth();
  const { isAdmin, isReady, isAuthenticated } = useAuth();
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [q, setQ] = useState("");
  const [domain, setDomain] = useState("");
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    asset_key: "",
    name: "",
    asset_type: "table",
    domain: "",
    owner_email: "",
    description: "",
    tags: "",
    pii_tier: "internal",
    lineage_node_key: "",
    schema_fields: "",
    sla_hours: 24,
    contract_version: "1.0",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [assetDrawer, setAssetDrawer] = useState(null);
  const [impactLoading, setImpactLoading] = useState(false);

  useEffect(() => {
    const qq = searchParams.get("q");
    if (qq) {
      setQ(qq);
    }
  }, [searchParams]);

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getCatalogAssets({ q, domain });
      setRows(data);
    } catch (error) {
      setErrorMessage(error.message || "Failed to load catalog.");
    } finally {
      setIsLoading(false);
    }
  }, [q, domain]);

  useEffect(() => {
    if (!isReady || !isAuthenticated) {
      return;
    }
    load();
  }, [isReady, isAuthenticated, load]);

  useEffect(() => {
    if (!message && !errorMessage) {
      return;
    }
    const t = setTimeout(() => {
      setMessage("");
      setErrorMessage("");
    }, 2800);
    return () => clearTimeout(t);
  }, [message, errorMessage]);

  function openAssetDrawer(row) {
    setAssetDrawer({ asset: row, impact: null, impactError: "" });
  }

  async function loadDrawerImpact() {
    if (!assetDrawer?.asset?.id) {
      return;
    }
    try {
      setImpactLoading(true);
      setErrorMessage("");
      const payload = await getCatalogAssetLineageImpact(assetDrawer.asset.id);
      setAssetDrawer((prev) => ({ ...prev, impact: payload, impactError: "" }));
    } catch (error) {
      setAssetDrawer((prev) => ({
        ...prev,
        impact: null,
        impactError: error.message || "Failed to load lineage impact.",
      }));
    } finally {
      setImpactLoading(false);
    }
  }

  async function handleCreate(event) {
    event.preventDefault();
    if (!form.asset_key.trim() || !form.name.trim()) {
      setErrorMessage("Asset key and name are required.");
      return;
    }
    try {
      setIsSaving(true);
      await createCatalogAsset({
        asset_key: form.asset_key.trim(),
        name: form.name.trim(),
        asset_type: form.asset_type.trim() || "table",
        domain: form.domain.trim(),
        owner_email: form.owner_email.trim(),
        description: form.description.trim(),
        tags: form.tags.trim(),
        pii_tier: form.pii_tier.trim() || "internal",
        lineage_node_key: form.lineage_node_key.trim(),
        schema_fields: form.schema_fields.trim(),
        sla_hours: Number(form.sla_hours) || 24,
        contract_version: form.contract_version.trim() || "1.0",
      });
      setMessage("Asset registered.");
      setForm({
        asset_key: "",
        name: "",
        asset_type: "table",
        domain: "",
        owner_email: "",
        description: "",
        tags: "",
        pii_tier: "internal",
        lineage_node_key: "",
        schema_fields: "",
        sla_hours: 24,
        contract_version: "1.0",
      });
      setShowForm(false);
      await load();
    } catch (error) {
      setErrorMessage(error.message || "Failed to create asset.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isCheckingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 text-sm text-zinc-600">
        Checking authentication...
      </div>
    );
  }

  const drawerAsset = assetDrawer?.asset;

  return (
    <>
      <Toast message={message} type="success" />
      <Toast message={errorMessage} type="error" />
      <Drawer
        open={Boolean(assetDrawer)}
        onClose={() => setAssetDrawer(null)}
        title={drawerAsset?.name || "Catalog asset"}
        subtitle={drawerAsset?.asset_key}
        width="max-w-lg"
        footer={
          <DrawerFooterActions>
            {drawerAsset?.lineage_node_key ? (
              <Button
                type="button"
                variant="secondary"
                onClick={() =>
                  router.push(`/lineage?node=${encodeURIComponent(drawerAsset.lineage_node_key)}`)
                }
              >
                Lineage graph
              </Button>
            ) : null}
            {drawerAsset?.lineage_node_key ? (
              <Button type="button" variant="secondary" onClick={loadDrawerImpact} disabled={impactLoading}>
                {impactLoading ? "Loading…" : "Lineage impact"}
              </Button>
            ) : null}
            <Button type="button" onClick={() => setAssetDrawer(null)}>
              Close
            </Button>
          </DrawerFooterActions>
        }
      >
        {drawerAsset ? (
          <div className="space-y-4 text-sm">
            <dl className="grid gap-2">
              <div>
                <dt className="text-xs font-semibold uppercase text-zinc-500">Type / Domain</dt>
                <dd>
                  {drawerAsset.asset_type} · {drawerAsset.domain || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-zinc-500">Owner</dt>
                <dd>{drawerAsset.owner_email || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-zinc-500">Description</dt>
                <dd className="text-zinc-700">{drawerAsset.description || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-zinc-500">Tags</dt>
                <dd>{drawerAsset.tags || "—"}</dd>
              </div>
            </dl>
            <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-blue-800">Data contract</p>
              <p className="mt-2 font-mono text-xs text-zinc-800">
                {drawerAsset.schema_fields || "No schema fields registered"}
              </p>
              <p className="mt-2 text-xs text-zinc-600">
                Version {drawerAsset.contract_version || "1.0"} · SLA {drawerAsset.sla_hours ?? 24}h
              </p>
              <span
                className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs capitalize ${piiTierClass(drawerAsset.pii_tier)}`}
              >
                PII: {drawerAsset.pii_tier}
              </span>
            </div>
            {assetDrawer.impactError ? (
              <p className="text-rose-700">{assetDrawer.impactError}</p>
            ) : null}
            {assetDrawer.impact ? (
              <div className="rounded-lg border border-zinc-200 p-3">
                <p className="text-xs font-bold uppercase text-zinc-500">Lineage impact</p>
                <p className="mt-2 text-zinc-800">{assetDrawer.impact.summary}</p>
                <p className="mt-2 font-mono text-xs text-zinc-600">
                  {(assetDrawer.impact.affected_node_keys || []).join(", ")}
                </p>
              </div>
            ) : null}
          </div>
        ) : null}
      </Drawer>
      <PageShell title="Data Catalog">
            <Breadcrumbs items={[{ label: "Home" }, { label: "Catalog", current: true }]} />
            <Card
              title="Discover data assets"
              subtitle="Search registered datasets and views. Keys align with lineage nodes for governance traceability."
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
                <label className="flex-1 min-w-[200px] text-sm">
                  <span className="text-zinc-500">Search</span>
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Name, key, owner, tags..."
                    className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                  />
                </label>
                <label className="w-full min-w-[140px] text-sm sm:w-48">
                  <span className="text-zinc-500">Domain</span>
                  <input
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    placeholder="e.g. Customer"
                    className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                  />
                </label>
                <Button type="button" onClick={() => load()}>
                  Refresh
                </Button>
                {isAdmin ? (
                  <Button type="button" variant="secondary" onClick={() => setShowForm((s) => !s)}>
                    {showForm ? "Hide form" : "Register asset"}
                  </Button>
                ) : null}
              </div>
            </Card>

            {isAdmin && showForm ? (
              <Card title="Register new asset" subtitle="Admin only">
                <form onSubmit={handleCreate} className="grid gap-3 sm:grid-cols-2">
                  <label className="text-sm sm:col-span-2">
                    <span className="text-zinc-500">Asset key (unique)</span>
                    <input
                      required
                      value={form.asset_key}
                      onChange={(e) => setForm((f) => ({ ...f, asset_key: e.target.value }))}
                      placeholder="domain.entity_name"
                      className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="text-sm sm:col-span-2">
                    <span className="text-zinc-500">Schema fields (data contract)</span>
                    <input
                      value={form.schema_fields}
                      onChange={(e) => setForm((f) => ({ ...f, schema_fields: e.target.value }))}
                      placeholder="customer_id,name,email"
                      className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm font-mono text-xs"
                    />
                  </label>
                  <label className="text-sm">
                    <span className="text-zinc-500">SLA (hours)</span>
                    <input
                      type="number"
                      min={1}
                      value={form.sla_hours}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, sla_hours: Number(e.target.value) || 24 }))
                      }
                      className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="text-sm">
                    <span className="text-zinc-500">Contract version</span>
                    <input
                      value={form.contract_version}
                      onChange={(e) => setForm((f) => ({ ...f, contract_version: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="text-sm sm:col-span-2">
                    <span className="text-zinc-500">Lineage node key (optional)</span>
                    <input
                      value={form.lineage_node_key}
                      onChange={(e) => setForm((f) => ({ ...f, lineage_node_key: e.target.value }))}
                      placeholder="e.g. mdm.customer_master — must match a node key in Lineage"
                      className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm font-mono text-xs"
                    />
                  </label>
                  <label className="text-sm">
                    <span className="text-zinc-500">Name</span>
                    <input
                      required
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="text-sm">
                    <span className="text-zinc-500">Type</span>
                    <select
                      value={form.asset_type}
                      onChange={(e) => setForm((f) => ({ ...f, asset_type: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                    >
                      <option value="table">table</option>
                      <option value="view">view</option>
                      <option value="api">api</option>
                      <option value="file">file</option>
                    </select>
                  </label>
                  <label className="text-sm">
                    <span className="text-zinc-500">Domain</span>
                    <input
                      value={form.domain}
                      onChange={(e) => setForm((f) => ({ ...f, domain: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="text-sm">
                    <span className="text-zinc-500">Owner email</span>
                    <input
                      type="email"
                      value={form.owner_email}
                      onChange={(e) => setForm((f) => ({ ...f, owner_email: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="text-sm sm:col-span-2">
                    <span className="text-zinc-500">Description</span>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                      rows={2}
                      className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="text-sm">
                    <span className="text-zinc-500">Tags (comma-separated)</span>
                    <input
                      value={form.tags}
                      onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="text-sm">
                    <span className="text-zinc-500">PII tier</span>
                    <select
                      value={form.pii_tier}
                      onChange={(e) => setForm((f) => ({ ...f, pii_tier: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                    >
                      <option value="public">public</option>
                      <option value="internal">internal</option>
                      <option value="confidential">confidential</option>
                      <option value="restricted">restricted</option>
                    </select>
                  </label>
                  <div className="sm:col-span-2">
                    <Button type="submit" disabled={isSaving}>
                      {isSaving ? "Saving..." : "Save asset"}
                    </Button>
                  </div>
                </form>
              </Card>
            ) : null}

            <Card title="Assets" subtitle="Click a name to open asset details and data contract">
              {isLoading ? (
                <div className="flex items-center gap-2 text-sm text-zinc-600">
                  <Spinner />
                  Loading catalog...
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
                      <tr>
                        <th className="px-3 py-2">Key</th>
                        <th className="px-3 py-2">Name</th>
                        <th className="px-3 py-2">Type</th>
                        <th className="px-3 py-2">Domain</th>
                        <th className="px-3 py-2">Owner</th>
                        <th className="px-3 py-2">Lineage</th>
                        <th className="px-3 py-2">Contract</th>
                        <th className="px-3 py-2">PII</th>
                        <th className="px-3 py-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => (
                        <tr key={row.id} className="border-b border-zinc-100 hover:bg-zinc-50/80">
                          <td className="px-3 py-2 font-mono text-xs text-zinc-800">{row.asset_key}</td>
                          <td className="px-3 py-2 text-zinc-800">
                            <button
                              type="button"
                              onClick={() => openAssetDrawer(row)}
                              className="font-medium text-blue-700 hover:text-blue-900 hover:underline"
                            >
                              {row.name}
                            </button>
                          </td>
                          <td className="px-3 py-2 text-zinc-600">{row.asset_type}</td>
                          <td className="px-3 py-2 text-zinc-600">{row.domain || "—"}</td>
                          <td className="px-3 py-2 text-zinc-600">{row.owner_email || "—"}</td>
                          <td className="px-3 py-2 text-zinc-600">
                            {row.lineage_node_key ? (
                              <Link
                                href={`/lineage?node=${encodeURIComponent(row.lineage_node_key)}`}
                                className="font-mono text-xs text-blue-700 underline decoration-blue-300 underline-offset-2 hover:text-blue-900"
                              >
                                {row.lineage_node_key}
                              </Link>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="px-3 py-2 text-xs text-zinc-600">
                            {row.schema_fields ? (
                              <span className="font-mono" title={row.schema_fields}>
                                v{row.contract_version || "1.0"} · SLA {row.sla_hours ?? 24}h
                              </span>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs capitalize">
                              {row.pii_tier}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            <button
                              type="button"
                              onClick={() => openAssetDrawer(row)}
                              className="text-xs font-medium text-zinc-600 hover:text-zinc-900"
                            >
                              Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {rows.length === 0 ? (
                    <p className="py-8 text-center text-sm text-zinc-500">No assets match your filters.</p>
                  ) : null}
                </div>
              )}
            </Card>
      </PageShell>
    </>
  );
}

export default function CatalogPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-zinc-50 text-sm text-zinc-600">
          Loading catalog…
        </div>
      }
    >
      <CatalogPageContent />
    </Suspense>
  );
}
