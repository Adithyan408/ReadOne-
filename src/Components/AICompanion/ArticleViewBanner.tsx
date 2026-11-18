import type { FC } from "react";
import { ArrowLeft, Languages, Sparkles } from "lucide-react";
import type { ActiveBlogView } from "../../types/aiAssistant";

interface ArticleViewBannerProps {
  activeView: ActiveBlogView;
  onResetToOriginal: () => void;
  onOpenCompanion: () => void;
}

export const ArticleViewBanner: FC<ArticleViewBannerProps> = ({
  activeView,
  onResetToOriginal,
  onOpenCompanion,
}) => {
  if (activeView.type === "original") {
    return null;
  }

  const isTranslation = activeView.type === "translated";
  const language = activeView.metaInfo?.language;
  const mode = activeView.metaInfo?.mode;

  const titleText = isTranslation
    ? `Translated to ${language || "another language"}`
    : mode === "simple"
      ? "Viewing Simple English Version"
      : mode === "beginner"
        ? "Viewing Beginner Explanation"
        : "Viewing Detailed Explanation";

  const descriptionText = isTranslation
    ? "This article was translated using Gemini. Technical terms and original formatting have been preserved."
    : "This version was adapted by Gemini to make the article clearer and easier to understand.";

  return (
    <div className="mb-6 rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50/90 via-indigo-50/80 to-purple-50/80 p-4 shadow-xs sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-blue-600 p-2.5 text-white shadow-xs shrink-0">
            {isTranslation ? <Languages size={18} /> : <Sparkles size={18} />}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm sm:text-base font-bold text-gray-900">
                {titleText}
              </span>
              <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
                AI Powered
              </span>
            </div>
            <p className="mt-0.5 text-xs sm:text-sm text-gray-600">
              {descriptionText}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <button
            type="button"
            onClick={onOpenCompanion}
            className="rounded-xl border border-gray-200 bg-white/90 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-white hover:text-blue-600"
          >
            Options
          </button>
          <button
            type="button"
            onClick={onResetToOriginal}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-blue-700"
          >
            <ArrowLeft size={14} />
            <span>Original Article</span>
          </button>
        </div>
      </div>
    </div>
  );
};