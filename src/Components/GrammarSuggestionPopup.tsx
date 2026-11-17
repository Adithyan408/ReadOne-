import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, X, Sparkles, AlertCircle, ArrowRight } from "lucide-react";
import type { GrammarCategory, GrammarIssue, PopupPosition } from "../types/grammar";

export interface GrammarSuggestionPopupProps {
  issue: GrammarIssue | null;
  position: PopupPosition | null;
  onAccept: (issue: GrammarIssue, replacement: string) => void;
  onIgnore: (issue: GrammarIssue) => void;
  onClose: () => void;
}

const CATEGORY_STYLES: Record<
  GrammarCategory,
  { label: string; badgeClass: string; iconClass: string }
> = {
  spelling: {
    label: "Spelling",
    badgeClass: "bg-red-50 text-red-700 border-red-200",
    iconClass: "text-red-500",
  },
  grammar: {
    label: "Grammar",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
    iconClass: "text-blue-500",
  },
  punctuation: {
    label: "Punctuation",
    badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
    iconClass: "text-amber-500",
  },
  style: {
    label: "Style & Clarity",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
    iconClass: "text-purple-500",
  },
};

export const GrammarSuggestionPopup: React.FC<GrammarSuggestionPopupProps> = ({
  issue,
  position,
  onAccept,
  onIgnore,
  onClose,
}) => {
  const popupRef = useRef<HTMLDivElement>(null);
  const [selectedReplacementIndex, setSelectedReplacementIndex] = useState<number>(0);
  const [prevIssueId, setPrevIssueId] = useState<string | undefined>(issue?.id);

  // Reset selected replacement during render when issue changes
  if (issue?.id !== prevIssueId) {
    setPrevIssueId(issue?.id);
    setSelectedReplacementIndex(0);
  }

  // Handle outside clicks to close popup
  useEffect(() => {
    if (!issue || !position) return;

    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement;
      if (
        popupRef.current &&
        !popupRef.current.contains(target) &&
        !target.closest(".grammar-issue")
      ) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, [issue, position, onClose]);

  if (!issue || !position) {
    return null;
  }

  const categoryMeta = CATEGORY_STYLES[issue.category] || CATEGORY_STYLES.grammar;
  const replacements = issue.replacements.length > 0 ? issue.replacements : [];
  const chosenReplacement = replacements[selectedReplacementIndex] || replacements[0] || "";

  const content = (
    <div
      ref={popupRef}
      style={{
        position: "absolute",
        top: `${position.top}px`,
        left: `${position.left}px`,
        zIndex: 99999,
      }}
      className="w-[calc(100vw-32px)] max-w-[340px] sm:max-w-[380px] rounded-2xl border border-gray-200/90 bg-white/95 p-4 shadow-2xl backdrop-blur-md transition-all duration-200 animate-in fade-in zoom-in-95"
      role="dialog"
      aria-label="Grammar Suggestion"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${categoryMeta.badgeClass}`}
          >
            <Sparkles size={12} className={categoryMeta.iconClass} />
            {categoryMeta.label}
          </span>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
          aria-label="Close suggestion"
        >
          <X size={15} />
        </button>
      </div>

      {/* Comparison: Original -> Suggested */}
      <div className="mt-3 flex items-center gap-2 flex-wrap text-sm">
        <span className="line-through decoration-red-500/80 text-gray-400 font-medium px-2 py-0.5 rounded-md bg-gray-50 border border-gray-100">
          {issue.originalText}
        </span>

        {replacements.length > 0 && (
          <>
            <ArrowRight size={14} className="text-gray-400 shrink-0" />
            <div className="flex flex-wrap gap-1.5 items-center">
              {replacements.slice(0, 3).map((rep, idx) => (
                <button
                  key={rep}
                  type="button"
                  onClick={() => setSelectedReplacementIndex(idx)}
                  className={`px-2.5 py-1 rounded-lg text-xs sm:text-sm font-semibold transition border ${selectedReplacementIndex === idx
                      ? "bg-emerald-50 text-emerald-700 border-emerald-300 shadow-xs"
                      : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                    }`}
                >
                  {rep}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Explanation message */}
      <div className="mt-2.5 text-xs text-gray-600 leading-relaxed flex items-start gap-1.5 bg-gray-50/70 p-2.5 rounded-xl border border-gray-100">
        <AlertCircle size={14} className="text-gray-400 shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-gray-700">{issue.shortMessage || issue.message}</p>
          {issue.shortMessage && issue.shortMessage !== issue.message && (
            <p className="text-gray-500 mt-0.5 text-[11px]">{issue.message}</p>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="mt-3 flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
        <button
          type="button"
          onClick={() => onIgnore(issue)}
          className="px-3 py-1.5 rounded-xl text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition"
        >
          Ignore
        </button>

        {chosenReplacement && (
          <button
            type="button"
            onClick={() => onAccept(issue, chosenReplacement)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 text-white shadow-xs hover:bg-emerald-700 active:scale-95 transition"
          >
            <Check size={13} />
            Accept "{chosenReplacement}"
          </button>
        )}
      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(content, document.body) : null;
};