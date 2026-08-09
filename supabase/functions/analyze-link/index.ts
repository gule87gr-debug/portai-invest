import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { checkRateLimit, getClientIP, rateLimitResponse } from "../_shared/rate-limiter.ts";
import { validateInput, validationErrorResponse, type SchemaDefinition } from "../_shared/input-validator.ts";
import { isAdminEmail, logAdminBypass } from "../_shared/admin-bypass.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const inputSchema: SchemaDefinition = {
  url: { type: "string", required: true, minLength: 5, maxLength: 2048, pattern: /^https?:\/\/.+/ },
  language: { type: "string", required: false, maxLength: 8 },
};

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English", es: "Spanish", fr: "French", pt: "Portuguese", de: "German", it: "Italian",
};

const FREE_DAILY_ANALYSES = 1;

// Must stay in sync with src/lib/trustScore.ts so the news-feed badge
// and the article analyzer always return the same score for a known source.
const TRUST_SCORES: Record<string, number> = {
  reuters: 10, "associated press": 10, ap: 10, "ap news": 10,
  "sec.gov": 10, sec: 10, "federal reserve": 10,
  bloomberg: 8, "financial times": 8, ft: 8,
  "the wall street journal": 8, "wall street journal": 8, wsj: 8,
  "the economist": 8, bbc: 8, "bbc news": 8,
  "the new york times": 7, "new york times": 7, nyt: 7,
  "the washington post": 7, "washington post": 7,
  cnbc: 7, "barron's": 7, barrons: 7, marketwatch: 7,
  "the guardian": 7, guardian: 7, axios: 7, morningstar: 7,
  forbes: 6, fortune: 6, "business insider": 6,
  "yahoo finance": 6, yahoo: 6, investopedia: 6,
  cnn: 6, "cnn business": 6, zacks: 6, kiplinger: 6,
  "seeking alpha": 5, "the motley fool": 5, "motley fool": 5,
  benzinga: 5, investorplace: 5, "fox business": 5,
  thestreet: 5, "the street": 5,
  reddit: 3, twitter: 3, x: 3, stocktwits: 3,
};

// Maps URL hostnames to the canonical source name used in TRUST_SCORES.
const DOMAIN_TO_SOURCE: Record<string, string> = {
  "reuters.com": "reuters",
  "apnews.com": "associated press",
  "ap.org": "associated press",
  "sec.gov": "sec.gov",
  "federalreserve.gov": "federal reserve",
  "bloomberg.com": "bloomberg",
  "ft.com": "financial times",
  "wsj.com": "the wall street journal",
  "economist.com": "the economist",
  "nytimes.com": "the new york times",
  "washingtonpost.com": "the washington post",
  "cnbc.com": "cnbc",
  "barrons.com": "barron's",
  "marketwatch.com": "marketwatch",
  "bbc.com": "bbc",
  "bbc.co.uk": "bbc",
  "theguardian.com": "the guardian",
  "axios.com": "axios",
  "morningstar.com": "morningstar",
  "forbes.com": "forbes",
  "fortune.com": "fortune",
  "businessinsider.com": "business insider",
  "finance.yahoo.com": "yahoo finance",
  "yahoo.com": "yahoo finance",
  "investopedia.com": "investopedia",
  "cnn.com": "cnn",
  "edition.cnn.com": "cnn",
  "zacks.com": "zacks",
  "kiplinger.com": "kiplinger",
  "seekingalpha.com": "seeking alpha",
  "fool.com": "the motley fool",
  "benzinga.com": "benzinga",
  "investorplace.com": "investorplace",
  "foxbusiness.com": "fox business",
  "thestreet.com": "thestreet",
  "reddit.com": "reddit",
  "twitter.com": "twitter",
  "x.com": "x",
  "stocktwits.com": "stocktwits",
};

function lookupKnownSource(urlStr: string): { source: string; score: number } | null {
  try {
    const host = new URL(urlStr).hostname.toLowerCase().replace(/^www\./, "");
    // exact match first
    if (DOMAIN_TO_SOURCE[host]) {
      const src = DOMAIN_TO_SOURCE[host];
      return { source: src, score: TRUST_SCORES[src] };
    }
    // suffix match (handles subdomains)
    for (const [domain, src] of Object.entries(DOMAIN_TO_SOURCE)) {
      if (host === domain || host.endsWith(`.${domain}`)) {
        return { source: src, score: TRUST_SCORES[src] };
      }
    }
  } catch {
    // ignore
  }
  return null;
}

