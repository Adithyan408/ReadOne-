import { useState, useEffect, useRef, type FC, type RefObject } from "react";
import { Sparkles, HelpCircle, Lightbulb, BookA, Wand2, Compass } from "lucide-react";
import type { ParagraphAction } from "../../types/aiAssistant";

interface ParagraphAIActionProps {
  containerRef: RefObject<HTMLElement | null>;
  onTriggerAction: (selectedText: string, action: ParagraphAction) => void;
}

export const ParagraphAIAction: FC<ParagraphAIActionProps> = ({
  containerRef,
  onTriggerAction,
}) => {
  const [selectedText, setSelectedText] = useState<string>("");
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || !containerRef.current) {
        if (!isActionMenuOpen) {
          setPosition(null);
          setSelectedText("");
        }
        return;
      }

      const text = selection.toString().trim();
      // Minimum 10 characters to avoid triggering on accidental micro-clicks
      if (text.length < 10) {
        if (!isActionMenuOpen) {
          setPosition(null);
          setSelectedText("");
        }
        return;
      }

      // Check if selection is inside containerRef
      const range = selection.getRangeAt(0);
      const commonAncestor = range.commonAncestorContainer;
      if (!containerRef.current.contains(commonAncestor)) {
        return;
      }

      const rect = range.getBoundingClientRect();
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      const scrollX = window.scrollX || document.documentElement.scrollLeft;

      // Position floating pill slightly above or below the selection
      let top = rect.top + scrollY - 48;
      if (top < scrollY + 10) {
        top = rect.bottom + scrollY + 10;
      }

      let left = rect.left + scrollX + rect.width / 2 - 140;
      // Clamp left position to stay inside viewport
      left = Math.max(16, Math.min(left, window.innerWidth - 300));

      setSelectedText(text);
      setPosition({ top, left });
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, [containerRef, isActionMenuOpen]);

  // Close when clicked outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setPosition(null);
        setSelectedText("");
        setIsActionMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  if (!position || !selectedText) {
    return null;
  }

  const handleAction = (action: ParagraphAction) => {
    onTriggerAction(selectedText, action);
    // Clear selection after action
    window.getSelection()?.removeAllRanges();
    setPosition(null);
    setSelectedText("");
    setIsActionMenuOpen(false);
  };

  return (
    <div
      ref={menuRef}
      style={{ top: `${position.top}px`, left: `${position.left}px` }}
      className="fixed z-40 flex items-center rounded-2xl border border-blue-200/90 bg-white/95 p-1.5 shadow-xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150"
    >
      {!isActionMenuOpen ? (
        <button
          type="button"
          onClick={() => setIsActionMenuOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:brightness-110 active:scale-95"
        >
          <Sparkles size={14} />
          <span>Ask AI About This</span>
        </button>
      ) : (
        <div className="flex flex-wrap items-center gap-1 max-w-[340px] sm:max-w-none">
          <button
            type="button"
            onClick={() => handleAction("explain")}
            className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-blue-50 hover:text-blue-700"
            title="Explain this paragraph in simple terms"
          >
            <HelpCircle size={14} className="text-blue-600" />
            <span>Explain</span>
          </button>

          <button
            type="button"
            onClick={() => handleAction("example")}
            className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-emerald-50 hover:text-emerald-700"
            title="Give real-world examples"
          >
            <Lightbulb size={14} className="text-emerald-600" />
            <span>Examples</span>
          </button>

          <button
            type="button"
            onClick={() => handleAction("terms")}
            className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-amber-50 hover:text-amber-700"
            title="Explain technical terms"
          >
            <BookA size={14} className="text-amber-600" />
            <span>Terms</span>
          </button>

          <button
            type="button"
            onClick={() => handleAction("simplify")}
            className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-purple-50 hover:text-purple-700"
            title="Rewrite in simple English"
          >
            <Wand2 size={14} className="text-purple-600" />
            <span>Simplify</span>
          </button>

          <button
            type="button"
            onClick={() => handleAction("context")}
            className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-cyan-50 hover:text-cyan-700"
            title="Provide additional context"
          >
            <Compass size={14} className="text-cyan-600" />
            <span>Context</span>
          </button>
        </div>
      )}
    </div>
  );
};
