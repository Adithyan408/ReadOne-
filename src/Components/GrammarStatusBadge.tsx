import React from "react";
import { CheckCircle2, AlertTriangle, Loader2, Sparkles, RefreshCw } from "lucide-react";
import type { GrammarIssue, GrammarStatus } from "../types/grammar";

export interface GrammarStatusBadgeProps {
  status: GrammarStatus;
  issues: GrammarIssue[];
  errorMessage?: string | null;
  enabled: boolean;
  onToggleEnabled?: () => void;
  onRetry?: () => void;
  onJumpToNext?: () => void;
}

export const GrammarStatusBadge: React.FC<GrammarStatusBadgeProps> = ({
  status,
  issues,
  errorMessage,
  enabled,
  onToggleEnabled,
  onRetry,
  onJumpToNext,
}) => {
  if (!enabled) {
    return (
      <button
        type="button"
        onClick={onToggleEnabled}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition border border-dashed border-gray-200"
        title="Grammar assistant is paused. Click to enable."
      >
        <Sparkles size={13} />
        <span>Assistant paused</span>
      </button>
    );
  }

  if (status === "checking") {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 animate-pulse">
        <Loader2 size={13} className="animate-spin text-blue-600" />
        <span>Checking...</span>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200">
        <AlertTriangle size={13} className="text-amber-600 shrink-0" />
        <span className="truncate max-w-[140px] sm:max-w-[200px]" title={errorMessage || "Check failed"}>
          {errorMessage || "Check failed"}
        </span>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="p-0.5 rounded text-amber-700 hover:bg-amber-100 transition"
            title="Retry grammar check"
          >
            <RefreshCw size={11} />
          </button>
        )}
      </div>
    );
  }

  if (status === "has-issues" || issues.length > 0) {
    const spellingCount = issues.filter((i) => i.category === "spelling").length;
    const grammarCount = issues.filter((i) => i.category === "grammar").length;
    const punctuationCount = issues.filter((i) => i.category === "punctuation").length;

    return (
      <button
        type="button"
        onClick={onJumpToNext}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200 hover:bg-red-100/80 transition cursor-pointer shadow-xs"
        title="Click to jump to next issue"
      >
        <span className="flex h-2 w-2 rounded-full bg-red-500 animate-ping" />
        <span>
          {issues.length} {issues.length === 1 ? "suggestion" : "suggestions"}
        </span>
        <span className="text-[10px] text-red-500/80 hidden sm:inline">
          ({spellingCount > 0 ? `${spellingCount} spell` : ""}
          {spellingCount > 0 && grammarCount > 0 ? ", " : ""}
          {grammarCount > 0 ? `${grammarCount} gram` : ""}
          {(spellingCount > 0 || grammarCount > 0) && punctuationCount > 0 ? ", " : ""}
          {punctuationCount > 0 ? `${punctuationCount} punct` : ""})
        </span>
      </button>
    );
  }

  // Clean state
  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200">
      <CheckCircle2 size={13} className="text-emerald-600" />
      <span>All clear</span>
    </div>
  );
};

