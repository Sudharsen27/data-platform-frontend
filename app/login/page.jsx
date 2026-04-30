"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LoginForm from "@/components/auth/LoginForm";
import { useAuth } from "@/context/AuthContext";
import { loginUser } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isReady } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    router.prefetch("/dashboard");
    if (isReady && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isReady, isAuthenticated, router]);

  async function handleSubmit(event) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!email.trim() || !password) {
      setErrorMessage("Please enter your email and password.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await loginUser({ email: email.trim(), password });
      login(response.access_token);
      setIsSubmitting(false);
      setSuccessMessage("Signed in successfully. Redirecting to dashboard...");
      window.setTimeout(() => {
        router.push("/dashboard");
      }, 450);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to sign in.";
      setErrorMessage(message);
      setSuccessMessage("");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)] px-4 py-6 sm:px-6 lg:px-10">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] w-full max-w-6xl overflow-hidden rounded-[var(--radius-shell)] border border-slate-200/80 bg-white shadow-[var(--shadow-shell)] lg:grid-cols-2">
        <aside className="relative hidden overflow-hidden bg-gradient-to-br from-[#1b4ed8] via-[#1e3a8a] to-[#0f766e] p-12 text-white lg:flex lg:flex-col lg:justify-center">
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-16 h-72 w-72 rounded-full bg-cyan-200/15 blur-3xl" />

          <div className="relative z-10 max-w-lg">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-cyan-100/95">
              Enterprise Data Governance Platform
            </p>
            <h2 className="mt-5 text-5xl font-bold leading-tight tracking-tight">
              MDM Data Governance Platform
            </h2>
            <p className="mt-6 text-base leading-7 text-slate-100/95">
              Ensure Data Quality, Compliance, and Governance Across Your
              Organization.
            </p>

            <ul className="mt-8 space-y-3 text-sm leading-6 text-cyan-50/95">
              <li className="flex items-start gap-3">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-cyan-200" />
                Built for enterprise data operations
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-cyan-200" />
                Role-based access and governance controls
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-cyan-200" />
                Real-time validation and monitoring
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-cyan-200" />
                Scalable pipeline-driven architecture
              </li>
            </ul>
          </div>
        </aside>

        <main className="relative flex items-center justify-center overflow-hidden bg-gradient-to-b from-white via-slate-50/80 to-slate-100/70 p-5 sm:p-8 lg:p-12">
          <div className="pointer-events-none absolute left-1/2 top-0 h-48 w-48 -translate-x-1/2 rounded-full bg-blue-100/70 blur-3xl" />
          <div className="w-full max-w-md">
            <p className="mb-4 text-center text-xs font-medium uppercase tracking-wide text-slate-500 lg:hidden">
              MDM Data Governance Platform
            </p>
            <LoginForm
              email={email}
              password={password}
              onEmailChange={(event) => setEmail(event.target.value)}
              onPasswordChange={(event) => setPassword(event.target.value)}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              errorMessage={errorMessage}
              successMessage={successMessage}
              appName="MDM Data Governance Platform"
            />
          </div>
        </main>
      </div>
    </div>
  );
}
