"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import PageShell from "@/components/layout/PageShell";
import Card from "@/components/ui/Card";
import Toast from "@/components/ui/Toast";
import { getLineageGraph } from "@/lib/api";
import { useRequireAuth } from "@/lib/auth";
import { useAuth } from "@/context/AuthContext";

function nodeStyle(layer) {
  if (layer === "source") {
    return "bg-indigo-50 border-indigo-200 text-indigo-800";
  }
  if (layer === "staging") {
    return "bg-amber-50 border-amber-200 text-amber-800";
  }
  if (layer === "golden") {
    return "bg-emerald-50 border-emerald-200 text-emerald-800";
  }
  if (layer === "consumption") {
    return "bg-cyan-50 border-cyan-200 text-cyan-800";
  }
  return "bg-zinc-50 border-zinc-200 text-zinc-700";
}

function criticalityStyle(criticality) {
  if (criticality === "high") {
    return "text-red-700 bg-red-50 border-red-200";
  }
  if (criticality === "medium") {
    return "text-amber-700 bg-amber-50 border-amber-200";
  }
  return "text-emerald-700 bg-emerald-50 border-emerald-200";
}

function LineagePageContent() {
  const searchParams = useSearchParams();
  const { isCheckingAuth } = useRequireAuth();
  const { isReady, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedNodeKey, setSelectedNodeKey] = useState("");

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
    if (!selectedNodeKey) {
      return new Set();
    }
    const connected = new Set([selectedNodeKey]);
    edges.forEach((edge) => {
      if (edge.source_key === selectedNodeKey || edge.target_key === selectedNodeKey) {
        connected.add(edge.source_key);
        connected.add(edge.target_key);
      }
    });
    return connected;
  }, [edges, selectedNodeKey]);

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
              <div className="mb-4 overflow-x-auto rounded-xl border border-zinc-200 bg-gradient-to-b from-zinc-50/50 to-white p-2 shadow-inner">
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
                        stroke={active ? "#2563eb" : "#cbd5e1"}
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
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="#2563eb" />
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
                          fill={active ? "#dbeafe" : "#f8fafc"}
                          stroke={active ? "#1d4ed8" : "#cbd5e1"}
                        />
                        <text x={node.x + 10} y={node.y + 18} fontSize="11" fill="#0f172a">
                          {node.label}
                        </text>
                        <text x={node.x + 10} y={node.y + 31} fontSize="9" fill="#475569">
                          {node.system}
                        </text>
                      </g>
                    );
                  })}
                </svg>
                <p className="mt-2 text-xs text-zinc-500">
                  Click a node to highlight upstream/downstream impact. Open{" "}
                  <code className="rounded bg-zinc-100 px-1">/lineage?node=your.node_key</code> to
                  deep-link from the catalog.
                </p>
              </div>
              {isLoading ? (
                <div className="h-44 animate-pulse rounded-lg bg-zinc-100" />
              ) : (
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {nodes.map((node) => (
                    <article
                      key={node.key}
                      className={`rounded-lg border p-3 ${nodeStyle(node.layer)}`}
                    >
                      <p className="text-sm font-semibold">{node.label}</p>
                      <p className="mt-1 text-xs opacity-80">
                        {node.system} - {node.layer}
                      </p>
                      <p className="mt-2 rounded border border-current/20 px-2 py-1 text-xs inline-block">
                        {node.key}
                      </p>
                      <p className="mt-2">
                        <Link
                          href={`/catalog?q=${encodeURIComponent(node.key)}`}
                          className="text-xs font-medium text-blue-700 underline decoration-blue-200 underline-offset-2 hover:text-blue-900"
                        >
                          Search in catalog
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
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
                      <tr>
                        <th className="px-3 py-2">From</th>
                        <th className="px-3 py-2">To</th>
                        <th className="px-3 py-2">Transformation</th>
                        <th className="px-3 py-2">Criticality</th>
                      </tr>
                    </thead>
                    <tbody>
                      {edges.map((edge) => (
                        <tr key={edge.id} className="border-b border-zinc-100">
                          <td className="px-3 py-2 text-zinc-700">{edge.source_key}</td>
                          <td className="px-3 py-2 text-zinc-700">{edge.target_key}</td>
                          <td className="px-3 py-2 text-zinc-700">{edge.transformation || "-"}</td>
                          <td className="px-3 py-2">
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