// ---------- Stronger article validation ----------
// Hosts that are essentially never article publishers
const NON_ARTICLE_HOSTS = new Set<string>([
  "youtube.com", "youtu.be", "m.youtube.com", "music.youtube.com",
  "tiktok.com", "vm.tiktok.com",
  "instagram.com",
  "facebook.com", "m.facebook.com", "fb.watch",
  "twitter.com", "x.com", "mobile.twitter.com",
  "reddit.com", "old.reddit.com",
  "linkedin.com",
  "stocktwits.com",
  "spotify.com", "open.spotify.com",
  "soundcloud.com",
  "twitch.tv",
  "pinterest.com",
  "github.com", "gitlab.com", "bitbucket.org",
  "wikipedia.org", "en.wikipedia.org",
  "amazon.com", "ebay.com", "etsy.com", "shopify.com",
  "google.com", "www.google.com", "news.google.com",
  "bing.com", "duckduckgo.com",
  "discord.com", "discord.gg",
  "t.me", "telegram.org",
  "tradingview.com",
]);

// Path patterns that almost certainly are NOT articles
const NON_ARTICLE_PATH_PATTERNS: RegExp[] = [
  /\/(login|signup|signin|register|checkout|cart|pricing|account|settings|subscribe|newsletter)(\/|$)/i,
  /\/(search|tag|tags|topic|topics|category|categories|author|authors|sitemap|index)(\/|$)/i,
  /\/(quote|symbol|ticker|chart|charts|portfolio|watchlist|screener)(\/|$)/i,
  /\/(video|videos|watch|live|stream|podcast|podcasts|gallery|photos|slideshow)(\/|$)/i,
  /\.(zip|exe|dmg|mp4|mp3|mov|webm|png|jpg|jpeg|gif|svg|ico|css|js|json|xml|csv)$/i,
];

// File extensions / paths that look like articles. We're permissive here so
// common news URL variants (AMP, mobile, dated slugs, /news/, /story/) are
// recognized as articles even when og:type metadata is missing or blocked.
const ARTICLE_PATH_HINTS: RegExp[] = [
  /\/\d{4}\/\d{1,2}\/\d{1,2}\//,                                // /2024/03/15/
  /\/\d{4}-\d{1,2}-\d{1,2}\//,                                  // /2024-03-15/
  /\/(article|articles|news|story|stories|post|posts|opinion|analysis|insights|markets|business|finance|economy|world|tech|technology|investing|companies|features|reports|read|press-release|pr|wire|blog|column|columns|editorial|commentary)\//i,
  /\/amp\//i,                                                    // AMP path segment
  /\.amp(\.html?)?$/i,                                           // .amp / .amp.html
  /-[a-z0-9]{6,}$/i,                                             // slug ending with id
  /\/[a-z0-9-]{20,}/i,                                           // long slugs
  /\/[a-z0-9-]+-(idUSKB|idUSL|id[A-Z]{2,3})\d/i,                // Reuters legacy IDs
];

// Known financial / mainstream news publishers — if the host is on this list AND
// the path is not obviously a homepage/section, we always treat it as an article.
// This prevents false negatives when sites block our metadata fetch with 403.
const KNOWN_PUBLISHER_DOMAINS = new Set<string>([
  "reuters.com", "apnews.com", "ap.org", "bloomberg.com", "ft.com",
  "wsj.com", "economist.com", "nytimes.com", "washingtonpost.com",
  "cnbc.com", "barrons.com", "marketwatch.com", "bbc.com", "bbc.co.uk",
  "theguardian.com", "axios.com", "morningstar.com", "forbes.com",
  "fortune.com", "businessinsider.com", "finance.yahoo.com",
  "investopedia.com", "cnn.com", "edition.cnn.com", "zacks.com",
  "kiplinger.com", "seekingalpha.com", "fool.com", "benzinga.com",
  "investorplace.com", "foxbusiness.com", "thestreet.com",
  // Additional widely-cited financial publishers
  "ftadviser.com", "investing.com", "coindesk.com", "cointelegraph.com",
  "decrypt.co", "theblock.co", "theinformation.com", "techcrunch.com",
  "arstechnica.com", "theverge.com", "engadget.com", "wired.com",
  "npr.org", "pbs.org", "abcnews.go.com", "nbcnews.com", "cbsnews.com",
  "politico.com", "thehill.com", "semafor.com", "vox.com",
  "businesswire.com", "prnewswire.com", "globenewswire.com",
  "handelsblatt.com", "lesechos.fr", "elpais.com", "elmundo.es",
  "expansion.com", "cincodias.elpais.com", "ilsole24ore.com",
  "nikkei.com", "scmp.com", "japantimes.co.jp",
]);

