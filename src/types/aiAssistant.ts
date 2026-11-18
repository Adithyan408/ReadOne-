export type MessageRole = "user" | "model" | "system";

export interface SourceAttribution {
  title: string;
  url: string;
  snippet?: string;
  source: "wikipedia" | "web";
}

export type ParagraphAction =
  | "explain"
  | "example"
  | "terms"
  | "simplify"
  | "context";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  sources?: SourceAttribution[];
  isError?: boolean;
  selectedTextSnippet?: string;
  actionType?: "chat" | "explain-paragraph" | "simplify" | "translate" | "explore";
}

export interface BlogContext {
  id: string;
  title: string;
  description: string;
  content: string;
  rawHtml: string;
  author: string;
  dateString: string;
}

export type TranslationLanguage =
  | "Malayalam"
  | "Hindi"
  | "Tamil"
  | "Kannada"
  | "Telugu"
  | "Arabic"
  | "French"
  | "German"
  | "Spanish"
  | "Japanese"
  | "English";

export const SUPPORTED_TRANSLATION_LANGUAGES: TranslationLanguage[] = [
  "Malayalam",
  "Hindi",
  "Tamil",
  "Kannada",
  "Telugu",
  "Arabic",
  "French",
  "German",
  "Spanish",
  "Japanese",
  "English",
];

export type SimplificationMode = "simple" | "beginner" | "detailed";

export interface SimplificationOption {
  id: SimplificationMode;
  title: string;
  badge: string;
  description: string;
}

export const SIMPLIFICATION_OPTIONS: SimplificationOption[] = [
  {
    id: "simple",
    title: "Simple English",
    badge: "Plain Language",
    description: "Rewrites complex sentences into easy-to-understand English using common vocabulary.",
  },
  {
    id: "beginner",
    title: "Beginner Explanation",
    badge: "New to Subject",
    description: "Explains unfamiliar terms and includes relatable, real-world examples for newcomers.",
  },
  {
    id: "detailed",
    title: "Detailed Explanation",
    badge: "In-Depth Breakdown",
    description: "Thoroughly explains key concepts, breaks complex ideas into smaller parts with deep context.",
  },
];

export interface TranslatedBlogData {
  language: TranslationLanguage;
  translatedTitle: string;
  translatedContent: string;
  cachedAt: number;
}

export interface SimplifiedBlogData {
  mode: SimplificationMode;
  simplifiedTitle: string;
  simplifiedContent: string;
  cachedAt: number;
}

export interface WikipediaSearchResult {
  title: string;
  snippet: string;
  pageId: number;
  url: string;
}

export interface WikipediaPageSummary {
  title: string;
  extract: string;
  description?: string;
  url: string;
}

export type CompanionActiveTab = "chat" | "translate" | "simplify";

export interface ActiveBlogView {
  type: "original" | "translated" | "simplified";
  title: string;
  content: string;
  metaInfo?: {
    language?: TranslationLanguage;
    mode?: SimplificationMode;
  };
}

