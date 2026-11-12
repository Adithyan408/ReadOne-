import { useState, useCallback, type ReactNode } from "react";
import { AdminAuthContext } from "./AdminAuthContext";

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
  // Always start unauthenticated on every full page load / URL navigation to /admin
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    clearPersistedAdminSession();
    return false;
  });

  const [adminUsername, setAdminUsername] = useState<string | null>(null);

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
              setIsAdmin(true);
              setAdminUsername(envUsername.trim());
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
