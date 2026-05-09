"use client";

import { AuthProvider } from "@/context/AuthContext";
import { MobileNavProvider } from "@/context/MobileNavContext";

export default function Providers({ children }) {
  return (
    <AuthProvider>
      <MobileNavProvider>{children}</MobileNavProvider>
    </AuthProvider>
  );
}
