import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import api, { tokenStore } from "../api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  // While a stored token is being verified we don't know yet if the user is logged in.
  const [checking, setChecking] = useState(Boolean(tokenStore.get()));

  const logout = useCallback(() => {
    tokenStore.clear();
    setAdmin(null);
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post("/api/auth/login", { email, password });
    tokenStore.set(data.token);
    setAdmin(data.admin);
  }, []);

  useEffect(() => {
    if (!tokenStore.get()) return;
    api
      .get("/api/auth/me", { headers: { Authorization: `Bearer ${tokenStore.get()}` } })
      .then(({ data }) => setAdmin(data.admin))
      .catch(() => tokenStore.clear())
      .finally(() => setChecking(false));
  }, []);

  useEffect(() => {
    window.addEventListener("nourishnet:session-expired", logout);
    return () => window.removeEventListener("nourishnet:session-expired", logout);
  }, [logout]);

  const value = useMemo(
    () => ({ admin, isLoggedIn: Boolean(admin), checking, login, logout }),
    [admin, checking, login, logout]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