function isKnownPublisherHost(host: string): boolean {
  for (const dom of KNOWN_PUBLISHER_DOMAINS) {
    if (host === dom || host.endsWith(`.${dom}`)) return true;
  }
  return false;
}

// Normalize host: drop common mobile/AMP subdomain prefixes so we don't
// reject "m.cnbc.com" or "amp.theguardian.com" etc.
function normalizeHost(host: string): string {
  return host
    .toLowerCase()
    .replace(/^www\./, "")
    .replace(/^m\./, "")
    .replace(/^amp\./, "")
    .replace(/^mobile\./, "");
}

type PreCheck =
  | { ok: true; metaTitle?: string; metaType?: string; metaDescription?: string }
  | { ok: false; reason: string };

function isPrivateOrLocalHost(hostname: string): boolean {
  if (!hostname) return true;
  const h = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (h === "localhost" || h.endsWith(".localhost") || h.endsWith(".local") || h.endsWith(".internal")) return true;
  // IPv4
  const m = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (m) {
    const [a, b] = [parseInt(m[1]), parseInt(m[2])];
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 0) return true;
    if (a === 169 && b === 254) return true; // link-local incl. 169.254.169.254
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
    if (a >= 224) return true; // multicast / reserved
    return false;
  }
  // IPv6: block loopback, link-local, unique-local, unspecified, and IPv4-mapped private
  if (h === "::" || h === "::1") return true;
  if (h.startsWith("fe80:") || h.startsWith("fc") || h.startsWith("fd")) return true;
  if (h.startsWith("::ffff:")) {
    const v4 = h.slice(7);
    return isPrivateOrLocalHost(v4);
  }
  return false;
}

