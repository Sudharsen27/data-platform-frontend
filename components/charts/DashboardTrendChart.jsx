"use client";

import { useMemo, useState } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const SERIES = [
  {
    key: "processed",
    label: "Records processed",
    color: "#2563eb",
    fillId: "trendProcessedFill",
    stroke: "#1d4ed8",
  },
  {
    key: "successful_jobs",
    label: "Successful jobs",
    color: "#059669",
    fillId: "trendSuccessFill",
    stroke: "#047857",
  },
  {
    key: "failed_jobs",
    label: "Failed jobs",
    color: "#e11d48",
    fillId: "trendFailedFill",
    stroke: "#be123c",
  },
];

function formatDateLabel(isoDate) {
  if (!isoDate) {
    return "";
  }
  try {
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(
      new Date(`${isoDate}T12:00:00`)
    );
  } catch {
    return isoDate;
  }
}

function TrendTooltip({ active, payload, label }) {
  if (!active || !payload?.length) {
    return null;
  }

  const point = payload[0]?.payload;
  const dateLabel = point?.date ? formatDateLabel(point.date) : label;

  return (
    <div className="min-w-[200px] rounded-xl border border-zinc-200/80 bg-white/95 p-3 shadow-xl backdrop-blur-md">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
        {dateLabel}
      </p>
      <ul className="mt-2 space-y-1.5">
        {payload.map((entry) => (
          <li key={entry.dataKey} className="flex items-center justify-between gap-4 text-sm">
            <span className="flex items-center gap-2 text-zinc-600">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              {entry.name}
            </span>
            <span className="font-semibold tabular-nums text-zinc-900">{entry.value ?? 0}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StatPill({ label, value, accent }) {
  return (
    <div className="rounded-xl border border-white/60 bg-white/70 px-3 py-2 shadow-sm backdrop-blur-sm">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">{label}</p>
      <p className={`mt-0.5 text-lg font-semibold tabular-nums tracking-tight ${accent}`}>
        {value}
      </p>
    </div>
  );
}

export default function DashboardTrendChart({ data, className = "" }) {
  const chartData = Array.isArray(data) ? data : [];
  const [hidden, setHidden] = useState(() => new Set());

  const totals = useMemo(
    () => ({
      processed: chartData.reduce((sum, point) => sum + Number(point.processed || 0), 0),
      successful: chartData.reduce((sum, point) => sum + Number(point.successful_jobs || 0), 0),
      failed: chartData.reduce((sum, point) => sum + Number(point.failed_jobs || 0), 0),
    }),
    [chartData]
  );

  const hasActivity =
    totals.processed > 0 || totals.successful > 0 || totals.failed > 0;

  const jobTotal = totals.successful + totals.failed;
  const successRate = jobTotal > 0 ? Math.round((totals.successful / jobTotal) * 100) : null;

  function toggleSeries(key) {
    setHidden((current) => {
      const next = new Set(current);
      if (next.has(key)) {
        next.delete(key);
      } else if (next.size < SERIES.length - 1) {
        next.add(key);
      }
      return next;
    });
  }

  return (
    <article
      className={`relative min-w-0 overflow-hidden rounded-[var(--radius-shell)] border border-zinc-200/80 bg-gradient-to-br from-slate-50 via-white to-blue-50/40 shadow-[var(--shadow-card)] ${className}`}
    >
      <div
        className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-blue-400/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-24 -left-12 h-48 w-48 rounded-full bg-teal-400/10 blur-3xl"
        aria-hidden
      />

      <header className="relative border-b border-zinc-200/60 px-5 py-4 sm:px-6 sm:py-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-blue-600/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-blue-700">
                Live analytics
              </span>
              <span className="text-xs text-zinc-500">Last 7 days</span>
            </div>
            <h3 className="mt-2 text-lg font-semibold tracking-tight text-zinc-900 sm:text-xl">
              Governance activity trend
            </h3>
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-zinc-600">
              Sync throughput and job health across your data pipeline — updated from real job
              history.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <StatPill label="Processed" value={totals.processed.toLocaleString()} accent="text-blue-700" />
            <StatPill
              label="Success rate"
              value={successRate !== null ? `${successRate}%` : "—"}
              accent="text-emerald-700"
            />
            <StatPill label="Failed jobs" value={totals.failed.toLocaleString()} accent="text-rose-700" />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {SERIES.map((series) => {
            const isOff = hidden.has(series.key);
            return (
              <button
                key={series.key}
                type="button"
                onClick={() => toggleSeries(series.key)}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                  isOff
                    ? "border-zinc-200 bg-white/50 text-zinc-400"
                    : "border-zinc-200/80 bg-white text-zinc-700 shadow-sm hover:border-blue-200 hover:shadow"
                }`}
              >
                <span
                  className="h-2 w-2 rounded-full transition-opacity"
                  style={{ backgroundColor: series.color, opacity: isOff ? 0.35 : 1 }}
                />
                {series.label}
              </button>
            );
          })}
        </div>
      </header>

      <div className="relative px-2 pb-4 pt-2 sm:px-4 sm:pb-6">
        <div className="h-[min(22rem,42vh)] min-h-[260px] w-full">
          {hasActivity ? (
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <ComposedChart data={chartData} margin={{ top: 12, right: 12, left: 0, bottom: 4 }}>
                <defs>
                  {SERIES.map((series) => (
                    <linearGradient
                      key={series.fillId}
                      id={series.fillId}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor={series.color} stopOpacity={0.28} />
                      <stop offset="95%" stopColor={series.color} stopOpacity={0.02} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid stroke="#e4e4e7" strokeDasharray="4 6" vertical={false} />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#71717a", fontSize: 12, fontWeight: 500 }}
                  dy={8}
                />
                <YAxis
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#a1a1aa", fontSize: 11 }}
                  width={36}
                />
                <Tooltip
                  content={<TrendTooltip />}
                  cursor={{ stroke: "#cbd5e1", strokeWidth: 1, strokeDasharray: "4 4" }}
                />
                {!hidden.has("processed") ? (
                  <Area
                    type="monotone"
                    dataKey="processed"
                    name="Records processed"
                    stroke={SERIES[0].stroke}
                    strokeWidth={2.5}
                    fill={`url(#${SERIES[0].fillId})`}
                    dot={false}
                    activeDot={{ r: 5, strokeWidth: 2, fill: "#fff", stroke: SERIES[0].stroke }}
                    isAnimationActive
                    animationDuration={700}
                  />
                ) : null}
                {!hidden.has("successful_jobs") ? (
                  <Line
                    type="monotone"
                    dataKey="successful_jobs"
                    name="Successful jobs"
                    stroke={SERIES[1].stroke}
                    strokeWidth={2}
                    dot={{ r: 3, strokeWidth: 2, fill: "#fff" }}
                    activeDot={{ r: 5, strokeWidth: 2 }}
                    isAnimationActive
                    animationDuration={700}
                  />
                ) : null}
                {!hidden.has("failed_jobs") ? (
                  <Line
                    type="monotone"
                    dataKey="failed_jobs"
                    name="Failed jobs"
                    stroke={SERIES[2].stroke}
                    strokeWidth={2}
                    strokeDasharray="6 4"
                    dot={{ r: 3, strokeWidth: 2, fill: "#fff" }}
                    activeDot={{ r: 5, strokeWidth: 2 }}
                    isAnimationActive
                    animationDuration={700}
                  />
                ) : null}
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300/80 bg-white/50 px-6 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  aria-hidden
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
                  />
                </svg>
              </div>
              <p className="text-sm font-medium text-zinc-800">No activity in the last 7 days</p>
              <p className="mt-1 max-w-sm text-sm text-zinc-500">
                Run a sync job or pipeline to populate this chart with live governance metrics.
              </p>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
