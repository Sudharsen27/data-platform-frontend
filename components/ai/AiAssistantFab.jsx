"use client";

import { useAiAssistant } from "@/context/AiAssistantContext";

function AiAssistantIcon() {
  return (
    <svg className="h-[17px] w-[17px]" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3a1.5 1.5 0 0 1 1.46 1.13l.55 2.1a1.5 1.5 0 0 0 1.09 1.09l2.1.55A1.5 1.5 0 0 1 16.87 9.5l-2.1.55a1.5 1.5 0 0 0-1.09 1.09l-.55 2.1A1.5 1.5 0 0 1 12 15l-.55-2.1a1.5 1.5 0 0 0-1.09-1.09l-2.1-.55A1.5 1.5 0 0 1 7.13 9.5l2.1-.55a1.5 1.5 0 0 0 1.09-1.09L12 3z"
        fill="currentColor"
        opacity="0.95"
      />
      <path
        d="M6 16.5h12M8.5 19.5h7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.5"
      />
    </svg>
  );
}

export default function AiAssistantFab() {
  const { showAssistant, isOpen, toggle } = useAiAssistant();

  if (!showAssistant) {
    return null;
  }

  return (
    <div
      className={`mdm-ai-fab-wrap ${isOpen ? "mdm-ai-fab-wrap--hidden" : "mdm-ai-fab-wrap--visible"}`}
    >
      <button
        type="button"
        onClick={toggle}
        aria-expanded={isOpen}
        aria-label={isOpen ? "Close AI Assistant" : "Open AI Assistant"}
        className="mdm-ai-fab-pro"
      >
        <span className="mdm-ai-fab-pro__icon">
          <AiAssistantIcon />
        </span>
        <span className="mdm-ai-fab-pro__label hidden sm:inline">AI Assistant</span>
        <span className="mdm-ai-fab-pro__label sm:hidden">AI</span>
      </button>
    </div>
  );
}
