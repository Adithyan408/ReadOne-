import { useState, type FC } from "react";
import { Sparkles, Loader2, Check, ArrowRight, RotateCcw, BookOpen } from "lucide-react";
import {
  SIMPLIFICATION_OPTIONS,
  type SimplificationMode,
  type BlogContext,
  type SimplifiedBlogData,
  type ActiveBlogView,
} from "../../types/aiAssistant";
import {
  simplifyBlogArticle,
  getCachedSimplification,
} from "../../services/simplificationService";

interface SimplificationPanelProps {
  blog: BlogContext;
  activeView: ActiveBlogView;
  onApplyView: (view: ActiveBlogView) => void;
  onResetView: () => void;
}

export const SimplificationPanel: FC<SimplificationPanelProps> = ({
  blog,
  activeView,
  onApplyView,
  onResetView,
}) => {
  const [selectedMode, setSelectedMode] = useState<SimplificationMode>("simple");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [latestSimplified, setLatestSimplified] = useState<SimplifiedBlogData | null>(() =>
    getCachedSimplification(blog.id, "simple")
  );

  const isCurrentViewThisMode =
    activeView.type === "simplified" &&
    activeView.metaInfo?.mode === selectedMode;

  const handleModeChange = (mode: SimplificationMode) => {
    setSelectedMode(mode);
    setError(null);
    const cached = getCachedSimplification(blog.id, mode);
    setLatestSimplified(cached);
  };

  const handleSimplify = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await simplifyBlogArticle(blog, selectedMode);
      setLatestSimplified(result);

      onApplyView({
        type: "simplified",
        title: result.simplifiedTitle,
        content: result.simplifiedContent,
        metaInfo: {
          mode: selectedMode,
        },
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Simplification failed. Please try again.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyToBlog = () => {
    if (!latestSimplified) return;
    onApplyView({
      type: "simplified",
      title: latestSimplified.simplifiedTitle,
      content: latestSimplified.simplifiedContent,
      metaInfo: {
        mode: selectedMode,
      },
    });
  };

  return (
    <div className="flex h-full flex-col justify-between overflow-y-auto p-4 sm:p-6 space-y-6">
      <div className="space-y-5">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 mb-1">
            <BookOpen size={18} />
            <h3 className="font-bold text-gray-900 text-base">Simplify Blog Content</h3>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            Adapt and rewrite the entire blog post using Gemini according to your learning style and level of familiarity with the subject.
          </p>
        </div>

        {/* 3 Mode Selection Cards */}
        <div className="space-y-2.5">
          {SIMPLIFICATION_OPTIONS.map((opt) => {
            const isSelected = selectedMode === opt.id;
            const isCached = Boolean(getCachedSimplification(blog.id, opt.id));

            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleModeChange(opt.id)}
                className={`w-full rounded-2xl border p-3.5 text-left transition-all ${isSelected
                    ? "border-indigo-500 bg-indigo-50/70 shadow-xs ring-1 ring-indigo-500"
                    : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50"
                  }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-bold ${isSelected ? "text-indigo-900" : "text-gray-900"
                        }`}
                    >
                      {opt.title}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${isSelected
                          ? "bg-indigo-100 text-indigo-800"
                          : "bg-gray-100 text-gray-600"
                        }`}
                    >
                      {opt.badge}
                    </span>
                  </div>

                  {isSelected ? (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white">
                      <Check size={12} />
                    </div>
                  ) : isCached ? (
                    <span
                      className="h-2 w-2 rounded-full bg-emerald-400"
                      title="Cached in session"
                    />
                  ) : null}
                </div>

                <p className="mt-1.5 text-xs text-gray-500 leading-relaxed">
                  {opt.description}
                </p>
              </button>
            );
          })}
        </div>

        {/* Simplified Status / Preview Card */}
        {latestSimplified && (
          <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 to-purple-50/50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-900">
                {SIMPLIFICATION_OPTIONS.find((o) => o.id === latestSimplified.mode)?.title} Ready
              </span>
              <span className="rounded-md bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-800">
                Session Cached
              </span>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-700">Adapted Title:</p>
              <p className="text-sm font-bold text-gray-900 line-clamp-2 mt-0.5">
                {latestSimplified.simplifiedTitle}
              </p>
            </div>

            <div className="flex items-center gap-2 pt-1">
              {!isCurrentViewThisMode ? (
                <button
                  type="button"
                  onClick={handleApplyToBlog}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-indigo-700 transition"
                >
                  <span>Apply to Reader</span>
                  <ArrowRight size={13} />
                </button>
              ) : (
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
                  <Check size={13} />
                  <span>Currently Reading this Version</span>
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
          onClick={handleSimplify}
          disabled={isLoading}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-700 active:scale-98 transition disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Simplifying article with Gemini...</span>
            </>
          ) : (
            <>
              <Sparkles size={16} />
              <span>
                {latestSimplified
                  ? `Re-apply ${SIMPLIFICATION_OPTIONS.find((o) => o.id === selectedMode)?.title}`
                  : `Simplify with ${SIMPLIFICATION_OPTIONS.find((o) => o.id === selectedMode)?.title}`}
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
            <span>Return to Original Article</span>
          </button>
        )}
      </div>
    </div>
  );
};