import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import { useEffect } from "react";
import CharacterCount from "@tiptap/extension-character-count";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import Typography from "@tiptap/extension-typography";
import "../BlogEditor.css";
import { GrammarExtension } from "../extensions/grammarExtension";
import { useGrammarCheck } from "../hooks/useGrammarCheck";
import { GrammarSuggestionPopup } from "./GrammarSuggestionPopup";
import { GrammarStatusBadge } from "./GrammarStatusBadge";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Undo2,
  Redo2,
  Code,
  Minus,
  Sparkles,
} from "lucide-react";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

function ToolbarButton({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-2 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${active ? "bg-black text-white" : "hover:bg-gray-100 text-gray-700"
        }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-6 bg-gray-200 mx-1" />;
}

function BlogEditor({ value, onChange }: Props) {
  const {
    status,
    errorMessage,
    issues,
    activeIssue,
    popupPosition,
    enabled: isGrammarEnabled,
    toggleEnabled,
    triggerCheck,
    acceptIssue,
    ignoreIssue,
    selectIssue,
    clearActiveIssue,
    recheck,
  } = useGrammarCheck();

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
      }),
      Placeholder.configure({
        placeholder: "Start writing your story...",
      }),
      CharacterCount,
      Typography,
      Highlight,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      GrammarExtension.configure({
        enabled: isGrammarEnabled,
        onSelectIssue: (issue, rect) => {
          selectIssue(issue, rect);
        },
      }),
    ],

    content: value,

    editorProps: {
      attributes: {
        class: "min-h-[240px] sm:min-h-[400px] p-3.5 sm:p-5 outline-none prose max-w-none",
      },
    },

    onUpdate({ editor }) {
      onChange(editor.getHTML());
      if (isGrammarEnabled) {
        triggerCheck(editor);
      }
    },
  });

  // Keep editor grammar extension state in sync with enabled flag
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    editor.commands.setGrammarEnabled(isGrammarEnabled);
    if (!isGrammarEnabled) {
      editor.commands.clearGrammarIssues();
    }
  }, [editor, isGrammarEnabled]);

  useEffect(() => {
    if (!editor || editor.isDestroyed) return;

    if (editor.getHTML() !== value) {
      editor.commands.setContent(value, {
        emitUpdate: false,
      });
      if (isGrammarEnabled) {
        triggerCheck(editor);
      }
    }
}, [value, editor, isGrammarEnabled, triggerCheck]);

// Initial grammar check on editor ready
useEffect(() => {
  if (!editor || editor.isDestroyed || !isGrammarEnabled) return;
  triggerCheck(editor);
}, [editor, isGrammarEnabled, triggerCheck]);

if (!editor) return null;

const handleJumpToNext = () => {
  if (!editor || issues.length === 0) return;
  const nextIssue = issues[0];
  try {
    editor.chain().focus().setTextSelection({ from: nextIssue.from, to: nextIssue.to }).run();
    const coords = editor.view.coordsAtPos(nextIssue.from);
    const rect = new DOMRect(
      coords.left,
      coords.top,
      Math.max(20, nextIssue.to - nextIssue.from),
      Math.max(20, coords.bottom - coords.top)
    );
    selectIssue(nextIssue, rect);
  } catch {
    // ignore selection positioning errors
  }
};

return (
  <div className="border rounded-2xl overflow-hidden">
    {/* Toolbar */}
    <div className="flex flex-wrap items-center gap-1 border-b p-2 bg-gray-50/50">
      <ToolbarButton
        title="Undo"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
      >
        <Undo2 size={17} />
      </ToolbarButton>
      <ToolbarButton
        title="Redo"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
      >
        <Redo2 size={17} />
      </ToolbarButton>

      <Divider />

      <ToolbarButton
        title="Heading 1"
        active={editor.isActive("heading", { level: 1 })}
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 1 }).run()
        }
      >
        <Heading1 size={18} />
      </ToolbarButton>
      <ToolbarButton
        title="Heading 2"
        active={editor.isActive("heading", { level: 2 })}
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 2 }).run()
        }
      >
        <Heading2 size={17} />
      </ToolbarButton>
      <ToolbarButton
        title="Heading 3"
        active={editor.isActive("heading", { level: 3 })}
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 3 }).run()
        }
      >
        <Heading3 size={16} />
      </ToolbarButton>

      <Divider />

      <ToolbarButton
        title="Bold"
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold size={17} />
      </ToolbarButton>
      <ToolbarButton
        title="Italic"
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic size={17} />
      </ToolbarButton>
      <ToolbarButton
        title="Underline"
        active={editor.isActive("underline")}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <UnderlineIcon size={17} />
      </ToolbarButton>
      <ToolbarButton
        title="Strikethrough"
        active={editor.isActive("strike")}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough size={17} />
      </ToolbarButton>
      <ToolbarButton
        title="Inline code"
        active={editor.isActive("code")}
        onClick={() => editor.chain().focus().toggleCode().run()}
      >
        <Code size={17} />
      </ToolbarButton>

      <Divider />

      <ToolbarButton
        title="Bullet list"
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List size={17} />
      </ToolbarButton>
      <ToolbarButton
        title="Numbered list"
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered size={17} />
      </ToolbarButton>
      <ToolbarButton
        title="Quote"
        active={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Quote size={17} />
      </ToolbarButton>
      <ToolbarButton
        title="Divider"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
      >
        <Minus size={17} />
      </ToolbarButton>

      <Divider />

      {/* Grammarly Assistant Toggle */}
      <div className="ml-auto flex items-center">
        <button
          type="button"
          onClick={() => toggleEnabled(editor)}
          title={isGrammarEnabled ? "Grammar Assistant is active" : "Enable Grammar Assistant"}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${isGrammarEnabled
            ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100/80 border border-emerald-200 shadow-2xs"
            : "bg-gray-100 text-gray-400 hover:text-gray-600 border border-gray-200/80"
            }`}
        >
          <Sparkles size={14} className={isGrammarEnabled ? "text-emerald-600" : "text-gray-400"} />
          <span className="hidden sm:inline">Grammar Assistant</span>
          <span
            className={`h-1.5 w-1.5 rounded-full ${isGrammarEnabled ? "bg-emerald-500" : "bg-gray-300"}`}
          />
        </button>
      </div>
    </div>

    {/* Editor body */}
    <EditorContent editor={editor} />

    {/* Footer with Grammar status badge & word count */}
    <div className="flex flex-wrap items-center justify-between gap-2 border-t px-4 py-2.5 bg-gray-50/40 text-xs text-gray-500">
      <GrammarStatusBadge
        status={status}
        issues={issues}
        errorMessage={errorMessage}
        enabled={isGrammarEnabled}
        onToggleEnabled={() => toggleEnabled(editor)}
        onRetry={() => recheck(editor)}
        onJumpToNext={handleJumpToNext}
      />

      <div className="text-gray-400 font-medium">
        {editor.storage.characterCount
          ? `${editor.storage.characterCount.words()} words`
          : `${editor.getText().trim().split(/\s+/).filter(Boolean).length} words`}
      </div>
    </div>

    {/* Suggestion Popup */}
    {isGrammarEnabled && (
      <GrammarSuggestionPopup
        issue={activeIssue}
        position={popupPosition}
        onAccept={(issue, replacement) => acceptIssue(editor, issue, replacement)}
        onIgnore={(issue) => ignoreIssue(editor, issue)}
        onClose={clearActiveIssue}
      />
    )}
  </div>
);
}

export default BlogEditor;
