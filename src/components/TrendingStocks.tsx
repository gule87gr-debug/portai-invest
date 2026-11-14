import { useEffect, useState } from "react";
import { TrendingUp, Flame } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { TrendingTilesSkeleton } from "@/components/Skeletons";
import { EmptyState } from "@/components/EmptyState";

type TrendingStock = {
  ticker: string;
  name: string;
  count: number;
};

export const TrendingStocks = () => {
  const { t } = useLanguage();
  const [trending, setTrending] = useState<TrendingStock[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrending = async () => {
      setLoading(true);
      // Query most-added stocks from watchlist_stocks (across all users)
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const { data, error } = await supabase
        .rpc("get_trending_stocks" as any, {
          _since: oneWeekAgo.toISOString(),
        });

      if (!error && data) {
        // Count occurrences of each ticker
        const counts: Record<string, { name: string; count: number }> = {};
        data.forEach((row) => {
          const key = row.ticker.toUpperCase();
          if (!counts[key]) counts[key] = { name: row.name, count: 0 };
          counts[key].count++;
        });

        const sorted = Object.entries(counts)
          .map(([ticker, { name, count }]) => ({ ticker, name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 6);

        setTrending(sorted);
      }
      setLoading(false);
    };

    fetchTrending();
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 mb-4">
          <Flame className="h-5 w-5 text-warning" />
          <h2 className="text-lg font-semibold">{t("trendingOnPortai")}</h2>
        </div>
        <TrendingTilesSkeleton />
      </div>
    );
  }

  if (trending.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Flame className="h-5 w-5 text-warning" />
          <h2 className="text-lg font-semibold">{t("trendingOnPortai")}</h2>
        </div>
        <EmptyState
          compact
          icon={Flame}
          title="No trending stocks yet"
          description="Add stocks to your watchlists and the most tracked ones will show up here."
        />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-4">
        <Flame className="h-5 w-5 text-warning" />
        <h2 className="text-lg font-semibold">{t("trendingOnPortai")}</h2>
        <span className="ml-auto text-[10px] text-muted-foreground uppercase tracking-wider">{t("thisWeek")}</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {trending.map((stock, i) => {
          return (
            <div
              key={stock.ticker}
              className="rounded-lg border border-border bg-accent/20 p-3 transition-colors hover:border-primary/30 hover:bg-accent/40 animate-fade-in"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-bold font-mono">{stock.ticker}</span>
                <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                  <TrendingUp className="h-3 w-3" />
                  {stock.count}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground truncate">{stock.name}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
