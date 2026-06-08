"use client";

import AiAssistantFab from "@/components/ai/AiAssistantFab";
import AiAssistantPanel from "@/components/ai/AiAssistantPanel";

/** Global AI Assistant UI (FAB + drawer). Mount once inside authenticated app shell. */
export default function AiAssistantShell() {
  return (
    <>
      <AiAssistantFab />
      <AiAssistantPanel />
    </>
  );
}
