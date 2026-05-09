export default function Toast({ message, type = "success" }) {
  if (!message) {
    return null;
  }

  const isError = type === "error";
  const border = isError ? "border-rose-200" : "border-emerald-200";
  const bg = isError ? "bg-rose-50" : "bg-emerald-50";
  const text = isError ? "text-rose-800" : "text-emerald-900";

  return (
    <div
      role="status"
      className={`fixed bottom-4 left-4 right-4 z-[90] max-w-md rounded-xl border px-4 py-3 text-sm shadow-lg sm:left-auto sm:right-6 sm:top-6 sm:bottom-auto ${border} ${bg} ${text}`}
      style={{ animation: "fadeIn 0.25s ease-out" }}
    >
      <div className="flex gap-3">
        <span
          className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
            isError ? "bg-rose-200 text-rose-800" : "bg-emerald-200 text-emerald-900"
          }`}
          aria-hidden
        >
          {isError ? "!" : "✓"}
        </span>
        <p className="min-w-0 flex-1 leading-snug">{message}</p>
      </div>
    </div>
  );
}
