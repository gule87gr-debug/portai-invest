import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Quote = {
  price: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  prevClose: number;
  timestamp?: number;
  live?: boolean;
};

type QuoteMap = Record<string, Quote | null>;

const QUOTE_TTL_MS = 60_000;
const STORAGE_KEY = "portai-quote-cache";

const globalCache = new Map<string, { ts: number; quote: Quote | null }>();

// Warm the in-memory cache from sessionStorage so a reload paints instantly.
try {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (raw) {
    const parsed = JSON.parse(raw) as Record<string, { ts: number; quote: Quote | null }>;
    Object.entries(parsed).forEach(([k, v]) => globalCache.set(k, v));
  }
} catch { /* storage unavailable */ }

const persistCache = () => {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(Object.fromEntries(globalCache)));
  } catch { /* storage unavailable */ }
};

// Dedupe concurrent requests for the same ticker across components.
const pending = new Map<string, Promise<void>>();

export const useQuotes = (tickers: string[], types?: Record<string, string>) => {
  const [quotes, setQuotes] = useState<QuoteMap>({});
  const [loading, setLoading] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const readCache = useCallback((list: string[]): QuoteMap => {
    const out: QuoteMap = {};
    list.forEach((t) => {
      const hit = globalCache.get(t.toUpperCase());
      if (hit) out[t.toUpperCase()] = hit.quote;
    });
    return out;
  }, []);

  const fetchQuotes = useCallback(async (tickerList: string[], typeMap?: Record<string, string>, force = false) => {
    if (tickerList.length === 0) {
      setQuotes({});
      return;
    }

    const upper = tickerList.map((t) => t.toUpperCase());

    // 1. Paint whatever we already know immediately (no spinner, no wait).
    const cached = readCache(upper);
    if (Object.keys(cached).length) setQuotes((prev) => ({ ...prev, ...cached }));

    // 2. Only request tickers that are missing or stale.
    const now = Date.now();
    const stale = upper.filter((t) => {
      if (force) return true;
      const hit = globalCache.get(t);
      return !hit || now - hit.ts > QUOTE_TTL_MS;
    });
    const toFetch = stale.filter((t) => !pending.has(t));

    if (!toFetch.length) {
      // Wait on any in-flight request covering these tickers, then re-read.
      const waits = stale.map((t) => pending.get(t)).filter(Boolean) as Promise<void>[];
      if (waits.length) {
        await Promise.allSettled(waits);
        if (mounted.current) setQuotes((prev) => ({ ...prev, ...readCache(upper) }));
      }
      return;
    }

    if (!Object.keys(cached).length) setLoading(true);

    const req = (async () => {
      try {
        const subTypes: Record<string, string> = {};
        if (typeMap) toFetch.forEach((t) => { if (typeMap[t]) subTypes[t] = typeMap[t]; });
        const { data, error } = await supabase.functions.invoke("fetch-quotes", {
          body: { tickers: toFetch, types: subTypes },
        });
        if (error) throw error;
        const result = (data?.quotes || {}) as QuoteMap;
        const ts = Date.now();
        Object.entries(result).forEach(([k, v]) => globalCache.set(k.toUpperCase(), { ts, quote: v }));
        persistCache();
      } catch (e) {
        console.error("Failed to fetch quotes:", e);
      }
    })();

    toFetch.forEach((t) => pending.set(t, req));
    await req;
    toFetch.forEach((t) => { if (pending.get(t) === req) pending.delete(t); });

    if (mounted.current) {
      setQuotes((prev) => ({ ...prev, ...readCache(upper) }));
      setLoading(false);
    }
  }, [readCache]);

  const key = tickers.join(",");
  const typesRef = useRef(types);
  typesRef.current = types;

  useEffect(() => {
    fetchQuotes(key ? key.split(",") : [], typesRef.current);
  }, [key, fetchQuotes]);

  return {
    quotes,
    loading,
    refetch: () => fetchQuotes(key ? key.split(",") : [], typesRef.current, true),
  };
};
