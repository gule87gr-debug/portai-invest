import { useParams, Link } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { usePageTitle } from "@/hooks/usePageTitle";
import { TradingViewTechnicalAnalysis } from "@/components/TradingViewWidgets";
import { YahooFinanceChart } from "@/components/YahooFinanceChart";
import { StockNews } from "@/components/StockNews";
import { DisclaimerBanner } from "@/components/DisclaimerBanner";
import { PriceAlertDialog } from "@/components/PriceAlertDialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { getStockDescription } from "@/lib/stockDescriptions";
import { getTradingViewSymbol } from "@/lib/tradingViewSymbol";
import { assetDatabase } from "@/lib/stockDatabase";
import { useQuotes } from "@/hooks/useQuotes";
import { ArrowLeft, Building2, Newspaper, BarChart3, TrendingUp, TrendingDown, Minus, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMemo } from "react";

const StockDetail = () => {
  const { ticker } = useParams<{ ticker: string }>();
  const symbol = ticker?.toUpperCase() || "SPY";
  usePageTitle(`${symbol} Stock Detail | PortAI`);
  const info = getStockDescription(symbol);
  const assetEntry = assetDatabase.find((a) => a.ticker.toUpperCase() === symbol);
  const tvSymbol = getTradingViewSymbol(symbol, assetEntry?.type);

  const tickerList = useMemo(() => [symbol], [symbol]);
  const typeMap = useMemo(() => assetEntry ? { [symbol]: assetEntry.type } : {}, [symbol, assetEntry]);
  const { quotes, loading } = useQuotes(tickerList, typeMap);
  const quote = quotes[symbol];

  let t: (key: string) => string;
  try {
    const lang = useLanguage();
    t = lang.t;
  } catch {
    t = (key: string) => key;
  }

  const isPositive = quote && quote.change > 0;
  const isNegative = quote && quote.change < 0;

  return (
    <AppLayout>
      <div className="mb-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <Link to="/watchlists" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" /> {t("backToWatchlists")}
          </Link>
          <PriceAlertDialog
            ticker={symbol}
            assetName={info.name}
            assetType={assetEntry?.type || "stock"}
            currentPrice={quote?.price}
            trigger={
              <Button variant="outline" size="sm" className="gap-2">
                <Bell className="h-4 w-4" /> Set Price Alert
              </Button>
            }
          />
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{symbol}</h1>
              <span className="rounded-md bg-muted px-2.5 py-1 text-xs text-muted-foreground">{info.sector}</span>
            </div>
            <p className="mt-1 text-muted-foreground">{info.name}</p>
          </div>

          {/* Yahoo Finance price block */}
          <div className="flex items-end gap-4">
            {loading ? (
              <div className="h-10 w-32 animate-pulse rounded-md bg-muted" />
            ) : quote ? (
              <>
                <span className="text-3xl font-bold tabular-nums font-mono">
                  ${quote.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <div className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-sm font-semibold ${
                  isPositive ? "bg-emerald-500/15 text-emerald-400" :
                  isNegative ? "bg-red-500/15 text-red-400" :
                  "bg-muted text-muted-foreground"
                }`}>
                  {isPositive ? <TrendingUp className="h-3.5 w-3.5" /> :
                   isNegative ? <TrendingDown className="h-3.5 w-3.5" /> :
                   <Minus className="h-3.5 w-3.5" />}
                  <span className="tabular-nums font-mono">
                    {quote.change >= 0 ? "+" : ""}{quote.change.toFixed(2)} ({quote.changePercent >= 0 ? "+" : ""}{quote.changePercent.toFixed(2)}%)
                  </span>
                </div>
              </>
            ) : (
              <span className="text-sm text-muted-foreground">Price unavailable</span>
            )}
          </div>
        </div>

        {/* OHLC bar */}
        {quote && (
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground font-mono tabular-nums">
            <span>Open <strong className="text-foreground">${quote.open.toFixed(2)}</strong></span>
            <span>High <strong className="text-foreground">${quote.high.toFixed(2)}</strong></span>
            <span>Low <strong className="text-foreground">${quote.low.toFixed(2)}</strong></span>
            <span>Prev Close <strong className="text-foreground">${quote.prevClose.toFixed(2)}</strong></span>
          </div>
        )}
      </div>

      <div className="mb-6 rounded-xl border border-border bg-card p-4">
        <YahooFinanceChart ticker={symbol} type={assetEntry?.type} height={380} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {tvSymbol && (
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-3 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              <h2 className="text-lg font-semibold">{t("technicalAnalysis")}</h2>
            </div>
            <TradingViewTechnicalAnalysis symbol={tvSymbol} />
          </div>
        )}

        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-3 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              <h2 className="text-lg font-semibold">{t("about")}</h2>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">{info.description}</p>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-3 flex items-center gap-2">
              <Newspaper className="h-4 w-4 text-primary" />
              <h2 className="text-lg font-semibold">{t("recentNews")}</h2>
            </div>
            <StockNews ticker={symbol} height={400} />
          </div>

          <DisclaimerBanner />
        </div>
      </div>
    </AppLayout>
  );
};

export default StockDetail;
