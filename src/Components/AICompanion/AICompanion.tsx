import { useState, useCallback, useImperativeHandle, forwardRef } from "react";
import {
  Sparkles,
  X,
  RotateCcw,
  MessageSquare,
  Languages,
  BookOpen,
} from "lucide-react";
import type {
  BlogContext,
  ChatMessage,
  CompanionActiveTab,
  ParagraphAction,
  ActiveBlogView,
} from "../../types/aiAssistant";
import {
  askBlogAssistant,
  explainParagraphWithAction,
} from "../../services/blogAssistantService";
import { ChatPanel } from "./ChatPanel";
import { TranslationPanel } from "./TranslationPanel";
import { SimplificationPanel } from "./SimplificationPanel";

export interface AICompanionHandle {
  executeParagraphAction: (selectedText: string, action: ParagraphAction) => void;
}

export interface AICompanionProps {
  blog: BlogContext;
  activeView: ActiveBlogView;
  onApplyView: (view: ActiveBlogView) => void;
  onResetView: () => void;
  isOpen: boolean;
  onToggleOpen: () => void;
  onClose: () => void;
}

export const AICompanion = forwardRef<AICompanionHandle, AICompanionProps>(function AICompanion(
  {
    blog,
    activeView,
    onApplyView,
    onResetView,
    isOpen,
    onToggleOpen,
    onClose,
  },
  ref
) {
  const [activeTab, setActiveTab] = useState<CompanionActiveTab>("chat");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Send a question to the assistant
  const handleSendMessage = useCallback(
    async (text: string, selectedTextSnippet?: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      const userMsgId = `user_${Date.now()}`;
      const userMessage: ChatMessage = {
        id: userMsgId,
        role: "user",
        content: trimmed,
        timestamp: Date.now(),
        selectedTextSnippet,
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      try {
        const { answer, sources } = await askBlogAssistant({
          question: trimmed,
          blog,
          history: messages,
        });

        const botMessage: ChatMessage = {
          id: `model_${Date.now()}`,
          role: "model",
          content: answer,
          timestamp: Date.now(),
          sources,
        };

        setMessages((prev) => [...prev, botMessage]);
      } catch (err: unknown) {
        const errorText =
          err instanceof Error
            ? err.message
            : "An unexpected error occurred while communicating with Gemini.";

        const errorMessage: ChatMessage = {
          id: `err_${Date.now()}`,
          role: "model",
          content: errorText,
          timestamp: Date.now(),
          isError: true,
        };

        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    [blog, messages, isLoading]
  );

  // Handle paragraph AI actions
  const executeParagraphAction = useCallback(
    async (selectedParagraph: string, action: ParagraphAction) => {
      setActiveTab("chat");

      let actionLabel = "Explain this paragraph";
      switch (action) {
        case "example":
          actionLabel = "Provide real-world examples for this paragraph";
          break;
        case "terms":
          actionLabel = "Explain technical terms in this paragraph";
          break;
        case "simplify":
          actionLabel = "Simplify this paragraph";
          break;
        case "context":
          actionLabel = "Give additional context for this paragraph";
          break;
      }

      const userMsgId = `user_${Date.now()}`;
      const userMessage: ChatMessage = {
        id: userMsgId,
        role: "user",
        content: actionLabel,
        timestamp: Date.now(),
        selectedTextSnippet: selectedParagraph.slice(0, 200) + (selectedParagraph.length > 200 ? "..." : ""),
        actionType: "explain-paragraph",
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      try {
        const answer = await explainParagraphWithAction({
          paragraph: selectedParagraph,
          action,
          blog,
        });

        const botMessage: ChatMessage = {
          id: `model_${Date.now()}`,
          role: "model",
          content: answer,
          timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, botMessage]);
      } catch (err: unknown) {
        const errorText =
          err instanceof Error ? err.message : "Failed to analyze the selected paragraph.";

        const errorMessage: ChatMessage = {
          id: `err_${Date.now()}`,
          role: "model",
          content: errorText,
          timestamp: Date.now(),
          isError: true,
        };

        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    [blog]
  );

  useImperativeHandle(
    ref,
    () => ({
      executeParagraphAction: (selectedParagraph: string, action: ParagraphAction) => {
        if (!isOpen) {
          onToggleOpen();
        }
        executeParagraphAction(selectedParagraph, action);
      },
    }),
    [isOpen, onToggleOpen, executeParagraphAction]
  );

  const handleClearHistory = () => {
    if (window.confirm("Clear active chat conversation history?")) {
      setMessages([]);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-40">
        <button
          type="button"
          onClick={onToggleOpen}
          aria-label={isOpen ? "Close AI Reading Assistant" : "Open AI Reading Assistant"}
          className={`group flex items-center gap-2.5 rounded-full px-4 py-3 sm:px-5 sm:py-3.5 font-semibold text-white shadow-xl transition-all duration-300 active:scale-95 ${isOpen
              ? "bg-gray-800 hover:bg-gray-900 ring-2 ring-gray-400"
              : "bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:shadow-blue-500/25 hover:brightness-110"
            }`}
        >
          <div className="relative">
            <Sparkles size={18} className="animate-spin-slow text-amber-300" />
            {!isOpen && (
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
            )}
          </div>
          <span className="text-sm tracking-wide">
            {isOpen ? "Close Assistant" : "Ask AI"}
          </span>
        </button>
      </div>

      {/* Expandable Chat & Tools Panel */}
      {isOpen && (
        <div className="fixed inset-x-2 bottom-20 sm:bottom-24 sm:right-6 sm:left-auto z-50 flex h-[580px] sm:h-[640px] w-auto sm:w-[440px] flex-col rounded-3xl border border-gray-200/90 bg-white/95 shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-6 duration-200 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-purple-50/60 px-4 py-3 sm:px-5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-xs">
                <Sparkles size={16} />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold text-gray-900">
                    AI Blog Companion
                  </h3>
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-800">
                    Gemini
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 line-clamp-1 max-w-[200px]">
                  {blog.title}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {activeTab === "chat" && messages.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearHistory}
                  title="Clear conversation"
                  className="rounded-xl p-1.5 text-gray-400 transition hover:bg-white hover:text-gray-700"
                >
                  <RotateCcw size={15} />
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                title="Close assistant"
                className="rounded-xl p-1.5 text-gray-400 transition hover:bg-white hover:text-gray-700"
              >
                <X size={17} />
              </button>
            </div>
          </div>

          {/* Feature Navigation Tabs */}
          <div className="flex border-b border-gray-100 bg-gray-50/60 p-1">
            <button
              type="button"
              onClick={() => setActiveTab("chat")}
              className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition ${activeTab === "chat"
                  ? "bg-white text-blue-700 shadow-2xs"
                  : "text-gray-500 hover:text-gray-800"
                }`}
            >
              <MessageSquare size={14} />
              <span>Ask & Chat</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("translate")}
              className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition ${activeTab === "translate"
                  ? "bg-white text-blue-700 shadow-2xs"
                  : "text-gray-500 hover:text-gray-800"
                }`}
            >
              <Languages size={14} />
              <span>Translate</span>
              {activeView.type === "translated" && (
                <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("simplify")}
              className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition ${activeTab === "simplify"
                  ? "bg-white text-blue-700 shadow-2xs"
                  : "text-gray-500 hover:text-gray-800"
                }`}
            >
              <BookOpen size={14} />
              <span>Simplify</span>
              {activeView.type === "simplified" && (
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
              )}
            </button>
          </div>

          {/* Active Tab View */}
          <div className="flex-1 overflow-hidden">
            {activeTab === "chat" && (
              <ChatPanel
                messages={messages}
                isLoading={isLoading}
                blogTitle={blog.title}
                onSendMessage={handleSendMessage}
                onRetry={handleSendMessage}
              />
            )}

            {activeTab === "translate" && (
              <TranslationPanel
                blog={blog}
                activeView={activeView}
                onApplyView={onApplyView}
                onResetView={onResetView}
              />
            )}

            {activeTab === "simplify" && (
              <SimplificationPanel
                blog={blog}
                activeView={activeView}
                onApplyView={onApplyView}
                onResetView={onResetView}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
});