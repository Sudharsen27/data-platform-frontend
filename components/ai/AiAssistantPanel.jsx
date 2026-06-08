"use client";

import { useCallback, useEffect, useRef } from "react";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import StatusBadge from "@/components/ui/StatusBadge";
import AiChatMessage from "@/components/ai/AiChatMessage";
import { useAiAssistant } from "@/context/AiAssistantContext";
import { MDM_INPUT } from "@/lib/themeClasses";

export default function AiAssistantPanel() {
  const {
    showAssistant,
    isOpen,
    close,
    messages,
    input,
    setInput,
    isLoading,
    errorMessage,
    aiStatus,
    pageLabel,
    pageContext,
    suggestedPrompts,
    panelWidth,
    setPanelWidth,
    minPanelWidth,
    maxPanelWidth,
    sendMessage,
    clearHistory,
  } = useAiAssistant();

  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const resizeRef = useRef({ dragging: false, startX: 0, startWidth: panelWidth });

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, isLoading, isOpen]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKey(event) {
      if (event.key === "Escape") {
        close();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen, close]);

  const onResizeStart = useCallback(
    (event) => {
      event.preventDefault();
      resizeRef.current = {
        dragging: true,
        startX: event.clientX,
        startWidth: panelWidth,
      };

      function onMove(moveEvent) {
        if (!resizeRef.current.dragging) {
          return;
        }
        const delta = resizeRef.current.startX - moveEvent.clientX;
        const next = Math.min(
          maxPanelWidth,
          Math.max(minPanelWidth, resizeRef.current.startWidth + delta)
        );
        setPanelWidth(next);
      }

      function onUp() {
        resizeRef.current.dragging = false;
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      }

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [panelWidth, setPanelWidth, minPanelWidth, maxPanelWidth]
  );

  if (!showAssistant) {
    return null;
  }

  const engineLabel = aiStatus
    ? `${aiStatus.provider}${aiStatus.model ? ` · ${aiStatus.model}` : ""}`
    : "";

  const contextHint =
    pageContext.asset_name ||
    pageContext.node_label ||
    pageContext.rule_field ||
    pageContext.task_name ||
    pageContext.record_name ||
    "";

  function handleSubmit(event) {
    event.preventDefault();
    sendMessage(input);
  }

  return (
    <>
      <button
        type="button"
        aria-hidden={!isOpen}
        tabIndex={isOpen ? 0 : -1}
        className={`fixed inset-0 z-[85] bg-[var(--overlay)] backdrop-blur-[2px] transition-opacity duration-300 md:bg-black/15 ${
          isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={close}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="AI Assistant"
        style={{ width: `min(100vw, ${panelWidth}px)` }}
        className={`mdm-ai-panel fixed inset-y-0 right-0 z-[90] flex flex-col border-l border-[var(--border-color)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isOpen ? "mdm-ai-panel--open translate-x-0" : "translate-x-full"
        }`}
      >
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize panel"
          onPointerDown={onResizeStart}
          className="absolute inset-y-0 left-0 hidden w-1.5 cursor-col-resize hover:bg-[var(--nav-active-ring)]/30 md:block"
        />

        <header className="mdm-ai-panel-header shrink-0 px-4 py-3 sm:px-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="mdm-ai-panel-title">AI Assistant</h2>
              <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                Current page: <span className="font-medium text-[var(--foreground)]">{pageLabel}</span>
                {contextHint ? (
                  <>
                    {" "}
                    · <span className="font-medium">{contextHint}</span>
                  </>
                ) : null}
              </p>
            </div>
            <button
              type="button"
              onClick={close}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--border-color)] text-[var(--text-muted)] hover:bg-[var(--color-surface-hover)]"
              aria-label="Close AI Assistant"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusBadge status={aiStatus?.available ? "active" : "pending"} />
            {engineLabel ? (
              <span className="text-[10px] text-[var(--text-muted)]">{engineLabel}</span>
            ) : null}
            {messages.length > 0 ? (
              <button
                type="button"
                onClick={clearHistory}
                className="ml-auto text-[10px] font-medium text-[var(--text-muted)] underline-offset-2 hover:underline"
              >
                Clear chat
              </button>
            ) : null}
          </div>
        </header>

        <div
          ref={scrollRef}
          className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-4 sm:px-5"
        >
          {messages.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
              <p className="text-sm text-[var(--text-muted)]">
                Ask about catalog, glossary, lineage, rules, stewardship, or master data on this page.
              </p>
              <div className="flex max-w-full flex-wrap justify-center gap-2">
                {suggestedPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => sendMessage(prompt)}
                    disabled={isLoading}
                    className="mdm-ai-prompt-chip disabled:opacity-50"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, index) => (
              <AiChatMessage key={`${msg.role}-${index}`} message={msg} />
            ))
          )}
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
              <Spinner size="sm" />
              Thinking…
            </div>
          ) : null}
        </div>

        <footer className="shrink-0 border-t border-[var(--border-subtle)] bg-[var(--shell-bg)] px-4 py-3 sm:px-5 sm:py-4">
          {errorMessage ? (
            <p className="mb-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
              {errorMessage}
            </p>
          ) : null}
          <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask a question…"
              disabled={isLoading}
              className={`${MDM_INPUT} min-w-0 flex-1 text-sm`}
              aria-label="Ask the AI assistant"
            />
            <Button type="submit" size="sm" disabled={isLoading || !input.trim()}>
              {isLoading ? "Sending…" : "Send"}
            </Button>
          </form>
        </footer>
      </aside>
    </>
  );
}
