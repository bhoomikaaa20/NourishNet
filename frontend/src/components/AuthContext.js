import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import api, { tokenStore } from "../api";

const AuthContext = createContext(null);

// The server decides what each role may do and sends the permission list with the
// session; the UI only uses it to hide what would be refused anyway.
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  // While a stored token is being verified we don't know yet if the user is logged in.
  const [checking, setChecking] = useState(Boolean(tokenStore.get()));

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  // Accepts any auth response: { token?, user }.
  const applySession = useCallback((data) => {
    if (data.token) tokenStore.set(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const login = useCallback(
    async (email, password) => applySession((await api.post("/api/auth/login", { email, password })).data),
    [applySession]
  );

  const register = useCallback(
    async (values) => applySession((await api.post("/api/auth/register", values)).data),
    [applySession]
  );

  // Re-reads the account from the server. Roles can change while someone is signed in
  // (promoted on the dashboard or in the database), so the cached permissions must
  // not be trusted for the whole session. Resolves with the current user or null.
  const refresh = useCallback(async () => {
    if (!tokenStore.get()) return null;
    try {
      const { data } = await api.get("/api/auth/me");
      setUser(data.user);
      return data.user;
    } catch (e) {
      // 401 already triggers logout via the session-expired event; keep the session on network errors.
      return null;
    }
  }, []);

  useEffect(() => {
    if (!tokenStore.get()) return;
    refresh().finally(() => setChecking(false));
  }, [refresh]);

  // Pick up role changes when the user comes back to the tab.
  useEffect(() => {
    const onFocus = () => document.visibilityState === "visible" && refresh();
    document.addEventListener("visibilitychange", onFocus);
    window.addEventListener("focus", onFocus);
    return () => {
      document.removeEventListener("visibilitychange", onFocus);
      window.removeEventListener("focus", onFocus);
    };
  }, [refresh]);

  useEffect(() => {
    window.addEventListener("nourishnet:session-expired", logout);
    return () => window.removeEventListener("nourishnet:session-expired", logout);
  }, [logout]);

  const value = useMemo(() => {
    const permissions = user?.permissions || [];
    const can = (permission) => permissions.includes(permission);
    return {
      user,
      // Kept for components written before user accounts existed.
      admin: user?.role === "admin" ? user : null,
      isLoggedIn: Boolean(user),
      isAdmin: can("dashboard:read"),
      can,
      checking,
      login,
      register,
      logout,
      applySession,
      refresh,
    };
  }, [user, checking, login, register, logout, applySession, refresh]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);

// Where to send someone after signing in when they weren't headed anywhere.
export const homeFor = (user) =>
  user?.permissions?.includes("dashboard:read") ? "/dashboard" : "/account";
