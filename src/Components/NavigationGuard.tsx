import { useLayoutEffect, useRef } from "react";
import { useLocation, useNavigate, useNavigationType } from "react-router-dom";
import { useAdminAuth } from "../hooks/useAdminAuth";

/**
 * Enforces navigation rules across the application:
 * 1. Prevents browser Back/Forward navigation once the Admin Dashboard is reached.
 * 2. Prevents browser Back/Forward navigation once the Home page ('/') is reached.
 * 3. Prevents navigating from the User side into the Admin side via browser Back/Forward.
 * 4. Clears admin authentication whenever navigating away from /admin routes.
 */
export default function NavigationGuard() {
  const location = useLocation();
  const navigate = useNavigate();
  const navigationType = useNavigationType();
  const { isAdmin, logout } = useAdminAuth();

  const prevPathRef = useRef<string>(location.pathname);

  useLayoutEffect(() => {
    const prevPath = prevPathRef.current;
    const currPath = location.pathname;

    if (prevPath === currPath) {
      return;
    }

    const isPop = navigationType === "POP";
    const wasOnAdminDashboard =
      prevPath.startsWith("/admin") && prevPath !== "/admin/login";
    const wasOnUserSide = !prevPath.startsWith("/admin");
    const isNowAdminSide = currPath.startsWith("/admin");

    // 1. Block Back/Forward navigation once Admin Dashboard is reached
    if (isPop && wasOnAdminDashboard && isAdmin) {
      navigate(prevPath, { replace: true });
      return;
    }

    // 2. Block Back/Forward navigation once Home page ('/') is reached
    if (isPop && prevPath === "/" && currPath !== "/") {
      navigate("/", { replace: true });
      return;
    }

    // 3. Block User side -> Admin side transition via Back/Forward button
    if (isPop && wasOnUserSide && isNowAdminSide) {
      if (isAdmin) {
        queueMicrotask(logout);
      }
      navigate(prevPath, { replace: true });
      return;
    }

    // 4. Clear admin session whenever leaving /admin routes
    if (!isNowAdminSide && isAdmin) {
      queueMicrotask(logout);
    }

    prevPathRef.current = currPath;
  }, [location.pathname, navigationType, isAdmin, logout, navigate]);

  return null;
}

