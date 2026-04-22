"use client";

import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function CustomTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) {
    return null;
  }

  const { type, count } = payload[0].payload;
  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2 shadow-lg">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        Error Type
      </p>
      <p className="text-sm font-semibold text-zinc-900">{type}</p>
      <p className="mt-1 text-xs text-zinc-600">
        Count: <span className="font-semibold text-zinc-900">{count}</span>
      </p>
    </div>
  );
}

export default function BarChart({ data }) {
  const chartData = Array.isArray(data) ? data : [];
  const hasData = chartData.length > 0;
  const COLORS = ["#2563eb", "#3b82f6", "#60a5fa", "#1d4ed8", "#93c5fd"];

  return (
    <div className="min-w-0 rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-zinc-900">Error Distribution</h3>
          <p className="mt-1 text-xs text-zinc-500">
            Live breakdown of current data quality issues
          </p>
        </div>
        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
          {chartData.reduce((sum, item) => sum + Number(item.count || 0), 0)} total errors
        </span>
      </div>

      <div className="h-72 min-h-[18rem] w-full min-w-0">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <RechartsBarChart
              data={chartData}
              margin={{ top: 8, right: 8, left: -16, bottom: 6 }}
            >
              <CartesianGrid strokeDasharray="4 4" stroke="#e4e4e7" vertical={false} />
              <XAxis
                dataKey="type"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#71717a", fontSize: 12 }}
                interval={0}
              />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#71717a", fontSize: 12 }}
              />
              <Tooltip cursor={{ fill: "#dbeafe" }} content={<CustomTooltip />} />
              <Bar dataKey="count" radius={[10, 10, 0, 0]} maxBarSize={56}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${entry.type}-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </RechartsBarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-zinc-50">
            <p className="text-sm text-zinc-500">No error records available right now.</p>
          </div>
        )}
      </div>
    </div>
  );
}
