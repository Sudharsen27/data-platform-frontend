export default function Card({ title, subtitle, className = "", children }) {
  return (
    <section className={`mdm-card p-4 sm:p-5 ${className}`}>
      {title ? (
        <h3 className="text-base font-semibold tracking-tight text-[var(--foreground)]">{title}</h3>
      ) : null}
      {subtitle ? (
        <p className="mt-1 text-sm leading-relaxed text-[var(--text-muted)]">{subtitle}</p>
      ) : null}
      <div className={title || subtitle ? "mt-4" : ""}>{children}</div>
    </section>
  );
}
