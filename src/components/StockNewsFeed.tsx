import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Newspaper, ExternalLink, RefreshCw, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

const categories = [
  { key: "all", tickers: [] },
  { key: "technology", tickers: ["AAPL", "MSFT", "GOOGL", "NVDA", "META", "AMD"] },
  { key: "finance", tickers: ["JPM", "GS", "V", "BRK.B"] },
  { key: "healthcare", tickers: ["JNJ", "UNH", "PFE", "ABBV"] },
  { key: "energy", tickers: ["XOM", "CVX", "NEE"] },
  { key: "consumer", tickers: ["TSLA", "PG", "KO", "DIS"] },
  { key: "crypto", tickers: ["BTC", "ETH", "SOL", "XRP"] },
  { key: "etfs", tickers: ["SPY", "QQQ", "VTI", "ARKK"] },
];

interface NewsItem {
  title: string;
  link: string;
  source: string;
  pubDate: string;
}

export const StockNewsFeed = () => {
  const { t } = useLanguage();
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeTicker, setActiveTicker] = useState("");
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchNews = useCallback(async (category: string, ticker: string) => {
    setLoading(true);
    setError("");
    try {
      const { data, error: fnError } = await supabase.functions.invoke("fetch-news", {
        body: { category, ticker: ticker || undefined },
      });
      if (fnError) throw new Error(fnError.message);
      if (data?.items) {
        setNews(data.items);
      } else {
        setNews([]);
      }
    } catch (e: any) {
      console.error("News fetch error:", e);
      setError(e.message || "Failed to load news");
      setNews([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNews(activeCategory, activeTicker);
  }, [activeCategory, activeTicker, fetchNews]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchNews(activeCategory, activeTicker);
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [activeCategory, activeTicker, fetchNews]);

  const formatTimeAgo = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch {
      return "";
    }
  };

  const currentCategory = categories.find((c) => c.key === activeCategory);
  const tickers = currentCategory?.tickers || [];

  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-4">
        <Newspaper className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">{t("marketNewsFeed")}</h2>
        <button
          onClick={() => fetchNews(activeCategory, activeTicker)}
          className="ml-auto flex items-center gap-1 text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full hover:bg-accent transition-colors"
          disabled={loading}
        >
          <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
          {t("autoRefresh")}
        </button>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-thin pb-1">
        {categories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => {
              setActiveCategory(cat.key);
              setActiveTicker("");
            }}
            className={cn(
              "shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
              activeCategory === cat.key
                ? "bg-primary text-primary-foreground"
                : "bg-muted/50 text-muted-foreground hover:bg-accent/50"
            )}
          >
            {t(cat.key)}
          </button>
        ))}
      </div>

      {/* Ticker pills */}
      {tickers.length > 0 && (
        <div className="flex gap-1.5 mb-4 overflow-x-auto scrollbar-thin pb-1">
          {tickers.map((ticker) => (
            <button
              key={ticker}
              onClick={() => setActiveTicker(activeTicker === ticker ? "" : ticker)}
              className={cn(
                "shrink-0 rounded-md px-2.5 py-1 text-[11px] font-mono font-medium transition-colors",
                activeTicker === ticker
                  ? "bg-primary/20 text-primary border border-primary/40"
                  : "bg-accent/30 text-muted-foreground hover:text-foreground border border-transparent"
              )}
            >
              {ticker}
            </button>
          ))}
        </div>
      )}

      {/* News list */}
      <div className="rounded-lg border border-border overflow-hidden">
        {loading ? (
          <div className="divide-y divide-border">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3 p-3">
                <div className="h-10 w-10 shrink-0 rounded-lg bg-muted animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-full rounded bg-muted animate-pulse" />
                  <div className="h-4 w-3/4 rounded bg-muted animate-pulse" />
                  <div className="flex gap-2">
                    <div className="h-4 w-16 rounded bg-muted animate-pulse" />
                    <div className="h-4 w-10 rounded bg-muted animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <span className="text-sm">{error}</span>
          </div>
        ) : news.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <span className="text-sm">No news found</span>
          </div>
        ) : (
          <div className="divide-y divide-border max-h-[500px] overflow-y-auto scrollbar-thin">
            {news.map((item, i) => (
              <a
                key={i}
                href={item.link}
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
        )}
      </div>

      <p className="mt-3 text-[10px] text-muted-foreground text-center">
        {t("newsDisclaimer")}
      </p>
    </div>
  );
};
