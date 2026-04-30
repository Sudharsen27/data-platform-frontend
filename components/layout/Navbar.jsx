"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Button from "@/components/ui/Button";

const ADMIN_EMAIL =
  process.env.NEXT_PUBLIC_ADMIN_EMAIL || "sundarlingam272000@gmail.com";

export default function Navbar({ title = "Dashboard" }) {
  const router = useRouter();
  const { logout, userEmail } = useAuth();
  const normalizedUserEmail = (userEmail || "").toLowerCase();
  const isAdmin = normalizedUserEmail === ADMIN_EMAIL.toLowerCase();

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-4">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">{title}</h1>
        {userEmail ? (
          <p className="mt-1 text-xs font-medium text-zinc-500">
            {isAdmin ? `Admin: ${userEmail}` : `User: ${userEmail}`}
          </p>
        ) : null}
      </div>
      <Button type="button" variant="secondary" onClick={handleLogout}>
        Logout
      </Button>
    </header>
  );
}
