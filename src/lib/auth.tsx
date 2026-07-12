import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getStoredUser, getToken, setStoredUser, setToken } from "./api";
import type { User } from "./types";

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  signIn: (token: string, user: User) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isAuthenticated: false,
  signIn: () => {},
  signOut: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  // Read from localStorage after hydration to stay SSR-safe.
  useEffect(() => {
    if (getToken()) {
      setUser(getStoredUser<User>());
    }
  }, []);

  const signIn = (token: string, nextUser: User) => {
    setToken(token);
    setStoredUser(nextUser);
    setUser(nextUser);
  };

  const signOut = () => {
    setToken(null);
    setStoredUser(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
