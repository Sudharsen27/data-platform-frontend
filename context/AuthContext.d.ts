import type { ReactNode } from "react";

export type AuthContextValue = {
  token: string | null;
  isReady: boolean;
  isAuthenticated: boolean;
  login: (nextToken: string) => void;
  logout: () => void;
};

export function AuthProvider(props: { children: ReactNode }): JSX.Element;
export function useAuth(): AuthContextValue;
