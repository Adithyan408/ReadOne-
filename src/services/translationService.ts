import type {
  BlogContext,
  TranslatedBlogData,
  TranslationLanguage,
} from "../types/aiAssistant";
import { generateGeminiContent } from "./geminiService";

// In-memory session cache for blog translations
const translationSessionCache = new Map<string, TranslatedBlogData>();

function getCacheKey(blogId: string, language: TranslationLanguage): string {
  return `${blogId}::${language.toLowerCase()}`;
}

/**
 * Checks if a cached translation exists in this session.
 */
export function getCachedTranslation(
  blogId: string,
  language: TranslationLanguage
): TranslatedBlogData | null {
  const key = getCacheKey(blogId, language);
  return translationSessionCache.get(key) || null;
}

/**
 * Translates a complete blog article into the selected target language using Gemini.
 */
export async function translateBlogArticle(
  blog: BlogContext,
  targetLanguage: TranslationLanguage
): Promise<TranslatedBlogData> {
  // Check active session cache first
  const cached = getCachedTranslation(blog.id, targetLanguage);
  if (cached) {
    return cached;
  }

  const systemInstruction = `You are a professional literary and technical translator.
Your task is to translate complete blog articles accurately into ${targetLanguage}.

Translation Rules:
1. Preserve the exact original meaning, tone, and nuance.
2. Maintain all headings, subheadings, paragraphs, bullet points, and numbered lists.
3. Output clean HTML structure (e.g. <h2>, <h3>, <p>, <ul>, <li>, <blockquote>) matching the original structure so it renders beautifully in a rich text reader.
4. Do NOT shorten, condense, or summarize the content. Translate the complete article.
5. Preserve technical terms, product names, code blocks (<code>, <pre>), and URLs in their original form where appropriate.
6. Return the response strictly as valid JSON with two fields:
   {
     "translatedTitle": "...",
     "translatedContent": "..."
   }
7. Do not include markdown formatting backticks around the JSON (or provide valid clean JSON).`;

  const prompt = `Please translate the following blog post into ${targetLanguage}:

BLOG TITLE:
"""
${blog.title}
"""

BLOG CONTENT (HTML):
"""
${blog.rawHtml || blog.content}
"""

Return your response strictly in JSON format:
{
  "translatedTitle": "translated title here",
  "translatedContent": "<p>translated HTML content here</p>"
}`;

  const responseText = await generateGeminiContent(prompt, {
    systemInstruction,
  });

  // Parse JSON response
  let translatedTitle = blog.title;
  let translatedContent = blog.rawHtml || blog.content;

  try {
    // Strip markdown code fences if model returned ```json ... ```
    const cleaned = responseText
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();

    const parsed = JSON.parse(cleaned);
    if (parsed.translatedTitle) {
      translatedTitle = parsed.translatedTitle.trim();
    }
    if (parsed.translatedContent) {
      translatedContent = parsed.translatedContent.trim();
    }
  } catch {
    // If strict JSON parsing fails, extract fields or use the translated text
    console.warn("JSON parsing of translation failed, using fallback extraction");
    const titleMatch = responseText.match(/"translatedTitle"\s*:\s*"([^"]+)"/i);
    if (titleMatch && titleMatch[1]) {
      translatedTitle = titleMatch[1];
    }
    const contentMatch = responseText.match(/"translatedContent"\s*:\s*"([\s\S]+?)"\s*\}/i);
    if (contentMatch && contentMatch[1]) {
      translatedContent = contentMatch[1].replace(/\\"/g, '"').replace(/\\n/g, "\n");
    } else {
      translatedContent = responseText;
    }
  }

  const result: TranslatedBlogData = {
    language: targetLanguage,
    translatedTitle,
    translatedContent,
    cachedAt: Date.now(),
  };

  // Cache in session
  translationSessionCache.set(getCacheKey(blog.id, targetLanguage), result);

  return result;
}

/**
 * Clears the session translation cache (useful if the blog was edited or user resets).
 */
export function clearTranslationCache(): void {
  translationSessionCache.clear();
}

