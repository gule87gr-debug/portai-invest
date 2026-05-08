import { useState, useEffect, useCallback, useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Newspaper, ExternalLink, RefreshCw, Search, SlidersHorizontal, X, Check, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { REGION_LABELS, REGION_FLAGS, REGION_LABEL_KEYS, AssetRegion } from "@/lib/stockDatabase";
import { getTrustScore } from "@/lib/trustScore";

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

type SortMode = "newest" | "relevant" | "trust";

// Trust score logic lives in @/lib/trustScore — kept in sync with the
// article-analysis edge function so news-feed badges and the analyzer agree.

interface NewsItem {
  title: string;
  link: string;
  source: string;
  pubDate: string;
}

export const StockNewsFeed = () => {
  const { t } = useLanguage();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<AssetRegion[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);

  // Relevance score: matches search/filter terms in the title
  const relevanceScore = useCallback(
    (item: NewsItem): number => {
      const haystack = item.title.toLowerCase();
      const terms: string[] = [];
      if (searchQuery) terms.push(...searchQuery.toLowerCase().split(/\s+/).filter(Boolean));
      terms.push(...selectedCategories.map((c) => c.toLowerCase()));
      terms.push(...selectedRegions.map((r) => r.replace("_", " ")));
      if (terms.length === 0) return 0;
      let score = 0;
      for (const term of terms) {
        if (haystack.includes(term)) score += 10;
      }
      return score;
    },
    [searchQuery, selectedCategories, selectedRegions]
  );

  const sortedNews = useMemo(() => {
    const list = [...news];
    if (sortMode === "newest") {
      list.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
    } else if (sortMode === "trust") {
      list.sort((a, b) => getTrustScore(b.source) - getTrustScore(a.source));
    } else if (sortMode === "relevant") {
      list.sort((a, b) => {
        const diff = relevanceScore(b) - relevanceScore(a);
        if (diff !== 0) return diff;
        return new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime();
      });
    }
    return list;
  }, [news, sortMode, relevanceScore]);

  const fetchNews = useCallback(
    async (cats: string[], regs: AssetRegion[], search: string) => {
      setLoading(true);
      setError("");
      try {
        const { data, error: fnError } = await supabase.functions.invoke("fetch-news", {
          body: {
            categories: cats,
            regions: regs,
            search: search || undefined,
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
    fetchNews(selectedCategories, selectedRegions, searchQuery);
  }, [selectedCategories, selectedRegions, searchQuery, fetchNews]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchNews(selectedCategories, selectedRegions, searchQuery);
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [selectedCategories, selectedRegions, searchQuery, fetchNews]);

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

  const toggleRegion = (region: AssetRegion) => {
    setSelectedRegions((prev) =>
      prev.includes(region) ? prev.filter((r) => r !== region) : [...prev, region]
    );
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedRegions([]);
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  const activeFilterCount = selectedCategories.length + selectedRegions.length;

  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-4">
        <Newspaper className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">{t("marketNewsFeed")}</h2>
        <button
          onClick={() => fetchNews(selectedCategories, selectedRegions, searchQuery)}
          className="ml-auto flex items-center gap-1 text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full hover:bg-accent transition-colors"
          disabled={loading}
        >
          <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
          {t("autoRefresh")}
        </button>
      </div>

      {/* Search + Filter row */}
      <div className="flex flex-col sm:flex-row gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("searchArticlesPh")}
            className="h-10 w-full rounded-lg border border-border bg-accent/30 pl-9 pr-9 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
              aria-label={t("clearSearch")}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <Select value={sortMode} onValueChange={(v) => setSortMode(v as SortMode)}>
          <SelectTrigger className="h-10 w-full sm:w-[170px] shrink-0 bg-accent/30">
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end">
            <SelectItem value="newest">{t("newestFirst")}</SelectItem>
            <SelectItem value="relevant">{t("mostRelevant")}</SelectItem>
            <SelectItem value="trust">{t("highestTrust")}</SelectItem>
          </SelectContent>
        </Select>

        <Popover open={filterOpen} onOpenChange={setFilterOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="h-10 gap-2 shrink-0"
              type="button"
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span>{t("filters")}</span>
              {activeFilterCount > 0 && (
                <span className="ml-1 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0">
            <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
              <p className="text-sm font-semibold">{t("filterNews")}</p>
              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-[11px] text-muted-foreground hover:text-foreground"
                >
                  {t("clearAll")}
                </button>
              )}
            </div>

            <div className="max-h-[60vh] overflow-y-auto scrollbar-thin">
              <div className="px-4 py-3">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("categories")}
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
                  {t("regions")}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {regions.map((region) => {
                    const active = selectedRegions.includes(region);
                    return (
                      <button
                        key={region}
                        onClick={() => toggleRegion(region)}
                        className={cn(
                          "rounded-md px-2 py-1 text-[11px] font-medium transition-colors border",
                          active
                            ? "bg-primary/20 text-primary border-primary/40"
                            : "bg-accent/30 text-muted-foreground border-transparent hover:text-foreground"
                        )}
                      >
                        {REGION_LABELS[region]}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-border px-4 py-2.5">
              <Button size="sm" onClick={() => setFilterOpen(false)}>
                {t("done")}
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
              <button onClick={clearSearch} aria-label={t("removeSearch")}>
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
          {selectedRegions.map((region) => (
            <span
              key={region}
              className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] text-foreground"
            >
              {REGION_LABELS[region]}
              <button onClick={() => toggleRegion(region)} aria-label={`Remove ${region}`}>
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* News list — fixed-height container so skeleton refreshes don't shift layout */}
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="divide-y divide-border h-[500px] overflow-y-auto scrollbar-thin relative">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
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
            ))
          ) : error ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <span className="text-sm">{error}</span>
            </div>
          ) : sortedNews.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <span className="text-sm">{t("noNewsFound")}</span>
            </div>
          ) : (
            sortedNews.map((item, i) => {
              const sourceInitial = item.source?.[0]?.toUpperCase() || "N";
              const sourceColor = ["bg-primary/20 text-primary", "bg-chart-3/20 text-chart-3", "bg-warning/20 text-warning", "bg-gain/20 text-gain"][i % 4];
              const trust = getTrustScore(item.source);
              const trustTone =
                trust >= 8 ? "text-gain bg-gain/10 border-gain/30" :
                trust >= 6 ? "text-primary bg-primary/10 border-primary/30" :
                "text-muted-foreground bg-muted border-border";
              return (
                <a
                  key={`${item.link}-${i}`}
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
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="text-[11px] font-medium text-primary/80 bg-primary/10 px-1.5 py-0.5 rounded">
                        {item.source}
                      </span>
                      <span className={cn("inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded border", trustTone)}>
                        <Shield className="h-2.5 w-2.5" />
                        {trust}/10
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {formatTimeAgo(item.pubDate)}
                      </span>
                    </div>
                  </div>
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              );
            })
          )}
        </div>
      </div>

      <p className="mt-3 text-[10px] text-muted-foreground text-center">
        {t("newsDisclaimer")}
      </p>
    </div>
  );
};
