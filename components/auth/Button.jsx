function Spinner() {
  return (
    <span
      aria-hidden="true"
      className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white transition-opacity duration-200"
    />
  );
}

export default function Button({
  type = "button",
  className = "",
  isLoading = false,
  disabled = false,
  children,
  ...props
}) {
  return (
    <button
      type={type}
      className={`inline-flex w-full items-center justify-center gap-2 rounded-[var(--radius-control)] bg-[var(--color-primary)] px-4 py-3 text-sm font-semibold text-white shadow-[var(--shadow-button)] transition-all duration-250 hover:-translate-y-0.5 hover:bg-[var(--color-primary-hover)] hover:shadow-[0_12px_26px_rgba(37,99,235,0.32)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-70 ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      <span className={`transition-opacity duration-200 ${isLoading ? "opacity-100" : "opacity-0"}`}>
        <Spinner />
      </span>
      <span className={`${isLoading ? "-ml-1" : ""} transition-all duration-200`}>
        {children}
      </span>
    </button>
  );
}
