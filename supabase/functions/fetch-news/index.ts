import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.57.2";
import { NEWS_FEEDS, NEWS_USER_AGENT, SNIPPET_MAX, type NewsFeed } from "../_shared/news-feeds.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface StoredItem {
  url: string;
  title: string;
  source: string;
  snippet: string;
  published_at: string;
  feed_key: string;
  categories: string[];
  regions: string[];
}

const REFRESH_MS = 10 * 60 * 1000;
const RETENTION_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_SEARCH_LEN = 200;

const CATEGORY_RULES: Record<string, RegExp> = {
  technology: /\b(tech|technology|AI|artificial intelligence|chips?|semiconductors?|software|cloud|Apple|Microsoft|Nvidia|Alphabet|Google|Meta|Amazon|OpenAI)\b/i,
  finance: /\b(banks?|banking|lenders?|Fed|Federal Reserve|ECB|interest rates?|bonds?|yields?|JPMorgan|Goldman|insurers?|central bank)\b/i,
  healthcare: /\b(pharma|pharmaceutical|biotech|drugs?|drugmakers?|health|healthcare|FDA|vaccines?|hospital)\b/i,
  energy: /\b(oil|gas|energy|OPEC|crude|solar|renewables?|wind power|petroleum|LNG)\b/i,
  consumer: /\b(retail|retailers?|consumers?|Tesla|Walmart|spending|shoppers|restaurants?|apparel)\b/i,
  crypto: /\b(bitcoin|crypto|cryptocurrenc(y|ies)|ethereum|blockchain|stablecoins?|tokens?)\b/i,
  etfs: /\b(ETFs?|index funds?|S&P 500|Nasdaq 100|index)\b/i,
};
const REGION_RULES: Record<string, RegExp> = {
  us: /\b(Wall Street|U\.S\.|US|United States|Nasdaq|Dow|S&P|Fed|Treasury)\b/,
  europe: /\b(Europe|European|EU|eurozone|ECB|UK|Britain|British|Germany|German|France|French|Spain|Spanish|Italy|FTSE|DAX|CAC|Ibex)\b/,
  asia: /\b(Asia|Asian|China|Chinese|Japan|Japanese|India|Indian|Korea|Nikkei|Hang Seng|Hong Kong|Taiwan|Singapore)\b/,
  americas: /\b(Canada|Canadian|Brazil|Mexico|Latin America|Argentina|Chile|Colombia|Peru|TSX|Bovespa)\b/,
  africa: /\b(Africa|African|Nigeria|Kenya|Egypt|Johannesburg|South Africa)\b/,
  middle_east: /\b(Middle East|Saudi|Gulf|UAE|Dubai|Abu Dhabi|Qatar|Israel|Iran|Tadawul)\b/,
  oceania: /\b(Australia|Australian|New Zealand|ASX|NZX)\b/,
};

function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;|&#x27;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&amp;/g, "&");
}

const cleanText = (raw: string | undefined) =>
  decodeEntities(decodeEntities((raw ?? "").replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")).replace(/<[^>]*>/g, " "))
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** Feed description → at most SNIPPET_MAX characters, ending with "…" when cut. */
export function toSnippet(description: string): string {
  const text = cleanText(description);
  if (text.length <= SNIPPET_MAX) return text;
  return text.slice(0, SNIPPET_MAX - 1).replace(/\s+\S*$/, "").trimEnd() + "…";
}

const tag = (xml: string, name: string) => xml.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, "i"))?.[1];

function parseFeed(xml: string, feed: NewsFeed): StoredItem[] {
  const out: StoredItem[] = [];
  const cutoff = Date.now() - RETENTION_MS;
  for (const m of xml.matchAll(/<item[\s>]([\s\S]*?)<\/item>/gi)) {
    const body = m[1];
    const title = cleanText(tag(body, "title")).slice(0, 300);
    let url = cleanText(tag(body, "link"));
    if (!/^https?:\/\//i.test(url)) {
      const guid = cleanText(tag(body, "guid"));
      url = /^https?:\/\//i.test(guid) ? guid : "";
    }
    if (!title || !url) continue;
    const dateRaw = cleanText(tag(body, "pubDate") ?? tag(body, "dc:date") ?? tag(body, "published"));
    const ts = Date.parse(dateRaw);
    if (!Number.isFinite(ts)) continue; // no publish date → can't show one honestly
    const published = Math.min(ts, Date.now());
    if (published < cutoff) continue;
    const snippet = toSnippet(tag(body, "description") ?? "");
    const text = `${title} ${snippet}`;
    const categories = new Set<string>(feed.categories);
    for (const [k, re] of Object.entries(CATEGORY_RULES)) if (re.test(text)) categories.add(k);
    const regions = new Set<string>(feed.regions);
    for (const [k, re] of Object.entries(REGION_RULES)) if (re.test(text)) regions.add(k);
    out.push({
      url: url.slice(0, 1000),
      title,
      source: feed.publisher,
      snippet,
      published_at: new Date(published).toISOString(),
      feed_key: feed.key,
      categories: [...categories],
      regions: [...regions],
    });
  }
  return out.slice(0, 40);
}

async function fetchFeed(feed: NewsFeed): Promise<StoredItem[]> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 5000);
  try {
    const r = await fetch(feed.url, {
      headers: { "User-Agent": NEWS_USER_AGENT, Accept: "application/rss+xml, application/xml;q=0.9, */*;q=0.5" },
      redirect: "follow",
      signal: ctrl.signal,
    });
    if (!r.ok) return [];
    return parseFeed(await r.text(), feed);
  } catch (e) {
    console.warn("feed failed", feed.key, (e as Error).message);
    return [];
  } finally {
    clearTimeout(timer);
  }
}

