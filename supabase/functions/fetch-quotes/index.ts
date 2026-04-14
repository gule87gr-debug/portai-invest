import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Simple in-memory cache (per isolate, ~5 min TTL)
const cache = new Map<string, { data: any; ts: number }>();
const CACHE_TTL = 5 * 60 * 1000;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("FINNHUB_API_KEY");
    if (!apiKey) throw new Error("FINNHUB_API_KEY is not set");

    const { tickers } = await req.json();
    if (!Array.isArray(tickers) || tickers.length === 0) {
      throw new Error("tickers must be a non-empty array");
    }

    // Limit batch size to avoid rate limits (60/min on free tier)
    const batch = tickers.slice(0, 30);
    const now = Date.now();
    const results: Record<string, any> = {};

    const fetches = batch.map(async (ticker: string) => {
      const upper = ticker.toUpperCase();

      // Check cache
      const cached = cache.get(upper);
      if (cached && now - cached.ts < CACHE_TTL) {
        results[upper] = cached.data;
        return;
      }

      // Map crypto tickers to Finnhub format
      let symbol = upper;
      if (upper.endsWith("USD") && upper.length > 4 && !["AUDUSD", "EURUSD", "GBPUSD", "NZDUSD"].includes(upper)) {
        // Crypto: BTCUSD -> BINANCE:BTCUSDT
        const base = upper.replace(/USD$/, "");
        symbol = `BINANCE:${base}USDT`;
      }

      try {
        const res = await fetch(
          `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${apiKey}`
        );
        if (!res.ok) {
          results[upper] = null;
          return;
        }
        const data = await res.json();
        // Finnhub returns { c, d, dp, h, l, o, pc, t }
        // c=current, d=change, dp=percent change, o=open, h=high, l=low, pc=prev close
        if (data && data.c && data.c !== 0) {
          const quote = {
            price: data.c,
            change: data.d,
            changePercent: data.dp,
            open: data.o,
            high: data.h,
            low: data.l,
            prevClose: data.pc,
          };
          results[upper] = quote;
          cache.set(upper, { data: quote, ts: now });
        } else {
          results[upper] = null;
        }
      } catch {
        results[upper] = null;
      }
    });

    // Run in batches of 10 to respect rate limits
    for (let i = 0; i < fetches.length; i += 10) {
      await Promise.all(fetches.slice(i, i + 10));
      if (i + 10 < fetches.length) {
        await new Promise((r) => setTimeout(r, 200));
      }
    }

    return new Response(JSON.stringify({ quotes: results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
