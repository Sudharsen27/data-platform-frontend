import type { ReactNode } from "react";

export type AuthContextValue = {
  token: string | null;
  refreshToken: string | null;
  isReady: boolean;
  isAuthenticated: boolean;
  userEmail: string;
  userName: string;
  userRole: string;
  isAdmin: boolean;
  permissions: string[];
  isActive: boolean;
  login: (nextToken: string, nextRefreshToken?: string | null) => void;
  logout: () => void;
  refreshAccessToken: () => Promise<string | null>;
};

export function AuthProvider(props: { children: ReactNode }): JSX.Element;
export function useAuth(): AuthContextValue;
