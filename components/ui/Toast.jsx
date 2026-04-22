export default function Toast({ message, type = "success" }) {
  if (!message) {
    return null;
  }

  const className =
    type === "error"
      ? "border-rose-200 bg-rose-50 text-rose-700"
      : "border-emerald-200 bg-emerald-50 text-emerald-700";

  return (
    <div className={`fixed right-4 top-4 z-50 rounded-lg border px-4 py-3 text-sm shadow-lg ${className}`}>
      {message}
    </div>
  );
}
