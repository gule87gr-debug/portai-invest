const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
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

    let query: string;
    const searchTrim = (search || "").trim();

    if (searchTrim) {
      query = searchTrim;
    } else if (Array.isArray(regionList) && regionList.length > 0) {
      query = regionList
        .map((r) => `(${regionQueries[r] || r})`)
        .join(" OR ");
    } else if (Array.isArray(catList) && catList.length > 0 && !catList.includes("all")) {
      query = catList
        .map((c) => `(${categoryQueries[c] || c})`)
        .join(" OR ");
    } else {
      query = categoryQueries[category] || categoryQueries.all;
    }

    const encodedQuery = encodeURIComponent(query);
    const rssUrl = `https://news.google.com/rss/search?q=${encodedQuery}+when:7d&hl=en-US&gl=US&ceid=US:en`;

    console.log("Fetching news for:", query);

    const response = await fetch(rssUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; NewsBot/1.0)",
      },
    });

    if (!response.ok) {
      throw new Error(`RSS fetch failed: ${response.status}`);
    }

    const xml = await response.text();
    const items = parseRSSItems(xml).slice(0, 25);

    console.log(`Found ${items.length} news items`);

    return new Response(JSON.stringify({ success: true, items }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching news:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message, items: [] }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
