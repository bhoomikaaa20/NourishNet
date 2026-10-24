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

  useEffect(() => {
    if (!tokenStore.get()) return;
    api
      .get("/api/auth/me", { headers: { Authorization: `Bearer ${tokenStore.get()}` } })
      .then(({ data }) => setUser(data.user))
      .catch(() => tokenStore.clear())
      .finally(() => setChecking(false));
  }, []);

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
    };
  }, [user, checking, login, register, logout, applySession]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);

// Where to send someone after signing in when they weren't headed anywhere.
export const homeFor = (user) =>
  user?.permissions?.includes("dashboard:read") ? "/dashboard" : "/account";
