"use client";

import { useEffect, useState } from "react";
import PageShell from "@/components/layout/PageShell";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import Toast from "@/components/ui/Toast";
import { getMyProfile, updateMyPassword, updateMyProfile } from "@/lib/api";
import { useRequireAuth } from "@/lib/auth";

export default function ProfilePage() {
  const { isCheckingAuth } = useRequireAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    company_name: "",
    role: "",
  });
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  useEffect(() => {
    let active = true;
    getMyProfile()
      .then((profile) => {
        if (!active) return;
        setForm({
          full_name: profile.full_name || "",
          email: profile.email || "",
          company_name: profile.company_name || "",
          role: profile.role || "",
        });
      })
      .catch((err) => {
        if (!active) return;
        setErrorMessage(err?.message || "Failed to load profile");
      })
      .finally(() => {
        if (!active) return;
        setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const id = window.setTimeout(() => setToastMessage(""), 2500);
    return () => window.clearTimeout(id);
  }, [toastMessage]);

  async function handleProfileSave(event) {
    event.preventDefault();
    setErrorMessage("");
    if (!form.full_name.trim()) {
      setErrorMessage("Full name is required.");
      return;
    }
    try {
      setIsSavingProfile(true);
      const updated = await updateMyProfile({
        full_name: form.full_name.trim(),
        company_name: form.company_name.trim(),
      });
      setForm((prev) => ({
        ...prev,
        full_name: updated.full_name || prev.full_name,
        company_name: updated.company_name || "",
        role: updated.role || prev.role,
      }));
      setToastType("success");
      setToastMessage("Profile updated.");
    } catch (err) {
      setErrorMessage(err?.message || "Failed to update profile");
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function handlePasswordSave(event) {
    event.preventDefault();
    setErrorMessage("");
    if (!passwordForm.current_password || !passwordForm.new_password) {
      setErrorMessage("Current and new password are required.");
      return;
    }
    if (passwordForm.new_password.length < 8) {
      setErrorMessage("New password must be at least 8 characters.");
      return;
    }
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setErrorMessage("New password and confirm password do not match.");
      return;
    }
    try {
      setIsSavingPassword(true);
      await updateMyPassword({
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      });
      setPasswordForm({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
      setToastType("success");
      setToastMessage("Password updated.");
    } catch (err) {
      setErrorMessage(err?.message || "Failed to update password");
    } finally {
      setIsSavingPassword(false);
    }
  }

  if (isCheckingAuth || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-zinc-600">
        Loading profile...
      </div>
    );
  }

  return (
    <>
      <Toast message={toastMessage} type={toastType} />
      <PageShell title="Profile">
        <Breadcrumbs items={[{ label: "Home" }, { label: "Profile", current: true }]} />
        {errorMessage ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : null}
        <section className="grid gap-4 xl:grid-cols-2">
          <Card title="Account details" subtitle="Manage your personal profile">
            <form className="space-y-3" onSubmit={handleProfileSave}>
              <label className="block text-sm">
                <span className="mb-1 block text-zinc-600">Full name</span>
                <input
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
                  value={form.full_name}
                  onChange={(e) => setForm((prev) => ({ ...prev, full_name: e.target.value }))}
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-zinc-600">Email</span>
                <input
                  className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-600"
                  value={form.email}
                  disabled
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-zinc-600">Company</span>
                <input
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
                  value={form.company_name}
                  onChange={(e) => setForm((prev) => ({ ...prev, company_name: e.target.value }))}
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-zinc-600">Role</span>
                <input
                  className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-600"
                  value={String(form.role || "").toUpperCase()}
                  disabled
                />
              </label>
              <Button type="submit" disabled={isSavingProfile}>
                {isSavingProfile ? "Saving..." : "Save profile"}
              </Button>
            </form>
          </Card>

          <Card title="Password" subtitle="Update your sign-in password">
            <form className="space-y-3" onSubmit={handlePasswordSave}>
              <label className="block text-sm">
                <span className="mb-1 block text-zinc-600">Current password</span>
                <input
                  type="password"
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
                  value={passwordForm.current_password}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({ ...prev, current_password: e.target.value }))
                  }
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-zinc-600">New password</span>
                <input
                  type="password"
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
                  value={passwordForm.new_password}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({ ...prev, new_password: e.target.value }))
                  }
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-zinc-600">Confirm new password</span>
                <input
                  type="password"
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
                  value={passwordForm.confirm_password}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({ ...prev, confirm_password: e.target.value }))
                  }
                />
              </label>
              <Button type="submit" disabled={isSavingPassword}>
                {isSavingPassword ? "Updating..." : "Change password"}
              </Button>
            </form>
          </Card>
        </section>
      </PageShell>
    </>
  );
}
