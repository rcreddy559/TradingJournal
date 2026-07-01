import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";
import { AuthUser } from "../types";
import {
  addKnownUser,
  clearCurrentUser,
  readCurrentUser,
  readKnownUsers,
  removeKnownUser,
  writeCurrentUser,
} from "../db/authStorage";

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  knownUsers: string[];
  login: (username: string) => void;
  logout: () => void;
  forgetUser: (username: string) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const loadInitialUser = (): AuthUser | null => {
  const username = readCurrentUser();
  return username ? { username } : null;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(loadInitialUser);
  const [knownUsers, setKnownUsers] = useState<string[]>(readKnownUsers);

  const login = useCallback((username: string) => {
    const trimmed = username.trim();
    if (!trimmed) return;
    writeCurrentUser(trimmed);
    setKnownUsers(addKnownUser(trimmed));
    setUser({ username: trimmed });
  }, []);

  const logout = useCallback(() => {
    clearCurrentUser();
    setUser(null);
  }, []);

  const forgetUser = useCallback((username: string) => {
    setKnownUsers(removeKnownUser(username));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: user !== null,
        knownUsers,
        login,
        logout,
        forgetUser,
      }}
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
