import { useEffect, useState } from "react";
import { TrendingUp, Flame } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

type TrendingStock = {
  ticker: string;
  name: string;
  count: number;
};

// Simulated daily prices — in production, replace with real market data API
const mockPrices: Record<string, { price: number; change: number }> = {
  AAPL: { price: 193.42, change: 1.65 },
  MSFT: { price: 420.55, change: 0.82 },
  GOOGL: { price: 176.30, change: -0.45 },
  AMZN: { price: 185.60, change: 2.10 },
  TSLA: { price: 248.20, change: -1.32 },
  NVDA: { price: 875.30, change: 3.45 },
  META: { price: 505.75, change: 1.20 },
  BTC: { price: 67250, change: 2.8 },
  ETH: { price: 3520, change: 1.9 },
  SPY: { price: 525.40, change: 0.35 },
};

const getPrice = (ticker: string) =>
  mockPrices[ticker.toUpperCase()] || { price: (Math.random() * 200 + 50).toFixed(2), change: (Math.random() * 6 - 3).toFixed(2) };

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
        .from("watchlist_stocks")
        .select("ticker, name")
        .gte("created_at", oneWeekAgo.toISOString());

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
          .slice(0, 8);

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
          <h2 className="text-lg font-semibold">Trending on PortAI</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-border bg-accent/20 p-3 animate-pulse">
              <div className="h-4 w-16 bg-muted rounded mb-2" />
              <div className="h-3 w-24 bg-muted rounded mb-2" />
              <div className="h-5 w-20 bg-muted rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (trending.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Flame className="h-5 w-5 text-warning" />
          <h2 className="text-lg font-semibold">Trending on PortAI</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          No trending stocks yet this week. Add stocks to your watchlists to see what's popular!
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-4">
        <Flame className="h-5 w-5 text-warning" />
        <h2 className="text-lg font-semibold">Trending on PortAI</h2>
        <span className="ml-auto text-[10px] text-muted-foreground uppercase tracking-wider">This week</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {trending.map((stock, i) => {
          const p = getPrice(stock.ticker);
          const price = typeof p.price === "number" ? p.price : parseFloat(p.price as any);
          const change = typeof p.change === "number" ? p.change : parseFloat(p.change as any);
          const isPositive = change >= 0;

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
              <p className="text-[11px] text-muted-foreground truncate mb-1.5">{stock.name}</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-sm font-semibold font-mono">
                  ${price >= 1000 ? price.toLocaleString(undefined, { maximumFractionDigits: 0 }) : price.toFixed(2)}
                </span>
                <span className={cn("text-[11px] font-medium font-mono", isPositive ? "text-gain" : "text-loss")}>
                  {isPositive ? "+" : ""}{change.toFixed(2)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
