const STATUS_MAP = {
  success:
    "bg-emerald-500/10 text-emerald-700 ring-emerald-500/25 dark:text-emerald-300 dark:ring-emerald-500/30",
  completed:
    "bg-emerald-500/10 text-emerald-700 ring-emerald-500/25 dark:text-emerald-300 dark:ring-emerald-500/30",
  active:
    "bg-emerald-500/10 text-emerald-700 ring-emerald-500/25 dark:text-emerald-300 dark:ring-emerald-500/30",
  running:
    "bg-amber-500/10 text-amber-800 ring-amber-500/25 dark:text-amber-300 dark:ring-amber-500/30",
  processing:
    "bg-amber-500/10 text-amber-800 ring-amber-500/25 dark:text-amber-300 dark:ring-amber-500/30",
  failed:
    "bg-rose-500/10 text-rose-700 ring-rose-500/25 dark:text-rose-300 dark:ring-rose-500/30",
  error:
    "bg-rose-500/10 text-rose-700 ring-rose-500/25 dark:text-rose-300 dark:ring-rose-500/30",
  pending:
    "bg-amber-500/10 text-amber-800 ring-amber-500/25 dark:text-amber-300 dark:ring-amber-500/30",
  approved:
    "bg-emerald-500/10 text-emerald-700 ring-emerald-500/25 dark:text-emerald-300 dark:ring-emerald-500/30",
  rejected:
    "bg-rose-500/10 text-rose-700 ring-rose-500/25 dark:text-rose-300 dark:ring-rose-500/30",
  default:
    "bg-zinc-500/10 text-zinc-700 ring-zinc-500/20 dark:text-zinc-300 dark:ring-zinc-500/25",
};

export default function StatusBadge({ status }) {
  const normalized = String(status || "default").toLowerCase();
  const className = STATUS_MAP[normalized] || STATUS_MAP.default;

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${className}`}
    >
      {status || "unknown"}
    </span>
  );
}
