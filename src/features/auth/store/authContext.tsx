import { createContext, ReactNode, useCallback, useContext, useState } from "react";
import { AuthUser } from "../types";
import { clearCurrentUser, readCurrentUser, writeCurrentUser } from "../db/authStorage";

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (username: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const loadInitialUser = (): AuthUser | null => {
  const username = readCurrentUser();
  return username ? { username } : null;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(loadInitialUser);

  const login = useCallback((username: string) => {
    const trimmed = username.trim();
    if (!trimmed) return;
    writeCurrentUser(trimmed);
    setUser({ username: trimmed });
  }, []);

  const logout = useCallback(() => {
    clearCurrentUser();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: user !== null, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
