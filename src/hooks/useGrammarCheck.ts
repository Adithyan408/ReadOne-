import { useState, useRef, useCallback, useEffect } from "react";
import type { Editor } from "@tiptap/react";
import type { GrammarIssue, GrammarStatus, PopupPosition } from "../types/grammar";
import { checkGrammar } from "../services/grammarService";
import { extractTextWithMapping, mapMatchesToIssues } from "../extensions/grammarExtension";

export interface UseGrammarCheckOptions {
  enabled?: boolean;
  debounceMs?: number;
  language?: string;
}

export interface UseGrammarCheckReturn {
  status: GrammarStatus;
  errorMessage: string | null;
  issues: GrammarIssue[];
  activeIssue: GrammarIssue | null;
  popupPosition: PopupPosition | null;
  enabled: boolean;
  setEnabled: (val: boolean | ((prev: boolean) => boolean), editor?: Editor | null) => void;
  toggleEnabled: (editor: Editor | null) => void;
  triggerCheck: (editor: Editor | null) => void;
  acceptIssue: (editor: Editor | null, issue: GrammarIssue, replacement: string) => void;
  ignoreIssue: (editor: Editor | null, issue: GrammarIssue) => void;
  selectIssue: (issue: GrammarIssue | null, rect?: DOMRect | null) => void;
  clearActiveIssue: () => void;
  recheck: (editor: Editor | null) => void;
}

