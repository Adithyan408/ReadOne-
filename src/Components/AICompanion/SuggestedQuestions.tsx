import type { FC } from "react";
import { Sparkles } from "lucide-react";
import { PREDEFINED_QUESTIONS } from "../../services/blogAssistantService";

interface SuggestedQuestionsProps {
  onSelectQuestion: (question: string) => void;
  disabled?: boolean;
}

export const SuggestedQuestions: FC<SuggestedQuestionsProps> = ({
  onSelectQuestion,
  disabled = false,
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
        <Sparkles size={14} className="text-blue-500" />
        <span>Suggested Questions</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {PREDEFINED_QUESTIONS.map((q, idx) => (
          <button
            key={idx}
            type="button"
            disabled={disabled}
            onClick={() => onSelectQuestion(q)}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-left text-xs font-medium text-gray-700 shadow-2xs transition-all hover:border-blue-300 hover:bg-blue-50/60 hover:text-blue-700 active:scale-98 disabled:opacity-50"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
};
