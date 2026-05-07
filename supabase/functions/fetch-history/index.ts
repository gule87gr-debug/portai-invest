import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { checkRateLimit, getClientIP, rateLimitResponse } from "../_shared/rate-limiter.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const cache = new Map<string, { data: any; ts: number }>();
const CACHE_TTL = 60 * 1000;

type Range = "1D" | "1W" | "1M" | "3M" | "1Y" | "ALL";

function rangeToParams(range: Range): { range: string; interval: string } {
  switch (range) {
    case "1D": return { range: "1d", interval: "5m" };
    case "1W": return { range: "5d", interval: "30m" };
    case "1M": return { range: "1mo", interval: "1d" };
    case "3M": return { range: "3mo", interval: "1d" };
    case "1Y": return { range: "1y", interval: "1d" };
    case "ALL": return { range: "max", interval: "1wk" };
  }
}

function toYahooSymbol(ticker: string, type?: string): string {
  const upper = ticker.toUpperCase();
  if (type === "crypto") {
    const base = upper.replace(/USD[T]?$/, "");
    return `${base}-USD`;
  }
  return upper;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { ticker, type, range = "1M" } = await req.json();
    if (!ticker || typeof ticker !== "string") {
      return new Response(JSON.stringify({ error: "ticker required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const r = (range as string).toUpperCase() as Range;
    const validRanges: Range[] = ["1D", "1W", "1M", "3M", "1Y", "ALL"];
    if (!validRanges.includes(r)) {
      return new Response(JSON.stringify({ error: "invalid range" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const symbol = toYahooSymbol(ticker, type);
    const cacheKey = `${symbol}:${r}`;
    const now = Date.now();
    const cached = cache.get(cacheKey);
    if (cached && now - cached.ts < CACHE_TTL) {
      return new Response(JSON.stringify(cached.data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const params = rangeToParams(r);
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${params.interval}&range=${params.range}`;
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!res.ok) {
      return new Response(JSON.stringify({ error: "yahoo fetch failed", status: res.status }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const data = await res.json();
    const result = data?.chart?.result?.[0];
    if (!result) {
      return new Response(JSON.stringify({ error: "no data" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const timestamps: number[] = result.timestamp || [];
    const quote = result.indicators?.quote?.[0] || {};
    const closes: (number | null)[] = quote.close || [];
    const opens: (number | null)[] = quote.open || [];
    const highs: (number | null)[] = quote.high || [];
    const lows: (number | null)[] = quote.low || [];

    const points = timestamps
      .map((t, i) => ({
        t: t * 1000,
        c: closes[i],
        o: opens[i],
        h: highs[i],
        l: lows[i],
      }))
      .filter((p) => p.c != null);

    const meta = result.meta || {};
    const payload = {
      symbol,
      range: r,
      currency: meta.currency,
      points,
      meta: {
        previousClose: meta.chartPreviousClose ?? meta.previousClose ?? null,
        regularMarketPrice: meta.regularMarketPrice ?? null,
      },
    };

    cache.set(cacheKey, { data: payload, ts: now });
    return new Response(JSON.stringify(payload), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
