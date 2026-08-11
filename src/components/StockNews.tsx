import { useState, useEffect, useCallback } from "react";
import { ExternalLink, Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { assetDatabase } from "@/lib/stockDatabase";

interface NewsItem {
  title: string;
  link: string;
  source: string;
  pubDate: string;
}

const STOP_WORDS = new Set(["inc", "corp", "corporation", "company", "co", "ltd", "plc", "the", "group", "holdings", "sa", "nv", "ag", "etf", "fund", "trust", "index", "class"]);

const NEWS_TTL_MS = 5 * 60 * 1000;
const cacheKey = (t: string) => `portai-stock-news-${t.toUpperCase()}`;

const readCached = (t: string): NewsItem[] | null => {
  try {
    const raw = sessionStorage.getItem(cacheKey(t));
    if (!raw) return null;
    const { ts, items } = JSON.parse(raw) as { ts: number; items: NewsItem[] };
    if (Date.now() - ts > NEWS_TTL_MS) return null;
    return items;
  } catch { return null; }
};

export const StockNews = ({ ticker, height = 400 }: { ticker: string; height?: number }) => {
  const [news, setNews] = useState<NewsItem[]>(() => readCached(ticker) ?? []);
  const [loading, setLoading] = useState(() => readCached(ticker) === null);

  const fetchNews = useCallback(async () => {
    const cached = readCached(ticker);
    if (cached) {
      setNews(cached);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const entry = assetDatabase.find((a) => a.ticker.toUpperCase() === ticker.toUpperCase());
      const name = entry?.name || "";
      const cleanTicker = ticker.replace(/[^A-Za-z0-9.\-]/g, "");
      const search = name ? `"${name.replace(/[^\p{L}\p{N}\s&.\-]/gu, "")}" OR "${cleanTicker} stock"` : `"${cleanTicker} stock"`;

      const { data } = await supabase.functions.invoke("fetch-news", {
        body: { search },
      });

      const items: NewsItem[] = data?.items || [];
      const nameWords = name
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, " ")
        .split(/\s+/)
        .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
      const tickerRe = new RegExp(`\\b${cleanTicker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");

      const relevant = items.filter((item) => {
        const title = item.title.toLowerCase();
        if (tickerRe.test(item.title)) return true;
        if (!nameWords.length) return false;
        const hits = nameWords.filter((w) => title.includes(w)).length;
        return hits >= Math.min(2, nameWords.length);
      });

      setNews(relevant);
      try {
        sessionStorage.setItem(cacheKey(ticker), JSON.stringify({ ts: Date.now(), items: relevant }));
      } catch { /* storage unavailable */ }
    } catch {
      setNews([]);
    } finally {
      setLoading(false);
    }
  }, [ticker]);

  useEffect(() => { fetchNews(); }, [fetchNews]);


  const formatTimeAgo = (dateStr: string) => {
    try {
      const diff = Date.now() - new Date(dateStr).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 60) return `${mins}m ago`;
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return `${hrs}h ago`;
      return `${Math.floor(hrs / 24)}d ago`;
    } catch { return ""; }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center text-muted-foreground" style={{ height }}>
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        <span className="text-sm">Loading news...</span>
      </div>
    );
  }

  if (!news.length) {
    return (
      <div className="flex items-center justify-center text-muted-foreground text-sm" style={{ height }}>
        No news found for {ticker}
      </div>
    );
  }

  return (
    <div className="divide-y divide-border overflow-y-auto scrollbar-thin" style={{ maxHeight: height }}>
      {news.map((item, i) => (
        <a
          key={i}
          href={/^https?:\/\//i.test(item.link) ? item.link : "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-start gap-3 p-3 hover:bg-accent/30 transition-colors group"
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium leading-snug group-hover:text-primary transition-colors line-clamp-2">
              {item.title}
            </p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[11px] font-medium text-primary/80 bg-primary/10 px-1.5 py-0.5 rounded">
                {item.source}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {formatTimeAgo(item.pubDate)}
              </span>
            </div>
          </div>
          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
        </a>
      ))}
    </div>
  );
};
