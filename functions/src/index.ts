import { onCall, HttpsError } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import * as admin from "firebase-admin";

admin.initializeApp();

// Firebase Secret Manager declarations for LanguageTool credentials
const languageToolApiKey = defineSecret("LANGUAGETOOL_API_KEY");
const languageToolUsername = defineSecret("LANGUAGETOOL_USERNAME");

export interface CheckGrammarPayload {
  text: string;
  language?: string;
}

export interface LanguageToolReplacement {
  value: string;
}

export interface LanguageToolMatch {
  message: string;
  shortMessage?: string;
  offset: number;
  length: number;
  replacements: LanguageToolReplacement[];
  rule: {
    id: string;
    description: string;
    issueType: string;
    category: {
      id: string;
      name: string;
    };
  };
  sentence?: string;
}

const MAX_CHAR_LIMIT = 20000;
const TIMEOUT_MS = 10000;

export const checkGrammar = onCall(
  {
    secrets: [languageToolApiKey, languageToolUsername],
    timeoutSeconds: 30,
    cors: true,
  },
  async (request) => {
    // 1. Authentication Check: Ensure only authenticated users can check grammar
    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated",
        "Authentication required: Please log in to use the grammar assistant."
      );
    }

    const { text, language = "en-US" } = (request.data || {}) as CheckGrammarPayload;

    // 2. Input Validation
    if (typeof text !== "string" || !text.trim()) {
      return { matches: [], language };
    }

    if (text.length > MAX_CHAR_LIMIT) {
      throw new HttpsError(
        "invalid-argument",
        `Text exceeds maximum allowed length of ${MAX_CHAR_LIMIT} characters.`
      );
    }

    // 3. Prepare LanguageTool API call
    const baseUrl =
      process.env.LANGUAGETOOL_BASE_URL || "https://api.languagetool.org/v2/check";

    const params = new URLSearchParams();
    params.append("text", text);
    params.append("language", language);

    // Securely retrieve credentials from Secret Manager or environment variables
    const apiKey = languageToolApiKey.value() || process.env.LANGUAGETOOL_API_KEY;
    const username = languageToolUsername.value() || process.env.LANGUAGETOOL_USERNAME;

    if (apiKey) {
      params.append("apiKey", apiKey);
    }
    if (username) {
      params.append("username", username);
    }

    // 4. Request with timeout handling
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        body: params.toString(),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!response.ok) {
        if (response.status === 429) {
          throw new HttpsError(
            "resource-exhausted",
            "LanguageTool rate limit reached. Please wait a moment before trying again."
          );
        }

        throw new HttpsError(
          "internal",
          `Grammar service responded with HTTP status ${response.status}.`
        );
      }

      const data = (await response.json()) as {
        matches?: LanguageToolMatch[];
        language?: { code: string; name: string };
      };

      return {
        matches: data.matches || [],
        language: data.language?.code || language,
      };
    } catch (error: unknown) {
      clearTimeout(timer);

      if (error instanceof HttpsError) {
        throw error;
      }

      if (error instanceof Error && error.name === "AbortError") {
        throw new HttpsError(
          "deadline-exceeded",
          "Grammar check request timed out after 10 seconds."
        );
      }

      const message =
        error instanceof Error ? error.message : "Unknown error while checking grammar";

      throw new HttpsError("internal", `Grammar check failed: ${message}`);
    }
  }
);

