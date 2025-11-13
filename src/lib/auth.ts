import Cookies from "js-cookie";
import { config } from "./config";

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

export interface User {
  id: string;
  email: string;
  name?: string;
  role?: string;
  [key: string]: unknown;
}

export const setToken = (token: string): void => {
  if (config.tokenStorage === "cookie") {
    Cookies.set(TOKEN_KEY, token, {
      expires: config.sessionTimeout / (1000 * 60 * 60 * 24),
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });
  } else {
    localStorage.setItem(TOKEN_KEY, token);
  }
};

export const getToken = (): string | null => {
  if (typeof window === "undefined") return null;

  if (config.tokenStorage === "cookie") {
    return Cookies.get(TOKEN_KEY) || null;
  }
  return localStorage.getItem(TOKEN_KEY);
};

export const clearToken = (): void => {
  if (config.tokenStorage === "cookie") {
    Cookies.remove(TOKEN_KEY);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
  localStorage.removeItem(USER_KEY);
};

export const setUser = (user: User): void => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const getUser = (): User | null => {
  if (typeof window === "undefined") return null;

  const userStr = localStorage.getItem(USER_KEY);
  if (!userStr) return null;

  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

export const isAuthenticated = (): boolean => {
  return !!getToken();
};

export const decodeToken = (token: string): Record<string, unknown> | null => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};