async function preCheckArticle(urlStr: string): Promise<PreCheck> {

  let parsed: URL;
  try {
    parsed = new URL(urlStr);
  } catch {
    return { ok: false, reason: "The link is not a valid URL." };
  }

  if (!/^https?:$/.test(parsed.protocol)) {
    return { ok: false, reason: "Only http(s) links can be analyzed." };
  }

  // SSRF guard: block private/loopback/link-local hosts (incl. cloud metadata IPs).
  if (isPrivateOrLocalHost(parsed.hostname)) {
    return { ok: false, reason: "This URL is not allowed." };
  }

  const host = normalizeHost(parsed.hostname);
  let path = parsed.pathname || "/";
  // Strip trailing /amp or /amp.html so the path checks match the canonical article
  path = path.replace(/\/amp\/?$/i, "/").replace(/\.amp(\.html?)?$/i, "");

  // Hard block: known non-article hosts
  for (const blocked of NON_ARTICLE_HOSTS) {
    if (host === blocked || host.endsWith(`.${blocked}`)) {
      return {
        ok: false,
        reason: `This link points to ${blocked}, which is not a written news article. Please paste a direct link to an article.`,
      };
    }
  }

  // Hard block: homepage / very short path (e.g. /, /markets)
  if (path === "/" || path === "" || /^\/[a-z-]{1,12}\/?$/i.test(path)) {
    return {
      ok: false,
      reason: "This link looks like a website homepage or section page, not a specific article. Please paste a direct link to an article.",
    };
  }

  // Hard block: obvious non-article paths
  for (const pat of NON_ARTICLE_PATH_PATTERNS) {
    if (pat.test(path)) {
      return {
        ok: false,
        reason: "This link looks like a section, video, or product page rather than a written article.",
      };
    }
  }

  // Fast accept: known publisher with a non-trivial path → treat as article
  // without requiring a successful metadata fetch (many publishers 403 bots).
  const isKnownPublisher = isKnownPublisherHost(host);
  const hasPathHint = ARTICLE_PATH_HINTS.some((p) => p.test(path));
  if (isKnownPublisher && (hasPathHint || path.length > 25)) {
    return { ok: true };
  }

  // Try to fetch metadata to confirm
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 6000);
    const fetchHeaders = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
    } as const;

    // Manually follow redirects so we can re-validate each hop against the
    // private-IP blocklist (prevents SSRF via open redirect to 169.254.169.254).
    let current = parsed.toString();
    let res: Response | null = null;
    for (let hop = 0; hop < 5; hop++) {
      res = await fetch(current, {
        method: "GET",
        redirect: "manual",
        signal: ctrl.signal,
        headers: fetchHeaders,
      });
      if (res.status >= 300 && res.status < 400) {
        const loc = res.headers.get("location");
        if (!loc) break;
        let next: URL;
        try { next = new URL(loc, current); } catch { clearTimeout(timer); return { ok: false, reason: "This URL is not allowed." }; }
        if (!/^https?:$/.test(next.protocol) || isPrivateOrLocalHost(next.hostname)) {
          clearTimeout(timer);
          return { ok: false, reason: "This URL is not allowed." };
        }
        current = next.toString();
        continue;
      }
      break;
    }
    clearTimeout(timer);
    if (!res) return { ok: false, reason: "We couldn't reach this page." };


    // If the publisher blocks the bot (403/429/503), don't penalize the user —
    // fall back to path heuristics.
    if (!res.ok) {
      if (hasPathHint || isKnownPublisher) return { ok: true };
      return {
        ok: false,
        reason: "We couldn't reach this page to verify it's an article. Please paste a different link or try again later.",
      };
    }

    const ctype = res.headers.get("content-type") || "";
    if (!ctype.toLowerCase().includes("text/html")) {
      return {
        ok: false,
        reason: "This link does not return a web page (it serves a file or non-HTML resource).",
      };
    }

    // Read at most ~200KB of HTML head
    const reader = res.body?.getReader();
    let html = "";
    if (reader) {
      const decoder = new TextDecoder();
      let total = 0;
      while (total < 200_000) {
        const { value, done } = await reader.read();
        if (done) break;
        total += value.length;
        html += decoder.decode(value, { stream: true });
        if (html.includes("</head>")) break;
      }
      try { await reader.cancel(); } catch { /* noop */ }
    }

    const headHtml = html.split(/<\/head>/i)[0] || html;

    const metaType = (headHtml.match(/<meta[^>]+property=["']og:type["'][^>]+content=["']([^"']+)["']/i)?.[1] || "").toLowerCase();
    const metaTitle = headHtml.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)?.[1]
      ?? headHtml.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]
      ?? "";
    const metaDescription = headHtml.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)?.[1] ?? "";
    const hasArticleSchema = /"@type"\s*:\s*"(NewsArticle|Article|ReportageNewsArticle|AnalysisNewsArticle|OpinionNewsArticle|BlogPosting|LiveBlogPosting|BackgroundNewsArticle)"/i.test(headHtml);
    const hasArticlePublishedTime =
      /property=["']article:published_time["']/i.test(headHtml) ||
      /name=["']pubdate["']/i.test(headHtml) ||
      /name=["']publishdate["']/i.test(headHtml) ||
      /name=["']article\.published["']/i.test(headHtml) ||
      /itemprop=["']datePublished["']/i.test(headHtml);
    const hasArticleAuthor =
      /property=["']article:author["']/i.test(headHtml) ||
      /name=["']author["']/i.test(headHtml) ||
      /itemprop=["']author["']/i.test(headHtml);
    const hasAmpHtml = /rel=["']amphtml["']/i.test(headHtml);

    const looksLikeArticle =
      metaType === "article" ||
      metaType.startsWith("article:") ||
      hasArticleSchema ||
      hasArticlePublishedTime ||
      (hasArticleAuthor && hasPathHint) ||
      hasAmpHtml ||
      hasPathHint ||
      isKnownPublisher;

    // Only hard-reject if og:type is explicitly something non-article AND we
    // have no other article signals (avoids rejecting articles that just tag
    // og:type as "website" by mistake).
    if (
      metaType &&
      metaType !== "article" &&
      !metaType.startsWith("article:") &&
      !hasArticleSchema &&
      !hasArticlePublishedTime &&
      !hasArticleAuthor &&
      !hasPathHint &&
      !isKnownPublisher
    ) {
      return {
        ok: false,
        reason: `This page is marked as "${metaType}" by the site, not as a written article.`,
      };
    }

    if (!looksLikeArticle) {
      return {
        ok: false,
        reason: "We couldn't detect article metadata on this page. Please paste a direct link to a written article.",
      };
    }

    return { ok: true, metaTitle: metaTitle?.slice(0, 300), metaType, metaDescription: metaDescription?.slice(0, 500) };
  } catch (_e) {
    // Network/timeout: don't hard-block — let the AI try, but flag as unknown
    return { ok: true };
  }
}

// ---------- Cross-source corroboration ----------
// Derives a search query from the article's title (or URL slug) and pulls
// independent coverage from Google News RSS so the model can compare claims
// against what other outlets are reporting.
function deriveQuery(urlStr: string, metaTitle?: string): string {
  const t = (metaTitle || "").replace(/\s*[|\-–—]\s*[^|\-–—]{0,40}$/, "").trim();
  if (t.length >= 15) return t.slice(0, 160);
  try {
    const path = new URL(urlStr).pathname;
    const slug = path.split("/").filter(Boolean).pop() || "";
    return slug.replace(/\.(html?|amp)$/i, "").replace(/[-_]+/g, " ").replace(/\b\d{6,}\b/g, "").trim().slice(0, 160);
  } catch {
    return "";
  }
}

type CrossSource = { source: string; title: string; date?: string };

async function fetchCrossSources(query: string, excludeHost: string): Promise<CrossSource[]> {
  if (!query || query.length < 8) return [];
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 6000);
    const res = await fetch(
      `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`,
      {
        signal: ctrl.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
          Accept: "application/rss+xml,application/xml;q=0.9,*/*;q=0.8",
        },
      },
    );
    clearTimeout(timer);
    if (!res.ok) return [];
    const xml = (await res.text()).slice(0, 200_000);
    const items = xml.split(/<item>/i).slice(1, 15);
    const out: CrossSource[] = [];
    for (const item of items) {
      const title = (item.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i)?.[1] || "")
        .replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"').trim();
      const source = (item.match(/<source[^>]*>([\s\S]*?)<\/source>/i)?.[1] || "").trim();
      const date = (item.match(/<pubDate>([\s\S]*?)<\/pubDate>/i)?.[1] || "").trim();
      if (!title) continue;
      const src = source || (title.split(" - ").pop() || "").trim();
      if (src && excludeHost && src.toLowerCase().replace(/\s+/g, "").includes(excludeHost.split(".")[0])) continue;
      out.push({ source: src.slice(0, 60), title: title.replace(/\s+-\s+[^-]+$/, "").slice(0, 200), date: date.slice(0, 40) });
      if (out.length >= 8) break;
    }
    return out;
  } catch {
    return [];
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Rate limit: 10 requests per minute per IP
  const ip = getClientIP(req);
  const rl = checkRateLimit(`analyze:${ip}`, { maxRequests: 10, windowMs: 60_000 });
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs, corsHeaders);

  try {
    const rawBody = await req.json();

    const { valid, errors, sanitized } = validateInput(rawBody, inputSchema);
    if (!valid) return validationErrorResponse(errors, corsHeaders);

    const { url, language: langCode } = sanitized as { url: string; language?: string };
    const langName = LANGUAGE_NAMES[(langCode || "en").toLowerCase()] || "English";

    // --- Server-side auth & usage enforcement ---
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData } = await supabaseAdmin.auth.getUser(token);
    if (!userData?.user) {
      return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = userData.user.id;
    let isPro = false;

    // Admin bypass via DB lookup
    const isAdmin = await isAdminEmail(supabaseAdmin, userData.user.email ?? null);
    if (isAdmin) {
      isPro = true;
      await logAdminBypass(supabaseAdmin, userData.user.email!, "analyze-link", userId);
    } else {
      const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
      if (stripeKey && userData.user.email) {
        try {
          // Only the Pro tier grants unlimited article analyses.
          // Plus ("price_1TPM56PJefLcxc6CzfD5CUaS" / "prod_UO8LzRA6kfvdwm")
          // remains on the free daily quota for this feature.
          const PRO_PRICE_IDS = new Set([
            "price_1TFyVKPJefLcxc6Cn1iwdSTk",
            "price_1TPM5RPJefLcxc6Cap03GhJm",
          ]);
          const PRO_PRODUCT_ID = "prod_UEROAe01UbaEpK";
          const Stripe = (await import("https://esm.sh/stripe@18.5.0")).default;
          const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
          const customers = await stripe.customers.list({ email: userData.user.email, limit: 1 });
          if (customers.data.length > 0) {
            const subs = await stripe.subscriptions.list({ customer: customers.data[0].id, status: "active", limit: 5 });
            for (const sub of subs.data) {
              const item = sub.items.data[0];
              const priceId = item?.price?.id ?? "";
              const productId = typeof item?.price?.product === "string" ? item.price.product : "";
              if (PRO_PRICE_IDS.has(priceId) || productId === PRO_PRODUCT_ID) {
                isPro = true;
                break;
              }
            }
          }
        } catch {
          // Default to free tier
        }
      }
    }

    // ---- Pre-flight URL/metadata validation (does NOT count against quota) ----
    const pre = await preCheckArticle(url);
    if (!pre.ok) {
      return new Response(
        JSON.stringify({
          success: false,
          notArticle: true,
          reason: pre.reason,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    // Enforce daily analysis limit for free users
    if (!isPro) {
      const today = new Date().toISOString().split("T")[0];
      const { count } = await supabaseAdmin
        .from("analysis_usage")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("used_date", today);

      if ((count ?? 0) >= FREE_DAILY_ANALYSES) {
        return new Response(JSON.stringify({ error: "Daily analysis limit reached. Upgrade to Pro for unlimited analyses." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // ---- Cross-source corroboration (independent coverage of the same story) ----
    let articleHost = "";
    try { articleHost = normalizeHost(new URL(url).hostname); } catch { /* noop */ }
    const crossSources = await fetchCrossSources(deriveQuery(url, (pre as { metaTitle?: string }).metaTitle), articleHost);
    const crossSourceBlock = crossSources.length
      ? crossSources.map((c, i) => `${i + 1}. [${c.source || "Unknown outlet"}] ${c.title}${c.date ? ` (${c.date})` : ""}`).join("\n")
      : "No independent coverage of this story was found in the news index.";

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");


    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `OUTPUT LANGUAGE: ${langName}. Every human-readable string value in your JSON output — including but not limited to "title", "source", "summary", every item in "biases" and "strengths", "redFlag", "hiddenAngle", every "category"/"evidence"/"explanation" inside "reasoning", and every field inside "proDeepDive" (stakeholderMotives, omittedDataPoints, sentimentDivergence) — MUST be written in ${langName}. JSON keys, ticker symbols, and proper nouns stay in their original form; everything else MUST be translated. Never mix languages in a single value.

You are a financial article credibility analyst. Given a URL, you must FIRST determine whether the URL points to an actual news/journalism article (or written analysis/opinion piece). You must respond with valid JSON only, no markdown.

STEP 1 — Classification (REQUIRED):
Set "isArticle" to false when the URL clearly points to any of:
- Homepages, section/category pages, tag/topic indexes, search results, author pages
- Video/podcast/livestream pages with no written article body (YouTube, TikTok, Spotify, Twitch, etc.)
- Social-media posts (Twitter/X, Reddit threads, Instagram, Facebook, LinkedIn, Stocktwits)
- Product/marketing/landing pages, pricing pages, login/signup, checkout
- Documentation, software repos (GitHub/GitLab), developer tools
- Raw files (PDFs are OK only if they are clearly a written report/article — otherwise false)
- Stock-quote/ticker pages with no editorial content, broker order tickets, charts
- Wikipedia/encyclopedia entries (not journalism)
- Forums, comment threads, message boards
- Anything not in a language you can analyze, or anything ambiguous/empty

If "isArticle" is false, respond with EXACTLY (the "reason" must be written in ${langName}):
{ "isArticle": false, "reason": "<one short sentence in ${langName} explaining what the URL actually is>" }
Do NOT include any other fields when isArticle is false.

STEP 2 — If and only if the URL clearly points to a written news/analysis/opinion article, return this exact JSON structure (remember: ALL string values below must be written in ${langName}):
{
  "isArticle": true,
  "title": "descriptive title of the analysis",
  "source": "identified source name",
  "trustScore": <number 1-10>,
  "summary": "200 word max summary of what you can infer about the content and source credibility",
  "biases": ["list", "of", "potential", "biases"],
  "strengths": ["list", "of", "credibility", "strengths"],
  "redFlag": "ONE short tag (2-4 words) translated to ${langName}, equivalent to one of: Promotional Language | Conflict of Interest | One-Sided | Pump Pattern | Sensational Headline | Cherry-Picked Data | Unverified Claims | Objective Reporting",
  "hiddenAngle": "2-3 sentence Pro insight describing what the article is hiding, omitting, or downplaying. Be concrete.",
  "misinformationRisk": "one of: low | medium | high (keep these exact English values)",
  "factualIssues": [
    { "claim": "the specific factual claim made in the article", "status": "one of: accurate | unsupported | misleading | false (keep these exact English values)", "explanation": "1-2 sentences in ${langName} explaining what is right or wrong with the claim and what the evidence actually shows" }
  ],
  "crossCheck": {
    "verdict": "one of: corroborated | partially_corroborated | contradicted | uncorroborated | no_coverage (keep these exact English values)",
    "summary": "2-3 sentences in ${langName} comparing this article against the independent coverage listed below: do other outlets report the same facts, different numbers, or nothing at all?",
    "sources": [ { "source": "outlet name", "title": "headline", "agreement": "one of: agrees | differs | contradicts (keep these exact English values)" } ]
  },
  "reasoning": [
    { "category": "<one of: Language | Framing | Sources | Bias | Topic | Omissions | Tone | Accuracy | Cross-check> (translated to ${langName}, except keep Cross-check recognizable)", "evidence": "the specific word, phrase, statistic, source citation, structural pattern, or corroborating/contradicting outlet headline that triggered this observation — quote it briefly", "explanation": "1-2 sentences in ${langName} explaining WHY this evidence pushed the trust score up or down, or revealed a bias, factual error, or corroboration gap" }
  ],
  "proDeepDive": {
    "stakeholderMotives": "2-3 sentences: who specifically benefits from THIS article's framing — name the institutions, insiders, analysts or funds whose positioning aligns with the narrative. Reference concrete incentives (recent insider trades, analyst price-target history, fund holdings) rather than generic 'institutions benefit' language.",
    "omittedDataPoints": "2-3 sentences: name the specific data the article skips — contradicting filings, recent regulatory headlines, peer comparisons, historical baselines, or guidance revisions that would weaken the thesis. Cite numbers or filing types where plausible.",
    "sentimentDivergence": "2-3 sentences: contrast the article's tone with concrete counter-signals — options-flow skew, short interest trend, analyst dispersion, peer-coverage tone, or social-sentiment direction. Indicate whether consensus is genuine or manufactured."
  }
}

CRITICAL — misinformation requirement:
You are not only a bias detector, you are a misinformation detector. Evaluate the FACTUAL accuracy of the article's central claims, not just its tone. Populate "factualIssues" with 2-4 of the article's most consequential checkable claims and judge each one. Flag fabricated statistics, misattributed quotes, stale data presented as current, causal claims unsupported by the cited data, and pump-and-dump or scam patterns. Set "misinformationRisk" accordingly: "high" when central claims are false or fabricated, "medium" when key claims are unsupported/misleading, "low" when claims are verifiable and consistent with the record.

CRITICAL — cross-source verification requirement:
Below you are given independent coverage of the same story from other outlets, retrieved from a live news index. You MUST use it. Compare the article's claims, numbers, and framing against that coverage and fill in "crossCheck". If several credible outlets report the same facts, say so and let it raise the trust score. If the numbers or conclusions diverge, or if NO other outlet is reporting this story at all, treat that as a serious credibility signal and lower the score. List up to 4 of the supplied outlets in "crossCheck.sources" with their agreement level — only use outlets from the supplied list, never invent sources or URLs.

CRITICAL — "reasoning" requirement:
The "reasoning" array MUST contain 4-6 entries that transparently explain "why we're saying this". Each entry must cite CONCRETE evidence — a specific phrase, adjective, source citation, statistic, headline pattern, structural choice, or a named outlet from the cross-source list. At least ONE entry MUST use category "Accuracy" (factual correctness of a claim) and at least ONE MUST use category "Cross-check" (what other outlets do or do not confirm, naming them). Cover a mix of the remaining categories so the user understands what triggered the trust score, the biases list, and the red flag. This section is what makes the analysis auditable.

CRITICAL — proDeepDive depth requirement:
The proDeepDive is the PAID Pro tier insight and MUST go meaningfully deeper than 'summary', 'biases', 'strengths', and 'hiddenAngle'. It must NOT restate or paraphrase any of those fields. It must add NEW analytical layers a free reader cannot see in the standard analysis. Each proDeepDive field must:
  - Be specific to THIS article's subject (name the ticker, company, sector, event, or person explicitly).
  - Reference concrete second-order signals: filing types (10-K, 13F, 8-K, S-1), insider Form 4 activity, options skew/IV, short interest %, analyst dispersion, peer-comparison numbers, historical base rates, regulatory dockets, or capital-flow data.
  - Avoid generic phrases like 'institutions benefit', 'investors should be cautious', 'context is missing'. Always specify WHICH institutions, WHICH context, WHICH numbers.
  - Read like a buy-side note, not a retail summary.
  - Be written in ${langName} — do NOT fall back to English just because the analytical depth is high. Translate technical terms naturally (e.g., "short interest" → equivalent in ${langName}). Acronyms like 10-K, 13F, ETF, P/E may stay as acronyms.
If you cannot supply that depth for a field, return a single sentence (in ${langName}) stating exactly which data you would need to deliver it — never pad with boilerplate.

Scoring guide:
- 9-10: Major wire services (Reuters, AP), SEC filings, Fed publications
- 7-8: Established financial media (Bloomberg, CNBC, FT, WSJ)
- 5-6: Contributor platforms (Seeking Alpha, Motley Fool), established blogs
- 3-4: Social media, anonymous forums, unverified sources
- 1-2: Known misinformation sources, pump-and-dump signals

Analyze the URL domain, path structure, and any recognizable patterns to assess credibility even without fetching the page content.`,
          },
          {
            role: "user",
            content: `Analyze this financial article URL for credibility and bias. Respond entirely in ${langName}. URL: ${url}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    let analysis;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch {
      analysis = null;
    }

    if (!analysis) {
      analysis = {
        title: "Article Analysis",
        source: new URL(url).hostname,
        trustScore: 5,
        summary: content.slice(0, 500),
        biases: ["Unable to fully parse structured analysis"],
        strengths: ["URL was analyzed by AI"],
        redFlag: "Unverified Claims",
        hiddenAngle: "Automated parsing failed; manual review recommended.",
      };
    }

    // If the AI determined this URL is not an article, short-circuit before
    // recording usage or persisting to the public Media Bias Pulse feed.
    if (analysis.isArticle === false) {
      return new Response(
        JSON.stringify({
          success: false,
          notArticle: true,
          reason: String(analysis.reason ?? "The link you provided does not appear to be a news article. Please paste a direct link to a written article.").slice(0, 280),
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!analysis.redFlag) analysis.redFlag = "Unverified Claims";
    if (!Array.isArray(analysis.reasoning)) analysis.reasoning = [];
    // Guarantee the "why we're saying this" section always renders: synthesize
    // fallback entries from biases/strengths if the model omitted the reasoning.
    if (analysis.reasoning.length === 0) {
      const biases = Array.isArray(analysis.biases) ? analysis.biases : [];
      const strengths = Array.isArray(analysis.strengths) ? analysis.strengths : [];
      const fallback: Array<{ category: string; evidence: string; explanation: string }> = [];
      biases.slice(0, 3).forEach((b: string) => fallback.push({
        category: "Bias", evidence: String(b), explanation: "This pattern contributed to lowering the trust score.",
      }));
      strengths.slice(0, 2).forEach((s: string) => fallback.push({
        category: "Strength", evidence: String(s), explanation: "This element supported the trust score.",
      }));
      if (fallback.length === 0) {
        fallback.push({ category: "Summary", evidence: analysis.summary?.slice(0, 160) ?? "", explanation: "Overall assessment based on the article content." });
      }
      analysis.reasoning = fallback;
    }
    if (!analysis.hiddenAngle) analysis.hiddenAngle = analysis.summary?.slice(0, 220) ?? "";
    if (!analysis.proDeepDive || typeof analysis.proDeepDive !== "object") {
      analysis.proDeepDive = {
        stakeholderMotives: "Deep-dive parsing unavailable for this article. Re-run analysis to generate stakeholder context.",
        omittedDataPoints: "Deep-dive parsing unavailable for this article. Re-run analysis to surface omitted data.",
        sentimentDivergence: "Deep-dive parsing unavailable for this article. Re-run analysis to compare sentiment signals.",
      };
    }

    // Override AI score with deterministic score for known sources so the
    // analyzer always agrees with the news-feed trust badge.
    const known = lookupKnownSource(url);
    if (known) {
      analysis.trustScore = known.score;
      if (!analysis.source || /^https?:|\./i.test(analysis.source)) {
        analysis.source = known.source.replace(/\b\w/g, (c: string) => c.toUpperCase());
      }
    }

    // Record usage server-side AFTER successful analysis
    if (userId && !isPro) {
      await supabaseAdmin.from("analysis_usage").insert({ user_id: userId });
    }

    // Persist to the public Media Bias Pulse feed
    try {
      const { data: inserted, error: insErr } = await supabaseAdmin
        .from("analyzed_articles")
        .insert({
          url,
          source: String(analysis.source ?? "Unknown").slice(0, 120),
          title: String(analysis.title ?? "Article Analysis").slice(0, 300),
          bias_score: Math.max(1, Math.min(10, Number(analysis.trustScore) || 5)),
          red_flag: String(analysis.redFlag ?? "Unverified").slice(0, 60),
          summary: String(analysis.summary ?? "").slice(0, 1000),
          submitted_by: userId,
        })
        .select("id")
        .single();
      if (insErr) throw insErr;
      if (inserted?.id) {
        await supabaseAdmin.from("analyzed_articles_premium").insert({
          article_id: inserted.id,
          hidden_angle: String(analysis.hiddenAngle ?? "").slice(0, 600),
          pro_deep_dive: analysis.proDeepDive ?? null,
        });
      }
    } catch (e) {
      console.error("Failed to persist analyzed_article:", e);
    }


    // Strip premium fields for non-Pro users to prevent client-side bypass
    if (!isPro) {
      analysis.hiddenAngle = null;
      analysis.proDeepDive = null;
    }

    return new Response(JSON.stringify({ success: true, analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-link error:", e);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
