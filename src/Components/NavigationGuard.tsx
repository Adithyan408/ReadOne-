import { useLayoutEffect, useRef } from "react";
import { useLocation, useNavigate, useNavigationType } from "react-router-dom";
import { useAdminAuth } from "../hooks/useAdminAuth";
import {
  getActiveRole,
  getLastAdminPath,
  getLastUserPath,
  isAdminPathname,
  setActiveRole,
  setLastAdminPath,
  setLastUserPath,
} from "../utils/rolePersistence";

/**
 * Enforces role-based and route-based navigation rules across the application:
 * 1. Browser Back/Forward ('POP') must NEVER transition Admin -> User or User -> Admin;
 *    role persists unless an explicit URL-driven or in-app action switches roles.
 * 2. Prevents Back/Forward navigation away from Admin Dashboard or Admin Login.
 * 3. Prevents Back/Forward navigation away from Home ('/').
 * 4. Clears admin authentication when explicitly leaving /admin routes.
 */
export default function NavigationGuard() {
  const location = useLocation();
  const navigate = useNavigate();
  const navigationType = useNavigationType();
  const { isAdmin, logout } = useAdminAuth();

  const prevPathRef = useRef<string>(location.pathname);
  const prevStateRef = useRef<unknown>(location.state);

  useLayoutEffect(() => {
    const prevPath = prevPathRef.current;
    const prevState = prevStateRef.current;
    const currPath = location.pathname;
    const currFullPath = `${currPath}${location.search}${location.hash}`;

    if (prevPath === currPath) {
      if (isAdminPathname(currPath)) {
        setLastAdminPath(currFullPath);
      } else {
        setLastUserPath(currFullPath);
      }
      prevStateRef.current = location.state;
      return;
    }

    const isPop = navigationType === "POP";
    const activeRole = getActiveRole();
    const wasOnAdminSide = isAdminPathname(prevPath);
    const wasOnAdminDashboard =
    wasOnAdminSide && prevPath !== "/admin/login";
    const isNowAdminSide = isAdminPathname(currPath);

    // 1. Block Admin -> User transition via Browser Back/Forward; persist Admin role
    if (isPop && (wasOnAdminSide || activeRole === "admin") && !isNowAdminSide) {
      setActiveRole("admin");
      const restorePath = wasOnAdminSide ? prevPath : getLastAdminPath();
      navigate(restorePath, { replace: true, state: prevState });
      return;
    }

    // 2. Block User -> Admin transition via Browser Back/Forward; persist User role
    if (isPop && (!wasOnAdminSide || activeRole === "user") && isNowAdminSide) {
      if (isAdmin) {
        queueMicrotask(logout);
      }
      setActiveRole("user");
      const restorePath = !wasOnAdminSide ? prevPath : getLastUserPath();
      navigate(restorePath, { replace: true, state: prevState });
      return;
    }

    // 3. Block Back/Forward navigation once Admin Dashboard is reached
    if (isPop && wasOnAdminDashboard && isAdmin) {
      navigate(prevPath, { replace: true, state: prevState });
      return;
    }

      // 4. Block Back/Forward navigation away from Admin Login into another route
      if (isPop && prevPath === "/admin/login" && currPath !== "/admin/login") {
        navigate("/admin/login", { replace: true, state: prevState });
        return;
      }

        // 5. Block Back/Forward navigation once Home page ('/') is reached
        if (isPop && prevPath === "/" && currPath !== "/") {
          navigate("/", { replace: true });
          return;
        }

        // 6. Explicit non-POP navigation: update tracked role/paths & clear admin auth on exit
        if (!isNowAdminSide && isAdmin) {
          queueMicrotask(logout);
        }

        if (isNowAdminSide) {
          setActiveRole("admin");
          setLastAdminPath(currFullPath);
        } else {
          setActiveRole("user");
          setLastUserPath(currFullPath);
        }

        prevPathRef.current = currPath;
  prevStateRef.current = location.state;
}, [
  location.pathname,
  location.search,
  location.hash,
  location.state,
  navigationType,
  isAdmin,
  logout,
  navigate,
]);

return null;
}
