"use client";

import { useCallback, useEffect, useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import { getUsers, updateUserRole, updateUserStatus } from "@/lib/api";
import { useRequireAdmin } from "@/lib/auth";
import { useAuth } from "@/context/AuthContext";
import Card from "@/components/ui/Card";
import Toast from "@/components/ui/Toast";
import Button from "@/components/ui/Button";

function StatusBadge({ active }) {
  if (active) {
    return (
      <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 ring-1 ring-inset ring-emerald-600/20">
        Active
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-semibold text-zinc-600 ring-1 ring-inset ring-zinc-500/20">
      Inactive
    </span>
  );
}

function RoleBadge({ role }) {
  const r = (role || "").toLowerCase();
  if (r === "admin") {
    return (
      <span className="inline-flex rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-semibold text-violet-800 ring-1 ring-inset ring-violet-600/20">
        Admin
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700 ring-1 ring-inset ring-slate-500/20">
      User
    </span>
  );
}

export default function UsersPage() {
  const { isCheckingAuth } = useRequireAdmin();
  const { isReady, isAuthenticated, isAdmin, userEmail } = useAuth();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [rowBusyId, setRowBusyId] = useState(null);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const [errorMessage, setErrorMessage] = useState("");

  const loadUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");
      const data = await getUsers();
      setUsers(data);
    } catch (error) {
      setErrorMessage(error.message || "Failed to load users.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isReady || !isAuthenticated || !isAdmin) {
      return;
    }
    loadUsers();
  }, [loadUsers, isReady, isAuthenticated, isAdmin]);

  useEffect(() => {
    if (!toastMessage) {
      return;
    }
    const t = setTimeout(() => setToastMessage(""), 2800);
    return () => clearTimeout(t);
  }, [toastMessage]);

  async function handleRoleChange(userId, nextRole) {
    try {
      setRowBusyId(userId);
      const updated = await updateUserRole(userId, nextRole);
      setUsers((list) => list.map((u) => (u.id === userId ? updated : u)));
      setToastType("success");
      setToastMessage("Role updated.");
    } catch (error) {
      setToastType("error");
      setToastMessage(error.message || "Could not update role.");
    } finally {
      setRowBusyId(null);
    }
  }

  async function handleToggleStatus(row) {
    const next = !row.is_active;
    if (!next && row.email?.toLowerCase() === (userEmail || "").toLowerCase()) {
      setToastType("error");
      setToastMessage("You cannot deactivate your own account.");
      return;
    }
    try {
      setRowBusyId(row.id);
      const updated = await updateUserStatus(row.id, next);
      setUsers((list) => list.map((u) => (u.id === row.id ? updated : u)));
      setToastType("success");
      setToastMessage(next ? "User activated." : "User deactivated.");
    } catch (error) {
      setToastType("error");
      setToastMessage(error.message || "Could not update status.");
    } finally {
      setRowBusyId(null);
    }
  }

  if (isCheckingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 text-sm text-zinc-600">
        Checking authentication...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <Toast message={toastMessage} type={toastType} />
      <div className="flex min-h-screen flex-col md:flex-row">
        <Sidebar />
        <div className="flex-1">
          <Navbar title="User management" />
          <main className="space-y-6 p-6">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900">Directory</h2>
              <p className="mt-1 text-sm text-zinc-600">
                Manage roles and access. The last active administrator cannot be demoted or deactivated.
              </p>
            </div>

            {errorMessage ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                {errorMessage}
              </div>
            ) : null}

            <Card>
              {isLoading ? (
                <div className="space-y-3">
                  <div className="h-6 w-48 animate-pulse rounded bg-zinc-200" />
                  <div className="h-32 animate-pulse rounded bg-zinc-100" />
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-zinc-200">
                  <table className="min-w-full divide-y divide-zinc-200 text-sm">
                    <thead className="bg-zinc-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">
                          Name
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">
                          Email
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">
                          Role
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 bg-white">
                      {users.map((row) => {
                        const busy = rowBusyId === row.id;
                        const isSelf =
                          row.email?.toLowerCase() === (userEmail || "").toLowerCase();
                        return (
                          <tr key={row.id} className="hover:bg-zinc-50/80">
                            <td className="whitespace-nowrap px-4 py-3 font-medium text-zinc-900">
                              {row.full_name}
                            </td>
                            <td className="px-4 py-3 text-zinc-700">{row.email}</td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap items-center gap-2">
                                <RoleBadge role={row.role} />
                                <select
                                  className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-xs font-medium text-zinc-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                                  value={(row.role || "user").toLowerCase()}
                                  disabled={busy}
                                  onChange={(e) =>
                                    handleRoleChange(row.id, e.target.value)
                                  }
                                >
                                  <option value="user">User</option>
                                  <option value="admin">Admin</option>
                                </select>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <StatusBadge active={row.is_active} />
                            </td>
                            <td className="px-4 py-3">
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                disabled={busy || (isSelf && row.is_active)}
                                onClick={() => handleToggleStatus(row)}
                              >
                                {busy
                                  ? "…"
                                  : row.is_active
                                  ? "Deactivate"
                                  : "Activate"}
                              </Button>
                              {isSelf && row.is_active ? (
                                <p className="mt-1 text-[10px] text-zinc-500">
                                  Cannot deactivate yourself
                                </p>
                              ) : null}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {users.length === 0 ? (
                    <p className="p-6 text-center text-sm text-zinc-500">No users found.</p>
                  ) : null}
                </div>
              )}
            </Card>
          </main>
        </div>
      </div>
    </div>
  );
}
