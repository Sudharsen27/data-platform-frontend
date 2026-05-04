const STATUS_MAP = {
  success: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  completed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  running: "bg-amber-50 text-amber-700 ring-amber-200",
  processing: "bg-amber-50 text-amber-700 ring-amber-200",
  failed: "bg-rose-50 text-rose-700 ring-rose-200",
  error: "bg-rose-50 text-rose-700 ring-rose-200",
  pending: "bg-zinc-100 text-zinc-700 ring-zinc-200",
  default: "bg-zinc-100 text-zinc-700 ring-zinc-200",
};

export default function StatusBadge({ status }) {
  const normalized = String(status || "default").toLowerCase();
  const className = STATUS_MAP[normalized] || STATUS_MAP.default;

  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${className}`}>
      {status || "unknown"}
    </span>
  );
}
