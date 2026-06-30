/**
 * Tavily web search wrapper.
 * Docs: https://docs.tavily.com/docs/rest-api/api-reference
 */

export interface WebSearchResult {
  title: string;
  url: string;
  content: string;
  score?: number;
}

const TAVILY_ENDPOINT = "https://api.tavily.com/search";

export async function webSearch(
  query: string,
  maxResults = 5
): Promise<WebSearchResult[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    throw new Error("TAVILY_API_KEY environment variable is not set");
  }

  const res = await fetch(TAVILY_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      max_results: maxResults,
      search_depth: "basic",
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Tavily HTTP ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = (await res.json()) as { results?: WebSearchResult[] };
  return data.results ?? [];
}
