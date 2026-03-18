import { useState } from "react";
import { TradingViewTimeline } from "@/components/TradingViewWidgets";
import { useLanguage } from "@/contexts/LanguageContext";
import { assetDatabase } from "@/lib/stockDatabase";
import { Newspaper } from "lucide-react";
import { cn } from "@/lib/utils";

const categories = [
  { key: "all", tickers: [] },
  { key: "technology", tickers: ["AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "META", "NFLX", "AMD", "INTC", "CRM"] },
  { key: "finance", tickers: ["JPM", "V", "GS", "BRK.B", "XLF"] },
  { key: "healthcare", tickers: ["JNJ", "UNH", "PFE", "ABBV", "XLV"] },
  { key: "energy", tickers: ["XOM", "CVX", "NEE", "XLE"] },
  { key: "consumer", tickers: ["TSLA", "PG", "KO", "PEP", "WMT", "DIS"] },
  { key: "crypto", tickers: ["BTCUSD", "ETHUSD", "SOLUSD", "XRPUSD"] },
  { key: "etfs", tickers: ["SPY", "QQQ", "VTI", "VOO", "IWM", "ARKK"] },
];

const allTickers = assetDatabase.map((a) => a.ticker);

export const StockNewsFeed = () => {
  const { t } = useLanguage();
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeTicker, setActiveTicker] = useState("SPY");

  const currentCategory = categories.find((c) => c.key === activeCategory);
  const tickers = activeCategory === "all" ? allTickers : (currentCategory?.tickers || []);

  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-4">
        <Newspaper className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">{t("marketNewsFeed")}</h2>
        <span className="ml-auto text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{t("autoRefresh")}</span>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-thin pb-1">
        {categories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => {
              setActiveCategory(cat.key);
              setActiveTicker(cat.key === "all" ? "SPY" : cat.tickers[0]);
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
      <div className="flex gap-1.5 mb-4 overflow-x-auto scrollbar-thin pb-1">
        {tickers.map((ticker) => (
          <button
            key={ticker}
            onClick={() => setActiveTicker(ticker)}
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

      {/* News timeline */}
      <div className="rounded-lg overflow-hidden border border-border">
        <TradingViewTimeline key={activeTicker} symbol={activeTicker} height={450} />
      </div>

      <p className="mt-3 text-[10px] text-muted-foreground text-center">
        {t("newsDisclaimer")}
      </p>
    </div>
  );
};
