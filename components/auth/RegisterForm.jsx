"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import Button from "./Button";
import Card from "./Card";
import InputField from "./InputField";

function EyeIcon({ isOpen }) {
  if (isOpen) {
    return (
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden="true"
      >
        <path d="M3 3l18 18" />
        <path d="M10.6 10.6a3 3 0 004.2 4.2" />
        <path d="M9.9 5.1A10 10 0 0112 5c4.6 0 8.5 3 10 7-0.6 1.7-1.8 3.2-3.3 4.4" />
        <path d="M6.2 6.2C4.8 7.3 3.7 8.6 3 12c1.5 4 5.4 7 9 7 0.7 0 1.4-0.1 2.1-0.2" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function getPasswordStrength(password) {
  if (!password) {
    return { score: 0, label: "Very weak", color: "bg-slate-200" };
  }

  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 1) return { score, label: "Weak", color: "bg-rose-500" };
  if (score === 2) return { score, label: "Fair", color: "bg-amber-500" };
  if (score === 3) return { score, label: "Good", color: "bg-blue-500" };
  return { score, label: "Strong", color: "bg-emerald-500" };
}

export default function RegisterForm({
  formValues,
  onFieldChange,
  onSubmit,
  isSubmitting,
  errorMessage,
  successMessage,
  appName,
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const passwordStrength = useMemo(
    () => getPasswordStrength(formValues.password),
    [formValues.password]
  );

  function validateFields() {
    const nextErrors = {};

    if (!formValues.fullName.trim()) {
      nextErrors.fullName = "Full name is required.";
    }
    if (!formValues.email.trim()) {
      nextErrors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formValues.email)) {
      nextErrors.email = "Please enter a valid email.";
    }
    if (!formValues.password) {
      nextErrors.password = "Password is required.";
    } else if (formValues.password.length < 8) {
      nextErrors.password = "Use at least 8 characters.";
    }
    if (!formValues.confirmPassword) {
      nextErrors.confirmPassword = "Please confirm your password.";
    } else if (formValues.password !== formValues.confirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }

    return nextErrors;
  }

  function handleSubmit(event) {
    const nextErrors = validateFields();
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      event.preventDefault();
      return;
    }
    onSubmit(event);
  }

  return (
    <Card className="animate-[fadeIn_260ms_ease-out]">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">
        Create account
      </h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Register to access {appName}.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
        <InputField
          id="fullName"
          label="Full Name"
          value={formValues.fullName}
          onChange={onFieldChange("fullName")}
          placeholder="John Doe"
          autoComplete="name"
          icon="user"
          errorMessage={fieldErrors.fullName}
          required
        />

        <InputField
          id="email"
          label="Email"
          type="email"
          value={formValues.email}
          onChange={onFieldChange("email")}
          placeholder="john@company.com"
          autoComplete="email"
          icon="email"
          errorMessage={fieldErrors.email}
          required
        />

        <InputField
          id="companyName"
          label="Company Name (Optional)"
          value={formValues.companyName}
          onChange={onFieldChange("companyName")}
          placeholder="Acme Corp"
          autoComplete="organization"
          icon="company"
        />

        <InputField
          id="password"
          label="Password"
          type={showPassword ? "text" : "password"}
          value={formValues.password}
          onChange={onFieldChange("password")}
          placeholder="Create a secure password"
          autoComplete="new-password"
          icon="password"
          errorMessage={fieldErrors.password}
          required
          rightSlot={
            <button
              type="button"
              className="rounded p-1 text-slate-500 transition-colors hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              <EyeIcon isOpen={showPassword} />
            </button>
          }
        />

        <div className="space-y-2">
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className={`h-full transition-all duration-300 ${passwordStrength.color}`}
              style={{ width: `${Math.max(passwordStrength.score, 1) * 25}%` }}
            />
          </div>
          <p className="text-xs text-slate-600">
            Password strength:{" "}
            <span className="font-semibold">{passwordStrength.label}</span>
          </p>
        </div>

        <InputField
          id="confirmPassword"
          label="Confirm Password"
          type={showConfirmPassword ? "text" : "password"}
          value={formValues.confirmPassword}
          onChange={onFieldChange("confirmPassword")}
          placeholder="Re-enter your password"
          autoComplete="new-password"
          icon="password"
          errorMessage={fieldErrors.confirmPassword}
          required
          rightSlot={
            <button
              type="button"
              className="rounded p-1 text-slate-500 transition-colors hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              aria-label={
                showConfirmPassword ? "Hide confirm password" : "Show confirm password"
              }
            >
              <EyeIcon isOpen={showConfirmPassword} />
            </button>
          }
        />

        {errorMessage ? (
          <div
            role="alert"
            className="rounded-[var(--radius-control)] border border-red-200 bg-gradient-to-r from-red-50 to-rose-50 px-3 py-2.5 text-sm text-red-700"
          >
            {errorMessage}
          </div>
        ) : null}

        {successMessage ? (
          <div className="rounded-[var(--radius-control)] border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 px-3 py-2.5 text-sm text-emerald-700 transition-all duration-200">
            {successMessage}
          </div>
        ) : null}

        <Button type="submit" isLoading={isSubmitting}>
          {isSubmitting ? "Creating account..." : "Create Account"}
        </Button>

        <p className="text-center text-sm text-slate-600">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-[var(--color-primary)] transition-colors hover:text-[var(--color-primary-hover)]"
          >
            Sign in
          </Link>
        </p>
      </form>
    </Card>
  );
}
