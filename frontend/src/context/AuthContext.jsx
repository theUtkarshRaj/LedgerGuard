import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { authLogin, authMe, authRegister } from "../services/authApi.js";
import { AUTH_TOKEN_KEY, AUTH_USER_KEY } from "../authStorage";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(AUTH_TOKEN_KEY));
  /** False while validating token / syncing profile from API (blocks routes to avoid RBAC race). */
  const [sessionReady, setSessionReady] = useState(
    () => !localStorage.getItem(AUTH_TOKEN_KEY)
  );
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem(AUTH_USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await authLogin({ email, password });
    const t = data?.data?.token;
    const u = data?.data?.user;
    if (!t || !u) throw new Error("Invalid login response");
    localStorage.setItem(AUTH_TOKEN_KEY, t);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(u));
    setToken(t);
    setUser(u);
    return u;
  }, []);

  const register = useCallback(async (payload) => {
    const data = await authRegister(payload);
    return data?.data;
  }, []);

  const refreshMe = useCallback(async () => {
    if (!token) return null;
    const data = await authMe();
    const u = data?.data;
    if (u) {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(u));
      setUser(u);
    }
    return u;
  }, [token]);

  useEffect(() => {
    if (!token) {
      setSessionReady(true);
      return;
    }
    setSessionReady(true);
  }, [token]);

  useEffect(() => {
    const handleAuthFailed = () => {
      logout();
    };
    window.addEventListener("auth-failed", handleAuthFailed);
    return () => window.removeEventListener("auth-failed", handleAuthFailed);
  }, [logout]);

  const value = useMemo(
    () => ({
      token,
      user,
      sessionReady,
      login,
      logout,
      register,
      refreshMe,
      isAdmin: user?.role === "ADMIN",
      isAnalyst: user?.role === "ANALYST",
      isViewer: user?.role === "VIEWER",
      setUser,
    }),
    [token, user, sessionReady, login, logout, register, refreshMe]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth outside AuthProvider");
  return ctx;
}
