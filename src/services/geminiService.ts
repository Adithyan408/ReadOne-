import { getGenerativeModel } from "firebase/ai";
import {
  ai,
  model as defaultModel,
  firebaseConfig,
  CONFIGURED_GEMINI_MODEL,
} from "../firebase/firebase";
import type { Content } from "firebase/ai";

export interface GeminiCallOptions {
  systemInstruction?: string;
  temperature?: number;
}

function isValidApiKey(key?: string | null): boolean {
  if (!key) return false;
  const trimmed = key.trim();
  return (
    trimmed.length > 15 &&
    !trimmed.includes("xxxx") &&
    trimmed !== "your_api_key_here" &&
    trimmed !== "undefined"
  );
}

/**
 * Normalizes error messages from Firebase AI / Gemini API into user-friendly explanations.
 */
export function formatGeminiError(error: unknown): string {
  if (!error) return "An unexpected error occurred while communicating with the AI.";

  const raw = error instanceof Error ? error.message : String(error);
  const lower = raw.toLowerCase();

  if (lower.includes("api key not valid") || lower.includes("api_key_invalid") || lower.includes("api key is invalid")) {
    return "Gemini API key is invalid or missing. Please add a valid key to your .env file as VITE_GEMINI_API_KEY (get a free key at https://aistudio.google.com/app/apikey).";
  }

  if (lower.includes("app check") || lower.includes("appcheck")) {
    return "Firebase App Check verification failed. If in local development, register a debug token in the Firebase console or use a VITE_GEMINI_API_KEY in .env.";
  }

  if (lower.includes("quota") || lower.includes("resource_exhausted") || lower.includes("429")) {
    return "The Gemini API request limit has been reached for this project. Please wait a moment before asking again.";
  }

  if (lower.includes("network") || lower.includes("failed to fetch") || lower.includes("offline")) {
    return "Network error: Unable to reach the AI service. Please check your internet connection.";
  }

  if (lower.includes("safety") || lower.includes("blocked")) {
    return "This request could not be completed because the content triggered the AI safety filters.";
  }

  if (lower.includes("not found") || lower.includes("404")) {
    return "The requested AI model was not found or is not enabled for this project.";
  }

  return `AI Assistant Error: ${raw.slice(0, 200)}`;
}

/**
 * Returns a GenerativeModel instance with optional custom system instruction.
 */
export function getAssistantModel(options?: GeminiCallOptions) {
  if (!options?.systemInstruction) {
    return defaultModel;
  }

  try {
    return getGenerativeModel(ai, {
      model: CONFIGURED_GEMINI_MODEL,
      systemInstruction: options.systemInstruction,
    });
  } catch {
    return defaultModel;
  }
}

/**
 * Direct Gemini Developer REST API caller.
 * Used as a reliable fallback when Firebase Vertex AI App Check is enforced or the model name is unavailable.
 */
async function callDirectGeminiRest(
  contents: Array<{ role: string; parts: Array<{ text: string }> }>,
  systemInstruction?: string,
  modelName: string = CONFIGURED_GEMINI_MODEL
): Promise<string> {
  const envGeminiKey =
    typeof import.meta !== "undefined" ? import.meta.env?.VITE_GEMINI_API_KEY : undefined;
  const envFirebaseKey =
    typeof import.meta !== "undefined" ? import.meta.env?.VITE_FIREBASE_API_KEY : undefined;

  const apiKey =
    (isValidApiKey(envGeminiKey) ? envGeminiKey : undefined) ||
    (isValidApiKey(envFirebaseKey) ? envFirebaseKey : undefined) ||
    firebaseConfig.apiKey;

  if (!isValidApiKey(apiKey)) {
    throw new Error(
      "Gemini API key is not configured. Please add VITE_GEMINI_API_KEY to your .env file (get a free key at https://aistudio.google.com/app/apikey)."
    );
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

  const body: {
    contents: Array<{ role: string; parts: Array<{ text: string }> }>;
    systemInstruction?: { parts: Array<{ text: string }> };
  } = {
    contents,
  };

  if (systemInstruction) {
    body.systemInstruction = {
      parts: [{ text: systemInstruction }],
    };
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = (await response.json().catch(() => null)) as
      | { error?: { message?: string; status?: string } }
      | null;
    const errorMsg = errorData?.error?.message || `HTTP ${response.status} ${response.statusText}`;

    throw new Error(`Gemini API: ${errorMsg}`);
  }

  const data = (await response.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{ text?: string }>;
      };
    }>;
  };

  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text || !text.trim()) {
    throw new Error("Received an empty response from the AI model.");
  }

  return text.trim();
}

