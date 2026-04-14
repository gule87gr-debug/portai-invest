import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const cache = new Map<string, { data: any; ts: number }>();
const CACHE_TTL = 5 * 60 * 1000;

// For crypto tickers, try multiple exchange formats
const CRYPTO_ATTEMPTS = (base: string) => [
  `BINANCE:${base}USDT`,
  `COINBASE:${base}-USD`,
  `KRAKEN:${base}USD`,
];

function buildSymbols(ticker: string, type?: string): string[] {
  const upper = ticker.toUpperCase();

  if (type === "crypto") {
    // Strip trailing USD/USDT if present in the ticker
    const base = upper.replace(/USD[T]?$/, "");
    return CRYPTO_ATTEMPTS(base);
  }

  // Index funds / synthetic indices with dashes won't exist on Finnhub
  if (upper.includes("-")) return [];

  // Stocks, ETFs → Finnhub resolves them directly
  return [upper];
}

async function fetchQuote(symbol: string, apiKey: string) {
  const res = await fetch(
    `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${apiKey}`
  );
  if (!res.ok) return null;
  const data = await res.json();
  // Finnhub returns zeros for unknown symbols
  if (!data || data.c === 0 || data.c === undefined) return null;
  return {
    price: data.c,
    change: data.d ?? 0,
    changePercent: data.dp ?? 0,
    open: data.o,
    high: data.h,
    low: data.l,
    prevClose: data.pc,
    timestamp: data.t ? data.t * 1000 : Date.now(),
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("FINNHUB_API_KEY");
    if (!apiKey) throw new Error("FINNHUB_API_KEY is not set");

    const body = await req.json();
    const tickers: string[] = body.tickers || [];
    const types: Record<string, string> = body.types || {};

    if (!Array.isArray(tickers) || tickers.length === 0) {
      throw new Error("tickers must be a non-empty array");
    }

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

      const symbols = buildSymbols(upper, types[upper] || types[ticker]);
      if (symbols.length === 0) {
        results[upper] = null;
        return;
      }

      // Try each symbol variant until one works
      for (const sym of symbols) {
        try {
          const quote = await fetchQuote(sym, apiKey);
          if (quote) {
            // Determine if this is live or last-close data
            const isMarketOpen = now - quote.timestamp < 5 * 60 * 1000;
            quote.live = isMarketOpen;
            results[upper] = quote;
            cache.set(upper, { data: quote, ts: now });
            return;
          }
        } catch {
          // continue to next symbol
        }
      }

      results[upper] = null;
    });

    // Run in sub-batches of 10 with small delay to respect rate limits
    for (let i = 0; i < fetches.length; i += 10) {
      await Promise.all(fetches.slice(i, i + 10));
      if (i + 10 < fetches.length) {
        await new Promise((r) => setTimeout(r, 250));
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
