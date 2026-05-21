import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { checkRateLimit, rateLimitResponse } from "../_shared/rate-limiter.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const cache = new Map<string, { description: string; ts: number }>();
const CACHE_TTL = 1000 * 60 * 60 * 24 * 7; // 7 days

const SYSTEM = `You write concise, factual financial reference summaries for stocks, ETFs, indexes, and cryptocurrencies.
Match this style exactly (specific, neutral, dense with facts, no hype, no advice):

Example (VOO): "VOO tracks the S&P 500 index at an extremely low expense ratio of 0.03%. Like SPY, it holds all 500 companies in the index but is preferred by long-term investors for its lower fees."

Rules:
- 2-4 sentences, 50-90 words.
- Mention what the asset IS (company business, fund objective, index methodology, or crypto purpose).
- Include 1-2 concrete facts (sector focus, key holdings, country, use case, year founded if known).
- No price commentary, no buy/sell language, no "as of" dates.
- If you are not certain about a specific number or fact, omit it rather than guess.
- Plain prose, no markdown, no lists, no headings.`;

interface Body {
  ticker: string;
  name?: string;
  sector?: string;
  type?: "stock" | "etf" | "index" | "crypto";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Require authenticated user (prevents AI credit abuse)
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Authentication required" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );
  const { data: userData } = await supabaseAdmin.auth.getUser(authHeader.replace("Bearer ", ""));
  if (!userData?.user) {
    return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const rl = checkRateLimit(`describe-asset:${userData.user.id}`, { maxRequests: 30, windowMs: 60_000 });
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs, corsHeaders);

  try {
    const body: Body = await req.json();
    const ticker = (body.ticker || "").toUpperCase().trim();
    if (!ticker || ticker.length > 20) {
      return new Response(JSON.stringify({ error: "ticker required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const name = (body.name || "").slice(0, 200);
    const sector = (body.sector || "").slice(0, 80);
    const type = (body.type || "stock") as Body["type"];

    const cacheKey = `${ticker}:${type}`;
    const now = Date.now();
    const cached = cache.get(cacheKey);
    if (cached && now - cached.ts < CACHE_TTL) {
      return new Response(JSON.stringify({ description: cached.description, cached: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userPrompt = `Write a description for:
Ticker: ${ticker}
Name: ${name || "(unknown)"}
Sector/Category: ${sector || "(unknown)"}
Type: ${type}

Return ONLY the description text, nothing else.`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!aiRes.ok) {
      const text = await aiRes.text();
      console.error("describe-asset ai gateway error:", aiRes.status, text.slice(0, 500));
      return new Response(JSON.stringify({ error: "Service temporarily unavailable" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiJson = await aiRes.json();
    let description = (aiJson?.choices?.[0]?.message?.content || "").trim();
    // strip wrapping quotes if any
    description = description.replace(/^["“”']+|["“”']+$/g, "").trim();
    if (!description) {
      return new Response(JSON.stringify({ error: "empty ai response" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    cache.set(cacheKey, { description, ts: now });
    return new Response(JSON.stringify({ description, cached: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
