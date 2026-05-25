"use client";

import { AuthProvider } from "@/context/AuthContext";
import { MobileNavProvider } from "@/context/MobileNavContext";
import { ThemeProvider } from "@/context/ThemeContext";

export default function Providers({ children }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MobileNavProvider>{children}</MobileNavProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
