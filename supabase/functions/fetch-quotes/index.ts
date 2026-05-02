import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const cache = new Map<string, { data: any; ts: number }>();
const CACHE_TTL = 5 * 60 * 1000;

// Map ticker to Yahoo Finance symbol
function toYahooSymbol(ticker: string, type?: string): string {
  const upper = ticker.toUpperCase();
  if (type === "crypto") {
    const base = upper.replace(/USD[T]?$/, "");
    return `${base}-USD`;
  }
  // International tickers already have exchange suffix (e.g., SHEL.L, SAP.DE)
  return upper;
}

// Crypto: try multiple exchange formats on Finnhub
const CRYPTO_ATTEMPTS = (base: string) => [
  `BINANCE:${base}USDT`,
  `COINBASE:${base}-USD`,
  `KRAKEN:${base}USD`,
];

function buildFinnhubSymbols(ticker: string, type?: string): string[] {
  const upper = ticker.toUpperCase();
  if (type === "crypto") {
    const base = upper.replace(/USD[T]?$/, "");
    return CRYPTO_ATTEMPTS(base);
  }
  if (upper.includes(".") || upper.includes("-")) return [];
  return [upper];
}

async function fetchYahoo(symbol: string) {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const meta = data?.chart?.result?.[0]?.meta;
    if (!meta || !meta.regularMarketPrice) return null;
    const price = meta.regularMarketPrice;
    const prevClose = meta.chartPreviousClose || meta.previousClose || price;
    const change = price - prevClose;
    const changePercent = prevClose !== 0 ? (change / prevClose) * 100 : 0;
    return {
      price,
      change: Number(change.toFixed(4)),
      changePercent: Number(changePercent.toFixed(4)),
      open: meta.regularMarketOpen ?? price,
      high: meta.regularMarketDayHigh ?? price,
      low: meta.regularMarketDayLow ?? price,
      prevClose,
      timestamp: (meta.regularMarketTime ?? Math.floor(Date.now() / 1000)) * 1000,
    };
  } catch {
    return null;
  }
}

async function fetchFinnhub(symbol: string, apiKey: string) {
  const res = await fetch(
    `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${apiKey}`
  );
  if (!res.ok) return null;
  const data = await res.json();
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

  // Require authenticated user
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

  try {
    const apiKey = Deno.env.get("FINNHUB_API_KEY");
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
      const assetType = types[upper] || types[ticker];

      // Check cache
      const cached = cache.get(upper);
      if (cached && now - cached.ts < CACHE_TTL) {
        results[upper] = cached.data;
        return;
      }

      // 1) Try Yahoo Finance first (works for all exchanges including international)
      const yahooSym = toYahooSymbol(upper, assetType);
      try {
        const quote = await fetchYahoo(yahooSym);
        if (quote) {
          const isLive = now - quote.timestamp < 5 * 60 * 1000;
          results[upper] = { ...quote, live: isLive, source: "yahoo" };
          cache.set(upper, { data: results[upper], ts: now });
          return;
        }
      } catch { /* continue to fallback */ }

      // 2) Fallback to Finnhub (US stocks and crypto)
      if (apiKey) {
        const symbols = buildFinnhubSymbols(upper, assetType);
        for (const sym of symbols) {
          try {
            const quote = await fetchFinnhub(sym, apiKey);
            if (quote) {
              const isLive = now - quote.timestamp < 5 * 60 * 1000;
              results[upper] = { ...quote, live: isLive, source: "finnhub" };
              cache.set(upper, { data: results[upper], ts: now });
              return;
            }
          } catch { /* try next */ }
        }
      }

      results[upper] = null;
    });

    // Sub-batches of 10 with delay
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
    console.error("fetch-quotes error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
