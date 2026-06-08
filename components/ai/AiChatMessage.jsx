"use client";

export default function AiChatMessage({ message }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[95%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${
          isUser
            ? "bg-[var(--color-primary)] text-white shadow-sm"
            : "border border-[var(--border-color)] bg-[var(--color-surface)] text-[var(--foreground)] shadow-sm"
        }`}
      >
        <p
          className={`mb-1 text-[10px] font-semibold uppercase tracking-wider ${
            isUser ? "text-white/75" : "text-[var(--text-subtle)]"
          }`}
        >
          {isUser ? "You" : "AI Assistant"}
        </p>
        <p className="whitespace-pre-wrap">{message.content}</p>
        {!isUser && message.sources?.length > 0 ? (
          <div className="mt-2 border-t border-[var(--border-subtle)] pt-2">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Sources
            </p>
            <ul className="flex flex-wrap gap-1">
              {message.sources.map((src) => (
                <li key={`${src.type}-${src.id}`}>
                  <span className="inline-flex items-center rounded-md bg-[var(--nav-icon-bg)] px-2 py-0.5 text-[10px] text-[var(--text-muted)]">
                    {src.type}: {src.label}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}
