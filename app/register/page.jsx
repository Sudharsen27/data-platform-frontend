"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import RegisterForm from "@/components/auth/RegisterForm";
import { loginUser, registerUser } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const INITIAL_FORM_VALUES = {
  fullName: "",
  email: "",
  companyName: "",
  password: "",
  confirmPassword: "",
};

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [formValues, setFormValues] = useState(INITIAL_FORM_VALUES);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  function handleFieldChange(field) {
    return (event) => {
      const value = event.target.value;
      setFormValues((prev) => ({ ...prev, [field]: value }));
    };
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      setErrorMessage("");
      setSuccessMessage("");

      await registerUser({
        full_name: formValues.fullName.trim(),
        email: formValues.email.trim(),
        company_name: formValues.companyName.trim(),
        password: formValues.password,
      });

      const loginResponse = await loginUser({
        email: formValues.email.trim(),
        password: formValues.password,
      });
      login(loginResponse.access_token);

      setSuccessMessage("Account created successfully. Redirecting to dashboard...");
      setFormValues(INITIAL_FORM_VALUES);
      window.setTimeout(() => {
        router.push("/dashboard");
      }, 700);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to create account.";
      setErrorMessage(message);
      setSuccessMessage("");
    } finally {
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
              Create Your Account
            </h2>
            <p className="mt-6 text-base leading-7 text-slate-100/95">
              Start managing data quality and governance across your organization.
            </p>

            <ul className="mt-8 space-y-3 text-sm leading-6 text-cyan-50/95">
              <li className="flex items-start gap-3">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-cyan-200" />
                Secure and scalable platform
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-cyan-200" />
                Role-based access control
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-cyan-200" />
                Real-time data validation
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-cyan-200" />
                Enterprise-grade architecture
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
            <RegisterForm
              formValues={formValues}
              onFieldChange={handleFieldChange}
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
