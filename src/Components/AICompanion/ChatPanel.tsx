import { useRef, useEffect, type FC } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import type { ChatMessage } from "../../types/aiAssistant";
import { ChatMessageItem } from "./ChatMessageItem";
import { ChatInput } from "./ChatInput";
import { SuggestedQuestions } from "./SuggestedQuestions";

interface ChatPanelProps {
  messages: ChatMessage[];
  isLoading: boolean;
  blogTitle: string;
  onSendMessage: (text: string) => void;
  onRetry?: (text: string) => void;
}

export const ChatPanel: FC<ChatPanelProps> = ({
  messages,
  isLoading,
  blogTitle,
  onSendMessage,
  onRetry,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  return (
    <div className="flex h-full flex-col justify-between overflow-hidden">
      {/* Scrollable messages container */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-2xs mb-3">
              <Sparkles size={24} />
            </div>
            <h3 className="text-base font-bold text-gray-900">
              AI Reading Assistant
            </h3>
            <p className="mt-1 max-w-xs text-xs text-gray-500 leading-relaxed">
              Ask questions, summarize key takeaways, or explore concepts from{" "}
              <span className="font-medium text-gray-700">"{blogTitle}"</span>.
            </p>

            <div className="mt-6 w-full text-left">
              <SuggestedQuestions
                onSelectQuestion={onSendMessage}
                disabled={isLoading}
              />
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <ChatMessageItem
                key={message.id}
                message={message}
                onRetry={onRetry}
              />
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-xs">
                  <Sparkles size={16} />
                </div>
                <div className="inline-flex items-center gap-2 rounded-2xl border border-gray-100 bg-white px-4 py-2.5 shadow-2xs">
                  <Loader2 size={14} className="animate-spin text-blue-600" />
                  <span className="font-medium text-gray-600">
                    Gemini is thinking...
                  </span>
                </div>
              </div>
            )}
          </>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-gray-100 bg-white/80 p-3 sm:p-4 backdrop-blur-xs">
        <ChatInput
          onSendMessage={onSendMessage}
          isLoading={isLoading}
          placeholder="Ask anything about this blog..."
        />
      </div>
    </div>
  );
};