// Warm-instance memory copy, used when the database is unavailable.
let memoryItems: StoredItem[] = [];
let lastRefresh = 0;
let refreshing: Promise<void> | null = null;

async function refresh(db: SupabaseClient | null) {
  const results = await Promise.all(NEWS_FEEDS.map(fetchFeed));
  const byUrl = new Map<string, StoredItem>();
  for (const list of results) for (const it of list) if (!byUrl.has(it.url)) byUrl.set(it.url, it);
  const fresh = [...byUrl.values()];
  if (fresh.length) {
    const merged = new Map(memoryItems.map((i) => [i.url, i]));
    for (const it of fresh) merged.set(it.url, it);
    const cutoff = Date.now() - RETENTION_MS;
    memoryItems = [...merged.values()].filter((i) => Date.parse(i.published_at) >= cutoff)
      .sort((a, b) => b.published_at.localeCompare(a.published_at)).slice(0, 1500);
  }
  if (db && fresh.length) {
    const { error } = await db.from("news_items").upsert(
      fresh.map((i) => ({ ...i, fetched_at: new Date().toISOString() })),
      { onConflict: "url" },
    );
    if (error) console.warn("news_items upsert failed:", error.message);
  }
  lastRefresh = Date.now();
}

async function refreshIfStale(db: SupabaseClient | null) {
  if (Date.now() - lastRefresh < REFRESH_MS) return;
  if (db) {
    const { data } = await db.from("news_items").select("fetched_at").order("fetched_at", { ascending: false }).limit(1).maybeSingle();
    if (data?.fetched_at && Date.now() - Date.parse(data.fetched_at) < REFRESH_MS && memoryItems.length) {
      lastRefresh = Date.parse(data.fetched_at);
      return;
    }
  }
  refreshing ??= refresh(db).finally(() => { refreshing = null; });
  // Never stall a request for more than ~7s on slow publishers.
  await Promise.race([refreshing, new Promise((r) => setTimeout(r, 7000))]);
}

const NAME_STOP = /\b(inc|corp|corporation|company|co|ltd|plc|the|group|holdings?|sa|nv|ag|se|etf|fund|trust|class [a-z]|limited|incorporated)\b\.?/gi;
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function tickerMatcher(ticker: string, company: string) {
  const base = ticker.toUpperCase().split(/[.\-]/)[0].replace(/USDT?$/, "");
  const core = company.replace(NAME_STOP, " ").replace(/[^\p{L}\p{N}&' ]/gu, " ").replace(/\s+/g, " ").trim();
  const tests: RegExp[] = [];
  if (base.length >= 2) tests.push(new RegExp(`(^|[^A-Za-z0-9])\\$?${escapeRe(base)}([^A-Za-z0-9]|$)`)); // case-sensitive ticker
  if (core.length >= 3) tests.push(new RegExp(`\\b${escapeRe(core)}\\b`, "i"));
  return (it: StoredItem) => tests.some((re) => re.test(it.title) || re.test(it.snippet));
}

function searchMatcher(search: string) {
  const terms = search.split(/\s+OR\s+|\|/i)
    .map((t) => t.replace(/["()]/g, "").trim().toLowerCase())
    .filter((t) => t.length >= 2);
  return (it: StoredItem) => {
    const hay = `${it.title} ${it.snippet}`.toLowerCase();
    return terms.some((t) => hay.includes(t));
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({}));
    const allowedCats = Object.keys(CATEGORY_RULES);
    const allowedRegions = Object.keys(REGION_RULES);
    const cats: string[] = Array.isArray(body.categories) ? body.categories.filter((c: unknown) => typeof c === "string" && allowedCats.includes(c)) : [];
    if (!cats.length && typeof body.category === "string" && allowedCats.includes(body.category)) cats.push(body.category);
    const regions: string[] = Array.isArray(body.regions) ? body.regions.filter((r: unknown) => typeof r === "string" && allowedRegions.includes(r)) : [];
    const search = typeof body.search === "string" ? body.search.trim().slice(0, MAX_SEARCH_LEN) : "";
    const ticker = typeof body.ticker === "string" ? body.ticker.replace(/[^A-Za-z0-9.\-]/g, "").slice(0, 15) : "";
    const company = typeof body.company === "string" ? body.company.slice(0, 120) : "";

    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const db = url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;

    await refreshIfStale(db);

    let pool: StoredItem[] = [];
    if (db) {
      let q = db.from("news_items")
        .select("url,title,source,snippet,published_at,feed_key,categories,regions")
        .gte("published_at", new Date(Date.now() - RETENTION_MS).toISOString())
        .order("published_at", { ascending: false })
        .limit(ticker || search ? 1500 : 300);
      if (cats.length) q = q.overlaps("categories", cats);
      if (regions.length) q = q.overlaps("regions", regions);
      const { data, error } = await q;
      if (error) console.warn("news_items read failed:", error.message);
      else pool = data as StoredItem[];
    }
    if (!pool.length) {
      pool = memoryItems.filter((i) =>
        (!cats.length || i.categories.some((c) => cats.includes(c))) &&
        (!regions.length || i.regions.some((r) => regions.includes(r))));
    }

    if (ticker) pool = pool.filter(tickerMatcher(ticker, company));
    else if (search) pool = pool.filter(searchMatcher(search));

    const items = pool.slice(0, ticker ? 20 : 30).map((i) => ({
      title: i.title, link: i.url, source: i.source, pubDate: i.published_at, snippet: i.snippet,
    }));
    return new Response(JSON.stringify({ success: true, items }), {
      headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "public, max-age=300" },
    });
  } catch (error) {
    console.error("fetch-news error:", error);
    return new Response(JSON.stringify({ success: false, error: "Unable to fetch news", fallback: true, items: [] }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
