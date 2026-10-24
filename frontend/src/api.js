import axios from "axios";

// Override in frontend/.env (REACT_APP_API_URL=http://localhost:8087) for local development.
export const API_URL = (
  process.env.REACT_APP_API_URL || "http://localhost:8087"
).replace(/\/$/, "");

const TOKEN_KEY = "nourishnet_admin_token";

// sessionStorage keeps the admin session scoped to the tab.
export const tokenStore = {
  get() {
    try {
      return sessionStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token) {
    try {
      sessionStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* storage unavailable */
    }
  },
  clear() {
    try {
      sessionStorage.removeItem(TOKEN_KEY);
    } catch {
      /* storage unavailable */
    }
  },
};

const api = axios.create({ baseURL: API_URL, timeout: 30000 });

api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token && config.url.startsWith("/api/admin")) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// An expired/invalid admin session is announced so AuthContext can log out.
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && error.config?.url?.startsWith("/api/admin")) {
      window.dispatchEvent(new Event("nourishnet:session-expired"));
    }
    return Promise.reject(error);
  }
);

// Normalises any axios failure into { message, errors } for forms and toasts.
export const parseError = (error) => {
  if (error.response) {
    const data = error.response.data;
    return {
      message:
        (data && typeof data === "object" && data.message) ||
        "Something went wrong. Please try again.",
      errors: (data && typeof data === "object" && data.errors) || {},
      status: error.response.status,
    };
  }
  if (error.code === "ECONNABORTED") {
    return {
      message: "The server took too long to respond. It may be waking up, please try again in a moment.",
      errors: {},
    };
  }
  return {
    message: "Can't reach the server. Check your connection and try again.",
    errors: {},
  };
};

export default api;
