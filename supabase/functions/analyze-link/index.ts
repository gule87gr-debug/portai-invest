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
            content: `You are a financial article credibility analyst. Given a URL, analyze the source and provide a structured assessment. You must respond with valid JSON only, no markdown.

Return this exact JSON structure:
{
  "title": "descriptive title of the analysis",
  "source": "identified source name",
  "trustScore": <number 1-10>,
  "summary": "200 word max summary of what you can infer about the content and source credibility",
  "biases": ["list", "of", "potential", "biases"],
  "strengths": ["list", "of", "credibility", "strengths"],
  "redFlag": "ONE short tag (2-4 words): Promotional Language | Conflict of Interest | One-Sided | Pump Pattern | Sensational Headline | Cherry-Picked Data | Unverified Claims | Objective Reporting",
  "hiddenAngle": "2-3 sentence Pro insight describing what the article is hiding, omitting, or downplaying. Be concrete."
}

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
    if (!analysis.redFlag) analysis.redFlag = "Unverified Claims";
    if (!analysis.hiddenAngle) analysis.hiddenAngle = analysis.summary?.slice(0, 220) ?? "";

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
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
