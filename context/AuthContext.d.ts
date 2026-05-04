import type { ReactNode } from "react";

export type AuthContextValue = {
  token: string | null;
  isReady: boolean;
  isAuthenticated: boolean;
  userEmail: string;
  userName: string;
  userRole: string;
  isAdmin: boolean;
  isActive: boolean;
  login: (nextToken: string) => void;
  logout: () => void;
};

export function AuthProvider(props: { children: ReactNode }): JSX.Element;
export function useAuth(): AuthContextValue;
