"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart as RechartsLineChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import ChartResponsiveContainer from "@/components/charts/ChartResponsiveContainer";

export default function LineChart({ data }) {
  return (
    <div className="min-w-0 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <h3 className="text-base font-semibold text-zinc-900">Records Trend</h3>
      <div className="mt-4 w-full min-w-0">
        <ChartResponsiveContainer>
          <RechartsLineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="records"
              stroke="#1d4ed8"
              strokeWidth={2}
            />
          </RechartsLineChart>
        </ChartResponsiveContainer>
      </div>
    </div>
  );
}
