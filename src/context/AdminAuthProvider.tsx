import { useState, useCallback, type ReactNode } from "react";
import { AdminAuthContext } from "./AdminAuthContext";
import {
  clearAdminAuthSnapshot,
  getBouncedAdminUsername,
  setAdminAuthSnapshot,
} from "../utils/rolePersistence";

const ADMIN_STORAGE_KEY = "readone_admin_session";
const ADMIN_USER_KEY = "readone_admin_username";

const clearPersistedAdminSession = () => {
  try {
    sessionStorage.removeItem(ADMIN_STORAGE_KEY);
    sessionStorage.removeItem(ADMIN_USER_KEY);
    localStorage.removeItem(ADMIN_STORAGE_KEY);
    localStorage.removeItem(ADMIN_USER_KEY);
  } catch {
    // ignore
  }
};

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  // Require fresh authentication on every URL navigation / reload;
  // only preserve an active session when bouncing straight back from an illegal Back press.
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    clearPersistedAdminSession();
    return Boolean(getBouncedAdminUsername());
  });

  const [adminUsername, setAdminUsername] = useState<string | null>(() =>
    getBouncedAdminUsername()
  );

  const login = useCallback(
    (
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
        const normalizedUser = envUsername.trim();
        setIsAdmin(true);
        setAdminUsername(normalizedUser);
        setAdminAuthSnapshot(normalizedUser);
        return { success: true };
      }

      return {
        success: false,
        error:
          "Invalid username or password. Please verify your admin credentials.",
      };
    },
    []
  );

  const logout = useCallback(() => {
    setIsAdmin(false);
    setAdminUsername(null);
    clearPersistedAdminSession();
    clearAdminAuthSnapshot();
  }, []);

  return (
    <AdminAuthContext.Provider
      value={{ isAdmin, adminUsername, login, logout }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export default AdminAuthProvider;
