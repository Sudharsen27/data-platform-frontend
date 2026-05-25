"use client";

import { useTheme } from "@/context/ThemeContext";
import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  Cell,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import ChartResponsiveContainer from "@/components/charts/ChartResponsiveContainer";

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) {
    return null;
  }

  const { type, count } = payload[0].payload;
  return (
    <div className="rounded-lg border border-[var(--chart-tooltip-border)] bg-[var(--chart-tooltip-bg)] px-3 py-2 shadow-lg">
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
        Error type
      </p>
      <p className="text-sm font-semibold text-[var(--foreground)]">{type}</p>
      <p className="mt-1 text-xs text-[var(--text-muted)]">
        Count: <span className="font-semibold text-[var(--foreground)]">{count}</span>
      </p>
    </div>
  );
}

export default function BarChart({ data }) {
  const { isDark } = useTheme();
  const chartData = Array.isArray(data) ? data : [];
  const hasData = chartData.length > 0;
  const COLORS = ["#6366f1", "#818cf8", "#a5b4fc", "#4f46e5", "#c7d2fe"];
  const gridStroke = isDark ? "#3f3f46" : "#e4e4e7";
  const axisTick = isDark ? "#a1a1aa" : "#71717a";
  const cursorFill = isDark ? "rgba(99, 102, 241, 0.15)" : "rgba(99, 102, 241, 0.12)";
  const total = chartData.reduce((sum, item) => sum + Number(item.count || 0), 0);

  return (
    <div className="mdm-chart-panel min-w-0">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-[var(--foreground)]">Error Distribution</h3>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Live breakdown of current data quality issues
          </p>
        </div>
        <span className="rounded-full bg-[var(--color-primary-muted)] px-2.5 py-1 text-xs font-semibold text-[var(--color-primary)]">
          {total.toLocaleString()} total errors
        </span>
      </div>

      <div className="mdm-chart-panel-inner w-full min-w-0 p-3">
        {hasData ? (
          <ChartResponsiveContainer>
            <RechartsBarChart data={chartData} margin={{ top: 8, right: 8, left: 4, bottom: 6 }}>
              <CartesianGrid strokeDasharray="4 4" stroke={gridStroke} vertical={false} />
              <XAxis
                dataKey="type"
                tickLine={false}
                axisLine={false}
                tick={{ fill: axisTick, fontSize: 11 }}
                interval={0}
              />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                tick={{ fill: axisTick, fontSize: 11 }}
                width={52}
              />
              <Tooltip cursor={{ fill: cursorFill }} content={<CustomTooltip />} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={56}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${entry.type}-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </RechartsBarChart>
          </ChartResponsiveContainer>
        ) : (
          <div className="mdm-chart-empty" style={{ minHeight: 288 }}>
            No error records available right now.
          </div>
        )}
      </div>
    </div>
  );
}
