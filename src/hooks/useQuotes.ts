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
};

type QuoteMap = Record<string, Quote | null>;

const globalCache: QuoteMap = {};

export const useQuotes = (tickers: string[]) => {
  const [quotes, setQuotes] = useState<QuoteMap>({});
  const [loading, setLoading] = useState(false);
  const lastFetch = useRef<string>("");

  const fetchQuotes = useCallback(async (tickerList: string[]) => {
    if (tickerList.length === 0) return;

    // Skip if we already fetched the same set
    const key = tickerList.sort().join(",");
    if (key === lastFetch.current) return;
    lastFetch.current = key;

    // Return cached if all available
    const allCached = tickerList.every((t) => t.toUpperCase() in globalCache);
    if (allCached) {
      const cached: QuoteMap = {};
      tickerList.forEach((t) => { cached[t.toUpperCase()] = globalCache[t.toUpperCase()]; });
      setQuotes(cached);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("fetch-quotes", {
        body: { tickers: tickerList },
      });
      if (error) throw error;
      const result = data?.quotes || {};
      // Merge into global cache
      Object.entries(result).forEach(([k, v]) => {
        globalCache[k] = v as Quote | null;
      });
      setQuotes(result);
    } catch (e) {
      console.error("Failed to fetch quotes:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuotes(tickers);
  }, [tickers.join(","), fetchQuotes]);

  return { quotes, loading, refetch: () => { lastFetch.current = ""; fetchQuotes(tickers); } };
};
