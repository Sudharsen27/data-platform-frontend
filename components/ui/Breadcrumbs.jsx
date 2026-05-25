export default function Breadcrumbs({ items = [] }) {
  if (!items.length) {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className="text-xs text-[var(--text-muted)]">
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((item, index) => (
          <li key={item.label} className="inline-flex items-center gap-2">
            {index > 0 ? <span className="text-[var(--text-subtle)]">/</span> : null}
            {item.current ? (
              <span className="font-semibold text-[var(--foreground)]">{item.label}</span>
            ) : (
              <span>{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
