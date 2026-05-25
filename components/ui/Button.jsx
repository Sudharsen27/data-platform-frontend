export default function Button({
  type = "button",
  variant = "primary",
  size = "md",
  className = "",
  disabled = false,
  children,
  ...props
}) {
  const variantClass =
    variant === "secondary"
      ? "mdm-btn--secondary"
      : variant === "danger"
        ? "mdm-btn--danger"
        : "mdm-btn--primary";

  const sizeClass = size === "sm" ? "mdm-btn--sm" : "mdm-btn--md";

  return (
    <button
      type={type}
      className={`mdm-btn ${variantClass} ${sizeClass} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
