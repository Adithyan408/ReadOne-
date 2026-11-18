import type { WikipediaSearchResult, WikipediaPageSummary } from "../types/aiAssistant";

/**
 * Strips HTML tags returned in Wikipedia API search snippets.
 */
function stripHtml(html: string): string {
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
}

/**
 * Searches Wikipedia using the MediaWiki search API.
 */
export async function searchWikipedia(
  query: string,
  limit: number = 3,
  signal?: AbortSignal
): Promise<WikipediaSearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
    trimmed
  )}&srlimit=${limit}&utf8=&format=json&origin=*`;

  try {
    const res = await fetch(url, { signal });
    if (!res.ok) {
      throw new Error(`Wikipedia search failed with HTTP status ${res.status}`);
    }

    const data = await res.json();
    const searchItems = data?.query?.search;
    if (!Array.isArray(searchItems) || searchItems.length === 0) {
      return [];
    }

    return searchItems.map((item: { title: string; snippet: string; pageid: number }) => ({
      title: item.title,
      snippet: stripHtml(item.snippet),
      pageId: item.pageid,
      url: `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title.replace(/ /g, "_"))}`,
    }));
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "AbortError") {
      throw err;
    }
    console.warn("Wikipedia search query error:", err);
    return [];
  }
}

/**
 * Fetches an introductory summary for a specific Wikipedia title.
 */
export async function getWikipediaSummary(
  title: string,
  signal?: AbortSignal
): Promise<WikipediaPageSummary | null> {
  const trimmed = title.trim();
  if (!trimmed) return null;

  // Try REST API first for clean plain extract
  const restUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
    trimmed.replace(/ /g, "_")
  )}`;

  try {
    const res = await fetch(restUrl, { signal });
    if (res.ok) {
      const data = await res.json();
      if (data && data.extract) {
        return {
          title: data.title || trimmed,
          extract: data.extract,
          description: data.description,
          url:
            data.content_urls?.desktop?.page ||
            `https://en.wikipedia.org/wiki/${encodeURIComponent(trimmed.replace(/ /g, "_"))}`,
        };
      }
    }
  } catch (restErr: unknown) {
    if (restErr instanceof Error && restErr.name === "AbortError") {
      throw restErr;
    }
    // Fall back to action=query extracts endpoint
  }

  // Fallback to MediaWiki action=query extracts endpoint
  const queryUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=1&explaintext=1&titles=${encodeURIComponent(
    trimmed
  )}&format=json&origin=*`;

  try {
    const res = await fetch(queryUrl, { signal });
    if (!res.ok) return null;

    const data = await res.json();
    const pages = data?.query?.pages;
    if (!pages) return null;

    const firstPageKey = Object.keys(pages)[0];
    const page = pages[firstPageKey];

    if (!page || page.missing !== undefined || !page.extract) {
      return null;
    }

    return {
      title: page.title || trimmed,
      extract: page.extract.slice(0, 1500),
      url: `https://en.wikipedia.org/wiki/${encodeURIComponent(trimmed.replace(/ /g, "_"))}`,
    };
  } catch (queryErr: unknown) {
    if (queryErr instanceof Error && queryErr.name === "AbortError") {
      throw queryErr;
    }
    console.warn("Wikipedia fallback summary error:", queryErr);
    return null;
  }
}

/**
 * Searches Wikipedia and returns the best matching page summary along with references.
 */
export async function searchAndRetrieveWikipediaTopic(
  topic: string,
  signal?: AbortSignal
): Promise<{
  summary: string;
  sourceUrl: string;
  sourceTitle: string;
} | null> {
  const searchResults = await searchWikipedia(topic, 2, signal);
  if (searchResults.length === 0) {
    return null;
  }

  const primaryResult = searchResults[0];
  const pageSummary = await getWikipediaSummary(primaryResult.title, signal);

  if (pageSummary && pageSummary.extract.trim().length > 30) {
    return {
      summary: pageSummary.extract.slice(0, 1800),
      sourceUrl: pageSummary.url,
      sourceTitle: pageSummary.title,
    };
  }

  // Fallback to snippet if full extract isn't available
  if (primaryResult.snippet.trim().length > 20) {
    return {
      summary: primaryResult.snippet,
      sourceUrl: primaryResult.url,
      sourceTitle: primaryResult.title,
    };
  }

  return null;
}

