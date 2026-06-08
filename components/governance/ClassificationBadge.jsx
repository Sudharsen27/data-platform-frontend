"use client";

const STYLES = {
  PII: "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300",
  Sensitive: "border-orange-500/30 bg-orange-500/10 text-orange-800 dark:text-orange-300",
  Financial: "border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300",
  Confidential: "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300",
  Public: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
};

export default function ClassificationBadge({ classification, size = "sm" }) {
  const label = classification || "Unknown";
  const style = STYLES[label] || "border-zinc-500/20 bg-zinc-500/10 text-zinc-700 dark:text-zinc-300";
  const sizeClass = size === "xs" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-xs";

  return (
    <span
      className={`inline-flex items-center rounded-full border font-semibold uppercase tracking-wide ${sizeClass} ${style}`}
    >
      {label}
    </span>
  );
}

export function riskScoreClass(score) {
  if (score >= 70) return "text-rose-600 dark:text-rose-400";
  if (score >= 40) return "text-amber-600 dark:text-amber-400";
  return "text-emerald-600 dark:text-emerald-400";
}
