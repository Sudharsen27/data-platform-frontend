"use client";

import { useMemo, useState } from "react";
import { useTheme } from "@/context/ThemeContext";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import ChartResponsiveContainer from "@/components/charts/ChartResponsiveContainer";

const SERIES = [
  {
    key: "processed",
    label: "Records processed",
    color: "#6366f1",
    fillId: "trendProcessedFill",
    stroke: "#4f46e5",
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
    <div className="min-w-[200px] rounded-xl border border-[var(--chart-tooltip-border)] bg-[var(--chart-tooltip-bg)] p-3 shadow-xl">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
        {dateLabel}
      </p>
      <ul className="mt-2 space-y-1.5">
        {payload.map((entry) => (
          <li key={entry.dataKey} className="flex items-center justify-between gap-4 text-sm">
            <span className="flex items-center gap-2 text-[var(--text-muted)]">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              {entry.name}
            </span>
            <span className="font-semibold tabular-nums text-[var(--foreground)]">{entry.value ?? 0}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StatPill({ label, value, tone = "primary" }) {
  return (
    <div className="mdm-stat-pill">
      <p className="mdm-stat-pill-label">{label}</p>
      <p className={`mdm-stat-pill-value mdm-stat-pill-value--${tone}`}>{value}</p>
    </div>
  );
}

export default function DashboardTrendChart({ data, className = "" }) {
  const { isDark } = useTheme();
  const chartData = Array.isArray(data) ? data : [];
  const [hidden, setHidden] = useState(() => new Set());
  const chartStroke = isDark ? "#52525b" : "#d4d4d8";
  const gridStroke = isDark ? "#3f3f46" : "#e4e4e7";
  const axisTick = isDark ? "#a1a1aa" : "#71717a";
  const activeDotFill = isDark ? "#27272a" : "#ffffff";

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
    <article className={`mdm-card relative min-w-0 overflow-hidden p-0 ${className}`}>
      <header className="relative border-b border-[var(--border-color)] px-5 py-4 sm:px-6 sm:py-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="mdm-badge-live">Live analytics</span>
              <span className="text-xs text-[var(--text-muted)]">Last 7 days</span>
            </div>
            <h3 className="mt-2 text-lg font-semibold tracking-tight text-[var(--foreground)] sm:text-xl">
              Governance activity trend
            </h3>
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-[var(--text-muted)]">
              Sync throughput and job health across your data pipeline — updated from real job
              history.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <StatPill label="Processed" value={totals.processed.toLocaleString()} tone="primary" />
            <StatPill
              label="Success rate"
              value={successRate !== null ? `${successRate}%` : "—"}
              tone="success"
            />
            <StatPill label="Failed jobs" value={totals.failed.toLocaleString()} tone="danger" />
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
                className={`mdm-series-toggle ${isOff ? "mdm-series-toggle--off" : ""}`}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: series.color, opacity: isOff ? 0.35 : 1 }}
                />
                {series.label}
              </button>
            );
          })}
        </div>
      </header>

      <div className="relative px-2 pb-4 pt-2 sm:px-4 sm:pb-6">
        <div className="mdm-chart-panel-inner w-full min-w-0 p-3">
          {hasActivity ? (
            <ChartResponsiveContainer>
              <ComposedChart data={chartData} margin={{ top: 12, right: 12, left: 8, bottom: 4 }}>
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
                <CartesianGrid stroke={gridStroke} strokeDasharray="4 6" vertical={false} />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: axisTick, fontSize: 12, fontWeight: 500 }}
                  dy={8}
                />
                <YAxis
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: axisTick, fontSize: 11 }}
                  width={48}
                />
                <Tooltip
                  content={<TrendTooltip />}
                  cursor={{ stroke: chartStroke, strokeWidth: 1, strokeDasharray: "4 4" }}
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
                    activeDot={{ r: 5, strokeWidth: 2, fill: activeDotFill, stroke: SERIES[0].stroke }}
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
                    dot={{ r: 3, strokeWidth: 2, fill: activeDotFill }}
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
                    dot={{ r: 3, strokeWidth: 2, fill: activeDotFill }}
                    activeDot={{ r: 5, strokeWidth: 2 }}
                    isAnimationActive
                    animationDuration={700}
                  />
                ) : null}
              </ComposedChart>
            </ChartResponsiveContainer>
          ) : (
            <div className="mdm-chart-empty flex-col gap-2 px-6" style={{ minHeight: 288 }}>
              <p className="font-medium text-[var(--foreground)]">No activity in the last 7 days</p>
              <p className="max-w-sm text-center text-sm text-[var(--text-muted)]">
                Run a sync job or pipeline to populate this chart with live governance metrics.
              </p>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
