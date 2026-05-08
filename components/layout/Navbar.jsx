"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Button from "@/components/ui/Button";

export default function Navbar({ title = "Dashboard" }) {
  const router = useRouter();
  const { logout, userEmail, userRole, isAdmin } = useAuth();

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  const roleLabel = isAdmin ? "Admin" : "User";

  return (
    <header className="flex flex-col gap-3 border-b border-zinc-200 bg-white px-6 py-4 md:flex-row md:items-center md:justify-between">
      <div className="min-w-0 md:flex-1">
        <h1 className="text-xl font-semibold text-zinc-900">{title}</h1>
        {userEmail ? (
          <p className="mt-1 text-xs font-medium text-zinc-500">
            {roleLabel}: {userEmail}
            {userRole ? (
              <span className="ml-2 rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-600">
                {userRole}
              </span>
            ) : null}
          </p>
        ) : null}
      </div>
      <div className="flex w-full items-center gap-3 md:w-auto md:min-w-0 md:justify-end">
        <Button type="button" variant="secondary" onClick={handleLogout} className="shrink-0">
          Logout
        </Button>
      </div>
    </header>
  );
}
