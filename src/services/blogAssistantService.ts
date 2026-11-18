import type {
  BlogContext,
  ChatMessage,
  ParagraphAction,
  SourceAttribution,
} from "../types/aiAssistant";
import { generateGeminiContent, sendGeminiChatMessage } from "./geminiService";
import { searchAndRetrieveWikipediaTopic } from "./wikipediaService";

/**
 * Predefined suggested questions displayed in the assistant UI.
 */
export const PREDEFINED_QUESTIONS = [
  "Summarize this blog.",
  "What are the main takeaways?",
  "Explain this article in simple English.",
  "Give me real-world examples.",
  "What are the important concepts?",
  "What can I learn from this article?",
  "What are the advantages and disadvantages?",
  "Ask anything about this blog.",
] as const;

/**
 * Converts rich HTML content into clean, structured Markdown-like text
 * while preserving headings, paragraphs, and lists.
 */
export function cleanBlogContent(html: string): string {
  if (!html) return "";

  // Replace block elements with linebreaks to keep paragraphs separate
  let text = html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, "\n\n# $1\n\n")
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, "\n\n## $1\n\n")
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, "\n\n### $1\n\n")
    .replace(/<h[4-6][^>]*>(.*?)<\/h[4-6]>/gi, "\n\n#### $1\n\n")
    .replace(/<li[^>]*>(.*?)<\/li>/gi, "\n- $1")
    .replace(/<p[^>]*>(.*?)<\/p>/gi, "\n\n$1\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, "\n\n> $1\n\n");

  // Remove remaining HTML tags
  text = text.replace(/<[^>]+>/g, " ");

  // Decode common HTML entities
  text = text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  // Normalize excessive newlines and whitespace
  text = text.replace(/\n\s*\n\s*\n+/g, "\n\n").trim();

  // Limit content to a safe length (e.g. 15,000 characters) to optimize token usage
  if (text.length > 15000) {
    return text.slice(0, 15000) + "\n...[Content truncated for length]";
  }

  return text;
}

/**
 * Creates the standard system instructions for the AI Blog Companion.
 */
export function buildBlogSystemInstruction(blog: BlogContext): string {
  return `You are an intelligent reading assistant helping readers understand a blog article.

Your primary source of information is the provided blog content.

Answer questions accurately and clearly.

Explain difficult concepts using simple language and practical examples.

If the requested information is not available in the blog, clearly mention that.

Do not invent information or pretend that external information came from the article.

Maintain conversation context throughout the session.

Use headings, bullet points, and examples where appropriate.

Keep answers concise unless the reader requests detailed explanations.

CURRENT BLOG CONTEXT:
Title: "${blog.title}"
Author: "${blog.author || "Unknown"}"
Date: "${blog.dateString || "Recent"}"
Summary: "${blog.description || ""}"
Article Text:
"""
${blog.content}
"""`;
}

/**
 * Detects whether a reader's question asks for external research, deep exploration beyond the blog,
 * or concepts not covered in the blog.
 */
export function isExternalExplorationQuestion(question: string): boolean {
  const lower = question.toLowerCase();
  const externalTriggers = [
    "explore",
    "beyond this blog",
    "outside this article",
    "more detail on wikipedia",
    "in the real world",
    "real-world application",
    "deep dive into",
    "history of",
    "who invented",
    "research",
    "tell me more about",
    "how does this work in industry",
  ];

  return externalTriggers.some((trigger) => lower.includes(trigger));
}

/**
 * Extracts a candidate topic or keyword for Wikipedia research from a user query.
 */
function extractResearchTopic(query: string, blog: BlogContext): string {
  // Remove conversational filler phrases
  const cleaned = query
    .replace(/explain|tell me more about|deep dive into|what is|how does|explore|in more detail|beyond this blog|outside this article/gi, "")
    .replace(/give me some real-world applications|applications of|history of|and give me/gi, "")
    .replace(/[?!.,;]/g, "")
    .trim();

  if (cleaned.length >= 3) {
    return cleaned;
  }

  // Fallback to blog title
  return blog.title;
}

/**
 * Processes a question from the reader, managing context, Wikipedia exploration,
 * and conversation history.
 */
