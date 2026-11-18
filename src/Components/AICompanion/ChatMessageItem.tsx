import type { FC, ReactNode } from "react";
import { User, ExternalLink, AlertCircle, Sparkles } from "lucide-react";
import type { ChatMessage } from "../../types/aiAssistant";

interface ChatMessageItemProps {
  message: ChatMessage;
  onRetry?: (text: string) => void;
}

/**
 * Basic markdown-to-HTML parser for formatted headings, bullet points,
 * bold text, and code blocks in AI responses.
 */
function renderFormattedContent(content: string) {
  const lines = content.split("\n");
  const renderedElements: ReactNode[] = [];

  let inList = false;
  let listItems: string[] = [];

  const flushList = (key: string) => {
    if (listItems.length > 0) {
      renderedElements.push(
        <ul key={key} className="my-2 ml-4 list-disc space-y-1 text-inherit">
          {listItems.map((item, idx) => (
            <li key={idx} dangerouslySetInnerHTML={{ __html: formatInline(item) }} />
          ))}
        </ul>
      );
      listItems = [];
      inList = false;
    }
  };

  const formatInline = (text: string): string => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
      .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-gray-100 font-mono text-xs text-blue-700">$1</code>');
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (!trimmed) {
      flushList(`list-${index}`);
      renderedElements.push(<div key={`space-${index}`} className="h-2" />);
      return;
    }

    // Bullet point
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ") || /^\d+\.\s/.test(trimmed)) {
      inList = true;
      const cleanItem = trimmed.replace(/^[-*]\s+|\d+\.\s+/, "");
      listItems.push(cleanItem);
      return;
    }

    flushList(`list-${index}`);

    // Headings
    if (trimmed.startsWith("### ")) {
      renderedElements.push(
        <h4 key={`h3-${index}`} className="mt-3 mb-1 font-bold text-sm text-gray-900">
          {trimmed.replace(/^###\s+/, "")}
        </h4>
      );
      return;
    }
    if (trimmed.startsWith("## ")) {
      renderedElements.push(
        <h3 key={`h2-${index}`} className="mt-3 mb-1 font-bold text-base text-gray-900">
          {trimmed.replace(/^##\s+/, "")}
        </h3>
      );
      return;
    }
    if (trimmed.startsWith("# ")) {
      renderedElements.push(
        <h2 key={`h1-${index}`} className="mt-3 mb-1 font-extrabold text-lg text-gray-900">
          {trimmed.replace(/^#\s+/, "")}
        </h2>
      );
      return;
    }

    // Blockquote
    if (trimmed.startsWith("> ")) {
      renderedElements.push(
        <blockquote
          key={`quote-${index}`}
          className="my-2 border-l-3 border-blue-400 pl-3 italic text-gray-600 bg-blue-50/50 py-1 rounded-r"
        >
          {trimmed.replace(/^>\s+/, "")}
        </blockquote>
      );
      return;
    }

    // Normal paragraph
    renderedElements.push(
      <p
        key={`p-${index}`}
        className="leading-relaxed text-inherit"
        dangerouslySetInnerHTML={{ __html: formatInline(trimmed) }}
      />
    );
  });

  if (inList) {
    flushList("list-end");
  }

  return renderedElements;
}

export const ChatMessageItem: FC<ChatMessageItemProps> = ({ message, onRetry }) => {
  const isUser = message.role === "user";
  const formattedTime = new Date(message.timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className={`flex w-full gap-2.5 sm:gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {/* Bot Icon */}
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-xs">
          <Sparkles size={16} />
        </div>
      )}

      {/* Message Bubble Container */}
      <div className={`flex max-w-[85%] sm:max-w-[80%] flex-col ${isUser ? "items-end" : "items-start"}`}>
        {/* Selected Excerpt Pill if this question was for a selected paragraph */}
        {message.selectedTextSnippet && (
          <div className="mb-1.5 max-w-full rounded-lg border border-blue-100 bg-blue-50/90 px-3 py-1.5 text-xs text-blue-900 shadow-2xs">
            <span className="font-semibold block text-[11px] uppercase tracking-wider text-blue-700">
              Selected Excerpt
            </span>
            <p className="italic line-clamp-2 text-gray-700 mt-0.5">
              "{message.selectedTextSnippet}"
            </p>
          </div>
        )}

        <div
          className={`rounded-2xl px-4 py-3 text-sm shadow-2xs ${isUser
              ? "bg-blue-600 text-white rounded-tr-xs"
              : message.isError
                ? "bg-red-50 text-red-900 border border-red-200 rounded-tl-xs"
                : "bg-white text-gray-800 border border-gray-100 rounded-tl-xs shadow-xs"
            }`}
        >
          {message.isError ? (
            <div className="flex items-start gap-2.5">
              <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-800">{message.content}</p>
                {onRetry && (
                  <button
                    type="button"
                    onClick={() => onRetry(message.content)}
                    className="mt-2 text-xs font-semibold text-red-700 underline hover:text-red-900"
                  >
                    Retry request
                  </button>
                )}
              </div>
            </div>
          ) : isUser ? (
            <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
          ) : (
            <div className="space-y-1">{renderFormattedContent(message.content)}</div>
          )}
        </div>

        {/* Source References (Wikipedia MediaWiki API) */}
        {message.sources && message.sources.length > 0 && (
          <div className="mt-2.5 w-full rounded-xl border border-gray-200/80 bg-gray-50/90 p-2.5 text-xs">
            <span className="block font-semibold text-[11px] uppercase tracking-wider text-gray-500 mb-1.5">
              External Sources & References
            </span>
            <div className="flex flex-wrap gap-2">
              {message.sources.map((src, idx) => (
                <a
                  key={idx}
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-blue-600 transition hover:border-blue-300 hover:bg-blue-50/50 hover:underline shadow-2xs"
                  title={src.snippet || src.title}
                >
                  <span>{src.title}</span>
                  <ExternalLink size={12} className="text-gray-400" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Timestamp */}
        <span className="mt-1 px-1 text-[10px] text-gray-400">{formattedTime}</span>
      </div>

      {/* User Icon */}
      {isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gray-200 text-gray-700">
          <User size={16} />
        </div>
      )}
    </div>
  );
};