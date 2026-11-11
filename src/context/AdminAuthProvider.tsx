import { useState, type ReactNode } from "react";
import { AdminAuthContext } from "./AdminAuthContext";

const ADMIN_STORAGE_KEY = "readone_admin_session";
const ADMIN_USER_KEY = "readone_admin_username";

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    try {
      const session = sessionStorage.getItem(ADMIN_STORAGE_KEY);
      const local = localStorage.getItem(ADMIN_STORAGE_KEY);
      return session === "true" || local === "true";
    } catch {
      return false;
    }
  });

  const [adminUsername, setAdminUsername] = useState<string | null>(() => {
    try {
      return (
        sessionStorage.getItem(ADMIN_USER_KEY) ||
        localStorage.getItem(ADMIN_USER_KEY) ||
        null
      );
    } catch {
      return null;
    }
  });

  const login = (
    username: string,
    password: string
  ): { success: boolean; error?: string } => {
    const trimmedUser = username.trim();

    // Access ADMIN_USERNAME and ADMIN_PASSWORD from .env
    const envUsername =
      import.meta.env.ADMIN_USERNAME ||
      import.meta.env.VITE_ADMIN_USERNAME ||
      "admin";
    const envPassword =
      import.meta.env.ADMIN_PASSWORD ||
      import.meta.env.VITE_ADMIN_PASSWORD ||
      "Admin@123";

    if (
      trimmedUser.toLowerCase() === envUsername.trim().toLowerCase() &&
      password === envPassword
    ) {
      setIsAdmin(true);
      setAdminUsername(envUsername.trim());

      try {
        sessionStorage.setItem(ADMIN_STORAGE_KEY, "true");
        sessionStorage.setItem(ADMIN_USER_KEY, envUsername.trim());
        localStorage.setItem(ADMIN_STORAGE_KEY, "true");
        localStorage.setItem(ADMIN_USER_KEY, envUsername.trim());
      } catch {
        // ignore
      }

      return { success: true };
    }

    return {
      success: false,
      error: "Invalid username or password. Please verify your admin credentials.",
    };
  };

  const logout = () => {
    setIsAdmin(false);
    setAdminUsername(null);
    try {
      sessionStorage.removeItem(ADMIN_STORAGE_KEY);
      sessionStorage.removeItem(ADMIN_USER_KEY);
      localStorage.removeItem(ADMIN_STORAGE_KEY);
      localStorage.removeItem(ADMIN_USER_KEY);
    } catch {
      // ignore
    }
  };

  return (
    <AdminAuthContext.Provider
      value={{ isAdmin, adminUsername, login, logout }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export default AdminAuthProvider;

