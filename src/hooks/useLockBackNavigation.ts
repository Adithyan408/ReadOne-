import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

/**
 * Prevents browser back-button navigation away from the current view
 * while mounted and enabled. Pushes a history trap entry for the active URL
 * and immediately re-pushes it whenever a popstate event fires.
 */
export function useLockBackNavigation(enabled: boolean = true) {
  const location = useLocation();
  const lockedHrefRef = useRef<string>(window.location.href);

  useEffect(() => {
    if (!enabled) return;

    const targetHref = window.location.href;
    lockedHrefRef.current = targetHref;

    const currentState = window.history.state as { __backTrapHref?: string } | null;
    if (!currentState || currentState.__backTrapHref !== targetHref) {
      window.history.pushState(
        { ...(currentState || {}), __backTrapHref: targetHref },
        "",
        targetHref
      );
    }

    const handlePopState = () => {
      const trapHref = lockedHrefRef.current;
      const stateAfterPop = window.history.state as Record<string, unknown> | null;
      window.history.pushState(
        { ...(stateAfterPop || {}), __backTrapHref: trapHref },
        "",
        trapHref
      );
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [enabled, location.pathname, location.search, location.hash]);
}

