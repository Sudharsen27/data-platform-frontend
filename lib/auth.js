import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  SESSION_PRESENCE_COOKIE,
  SESSION_PRESENCE_MAX_AGE,
  TOKEN_KEY,
} from "@/lib/authConstants";

export { TOKEN_KEY };

/** True if a JWT is stored (client-only). */
export function isAuthenticated() {
  return Boolean(getStoredToken());
}

export function getStoredToken() {
  if (typeof window === "undefined") {
    return null;
  }
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token) {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(TOKEN_KEY, token);
  if (typeof document !== "undefined") {
    document.cookie = `${SESSION_PRESENCE_COOKIE}=1; Path=/; Max-Age=${SESSION_PRESENCE_MAX_AGE}; SameSite=Lax`;
  }
}

export function clearStoredToken() {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.removeItem(TOKEN_KEY);
  if (typeof document !== "undefined") {
    document.cookie = `${SESSION_PRESENCE_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
  }
}

/**
 * Client-side guard for protected pages. Pair with `middleware.ts` (session cookie) for first paint.
 */
export function useRequireAuth() {
  const router = useRouter();
  const { isAuthenticated: authed, isReady } = useAuth();

  useEffect(() => {
    if (!isReady) {
      return;
    }
    if (!authed) {
      router.replace("/login");
    }
  }, [isReady, authed, router]);

  return {
    isCheckingAuth: !isReady || !authed,
  };
}

/** Admin-only sections (Rules, Pipeline, User management). */
export function useRequireAdmin() {
  const router = useRouter();
  const { isReady, isAuthenticated: authed, isAdmin } = useAuth();

  useEffect(() => {
    if (!isReady) {
      return;
    }
    if (!authed) {
      router.replace("/login");
      return;
    }
    if (!isAdmin) {
      router.replace("/dashboard");
    }
  }, [isReady, authed, isAdmin, router]);

  return {
    isCheckingAuth: !isReady || !authed || !isAdmin,
  };
}
