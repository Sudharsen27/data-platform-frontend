"use client";

import { AuthProvider } from "@/context/AuthContext";
import { AiAssistantProvider } from "@/context/AiAssistantContext";
import { MobileNavProvider } from "@/context/MobileNavContext";
import { ThemeProvider } from "@/context/ThemeContext";
import AiAssistantShell from "@/components/ai/AiAssistantShell";

export default function Providers({ children }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AiAssistantProvider>
          <MobileNavProvider>
            {children}
            <AiAssistantShell />
          </MobileNavProvider>
        </AiAssistantProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
