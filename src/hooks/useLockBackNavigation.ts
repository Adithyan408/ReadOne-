import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Keeps the current history entry normalized via replaceState without pushing
 * synthetic trap entries onto window.history, so reaching Home or Admin leaves
 * no artificial Back history to click.
 */
export function useLockBackNavigation(enabled: boolean = true) {
  const location = useLocation();

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    try {
      window.history.replaceState(
        window.history.state,
        "",
        window.location.href
      );
    } catch {
      // ignore replaceState errors
    }
  }, [enabled, location.pathname, location.search, location.hash]);
}
