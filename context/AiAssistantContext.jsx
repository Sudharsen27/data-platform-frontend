"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { getAiStatus, postCopilotChat } from "@/lib/api";
import {
  formatPageLabel,
  getSuggestedPrompts,
  resolvePageKey,
} from "@/lib/aiAssistantPrompts";
import { useAuth } from "@/context/AuthContext";

const AiAssistantContext = createContext(null);

const MIN_PANEL_WIDTH = 320;
const MAX_PANEL_WIDTH = 720;
const DEFAULT_PANEL_WIDTH = 420;

export function AiAssistantProvider({ children }) {
  const pathname = usePathname();
  const { isAuthenticated, isReady, permissions } = useAuth();
  const canUseAssistant = permissions?.includes("catalog:read");

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [aiStatus, setAiStatus] = useState(null);
  const [pageContext, setPageContext] = useState({});
  const [panelWidth, setPanelWidth] = useState(DEFAULT_PANEL_WIDTH);

  const pageKey = useMemo(() => resolvePageKey(pathname), [pathname]);
  const pageLabel = useMemo(() => formatPageLabel(pageKey), [pageKey]);
  const suggestedPrompts = useMemo(
    () => getSuggestedPrompts(pageKey, pageContext),
    [pageKey, pageContext]
  );

  const isPublicRoute = pathname === "/login" || pathname === "/register" || pathname === "/";

  useEffect(() => {
    if (!isReady || !isAuthenticated || !canUseAssistant) {
      return;
    }
    getAiStatus()
      .then(setAiStatus)
      .catch(() => setAiStatus(null));
  }, [isReady, isAuthenticated, canUseAssistant]);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((v) => !v), []);

  const registerPageContext = useCallback((context) => {
    setPageContext(context && typeof context === "object" ? context : {});
  }, []);

  const clearPageContext = useCallback(() => {
    setPageContext({});
  }, []);

  const sendMessage = useCallback(
    async (questionText) => {
      const question = (questionText || "").trim();
      if (!question || isLoading || !canUseAssistant) {
        return;
      }
      setErrorMessage("");
      setInput("");
      setMessages((prev) => [...prev, { role: "user", content: question }]);
      setIsLoading(true);

      const payloadContext = {
        page: pageKey,
        pathname,
        page_label: pageLabel,
        ...pageContext,
      };

      try {
        const result = await postCopilotChat(question, payloadContext);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: result.answer || "No answer returned.",
            sources: result.sources || [],
          },
        ]);
      } catch (error) {
        setErrorMessage(error.message || "Failed to get a response from the assistant.");
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, canUseAssistant, pageKey, pathname, pageLabel, pageContext]
  );

  const clearHistory = useCallback(() => {
    setMessages([]);
    setErrorMessage("");
  }, []);

  const value = useMemo(
    () => ({
      isOpen,
      open,
      close,
      toggle,
      messages,
      input,
      setInput,
      isLoading,
      errorMessage,
      aiStatus,
      pageKey,
      pageLabel,
      pageContext,
      suggestedPrompts,
      panelWidth,
      setPanelWidth,
      minPanelWidth: MIN_PANEL_WIDTH,
      maxPanelWidth: MAX_PANEL_WIDTH,
      sendMessage,
      clearHistory,
      registerPageContext,
      clearPageContext,
      canUseAssistant,
      showAssistant: isAuthenticated && canUseAssistant && !isPublicRoute,
    }),
    [
      isOpen,
      open,
      close,
      toggle,
      messages,
      input,
      isLoading,
      errorMessage,
      aiStatus,
      pageKey,
      pageLabel,
      pageContext,
      suggestedPrompts,
      panelWidth,
      sendMessage,
      clearHistory,
      registerPageContext,
      clearPageContext,
      canUseAssistant,
      isAuthenticated,
      isPublicRoute,
    ]
  );

  return (
    <AiAssistantContext.Provider value={value}>{children}</AiAssistantContext.Provider>
  );
}

export function useAiAssistant() {
  const ctx = useContext(AiAssistantContext);
  if (!ctx) {
    throw new Error("useAiAssistant must be used within AiAssistantProvider");
  }
  return ctx;
}

/** Register page-specific context for the AI Assistant (cleared on unmount). */
export function useRegisterAiPageContext(context) {
  const { registerPageContext, clearPageContext } = useAiAssistant();
  const contextKey = JSON.stringify(context ?? {});

  useEffect(() => {
    registerPageContext(context ?? {});
    return () => clearPageContext();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed by serialized context
  }, [registerPageContext, clearPageContext, contextKey]);
}
