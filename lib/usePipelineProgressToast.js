"use client";

import { useEffect, useRef } from "react";
import { getPipelineStatus } from "@/lib/api";

const PIPELINE_TOAST_ID = "pipeline-run";

export function usePipelineProgressToast({
  pushToast,
  dismissToast,
  enabled = true,
  onStatus,
  pollMs = 2000,
}) {
  const wasRunningRef = useRef(false);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    async function applyStatus(data) {
      onStatus?.(data);

      const steps = Array.isArray(data?.steps) ? data.steps : [];
      const runningStep = steps.find((step) => step.status === "running");
      const stepLabel =
        runningStep?.label || steps.find((step) => step.status === "completed")?.label;
      const {
        status,
        progress_percent,
        processed_records,
        total_records,
        last_message,
      } = data;

      if (status === "running") {
        wasRunningRef.current = true;
        const pct = progress_percent || 0;
        pushToast(
          `${stepLabel ? `${stepLabel} · ` : ""}${pct}% — ${Number(processed_records || 0).toLocaleString()} / ${Number(total_records || 0).toLocaleString()} records`,
          {
            type: "info",
            id: PIPELINE_TOAST_ID,
            title: "Pipeline running",
            duration: 0,
          }
        );
        return;
      }

      if (!wasRunningRef.current) {
        return;
      }

      wasRunningRef.current = false;
      if (status === "success") {
        pushToast(last_message || "Pipeline finished successfully.", {
          type: "success",
          id: PIPELINE_TOAST_ID,
          title: "Pipeline complete",
          duration: 8000,
        });
      } else if (status === "failed") {
        pushToast(last_message || "Pipeline failed.", {
          type: "error",
          id: PIPELINE_TOAST_ID,
          title: "Pipeline failed",
          duration: 10000,
        });
      } else {
        dismissToast(PIPELINE_TOAST_ID);
      }
    }

    async function poll() {
      try {
        const data = await getPipelineStatus();
        await applyStatus(data);
      } catch {
        // Ignore poll errors; page-level handlers show load failures.
      }
    }

    poll();
    const intervalId = setInterval(poll, pollMs);
    return () => clearInterval(intervalId);
  }, [enabled, pushToast, dismissToast, onStatus, pollMs]);
}
