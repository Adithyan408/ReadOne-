import { useState, type FC } from "react";
import { Languages, Loader2, Check, ArrowRight, RotateCcw } from "lucide-react";
import {
  SUPPORTED_TRANSLATION_LANGUAGES,
  type TranslationLanguage,
  type BlogContext,
  type TranslatedBlogData,
  type ActiveBlogView,
} from "../../types/aiAssistant";
import {
  translateBlogArticle,
  getCachedTranslation,
} from "../../services/translationService";

interface TranslationPanelProps {
  blog: BlogContext;
  activeView: ActiveBlogView;
  onApplyView: (view: ActiveBlogView) => void;
  onResetView: () => void;
}

export const TranslationPanel: FC<TranslationPanelProps> = ({
  blog,
  activeView,
  onApplyView,
  onResetView,
}) => {
  const [selectedLanguage, setSelectedLanguage] = useState<TranslationLanguage>("Malayalam");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [latestTranslation, setLatestTranslation] = useState<TranslatedBlogData | null>(() =>
    getCachedTranslation(blog.id, "Malayalam")
  );

  const isCurrentViewThisLanguage =
    activeView.type === "translated" &&
    activeView.metaInfo?.language === selectedLanguage;

  const handleLanguageChange = (lang: TranslationLanguage) => {
    setSelectedLanguage(lang);
    setError(null);
    const cached = getCachedTranslation(blog.id, lang);
    setLatestTranslation(cached);
  };

  const handleTranslate = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await translateBlogArticle(blog, selectedLanguage);
      setLatestTranslation(result);

      // Automatically apply to main view so user sees it
      onApplyView({
        type: "translated",
        title: result.translatedTitle,
        content: result.translatedContent,
        metaInfo: {
          language: selectedLanguage,
        },
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Translation failed. Please try again.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyToBlog = () => {
    if (!latestTranslation) return;
    onApplyView({
      type: "translated",
      title: latestTranslation.translatedTitle,
      content: latestTranslation.translatedContent,
      metaInfo: {
        language: selectedLanguage,
      },
    });
  };

  return (
    <div className="flex h-full flex-col justify-between overflow-y-auto p-4 sm:p-6 space-y-6">
      <div className="space-y-5">
        <div>
          <div className="flex items-center gap-2 text-blue-600 mb-1">
            <Languages size={18} />
            <h3 className="font-bold text-gray-900 text-base">Translate Blog Article</h3>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            Translate the entire blog article into your preferred language using Gemini while
            preserving headings, lists, formatting, and technical terms.
          </p>
        </div>

        {/* Language selector grid */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2.5">
            Select Language
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {SUPPORTED_TRANSLATION_LANGUAGES.map((lang) => {
              const isSelected = selectedLanguage === lang;
              const isCached = Boolean(getCachedTranslation(blog.id, lang));

              return (
                <button
                  key={lang}
                  type="button"
                  onClick={() => handleLanguageChange(lang)}
                  className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-medium transition border text-left ${isSelected
                      ? "border-blue-500 bg-blue-50 text-blue-700 shadow-2xs font-semibold"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                >
                  <span>{lang}</span>
                  {isSelected ? (
                    <Check size={14} className="text-blue-600" />
                  ) : isCached ? (
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" title="Cached" />
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        {/* Translation Status / Preview Card if available */}
        {latestTranslation && (
          <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/70 to-indigo-50/50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-900">
                {latestTranslation.language} Translation Ready
              </span>
              <span className="rounded-md bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-800">
                Session Cached
              </span>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-700">Translated Title:</p>
              <p className="text-sm font-bold text-gray-900 line-clamp-2 mt-0.5">
                {latestTranslation.translatedTitle}
              </p>
            </div>

            <div className="flex items-center gap-2 pt-1">
              {!isCurrentViewThisLanguage ? (
                <button
                  type="button"
                  onClick={handleApplyToBlog}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-blue-700 transition"
                >
                  <span>Apply to Reader</span>
                  <ArrowRight size={13} />
                </button>
              ) : (
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
                  <Check size={13} />
                  <span>Currently Reading in {selectedLanguage}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error alert */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            {error}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="pt-4 border-t border-gray-100 space-y-2">
        <button
          type="button"
          onClick={handleTranslate}
          disabled={isLoading}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-blue-700 active:scale-98 transition disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Translating into {selectedLanguage}...</span>
            </>
          ) : (
            <>
              <Languages size={16} />
              <span>
                {latestTranslation
                  ? `Re-translate into ${selectedLanguage}`
                  : `Translate into ${selectedLanguage}`}
              </span>
            </>
          )}
        </button>

        {activeView.type !== "original" && (
          <button
            type="button"
            onClick={onResetView}
            className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            <RotateCcw size={13} />
            <span>Return to Original English Article</span>
          </button>
        )}
      </div>
    </div>
  );
};