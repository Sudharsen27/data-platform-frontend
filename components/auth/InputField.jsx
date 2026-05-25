function EmailIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4 text-[var(--text-subtle)]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4 text-[var(--text-subtle)]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 118 0v3" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4 text-[var(--text-subtle)]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20a7 7 0 0114 0" />
    </svg>
  );
}

function CompanyIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4 text-[var(--text-subtle)]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M9 9h.01M15 9h.01M9 13h.01M15 13h.01M9 17h6" />
    </svg>
  );
}

export default function InputField({
  id,
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  required = false,
  icon = "email",
  rightSlot = null,
  autoComplete,
  errorMessage = "",
  ...props
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-semibold text-[var(--foreground)]">
        {label}
      </label>
      <div
        className={`group flex items-center rounded-[var(--radius-control)] border bg-[var(--input-bg)] px-3 transition-all duration-200 focus-within:-translate-y-0.5 focus-within:shadow-[0_0_0_4px_color-mix(in_srgb,var(--color-ring)_35%,transparent)] ${
          errorMessage
            ? "border-red-400 focus-within:border-red-400"
            : "border-[var(--input-border)] focus-within:border-[var(--color-primary)]"
        }`}
      >
        <span className="mr-2 transition-transform duration-200 group-focus-within:scale-110 group-focus-within:text-[var(--color-primary)]">
          {icon === "password" ? (
            <LockIcon />
          ) : icon === "user" ? (
            <UserIcon />
          ) : icon === "company" ? (
            <CompanyIcon />
          ) : (
            <EmailIcon />
          )}
        </span>
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          aria-invalid={Boolean(errorMessage)}
          className="w-full bg-transparent py-2.5 text-sm text-[var(--input-text)] outline-none placeholder:text-[var(--text-subtle)]"
          {...props}
        />
        {rightSlot ? <div className="ml-2">{rightSlot}</div> : null}
      </div>
      {errorMessage ? (
        <p className="text-xs font-medium text-red-600 dark:text-red-300">{errorMessage}</p>
      ) : null}
    </div>
  );
}
