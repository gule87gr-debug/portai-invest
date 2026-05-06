import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { checkRateLimit, getClientIP, rateLimitResponse } from "../_shared/rate-limiter.ts";
import { validateInput, validationErrorResponse, type SchemaDefinition } from "../_shared/input-validator.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const inputSchema: SchemaDefinition = {
  url: { type: "string", required: true, minLength: 5, maxLength: 2048, pattern: /^https?:\/\/.+/ },
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
  /\/(login|signup|signin|register|checkout|cart|pricing|account|settings)(\/|$)/i,
  /\/(search|tag|tags|topic|topics|category|categories|author|authors)(\/|$)/i,
  /\/(quote|symbol|ticker|chart|charts|portfolio|watchlist)(\/|$)/i,
  /\/(video|videos|watch|live|stream|podcast|podcasts|gallery|photos)(\/|$)/i,
  /\.(zip|exe|dmg|mp4|mp3|mov|webm|png|jpg|jpeg|gif|svg|ico|css|js|json|xml|csv)$/i,
];

// File extensions / paths that look like articles (paths containing dated slugs etc.)
const ARTICLE_PATH_HINTS: RegExp[] = [
  /\/\d{4}\/\d{1,2}\/\d{1,2}\//,        // /2024/03/15/
  /\/(article|articles|news|story|stories|post|posts|opinion|analysis|insights|markets|business|finance)\//i,
  /-[a-z0-9]{6,}$/i,                     // slug ending with id
  /\/[a-z0-9-]{20,}/i,                   // long slugs
];

type PreCheck =
  | { ok: true; metaTitle?: string; metaType?: string; metaDescription?: string }
  | { ok: false; reason: string };

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

  const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
  const path = parsed.pathname || "/";

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
  if (path === "/" || path === "") {
    return {
      ok: false,
      reason: "This link looks like a website homepage, not a specific article. Please paste a direct link to an article.",
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

  // Try to fetch metadata to confirm
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 6000);
    const res = await fetch(parsed.toString(), {
      method: "GET",
      redirect: "follow",
      signal: ctrl.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; PortAI-Bot/1.0; +https://portai-invest.com)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    clearTimeout(timer);

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
    const hasArticleSchema = /"@type"\s*:\s*"(NewsArticle|Article|ReportageNewsArticle|AnalysisNewsArticle|OpinionNewsArticle|BlogPosting)"/i.test(headHtml);
    const hasArticlePublishedTime = /property=["']article:published_time["']/i.test(headHtml);

    const looksLikeArticle =
      metaType === "article" ||
      hasArticleSchema ||
      hasArticlePublishedTime ||
      ARTICLE_PATH_HINTS.some((p) => p.test(path));

    if (metaType && metaType !== "article" && !hasArticleSchema && !hasArticlePublishedTime) {
      // og:type explicitly says it's not an article (e.g. video, profile, website)
      return {
        ok: false,
        reason: `This page is marked as "${metaType}" by the site, not as a written article.`,
      };
    }

    if (!looksLikeArticle) {
      // No article signals at all and no path hint either — likely homepage/section
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

    const { url } = sanitized as { url: string };

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

    // Admin override
    const ADMIN_EMAILS = ["gule.87.gr@gmail.com"];
    if (userData.user.email && ADMIN_EMAILS.includes(userData.user.email.toLowerCase())) {
      isPro = true;
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
            content: `You are a financial article credibility analyst. Given a URL, you must FIRST determine whether the URL points to an actual news/journalism article (or written analysis/opinion piece). You must respond with valid JSON only, no markdown.

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

If "isArticle" is false, respond with EXACTLY:
{ "isArticle": false, "reason": "<one short sentence explaining what the URL actually is, e.g. 'This URL is a YouTube video, not a written article.'>" }
Do NOT include any other fields when isArticle is false.

STEP 2 — If and only if the URL clearly points to a written news/analysis/opinion article, return this exact JSON structure:
{
  "isArticle": true,
  "title": "descriptive title of the analysis",
  "source": "identified source name",
  "trustScore": <number 1-10>,
  "summary": "200 word max summary of what you can infer about the content and source credibility",
  "biases": ["list", "of", "potential", "biases"],
  "strengths": ["list", "of", "credibility", "strengths"],
  "redFlag": "ONE short tag (2-4 words): Promotional Language | Conflict of Interest | One-Sided | Pump Pattern | Sensational Headline | Cherry-Picked Data | Unverified Claims | Objective Reporting",
  "hiddenAngle": "2-3 sentence Pro insight describing what the article is hiding, omitting, or downplaying. Be concrete.",
  "proDeepDive": {
    "stakeholderMotives": "2-3 sentences: who specifically benefits from THIS article's framing — name the institutions, insiders, analysts or funds whose positioning aligns with the narrative. Reference concrete incentives (recent insider trades, analyst price-target history, fund holdings) rather than generic 'institutions benefit' language.",
    "omittedDataPoints": "2-3 sentences: name the specific data the article skips — contradicting filings, recent regulatory headlines, peer comparisons, historical baselines, or guidance revisions that would weaken the thesis. Cite numbers or filing types where plausible.",
    "sentimentDivergence": "2-3 sentences: contrast the article's tone with concrete counter-signals — options-flow skew, short interest trend, analyst dispersion, peer-coverage tone, or social-sentiment direction. Indicate whether consensus is genuine or manufactured."
  }
}

CRITICAL — proDeepDive depth requirement:
The proDeepDive is the PAID Pro tier insight and MUST go meaningfully deeper than 'summary', 'biases', 'strengths', and 'hiddenAngle'. It must NOT restate or paraphrase any of those fields. It must add NEW analytical layers a free reader cannot see in the standard analysis. Each proDeepDive field must:
  - Be specific to THIS article's subject (name the ticker, company, sector, event, or person explicitly).
  - Reference concrete second-order signals: filing types (10-K, 13F, 8-K, S-1), insider Form 4 activity, options skew/IV, short interest %, analyst dispersion, peer-comparison numbers, historical base rates, regulatory dockets, or capital-flow data.
  - Avoid generic phrases like 'institutions benefit', 'investors should be cautious', 'context is missing'. Always specify WHICH institutions, WHICH context, WHICH numbers.
  - Read like a buy-side note, not a retail summary.
If you cannot supply that depth for a field, return a single sentence stating exactly which data you would need to deliver it — never pad with boilerplate.

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
            content: `Analyze this financial article URL for credibility and bias: ${url}`,
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
      await supabaseAdmin.from("analyzed_articles").insert({
        url,
        source: String(analysis.source ?? "Unknown").slice(0, 120),
        title: String(analysis.title ?? "Article Analysis").slice(0, 300),
        bias_score: Math.max(1, Math.min(10, Number(analysis.trustScore) || 5)),
        red_flag: String(analysis.redFlag ?? "Unverified").slice(0, 60),
        hidden_angle: String(analysis.hiddenAngle ?? "").slice(0, 600),
        summary: String(analysis.summary ?? "").slice(0, 1000),
        pro_deep_dive: analysis.proDeepDive ?? null,
        submitted_by: userId,
      });
    } catch (e) {
      console.error("Failed to persist analyzed_article:", e);
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