/**
 * Generates text content directly from a prompt using Gemini.
 */
export async function generateGeminiContent(
  prompt: string,
  options?: GeminiCallOptions
): Promise<string> {
  const modelToUse = getAssistantModel(options);

  try {
    const result = await modelToUse.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    if (!text || !text.trim()) {
      throw new Error("Received an empty response from the AI model.");
    }
    return text.trim();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const lower = msg.toLowerCase();

    // If Firebase Vertex AI rejects due to App Check (401) or invalid model (404/not found),
    // fallback gracefully to direct Gemini Developer API
    const isAppCheckError = lower.includes("app check") || lower.includes("appcheck") || lower.includes("401");
    const isModelError = lower.includes("404") || lower.includes("not found") || lower.includes("invalid model");

    if (isAppCheckError || isModelError) {
      console.warn("Firebase Vertex AI App Check / Model notice:", msg, "- Falling back to direct Gemini API");
      try {
        return await callDirectGeminiRest(
          [{ role: "user", parts: [{ text: prompt }] }],
          options?.systemInstruction
        );
      } catch (fallbackErr) {
        throw new Error(formatGeminiError(fallbackErr), { cause: fallbackErr });
      }
    }

    throw new Error(formatGeminiError(err), { cause: err });
  }
}

/**
 * Executes a multi-turn chat message using the chat session API.
 */
export async function sendGeminiChatMessage(
  history: Array<{ role: "user" | "model"; text: string }>,
  newMessage: string,
  options?: GeminiCallOptions
): Promise<string> {
  const modelToUse = getAssistantModel(options);

  // Convert history items to Content objects
  // Limit to recent 10 turns to avoid token limit issues
  const formattedHistory: Content[] = history.slice(-10).map((msg) => ({
    role: msg.role === "user" ? "user" : "model",
    parts: [{ text: msg.text }],
  }));

  try {
    const chatSession = modelToUse.startChat({
      history: formattedHistory,
    });

    const result = await chatSession.sendMessage(newMessage);
    const response = result.response;
    const text = response.text();

    if (!text || !text.trim()) {
      throw new Error("Received an empty response from the AI model.");
    }

    return text.trim();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const lower = msg.toLowerCase();

    const isAppCheckError = lower.includes("app check") || lower.includes("appcheck") || lower.includes("401");
    const isModelError = lower.includes("404") || lower.includes("not found") || lower.includes("invalid model");

    if (isAppCheckError || isModelError) {
      console.warn("Firebase Vertex AI App Check / Model notice:", msg, "- Falling back to direct Gemini API");
      try {
        const directContents = [
          ...formattedHistory.map((h) => ({
            role: h.role === "user" ? "user" : "model",
            parts: h.parts.map((p) => ("text" in p ? { text: p.text } : { text: "" })),
          })),
          {
            role: "user",
            parts: [{ text: newMessage }],
          },
        ];

        return await callDirectGeminiRest(
          directContents,
          options?.systemInstruction
        );
      } catch (fallbackErr) {
        throw new Error(formatGeminiError(fallbackErr), { cause: fallbackErr });
      }
    }

    throw new Error(formatGeminiError(err), { cause: err });
  }
}