export async function askBlogAssistant({
  question,
  blog,
  history,
  forceExternal = false,
}: {
  question: string;
  blog: BlogContext;
  history: ChatMessage[];
  forceExternal?: boolean;
}): Promise<{
  answer: string;
  sources?: SourceAttribution[];
}> {
  const trimmed = question.trim();
  if (!trimmed) {
    throw new Error("Question cannot be empty.");
  }

  const systemInstruction = buildBlogSystemInstruction(blog);
  const requiresExternal = forceExternal || isExternalExplorationQuestion(trimmed);

  if (requiresExternal) {
    const topic = extractResearchTopic(trimmed, blog);
    const wikiData = await searchAndRetrieveWikipediaTopic(topic);

    if (wikiData) {
      const researchPrompt = `The reader asked the following question about "${blog.title}":
"${trimmed}"

EXTERNAL RESEARCH MATERIAL FROM WIKIPEDIA (Topic: "${wikiData.sourceTitle}"):
"""
${wikiData.summary}
"""

Instructions:
1. First, answer the reader's question directly and thoroughly using the provided Wikipedia research material and relevant blog context.
2. Clearly distinguish between what came from the blog article and what is expanded from external Wikipedia research.
3. Use simple language, headings, and concrete examples.
4. Mention that external information was retrieved from Wikipedia for "${wikiData.sourceTitle}".`;

      const responseText = await generateGeminiContent(researchPrompt, {
        systemInstruction,
      });

      return {
        answer: responseText,
        sources: [
          {
            title: `Wikipedia: ${wikiData.sourceTitle}`,
            url: wikiData.sourceUrl,
            snippet: wikiData.summary.slice(0, 200) + "...",
            source: "wikipedia",
          },
        ],
      };
    } else {
      // Wikipedia did not find a direct match
      const fallbackPrompt = `The reader asked an exploratory question:
"${trimmed}"

Note: External Wikipedia search for "${topic}" did not return a conclusive page.
Please answer based on the blog article. If the topic is outside the blog article, clearly state:
"This topic is not covered in detail in the blog article, and no matching Wikipedia reference was found." Then provide a brief, helpful general explanation based on established concepts without inventing claims.`;

      const responseText = await generateGeminiContent(fallbackPrompt, {
        systemInstruction,
      });

      return {
        answer: responseText,
      };
    }
  }

  // Standard conversational question about the blog
  // Convert history into user/model turns
  const formattedHistory = history
    .filter((m) => m.role === "user" || m.role === "model")
    .map((m) => ({
      role: m.role as "user" | "model",
      text: m.content,
    }));

  const answer = await sendGeminiChatMessage(formattedHistory, trimmed, {
    systemInstruction,
  });

  return { answer };
}

/**
 * Explains or simplifies a specific paragraph selected by the reader.
 */
export async function explainParagraphWithAction({
  paragraph,
  action,
  blog,
}: {
  paragraph: string;
  action: ParagraphAction;
  blog: BlogContext;
}): Promise<string> {
  const trimmed = paragraph.trim();
  if (!trimmed) {
    throw new Error("No paragraph text provided for analysis.");
  }

  const systemInstruction = buildBlogSystemInstruction(blog);

  let promptDirective = "";
  switch (action) {
    case "explain":
      promptDirective = "Explain this paragraph from the article in simple, engaging terms. Highlight the key idea and why it matters.";
      break;
    case "example":
      promptDirective = "Provide 1-2 realistic, practical real-world examples that illustrate the concept discussed in this paragraph.";
      break;
    case "terms":
      promptDirective = "Identify and clearly explain any technical terms, jargon, or acronyms found in this paragraph using everyday language.";
      break;
    case "simplify":
      promptDirective = "Rewrite and simplify this paragraph into plain, easy English without losing its core meaning.";
      break;
    case "context":
      promptDirective = "Provide additional background context for this paragraph. Explain what precedes or motivates this concept in the broader subject.";
      break;
  }

  const prompt = `${promptDirective}

SELECTED PARAGRAPH:
"""
${trimmed.slice(0, 3000)}
"""

Please provide a clear, concise explanation formatted with bullet points or bold text where appropriate.`;

  return await generateGeminiContent(prompt, {
    systemInstruction,
  });
}
