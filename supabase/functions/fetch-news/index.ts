import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const MAX_SEARCH_LEN = 200;
const SAFE_QUERY_RE = /^[\p{L}\p{N}\s\-_.,&'"()|:]+$/u;

interface NewsItem {
  title: string;
  link: string;
  source: string;
  pubDate: string;
}

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)));
}

function parseRSSItems(xml: string): NewsItem[] {
  const items: NewsItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];

    const title = decodeHtmlEntities(
      itemXml.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")?.trim() || ""
    );
    const link = itemXml.match(/<link>([\s\S]*?)<\/link>/)?.[1]?.trim() || "";
    const pubDate = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1]?.trim() || "";
    const source = decodeHtmlEntities(
      itemXml.match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1]?.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")?.trim() || "News"
    );

    if (title && !title.includes("View Full Coverage")) {
      items.push({ title, link, source, pubDate });
    }
  }

  return items;
}

const categoryQueries: Record<string, string> = {
  all: "stock market OR finance OR investing",
  technology: "technology stocks OR tech earnings OR AAPL OR MSFT OR NVDA",
  finance: "banking stocks OR JPMorgan OR Goldman Sachs OR financial sector",
  healthcare: "healthcare stocks OR pharma OR biotech OR Johnson Johnson",
  energy: "energy stocks OR oil prices OR renewable energy stocks",
  consumer: "consumer stocks OR Tesla OR retail stocks OR consumer spending",
  crypto: "cryptocurrency OR bitcoin OR ethereum OR crypto market",
  etfs: "ETF OR index fund OR S&P 500 OR market index",
};

const regionQueries: Record<string, string> = {
  us: "US stocks OR Wall Street OR Nasdaq OR NYSE",
  europe: "European stocks OR FTSE OR DAX OR CAC OR European markets",
  asia: "Asian stocks OR Nikkei OR Hang Seng OR Shanghai OR Asian markets",
  americas: "Canada stocks OR TSX OR Brazil stocks OR Bovespa OR Latin America",
  africa: "African stocks OR Johannesburg OR Nigeria stocks OR African markets",
  middle_east: "Middle East stocks OR Saudi stocks OR Tadawul OR Dubai stocks",
  oceania: "Australia stocks OR ASX OR New Zealand stocks OR NZX",
};

// Simple in-memory cache shared across warm invocations (5 min TTL)
const CACHE_TTL_MS = 5 * 60 * 1000;
const newsCache = new Map<string, { ts: number; items: NewsItem[] }>();

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Public endpoint - news is non-sensitive RSS data
    const body = await req.json().catch(() => ({}));
    const {
      category = "all",
      categories: catList,
      regions: regionList,
      search,
    }: {
      category?: string;
      categories?: string[];
      regions?: string[];
      search?: string;
    } = body;

    // Validate against allow-lists; ignore unknown keys
    const allowedCategories = Object.keys(categoryQueries);
    const allowedRegions = Object.keys(regionQueries);
    const safeCats = Array.isArray(catList)
      ? catList.filter((c) => typeof c === "string" && allowedCategories.includes(c))
      : undefined;
    const safeRegions = Array.isArray(regionList)
      ? regionList.filter((r) => typeof r === "string" && allowedRegions.includes(r))
      : undefined;
    const safeCategory = allowedCategories.includes(category) ? category : "all";

    let query: string;
    let searchTrim = typeof search === "string" ? search.trim().slice(0, MAX_SEARCH_LEN) : "";
    if (searchTrim && !SAFE_QUERY_RE.test(searchTrim)) {
      searchTrim = "";
    }

    if (searchTrim) {
      query = searchTrim;
    } else if (safeRegions && safeRegions.length > 0) {
      query = safeRegions
        .map((r) => `(${regionQueries[r]})`)
        .join(" OR ");
    } else if (safeCats && safeCats.length > 0 && !safeCats.includes("all")) {
      query = safeCats
        .map((c) => `(${categoryQueries[c]})`)
        .join(" OR ");
    } else {
      query = categoryQueries[safeCategory] || categoryQueries.all;
    }

    const encodedQuery = encodeURIComponent(query);
    const rssUrl = `https://news.google.com/rss/search?q=${encodedQuery}+when:7d&hl=en-US&gl=US&ceid=US:en`;

    // Cache hit?
    const cached = newsCache.get(rssUrl);
    if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
      return new Response(JSON.stringify({ success: true, items: cached.items, cached: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "public, max-age=300" },
      });
    }

    console.log("Fetching news for:", query);

    // Retry up to 3 times with backoff for transient 5xx errors
    let response: Response | null = null;
    let lastStatus = 0;
    for (let attempt = 0; attempt < 3; attempt++) {
      response = await fetch(rssUrl, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; NewsBot/1.0)" },
      });
      if (response.ok) break;
      lastStatus = response.status;
      // Drain body to free resources before retrying
      await response.text().catch(() => "");
      response = null;
      if (lastStatus < 500) break; // don't retry client errors
      await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
    }

    if (!response) {
      console.error(`RSS unavailable after retries (last status: ${lastStatus})`);
      return new Response(
        JSON.stringify({ success: false, error: "SERVICE_UNAVAILABLE", fallback: true, items: [] }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const xml = await response.text();
    const items = parseRSSItems(xml).slice(0, 25);

    console.log(`Found ${items.length} news items`);

    newsCache.set(rssUrl, { ts: Date.now(), items });

    return new Response(JSON.stringify({ success: true, items }), {
      headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "public, max-age=300" },
    });
  } catch (error) {
    console.error("Error fetching news:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Unable to fetch news", fallback: true, items: [] }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
