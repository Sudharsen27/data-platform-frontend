"use client";

import Link from "next/link";
import { useState } from "react";
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

export default function LoginForm({
  email,
  password,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  isSubmitting,
  errorMessage,
  successMessage,
  appName,
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  return (
    <Card className="animate-[fadeIn_260ms_ease-out]">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">
        Welcome back
      </h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Sign in to continue to {appName}.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-5" noValidate>
        <InputField
          id="email"
          label="Email"
          type="email"
          value={email}
          onChange={onEmailChange}
          placeholder="admin@mdm.com"
          autoComplete="email"
          icon="email"
          required
        />

        <InputField
          id="password"
          label="Password"
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={onPasswordChange}
          placeholder="Enter your password"
          autoComplete="current-password"
          icon="password"
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

        <div className="flex items-center justify-between pt-0.5 text-sm">
          <label className="inline-flex cursor-pointer items-center gap-2 text-slate-600">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-[var(--color-primary)] focus:ring-[var(--color-ring)]"
              checked={rememberMe}
              onChange={(event) => setRememberMe(event.target.checked)}
            />
            Remember me
          </label>
          <a
            href="#"
            className="font-medium text-[var(--color-primary)] transition-colors hover:text-[var(--color-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
          >
            Forgot password?
          </a>
        </div>

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
          {isSubmitting ? "Signing in..." : "Sign in"}
        </Button>

        <p className="pt-1 text-center text-sm text-slate-600">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-semibold text-[var(--color-primary)] transition-colors hover:text-[var(--color-primary-hover)]"
          >
            Create account
          </Link>
        </p>
      </form>
    </Card>
  );
}
