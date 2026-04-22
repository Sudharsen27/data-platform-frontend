export default function Button({
  type = "button",
  variant = "primary",
  size = "md",
  className = "",
  disabled = false,
  children,
  ...props
}) {
  const baseClassName =
    "inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 disabled:cursor-not-allowed disabled:opacity-60";

  const variantClassName =
    variant === "secondary"
      ? "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
      : variant === "danger"
      ? "bg-rose-600 text-white hover:bg-rose-700"
      : "bg-blue-600 text-white hover:bg-blue-700";

  const sizeClassName =
    size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm";

  return (
    <button
      type={type}
      className={`${baseClassName} ${variantClassName} ${sizeClassName} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
