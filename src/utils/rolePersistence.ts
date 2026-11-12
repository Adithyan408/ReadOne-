const ROLE_STORAGE_KEY = "readone_active_role";
const LAST_ADMIN_PATH_KEY = "readone_last_admin_path";
const LAST_USER_PATH_KEY = "readone_last_user_path";
const ADMIN_AUTH_SNAPSHOT_KEY = "readone_admin_authed";
const ROLE_BOUNCE_KEY = "readone_role_bounce";

export type AppRole = "admin" | "user";

let bouncedAdminUsername: string | null = null;

export const isAdminPathname = (pathname: string): boolean =>
  pathname === "/admin" || pathname.startsWith("/admin/");

export const getActiveRole = (): AppRole | null => {
  try {
    const val = sessionStorage.getItem(ROLE_STORAGE_KEY);
    return val === "admin" || val === "user" ? val : null;
  } catch {
    return null;
  }
};

export const setActiveRole = (role: AppRole): void => {
  try {
    sessionStorage.setItem(ROLE_STORAGE_KEY, role);
  } catch {
    // ignore storage limits
  }
};

export const getLastAdminPath = (): string => {
  try {
    const val = sessionStorage.getItem(LAST_ADMIN_PATH_KEY);
    return val && isAdminPathname(val.split("?")[0].split("#")[0]) ? val : "/admin";
  } catch {
    return "/admin";
  }
};

export const setLastAdminPath = (path: string): void => {
  try {
    if (isAdminPathname(path.split("?")[0].split("#")[0])) {
      sessionStorage.setItem(LAST_ADMIN_PATH_KEY, path);
    }
  } catch {
    // ignore
  }
};

export const getLastUserPath = (): string => {
  try {
    const val = sessionStorage.getItem(LAST_USER_PATH_KEY);
    return val && !isAdminPathname(val.split("?")[0].split("#")[0]) ? val : "/";
  } catch {
    return "/";
  }
};

export const setLastUserPath = (path: string): void => {
  try {
    if (!isAdminPathname(path.split("?")[0].split("#")[0])) {
      sessionStorage.setItem(LAST_USER_PATH_KEY, path || "/");
    }
  } catch {
    // ignore
  }
};

export const setAdminAuthSnapshot = (username: string): void => {
  try {
    sessionStorage.setItem(ADMIN_AUTH_SNAPSHOT_KEY, username);
  } catch {
    // ignore
  }
};

export const clearAdminAuthSnapshot = (): void => {
  bouncedAdminUsername = null;
  try {
    sessionStorage.removeItem(ADMIN_AUTH_SNAPSHOT_KEY);
    sessionStorage.removeItem(ROLE_BOUNCE_KEY);
  } catch {
    // ignore
  }
};

export const getBouncedAdminUsername = (): string | null => bouncedAdminUsername;

const getBrowserNavigationType = (): string => {
  try {
    const entries = performance.getEntriesByType(
      "navigation"
    ) as PerformanceNavigationTiming[];
    return entries[0]?.type || "navigate";
  } catch {
    return "navigate";
  }
};

const replaceWithPersistedRole = (
  expectedRole: AppRole,
  fallbackPath: string
): void => {
  document.documentElement.style.visibility = "hidden";

  try {
    if (
      expectedRole === "admin" &&
      sessionStorage.getItem(ADMIN_AUTH_SNAPSHOT_KEY)
    ) {
      sessionStorage.setItem(ROLE_BOUNCE_KEY, "1");
    }
  } catch {
    // ignore
  }

  window.location.replace(fallbackPath);
};

/**
 * Enforces role persistence across full-page Back/Forward document loads
 * and bfcache restores, while allowing explicit URL-driven redirections
 * ('navigate' / 'reload') to switch roles and require /admin re-auth.
 *
 * Returns true if app initialization should continue normally, or false if a
 * cross-role redirect is in progress.
 */
export const enforceRoleOnDocumentLoad = (): boolean => {
  if (typeof window === "undefined") return true;

  const pathname = window.location.pathname;
  const fullPath = `${pathname}${window.location.search}${window.location.hash}`;
  const onAdminUrl = isAdminPathname(pathname);
  const navType = getBrowserNavigationType();
  const savedRole = getActiveRole();

  let isRoleBounce: boolean;
  try {
    isRoleBounce = sessionStorage.getItem(ROLE_BOUNCE_KEY) === "1";
    sessionStorage.removeItem(ROLE_BOUNCE_KEY);
  } catch {
    isRoleBounce = false;
  }

  window.addEventListener("pageshow", (event) => {
    if (!event.persisted) {
      document.documentElement.style.visibility = "";
      return;
    }

    const currentPath = window.location.pathname;
    const isCurrentAdmin = isAdminPathname(currentPath);
    const activeRole = getActiveRole();

    if (activeRole === "admin" && !isCurrentAdmin) {
      replaceWithPersistedRole("admin", getLastAdminPath());
      return;
    }

    if (activeRole === "user" && isCurrentAdmin) {
      replaceWithPersistedRole("user", getLastUserPath());
      return;
    }

    document.documentElement.style.visibility = "";
  });

  if (navType === "back_forward" && savedRole) {
    if (savedRole === "admin" && !onAdminUrl) {
      replaceWithPersistedRole("admin", getLastAdminPath());
      return false;
    }

    if (savedRole === "user" && onAdminUrl) {
      replaceWithPersistedRole("user", getLastUserPath());
      return false;
    }
  }

  // Only preserve admin auth when bouncing straight back from an illegal Back press;
  // direct URL bar navigation ('navigate') or reload ('reload') must re-authenticate.
  if (onAdminUrl && isRoleBounce) {
    try {
      bouncedAdminUsername = sessionStorage.getItem(ADMIN_AUTH_SNAPSHOT_KEY);
    } catch {
      bouncedAdminUsername = null;
    }
  } else {
    clearAdminAuthSnapshot();
  }

  // Explicit URL-driven navigation ('navigate' / 'reload') updates active role cleanly
  if (onAdminUrl) {
    setActiveRole("admin");
    setLastAdminPath(fullPath);
  } else {
    setActiveRole("user");
    setLastUserPath(fullPath);
  }

  return true;
};