export function useGrammarCheck({
  enabled: initialEnabled = true,
  debounceMs = 1200,
  language = "en-US",
}: UseGrammarCheckOptions = {}): UseGrammarCheckReturn {
  const [enabled, setEnabledState] = useState<boolean>(initialEnabled);
  const [status, setStatus] = useState<GrammarStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [issues, setIssues] = useState<GrammarIssue[]>([]);
  const [activeIssue, setActiveIssue] = useState<GrammarIssue | null>(null);
  const [popupPosition, setPopupPosition] = useState<PopupPosition | null>(null);
  const [ignoredIds, setIgnoredIds] = useState<Set<string>>(new Set());

  const enabledRef = useRef<boolean>(initialEnabled);
  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  const debounceTimerRef = useRef<number | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastCheckedTextRef = useRef<string>("");
  const checkVersionRef = useRef<number>(0);

  const clearTimersAndRequests = useCallback(() => {
    if (debounceTimerRef.current !== null) {
      window.clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    checkVersionRef.current++;
    lastCheckedTextRef.current = "";
  }, []);

  const resetState = useCallback(
    (editor?: Editor | null) => {
      clearTimersAndRequests();
      setIssues([]);
      setActiveIssue(null);
      setPopupPosition(null);
      setStatus("idle");
      setErrorMessage(null);

      if (editor && !editor.isDestroyed) {
        editor.commands.setGrammarEnabled(false);
        editor.commands.clearGrammarIssues();
      }
    },
    [clearTimersAndRequests]
  );

  // Clear debounce timer and in-flight request on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current !== null) {
        window.clearTimeout(debounceTimerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // When enabled transitions to false, clear pending timers and abort requests
  useEffect(() => {
    if (!enabled) {
      clearTimersAndRequests();
    }
  }, [enabled, clearTimersAndRequests]);

  const performCheck = useCallback(
    async (editor: Editor) => {
      if (!enabledRef.current || editor.isDestroyed) {
        clearTimersAndRequests();
        return;
      }

      const { doc } = editor.state;
      const { text, offsetToPos } = extractTextWithMapping(doc);
      const trimmedText = text.trim();

      // If document is empty, reset to idle
      if (!trimmedText) {
        setStatus("idle");
        setErrorMessage(null);
        setIssues([]);
        editor.commands.clearGrammarIssues();
        lastCheckedTextRef.current = "";
        return;
      }

      // If text has not changed, do not re-request API
      if (text === lastCheckedTextRef.current) {
        return;
      }

      // Cancel any ongoing in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const currentVersion = ++checkVersionRef.current;
      setStatus("checking");
      setErrorMessage(null);

      try {
        const matches = await checkGrammar(text, language, controller.signal);

        // Stale response check: If assistant was disabled while in-flight or editor destroyed
        if (!enabledRef.current || editor.isDestroyed) {
          clearTimersAndRequests();
          return;
        }

        // If a newer check was triggered, discard this result
        if (currentVersion !== checkVersionRef.current) {
          return;
        }

        lastCheckedTextRef.current = text;

        // Map matches to document positions
        const mappedIssues = mapMatchesToIssues(matches, editor.state.doc, offsetToPos, ignoredIds);

        setIssues(mappedIssues);
        editor.commands.setGrammarIssues(mappedIssues);

        if (mappedIssues.length === 0) {
          setStatus("clean");
        } else {
          setStatus("has-issues");
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") {
          return; // Request was aborted due to new typing or disabling, do nothing
        }

        if (!enabledRef.current || editor.isDestroyed) {
          return;
        }

        if (currentVersion === checkVersionRef.current) {
          const msg = err instanceof Error ? err.message : "Grammar check failed";
          setErrorMessage(msg);
          setStatus("error");
        }
      }
    },
    [language, ignoredIds, clearTimersAndRequests]
  );

  const triggerCheck = useCallback(
    (editor: Editor | null) => {
      if (!editor || !enabledRef.current || editor.isDestroyed) {
        if (debounceTimerRef.current !== null) {
          window.clearTimeout(debounceTimerRef.current);
          debounceTimerRef.current = null;
        }
        return;
      }

      if (debounceTimerRef.current !== null) {
        window.clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = window.setTimeout(() => {
        if (enabledRef.current && editor && !editor.isDestroyed) {
          performCheck(editor);
        }
      }, debounceMs);
    },
    [debounceMs, performCheck]
  );

  const recheck = useCallback(
    (editor: Editor | null) => {
      if (!editor || !enabledRef.current || editor.isDestroyed) return;
      if (debounceTimerRef.current !== null) {
        window.clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      lastCheckedTextRef.current = ""; // Force recheck
      performCheck(editor);
    },
    [performCheck]
  );

  const toggleEnabled = useCallback(
    (editor: Editor | null) => {
      const next = !enabledRef.current;
      enabledRef.current = next;
      setEnabledState(next);

      if (!next) {
        resetState(editor);
      } else {
        if (editor && !editor.isDestroyed) {
          editor.commands.setGrammarEnabled(true);
          lastCheckedTextRef.current = "";
          performCheck(editor);
        }
      }
    },
    [resetState, performCheck]
  );

  const setEnabled = useCallback(
    (val: boolean | ((prev: boolean) => boolean), editor?: Editor | null) => {
      setEnabledState((prev) => {
        const next = typeof val === "function" ? val(prev) : val;
        enabledRef.current = next;
        if (!next) {
          resetState(editor);
        } else if (editor && !editor.isDestroyed) {
          editor.commands.setGrammarEnabled(true);
          lastCheckedTextRef.current = "";
          performCheck(editor);
        }
        return next;
      });
    },
    [resetState, performCheck]
  );

  const selectIssue = useCallback((issue: GrammarIssue | null, rect?: DOMRect | null) => {
    setActiveIssue(issue);

    if (issue && rect) {
      // Calculate responsive coordinates near the highlighted mistake
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      const scrollX = window.scrollX || document.documentElement.scrollLeft;

      // Position popup slightly below the underlined word by default
      let top = rect.bottom + scrollY + 8;
      let left = rect.left + scrollX;

      // Ensure popup doesn't overflow right edge on mobile/small screens
      const popupWidth = 320;
      if (rect.left + popupWidth > window.innerWidth - 16) {
        left = Math.max(16, window.innerWidth - popupWidth - 16 + scrollX);
      }

      // If close to bottom of screen, show above the word
      let placement: "top" | "bottom" = "bottom";
      if (rect.bottom + 220 > window.innerHeight) {
        top = Math.max(8, rect.top + scrollY - 200);
        placement = "top";
      }

      setPopupPosition({ top, left, placement });
    } else {
      setPopupPosition(null);
    }
  }, []);

  const clearActiveIssue = useCallback(() => {
    setActiveIssue(null);
    setPopupPosition(null);
  }, []);

  const acceptIssue = useCallback(
    (editor: Editor | null, issue: GrammarIssue, replacement: string) => {
      if (!editor) return;

      const success = editor.commands.acceptGrammarIssue(issue.id, replacement);
      if (success) {
        setIssues((prev) => prev.filter((i) => i.id !== issue.id));
        clearActiveIssue();

        // Check if all issues were resolved
        setIssues((prev) => {
          if (prev.length <= 1) {
            setStatus("clean");
          }
          return prev.filter((i) => i.id !== issue.id);
        });

        // Trigger a follow-up recheck after a brief moment to update context
        window.setTimeout(() => {
          lastCheckedTextRef.current = ""; // ensure fresh check
          performCheck(editor);
        }, 500);
      }
    },
    [clearActiveIssue, performCheck]
  );

  const ignoreIssue = useCallback(
    (editor: Editor | null, issue: GrammarIssue) => {
      if (!editor) return;

      editor.commands.ignoreGrammarIssue(issue.id);
      setIgnoredIds((prev) => new Set(prev).add(issue.id).add(issue.ruleId));
      setIssues((prev) => {
        const remaining = prev.filter((i) => i.id !== issue.id);
        if (remaining.length === 0) {
          setStatus("clean");
        }
        return remaining;
      });
      clearActiveIssue();
    },
    [clearActiveIssue]
  );

  return {
    status: enabled ? status : "idle",
    errorMessage: enabled ? errorMessage : null,
    issues: enabled ? issues : [],
    activeIssue: enabled ? activeIssue : null,
    popupPosition: enabled ? popupPosition : null,
    enabled,
    setEnabled,
    toggleEnabled,
    triggerCheck,
    acceptIssue,
    ignoreIssue,
    selectIssue,
    clearActiveIssue,
    recheck,
  };
}

