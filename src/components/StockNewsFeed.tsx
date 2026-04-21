import { useState, useEffect, useCallback, useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Newspaper, ExternalLink, RefreshCw, Search, SlidersHorizontal, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { REGION_LABELS, AssetRegion } from "@/lib/stockDatabase";

const categories = [
  { key: "technology" },
  { key: "finance" },
  { key: "healthcare" },
  { key: "energy" },
  { key: "consumer" },
  { key: "crypto" },
  { key: "etfs" },
];

const regions: AssetRegion[] = ["us", "europe", "asia", "americas", "africa", "middle_east", "oceania"];

interface NewsItem {
  title: string;
  link: string;
  source: string;
  pubDate: string;
}

export const StockNewsFeed = () => {
  const { t } = useLanguage();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTickers, setSelectedTickers] = useState<string[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);

  const allTickers = useMemo(
    () => Array.from(new Set(categories.flatMap((c) => c.tickers))).sort(),
    []
  );

  const fetchNews = useCallback(
    async (cats: string[], tks: string[], search: string) => {
      setLoading(true);
      setError("");
      try {
        const { data, error: fnError } = await supabase.functions.invoke("fetch-news", {
          body: {
            categories: cats,
            tickers: tks,
            search: search || undefined,
            // legacy fallback so cached deployments still work
            category: cats.length === 1 ? cats[0] : "all",
          },
        });
        if (fnError) throw new Error(fnError.message);
        setNews(data?.items || []);
      } catch (e: any) {
        console.error("News fetch error:", e);
        setError(e.message || "Failed to load news");
        setNews([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchNews(selectedCategories, selectedTickers, searchQuery);
  }, [selectedCategories, selectedTickers, searchQuery, fetchNews]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchNews(selectedCategories, selectedTickers, searchQuery);
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [selectedCategories, selectedTickers, searchQuery, fetchNews]);

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

  const toggleCategory = (key: string) => {
    setSelectedCategories((prev) =>
      prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key]
    );
  };

  const toggleTicker = (ticker: string) => {
    setSelectedTickers((prev) =>
      prev.includes(ticker) ? prev.filter((c) => c !== ticker) : [...prev, ticker]
    );
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedTickers([]);
  };

  const submitSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    setSearchQuery(searchInput.trim());
  };

  const clearSearch = () => {
    setSearchInput("");
    setSearchQuery("");
  };

  const activeFilterCount = selectedCategories.length + selectedTickers.length;

  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-4">
        <Newspaper className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">{t("marketNewsFeed")}</h2>
        <button
          onClick={() => fetchNews(selectedCategories, selectedTickers, searchQuery)}
          className="ml-auto flex items-center gap-1 text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full hover:bg-accent transition-colors"
          disabled={loading}
        >
          <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
          {t("autoRefresh")}
        </button>
      </div>

      {/* Search + Filter row */}
      <div className="flex flex-col sm:flex-row gap-2 mb-3">
        <form onSubmit={submitSearch} className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search articles, tickers, topics..."
            className="h-10 w-full rounded-lg border border-border bg-accent/30 pl-9 pr-9 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {searchInput && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </form>

        <Popover open={filterOpen} onOpenChange={setFilterOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="h-10 gap-2 shrink-0"
              type="button"
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="ml-1 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0">
            <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
              <p className="text-sm font-semibold">Filter news</p>
              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-[11px] text-muted-foreground hover:text-foreground"
                >
                  Clear all
                </button>
              )}
            </div>

            <div className="max-h-[60vh] overflow-y-auto scrollbar-thin">
              <div className="px-4 py-3">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Categories
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {categories.map((cat) => {
                    const active = selectedCategories.includes(cat.key);
                    return (
                      <button
                        key={cat.key}
                        onClick={() => toggleCategory(cat.key)}
                        className={cn(
                          "flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                          active
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted/50 text-muted-foreground hover:bg-accent"
                        )}
                      >
                        {active && <Check className="h-3 w-3" />}
                        {t(cat.key)}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-border px-4 py-3">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Tickers
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {allTickers.map((ticker) => {
                    const active = selectedTickers.includes(ticker);
                    return (
                      <button
                        key={ticker}
                        onClick={() => toggleTicker(ticker)}
                        className={cn(
                          "rounded-md px-2 py-1 text-[11px] font-mono font-medium transition-colors border",
                          active
                            ? "bg-primary/20 text-primary border-primary/40"
                            : "bg-accent/30 text-muted-foreground border-transparent hover:text-foreground"
                        )}
                      >
                        {ticker}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-border px-4 py-2.5">
              <Button size="sm" onClick={() => setFilterOpen(false)}>
                Done
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Active filter chips */}
      {(activeFilterCount > 0 || searchQuery) && (
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          {searchQuery && (
            <span className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[11px] text-primary">
              "{searchQuery}"
              <button onClick={clearSearch} aria-label="Remove search">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {selectedCategories.map((c) => (
            <span
              key={c}
              className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] text-foreground"
            >
              {t(c)}
              <button onClick={() => toggleCategory(c)} aria-label={`Remove ${c}`}>
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          {selectedTickers.map((tk) => (
            <span
              key={tk}
              className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-mono text-foreground"
            >
              {tk}
              <button onClick={() => toggleTicker(tk)} aria-label={`Remove ${tk}`}>
                <X className="h-3 w-3" />
              </button>
            </span>
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
            {news.map((item, i) => {
              const sourceInitial = item.source?.[0]?.toUpperCase() || "N";
              const sourceColor = ["bg-primary/20 text-primary", "bg-chart-3/20 text-chart-3", "bg-warning/20 text-warning", "bg-gain/20 text-gain"][i % 4];
              return (
                <a
                  key={i}
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 p-3 hover:bg-accent/30 transition-colors group"
                >
                  <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xs font-bold", sourceColor)}>
                    {sourceInitial}
                  </div>
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
              );
            })}
          </div>
        )}
      </div>

      <p className="mt-3 text-[10px] text-muted-foreground text-center">
        {t("newsDisclaimer")}
      </p>
    </div>
  );
};
