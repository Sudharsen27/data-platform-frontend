"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import PageShell from "@/components/layout/PageShell";
import Card from "@/components/ui/Card";
import Toast from "@/components/ui/Toast";
import { getLineageGraph, getLineageImpact } from "@/lib/api";
import { useRequireAuth } from "@/lib/auth";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import {
  MDM_TABLE,
  MDM_TABLE_HEAD,
  MDM_TABLE_ROW,
  MDM_TABLE_TD,
  MDM_TABLE_TH,
  MDM_TABLE_WRAP,
} from "@/lib/themeClasses";

function nodeStyle(layer) {
  if (layer === "source") return "mdm-layer-card mdm-layer--source";
  if (layer === "staging") return "mdm-layer-card mdm-layer--staging";
  if (layer === "golden") return "mdm-layer-card mdm-layer--golden";
  if (layer === "consumption") return "mdm-layer-card mdm-layer--consumption";
  return "mdm-layer-card mdm-layer--default";
}

function criticalityStyle(criticality) {
  if (criticality === "high") {
    return "rounded-full border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-xs font-medium text-rose-700 dark:text-rose-300";
  }
  if (criticality === "medium") {
    return "rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-800 dark:text-amber-300";
  }
  return "rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-300";
}

function LineagePageContent() {
  const searchParams = useSearchParams();
  const { isCheckingAuth } = useRequireAuth();
  const { isReady, isAuthenticated } = useAuth();
  const { isDark } = useTheme();
  const nodeFillActive = isDark ? "#312e81" : "#e0e7ff";
  const nodeFillIdle = isDark ? "#27272a" : "#fafafa";
  const nodeStrokeActive = isDark ? "#818cf8" : "#4f46e5";
  const nodeStrokeIdle = isDark ? "#52525b" : "#d4d4d8";
  const edgeStrokeActive = isDark ? "#818cf8" : "#4f46e5";
  const edgeStrokeIdle = isDark ? "#52525b" : "#d4d4d8";
  const textPrimary = isDark ? "#fafafa" : "#18181b";
  const textSecondary = isDark ? "#a1a1aa" : "#52525b";
  const [isLoading, setIsLoading] = useState(true);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedNodeKey, setSelectedNodeKey] = useState("");
  const [impactField, setImpactField] = useState("email");
  const [impactResult, setImpactResult] = useState(null);
  const [impactLoading, setImpactLoading] = useState(false);

  useEffect(() => {
    if (!isReady || !isAuthenticated) {
      return;
    }

    async function loadGraph() {
      try {
        setIsLoading(true);
        const payload = await getLineageGraph();
        setNodes(payload.nodes || []);
        setEdges(payload.edges || []);
      } catch (error) {
        setErrorMessage(error.message || "Failed to load lineage graph.");
      } finally {
        setIsLoading(false);
      }
    }

    loadGraph();
  }, [isReady, isAuthenticated]);

  useEffect(() => {
    const key = searchParams.get("node");
    if (!key || nodes.length === 0) {
      return;
    }
    const exists = nodes.some((n) => n.key === key);
    if (exists) {
      setSelectedNodeKey(key);
    }
  }, [searchParams, nodes]);

  const groupedNodes = useMemo(() => {
    const groups = {
      source: [],
      staging: [],
      golden: [],
      consumption: [],
      other: [],
    };
    for (const node of nodes) {
      if (!groups[node.layer]) {
        groups.other.push(node);
      } else {
        groups[node.layer].push(node);
      }
    }
    return groups;
  }, [nodes]);

  const graphView = useMemo(() => {
    const layers = ["source", "staging", "golden", "consumption", "other"];
    const byLayer = new Map(layers.map((layer) => [layer, []]));
    nodes.forEach((node) => {
      const layer = byLayer.has(node.layer) ? node.layer : "other";
      byLayer.get(layer).push(node);
    });

    const layerX = {
      source: 90,
      staging: 290,
      golden: 490,
      consumption: 690,
      other: 690,
    };

    const positioned = [];
    layers.forEach((layer) => {
      const items = byLayer.get(layer);
      items.forEach((node, idx) => {
        positioned.push({
          ...node,
          x: layerX[layer],
          y: 70 + idx * 95,
        });
      });
    });
    const map = Object.fromEntries(positioned.map((n) => [n.key, n]));
    return { positioned, map };
  }, [nodes]);

  const connectedKeys = useMemo(() => {
    const focusKey = impactResult?.affected_node_keys?.length
      ? impactResult.anchor_node_key || selectedNodeKey
      : selectedNodeKey;
    const highlightKeys = impactResult?.affected_node_keys?.length
      ? new Set(impactResult.affected_node_keys)
      : null;
    if (highlightKeys) {
      return highlightKeys;
    }
    if (!focusKey) {
      return new Set();
    }
    const connected = new Set([focusKey]);
    edges.forEach((edge) => {
      if (edge.source_key === focusKey || edge.target_key === focusKey) {
        connected.add(edge.source_key);
        connected.add(edge.target_key);
      }
    });
    return connected;
  }, [edges, selectedNodeKey, impactResult]);

  async function runImpactAnalysis({ nodeKey = "", field = "" } = {}) {
    try {
      setImpactLoading(true);
      setErrorMessage("");
      const payload = await getLineageImpact({ nodeKey, field });
      setImpactResult(payload);
      if (payload.anchor_node_key) {
        setSelectedNodeKey(payload.anchor_node_key);
      }
    } catch (error) {
      setImpactResult(null);
      setErrorMessage(error.message || "Impact analysis failed.");
    } finally {
      setImpactLoading(false);
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
      <Toast message={errorMessage} type="error" />
      <PageShell title="Data Lineage">
            <Card
              title="Lineage Overview"
              subtitle="Track source-to-golden-to-consumption lineage with transformation metadata."
            >
              {isLoading ? (
                <div className="h-28 animate-pulse rounded-lg bg-zinc-100" />
              ) : (
                <div className="grid gap-4 md:grid-cols-4">
                  {[
                    ["source", "Source"],
                    ["staging", "Staging"],
                    ["golden", "Golden"],
                    ["consumption", "Consumption"],
                  ].map(([key, label]) => (
                    <div key={key} className="rounded-lg border border-zinc-200 bg-white p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                        {label}
                      </p>
                      <p className="mt-1 text-2xl font-bold text-zinc-900">{groupedNodes[key].length}</p>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card
              title="Impact analysis"
              subtitle="Simulate a schema or field change and see downstream nodes and catalog assets."
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
                <label className="min-w-[200px] flex-1 text-sm">
                  <span className="text-zinc-500">Field name</span>
                  <input
                    value={impactField}
                    onChange={(e) => setImpactField(e.target.value)}
                    placeholder="e.g. email"
                    className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                  />
                </label>
                <button
                  type="button"
                  disabled={impactLoading}
                  onClick={() => runImpactAnalysis({ field: impactField })}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {impactLoading ? "Analyzing…" : "Analyze field impact"}
                </button>
                <button
                  type="button"
                  disabled={impactLoading || !selectedNodeKey}
                  onClick={() => runImpactAnalysis({ nodeKey: selectedNodeKey })}
                  className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50 disabled:opacity-60"
                >
                  Analyze selected node
                </button>
                {impactResult ? (
                  <button
                    type="button"
                    onClick={() => setImpactResult(null)}
                    className="rounded-lg px-4 py-2 text-sm text-zinc-600 hover:text-zinc-900"
                  >
                    Clear
                  </button>
                ) : null}
              </div>
              {impactResult ? (
                <div className="mdm-info-panel mt-4 text-sm">
                  <p className="font-medium text-[var(--foreground)]">{impactResult.summary}</p>
                  <p className="mt-2 text-xs text-[var(--text-muted)]">
                    Affected nodes:{" "}
                    <span className="font-mono">
                      {(impactResult.affected_node_keys || []).join(", ") || "none"}
                    </span>
                  </p>
                  {(impactResult.catalog_assets || []).length > 0 ? (
                    <ul className="mt-2 list-inside list-disc text-xs text-zinc-700">
                      {impactResult.catalog_assets.map((asset) => (
                        <li key={asset.id}>
                          <Link
                            href={`/lineage?node=${encodeURIComponent(asset.lineage_node_key)}`}
                            className="text-blue-700 underline"
                          >
                            {asset.name}
                          </Link>{" "}
                          ({asset.asset_key})
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ) : null}
            </Card>

            <Card title="Layer legend" subtitle="Node colors match the graph and list below.">
              <div className="flex flex-wrap gap-3 text-xs">
                {[
                  ["source", "Source systems"],
                  ["staging", "Staging / cleansing"],
                  ["golden", "Golden / MDM"],
                  ["consumption", "Analytics & consumption"],
                ].map(([layer, label]) => (
                  <span
                    key={layer}
                    className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 font-medium ${nodeStyle(layer)}`}
                  >
                    <span className="h-2 w-2 rounded-full bg-current opacity-70" />
                    {label}
                  </span>
                ))}
              </div>
            </Card>

            <Card title="Lineage Nodes" subtitle="Datasets and systems participating in the flow.">
              <div className="mdm-lineage-canvas mb-4">
                <svg
                  viewBox="0 0 780 380"
                  className="mx-auto h-[240px] w-full min-w-[640px] max-w-full sm:h-[280px] sm:min-w-[720px]"
                  preserveAspectRatio="xMidYMid meet"
                >
                  {edges.map((edge) => {
                    const from = graphView.map[edge.source_key];
                    const to = graphView.map[edge.target_key];
                    if (!from || !to) {
                      return null;
                    }
                    const active =
                      !selectedNodeKey ||
                      edge.source_key === selectedNodeKey ||
                      edge.target_key === selectedNodeKey;
                    return (
                      <line
                        key={edge.id}
                        x1={from.x + 80}
                        y1={from.y + 20}
                        x2={to.x}
                        y2={to.y + 20}
                        stroke={active ? edgeStrokeActive : edgeStrokeIdle}
                        strokeWidth={active ? 2.5 : 1.5}
                        markerEnd="url(#arrow)"
                        opacity={active ? 1 : 0.45}
                      />
                    );
                  })}
                  <defs>
                    <marker
                      id="arrow"
                      viewBox="0 0 10 10"
                      refX="9"
                      refY="5"
                      markerWidth="5"
                      markerHeight="5"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 0 L 10 5 L 0 10 z" fill={edgeStrokeActive} />
                    </marker>
                  </defs>
                  {graphView.positioned.map((node) => {
                    const active =
                      !selectedNodeKey || connectedKeys.has(node.key) || node.key === selectedNodeKey;
                    return (
                      <g
                        key={node.key}
                        onClick={() =>
                          setSelectedNodeKey((current) => (current === node.key ? "" : node.key))
                        }
                        className="cursor-pointer"
                      >
                        <rect
                          x={node.x}
                          y={node.y}
                          width="160"
                          height="42"
                          rx="10"
                          fill={active ? nodeFillActive : nodeFillIdle}
                          stroke={active ? nodeStrokeActive : nodeStrokeIdle}
                        />
                        <text x={node.x + 10} y={node.y + 18} fontSize="11" fill={textPrimary}>
                          {node.label}
                        </text>
                        <text x={node.x + 10} y={node.y + 31} fontSize="9" fill={textSecondary}>
                          {node.system}
                        </text>
                      </g>
                    );
                  })}
                </svg>
                <p className="mt-2 text-xs text-[var(--text-muted)]">
                  Click a node to highlight upstream/downstream impact. Open{" "}
                  <code className="mdm-code-inline">/lineage?node=your.node_key</code> to deep-link
                  from the catalog.
                </p>
              </div>
              {isLoading ? (
                <div className="h-44 animate-pulse rounded-lg bg-zinc-100" />
              ) : (
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {nodes.map((node) => (
                    <article key={node.key} className={nodeStyle(node.layer)}>
                      <p className="text-sm font-semibold">{node.label}</p>
                      <p className="mt-1 text-xs text-[var(--text-muted)]">
                        {node.system} · {node.layer}
                      </p>
                      <p className="mdm-code-inline mt-2 inline-block">{node.key}</p>
                      <p className="mt-2">
                        <Link
                          href={`/catalog?q=${encodeURIComponent(node.key)}`}
                          className="text-xs font-semibold text-[var(--color-primary)] hover:underline"
                        >
                          Search in catalog →
                        </Link>
                      </p>
                    </article>
                  ))}
                </div>
              )}
            </Card>

            <Card title="Lineage Edges" subtitle="Transformation and dependency links between datasets.">
              {isLoading ? (
                <div className="h-44 animate-pulse rounded-lg bg-zinc-100" />
              ) : (
                <div className={MDM_TABLE_WRAP}>
                  <table className={MDM_TABLE}>
                    <thead className={MDM_TABLE_HEAD}>
                      <tr>
                        <th className={MDM_TABLE_TH}>From</th>
                        <th className={MDM_TABLE_TH}>To</th>
                        <th className={MDM_TABLE_TH}>Transformation</th>
                        <th className={MDM_TABLE_TH}>Criticality</th>
                      </tr>
                    </thead>
                    <tbody>
                      {edges.map((edge) => (
                        <tr key={edge.id} className={MDM_TABLE_ROW}>
                          <td className={MDM_TABLE_TD}>{edge.source_key}</td>
                          <td className={MDM_TABLE_TD}>{edge.target_key}</td>
                          <td className={MDM_TABLE_TD}>{edge.transformation || "—"}</td>
                          <td className={MDM_TABLE_TD}>
                            <span
                              className={`rounded-full border px-2 py-0.5 text-xs font-medium ${criticalityStyle(edge.criticality)}`}
                            >
                              {edge.criticality}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
      </PageShell>
    </>
  );
}

export default function LineagePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-zinc-50 text-sm text-zinc-600">
          Loading lineage…
        </div>
      }
    >
      <LineagePageContent />
    </Suspense>
  );
}
