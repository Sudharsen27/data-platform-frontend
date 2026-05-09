export default function Card({ title, subtitle, className = "", children }) {
  return (
    <section
      className={`rounded-[var(--radius-card)] border border-zinc-200/90 bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card)] sm:p-5 ${className}`}
    >
      {title ? <h3 className="text-base font-semibold tracking-tight text-zinc-900">{title}</h3> : null}
      {subtitle ? <p className="mt-1 text-sm leading-relaxed text-zinc-500">{subtitle}</p> : null}
      <div className={title || subtitle ? "mt-4" : ""}>{children}</div>
    </section>
  );
}
