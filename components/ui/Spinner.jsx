export default function Spinner({ size = "md", className = "" }) {
  const sizeClass =
    size === "sm" ? "h-4 w-4 border-2" : size === "lg" ? "h-8 w-8 border-4" : "h-6 w-6 border-2";

  return (
    <span
      className={`inline-block animate-spin rounded-full border-zinc-300 border-t-blue-600 ${sizeClass} ${className}`}
      aria-hidden="true"
    />
  );
}
