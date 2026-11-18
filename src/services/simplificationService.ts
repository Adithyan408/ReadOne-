import type {
  BlogContext,
  SimplifiedBlogData,
  SimplificationMode,
} from "../types/aiAssistant";
import { generateGeminiContent } from "./geminiService";

// In-memory session cache for blog simplifications
const simplificationSessionCache = new Map<string, SimplifiedBlogData>();

function getCacheKey(blogId: string, mode: SimplificationMode): string {
  return `${blogId}::${mode}`;
}

/**
 * Checks if a cached simplification exists in this session.
 */
export function getCachedSimplification(
  blogId: string,
  mode: SimplificationMode
): SimplifiedBlogData | null {
  const key = getCacheKey(blogId, mode);
  return simplificationSessionCache.get(key) || null;
}

/**
 * Simplifies a complete blog article according to the selected mode using Gemini.
 */
export async function simplifyBlogArticle(
  blog: BlogContext,
  mode: SimplificationMode
): Promise<SimplifiedBlogData> {
  const cached = getCachedSimplification(blog.id, mode);
  if (cached) {
    return cached;
  }

  let modeInstructions = "";
  switch (mode) {
    case "simple":
      modeInstructions = `Mode: SIMPLE ENGLISH
- Rewrite complex and verbose sentences into clear, easy-to-read English.
- Use everyday vocabulary while keeping all key facts and insights intact.
- Keep the original structure (headings, paragraphs, bullet points) with clean HTML markup.`;
      break;

    case "beginner":
      modeInstructions = `Mode: BEGINNER EXPLANATION
- Explain unfamiliar terms and jargon in plain, welcoming language.
- Include relatable real-world analogies and examples to illustrate core concepts.
- Assume the reader has zero prior experience with this subject.
- Maintain headings, subheadings, and clear paragraphs with clean HTML markup.`;
      break;

    case "detailed":
      modeInstructions = `Mode: DETAILED EXPLANATION
- Thoroughly break down complex ideas into manageable, digestible sections.
- Provide step-by-step reasoning, clear context, and practical illustrations.
- Maintain comprehensive depth while making the logic transparent and structured.
- Keep clean HTML structure (headings, paragraphs, bullet points, callouts).`;
      break;
  }

  const systemInstruction = `You are an expert educational content editor.
Your objective is to adapt and simplify a complete blog article for readers.

${modeInstructions}

Requirements:
1. Preserve the full narrative and all essential points from the original article.
2. Do not omit important technical details or invent unsupported facts.
3. Output the result in clean semantic HTML (<p>, <h2>, <h3>, <ul>, <li>, <blockquote>).
4. Return strictly valid JSON with this format:
   {
     "simplifiedTitle": "...",
     "simplifiedContent": "<p>...</p>"
   }`;

  const prompt = `Please simplify the following blog article:

TITLE:
"""
${blog.title}
"""

CONTENT:
"""
${blog.rawHtml || blog.content}
"""

Return strictly in JSON format:
{
  "simplifiedTitle": "simplified title here",
  "simplifiedContent": "<p>simplified HTML content here</p>"
}`;

  const responseText = await generateGeminiContent(prompt, {
    systemInstruction,
  });

  let simplifiedTitle = blog.title;
  let simplifiedContent = blog.rawHtml || blog.content;

  try {
    const cleaned = responseText
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();

    const parsed = JSON.parse(cleaned);
    if (parsed.simplifiedTitle) {
      simplifiedTitle = parsed.simplifiedTitle.trim();
    }
    if (parsed.simplifiedContent) {
      simplifiedContent = parsed.simplifiedContent.trim();
    }
  } catch {
    console.warn("JSON parsing of simplification failed, using fallback extraction");
    const titleMatch = responseText.match(/"simplifiedTitle"\s*:\s*"([^"]+)"/i);
    if (titleMatch && titleMatch[1]) {
      simplifiedTitle = titleMatch[1];
    }
    const contentMatch = responseText.match(/"simplifiedContent"\s*:\s*"([\s\S]+?)"\s*\}/i);
    if (contentMatch && contentMatch[1]) {
      simplifiedContent = contentMatch[1].replace(/\\"/g, '"').replace(/\\n/g, "\n");
    } else {
      simplifiedContent = responseText;
    }
  }

  const result: SimplifiedBlogData = {
    mode,
    simplifiedTitle,
    simplifiedContent,
    cachedAt: Date.now(),
  };

  simplificationSessionCache.set(getCacheKey(blog.id, mode), result);

  return result;
}

/**
 * Clears the session simplification cache.
 */
export function clearSimplificationCache(): void {
  simplificationSessionCache.clear();
}

