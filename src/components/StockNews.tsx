import { useState, useEffect, useCallback } from "react";
import { ExternalLink, Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface NewsItem {
  title: string;
  link: string;
  source: string;
  pubDate: string;
}

export const StockNews = ({ ticker, height = 400 }: { ticker: string; height?: number }) => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNews = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase.functions.invoke("fetch-news", {
        body: { category: "all", ticker },
      });
      setNews(data?.items || []);
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
