import { httpsCallable } from "firebase/functions";
import { functions } from "../firebase/firebase";
import type {
  CheckGrammarRequest,
  CheckGrammarResponse,
  GrammarCategory,
  LanguageToolMatch,
  LanguageToolResponse,
  LanguageToolRule,
} from "../types/grammar";

export const MAX_TEXT_LENGTH = 20000;

/**
 * Maps LanguageTool rule category and issue type to one of the 4 user-facing categories:
 * - spelling (Red wavy underline)
 * - grammar (Blue wavy underline)
 * - punctuation (Yellow wavy underline)
 * - style (Purple wavy underline)
 */
export function categorizeRule(rule: LanguageToolRule): {
  category: GrammarCategory;
  categoryName: string;
} {
  const categoryId = rule.category?.id?.toUpperCase() || "";
  const issueType = rule.issueType?.toLowerCase() || "";

  if (issueType === "misspelling" || categoryId === "TYPOS") {
    return { category: "spelling", categoryName: "Spelling" };
  }

  if (
    categoryId === "PUNCTUATION" ||
    issueType === "whitespace" ||
    rule.id.includes("COMMA") ||
    rule.id.includes("PUNCTUATION")
  ) {
    return { category: "punctuation", categoryName: "Punctuation" };
  }

  if (
    categoryId === "STYLE" ||
    categoryId === "REDUNDANCY" ||
    categoryId === "COLLOQUIALISMS" ||
    issueType === "style"
  ) {
    return { category: "style", categoryName: "Style & Clarity" };
  }

  return { category: "grammar", categoryName: rule.category?.name || "Grammar" };
}

/**
 * Fallback direct LanguageTool API call used when Cloud Function is offline or undeployed locally.
 */
async function fallbackDirectLanguageTool(
  text: string,
  language: string = "en-US",
  signal?: AbortSignal
): Promise<LanguageToolMatch[]> {
  const params = new URLSearchParams();
  params.append("text", text);
  params.append("language", language);

  const response = await fetch("https://api.languagetool.org/v2/check", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: params.toString(),
    signal,
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error("LanguageTool rate limit reached. Please wait a moment.");
    }
    throw new Error(`Grammar checking service returned status ${response.status}`);
  }

  const data = (await response.json()) as LanguageToolResponse;
  return data.matches || [];
}

/**
 * Requests grammar and spelling suggestions.
 * First tries the secure Firebase Cloud Function `checkGrammar`.
 * If undeployed or inaccessible in local dev, gracefully falls back to LanguageTool API.
 */
export async function checkGrammar(
  text: string,
  language: string = "en-US",
  signal?: AbortSignal
): Promise<LanguageToolMatch[]> {
  const trimmed = text.trim();
  if (!trimmed) {
    return [];
  }

  if (trimmed.length > MAX_TEXT_LENGTH) {
    throw new Error(`Text exceeds maximum allowed length of ${MAX_TEXT_LENGTH} characters.`);
  }

  // Attempt call via Firebase Cloud Function
  try {
    const checkGrammarFn = httpsCallable<CheckGrammarRequest, CheckGrammarResponse>(
      functions,
      "checkGrammar",
      { timeout: 12000 }
    );

    const result = await checkGrammarFn({
      text,
      language,
    });

    if (result.data && Array.isArray(result.data.matches)) {
      return result.data.matches;
    }
  } catch (error: unknown) {
    // If the Cloud Function is not found/not deployed or fails with internal error in local dev,
    // fallback gracefully to direct LanguageTool call so editing is never blocked.
    const isCloudFunctionUnavailable =
      error instanceof Error &&
      (error.message.includes("not-found") ||
        error.message.includes("internal") ||
        error.message.includes("unauthenticated") ||
        error.message.includes("unavailable") ||
        error.message.includes("Failed to fetch") ||
        error.message.includes("FunctionsError"));

    if (isCloudFunctionUnavailable) {
      return await fallbackDirectLanguageTool(text, language, signal);
    }

    throw error;
  }

  return [];
}

