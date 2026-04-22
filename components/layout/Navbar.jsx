"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Button from "@/components/ui/Button";

export default function Navbar({ title = "Dashboard" }) {
  const router = useRouter();
  const { logout } = useAuth();

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-4">
      <h1 className="text-xl font-semibold text-zinc-900">{title}</h1>
      <Button type="button" variant="secondary" onClick={handleLogout}>
        Logout
      </Button>
    </header>
  );
}
