"use client";

import { useEffect, useState } from "react";
import { ResponsiveContainer } from "recharts";

/** Fixed height avoids ResponsiveContainer measuring 0/-1 in flex/hidden layouts. */
export const CHART_HEIGHT = 288;

export default function ChartResponsiveContainer({ children, className = "" }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  return (
    <div
      className={`w-full min-w-0 ${className}`}
      style={{ height: CHART_HEIGHT, minHeight: CHART_HEIGHT }}
    >
      {ready ? (
        <ResponsiveContainer width="100%" height={CHART_HEIGHT} minWidth={0}>
          {children}
        </ResponsiveContainer>
      ) : (
        <div
          className="h-full w-full rounded-lg bg-[var(--table-head-bg)]"
          style={{ minHeight: CHART_HEIGHT }}
          aria-hidden
        />
      )}
    </div>
  );
}
