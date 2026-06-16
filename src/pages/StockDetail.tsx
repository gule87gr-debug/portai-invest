import { useParams, Link } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { SEO } from "@/components/SEO";
import { usePageTitle } from "@/hooks/usePageTitle";
import { TradingViewTechnicalAnalysis } from "@/components/TradingViewWidgets";
import { YahooFinanceChart, type RangeStats } from "@/components/YahooFinanceChart";
import { StockNews } from "@/components/StockNews";
import { DisclaimerBanner } from "@/components/DisclaimerBanner";
import { PriceAlertDialog } from "@/components/PriceAlertDialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAssetDescription } from "@/hooks/useAssetDescription";
import { getTradingViewSymbol } from "@/lib/tradingViewSymbol";
import { assetDatabase } from "@/lib/stockDatabase";
import { useQuotes } from "@/hooks/useQuotes";
import { ArrowLeft, Building2, Newspaper, BarChart3, TrendingUp, TrendingDown, Minus, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMemo, useState, useCallback } from "react";

const StockDetail = () => {
  const { ticker } = useParams<{ ticker: string }>();
  const symbol = ticker?.toUpperCase() || "SPY";
  usePageTitle(`${symbol} Stock Detail | PortAI`);
  const info = useAssetDescription(symbol);
  const assetEntry = assetDatabase.find((a) => a.ticker.toUpperCase() === symbol);
  const tvSymbol = getTradingViewSymbol(symbol, assetEntry?.type);

  const tickerList = useMemo(() => [symbol], [symbol]);
  const typeMap = useMemo(() => assetEntry ? { [symbol]: assetEntry.type } : {}, [symbol, assetEntry]);
  const { quotes, loading } = useQuotes(tickerList, typeMap);
  const quote = quotes[symbol];

  const [rangeStats, setRangeStats] = useState<RangeStats | null>(null);
  const handleStats = useCallback((s: RangeStats | null) => setRangeStats(s), []);

  let t: (key: string) => string;
  try {
    const lang = useLanguage();
    t = lang.t;
  } catch {
    t = (key: string) => key;
  }

  const rangeLabelMap: Record<string, string> = { "1D": "1D", "5D": "5D", "1M": "1M", "6M": "6M", "YTD": "YTD", "1Y": "1Y", "5Y": "5Y", "ALL": "All" };
  const displayChange = rangeStats ? rangeStats.diff : quote?.change ?? 0;
  const displayPct = rangeStats ? rangeStats.pct : quote?.changePercent ?? 0;
  const displayLabel = rangeStats ? rangeLabelMap[rangeStats.range] ?? rangeStats.range : t("today");
  const isPositive = displayChange > 0;
  const isNegative = displayChange < 0;

  return (
    <AppLayout>
      <SEO
        title={`${symbol}${info.name ? ` — ${info.name}` : ""} | PortAI`}
        description={`Live ${symbol} price, AI-powered news bias analysis, technicals and chart. Set price alerts and track ${info.name || symbol} on PortAI.`}
        path={`/stock/${symbol}`}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "WebPage",
                name: `${symbol}${info.name ? ` — ${info.name}` : ""}`,
                url: `https://portai-invest.com/stock/${symbol}`,
                description: `Live ${symbol} price, AI-powered news bias analysis, technicals and chart for ${info.name || symbol}.`,
              },
              {
                "@type": "FinancialProduct",
                name: info.name ? `${info.name} (${symbol})` : symbol,
                identifier: symbol,
                tickerSymbol: symbol,
                category: assetEntry?.type === "crypto" ? "Cryptocurrency" : assetEntry?.type === "etf" ? "ETF" : "Stock",
                description: info.sector
                  ? `${info.name || symbol} (${symbol}) — ${info.sector} sector asset tracked on PortAI with live price, AI bias analysis and technicals.`
                  : `${symbol} asset tracked on PortAI with live price, AI bias analysis and technicals.`,
                url: `https://portai-invest.com/stock/${symbol}`,
                provider: {
                  "@type": "Organization",
                  name: "PortAI",
                  url: "https://portai-invest.com",
                },
              },
            ],
          }),
        }}
      />

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
                <Bell className="h-4 w-4" /> {t("setPriceAlert")}
              </Button>
            }
          />
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="editorial-h1 text-4xl sm:text-5xl font-bold tnum">
              <span className="tnum">{symbol}</span>
              {info.name ? <span className="text-muted-foreground font-normal"> — {info.name}</span> : null}
            </h1>
            <span className="metric-label rounded-md bg-muted px-2.5 py-1">{t(`sec_${(info.sector || "").replace(/\s+/g, "")}`) !== `sec_${(info.sector || "").replace(/\s+/g, "")}` ? t(`sec_${(info.sector || "").replace(/\s+/g, "")}`) : info.sector}</span>
          </div>
            <p className="mt-1 text-muted-foreground">{info.name}</p>
          </div>

          {/* Yahoo Finance price block */}
          <div className="flex items-end gap-4">
            {loading ? (
              <div className="h-10 w-32 animate-pulse rounded-md bg-muted" />
            ) : quote ? (
              <>
                <span className="text-4xl font-bold tnum font-mono spring-in inline-block">
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
                  <span className="tnum font-mono">
                    {displayChange >= 0 ? "+" : ""}{displayChange.toFixed(2)} ({displayPct >= 0 ? "+" : ""}{displayPct.toFixed(2)}%)
                  </span>
                  <span className="ml-1 text-xs font-medium opacity-80">{displayLabel}</span>
                </div>
              </>
            ) : (
              <span className="text-sm text-muted-foreground">{t("priceUnavailable")}</span>
            )}
          </div>
        </div>

        {/* OHLC bar */}
        {quote && (
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 font-mono tnum">
            <span className="metric-label">Open <strong className="text-foreground font-mono normal-case tracking-normal ml-1">${quote.open.toFixed(2)}</strong></span>
            <span className="metric-label">High <strong className="text-foreground font-mono normal-case tracking-normal ml-1">${quote.high.toFixed(2)}</strong></span>
            <span className="metric-label">Low <strong className="text-foreground font-mono normal-case tracking-normal ml-1">${quote.low.toFixed(2)}</strong></span>
            <span className="metric-label">Prev Close <strong className="text-foreground font-mono normal-case tracking-normal ml-1">${quote.prevClose.toFixed(2)}</strong></span>
          </div>
        )}
      </div>

      <div className="mb-6 rounded-2xl border border-border bg-card p-6 sm:p-8">
        <YahooFinanceChart ticker={symbol} type={assetEntry?.type} height={380} onStatsChange={handleStats} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {tvSymbol && (
          <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 spring-in">
            <div className="mb-4 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              <h2 className="editorial-h2 text-lg font-semibold">{t("technicalAnalysis")}</h2>
            </div>
            <TradingViewTechnicalAnalysis symbol={tvSymbol} />
          </div>
        )}

        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
            <div className="mb-4 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              <h2 className="editorial-h2 text-lg font-semibold">{t("about")}</h2>
            </div>
            {info.loading && !info.isCurated ? (
              <div className="space-y-2">
                <div className="h-3 w-full animate-pulse rounded bg-muted" />
                <div className="h-3 w-11/12 animate-pulse rounded bg-muted" />
                <div className="h-3 w-9/12 animate-pulse rounded bg-muted" />
              </div>
            ) : (
              <p className="text-sm leading-relaxed text-muted-foreground">{info.description}</p>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
            <div className="mb-4 flex items-center gap-2">
              <Newspaper className="h-4 w-4 text-primary" />
              <h2 className="editorial-h2 text-lg font-semibold">{t("recentNews")}</h2>
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
