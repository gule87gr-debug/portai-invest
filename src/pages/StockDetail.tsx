import { useParams, Link } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { SEO } from "@/components/SEO";
import { usePageTitle } from "@/hooks/usePageTitle";
import { TVAdvancedChart, TVSymbolInfo, TVTechnicalAnalysis, TradingViewAttribution } from "@/components/tradingview";
import { StockNews } from "@/components/StockNews";
import { DisclaimerBanner } from "@/components/DisclaimerBanner";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAssetDescription } from "@/hooks/useAssetDescription";
import { getAsset, toTradingViewSymbol } from "@/lib/stockDatabase";
import { ArrowLeft, Building2, Newspaper, BarChart3, LineChart } from "lucide-react";
import { AddToWatchlistButton } from "@/components/AddToWatchlistButton";
import { Shimmer } from "@/components/Skeletons";

const StockDetail = () => {
  const { ticker } = useParams<{ ticker: string }>();
  const symbol = ticker?.toUpperCase() || "SPY";
  usePageTitle(`${symbol} Stock Detail | PortAI`);
  const info = useAssetDescription(symbol);
  const assetEntry = getAsset(symbol);
  const tvSymbol = toTradingViewSymbol(symbol);

  let t: (key: string) => string;
  try {
    const lang = useLanguage();
    t = lang.t;
  } catch {
    t = (key: string) => key;
  }

  return (
    <AppLayout>
      <SEO
        title={`${symbol}${info.name ? ` — ${info.name}` : ""} | PortAI`}
        description={`${symbol} chart, AI-powered news bias analysis and technicals. Track ${info.name || symbol} on PortAI.`}
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
                description: `${symbol} chart, AI-powered news bias analysis and technicals for ${info.name || symbol}.`,
              },
              {
                "@type": "FinancialProduct",
                name: info.name ? `${info.name} (${symbol})` : symbol,
                identifier: symbol,
                tickerSymbol: symbol,
                category: assetEntry?.type === "crypto" ? "Cryptocurrency" : assetEntry?.type === "etf" ? "ETF" : "Stock",
                description: info.sector
                  ? `${info.name || symbol} (${symbol}) — ${info.sector} sector asset tracked on PortAI with charts, AI bias analysis and technicals.`
                  : `${symbol} asset tracked on PortAI with charts, AI bias analysis and technicals.`,
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
          <div className="flex items-center gap-2">
          <AddToWatchlistButton ticker={symbol} name={info.name} sector={info.sector} />
          </div>
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

        </div>
      </div>

      {tvSymbol ? (
        <div className="mb-6 space-y-4">
          <div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
            <TVSymbolInfo symbol={tvSymbol} />
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
            <TVAdvancedChart symbol={tvSymbol} height={520} />
          </div>
          <TradingViewAttribution />
        </div>
      ) : (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-border bg-card p-6">
          <LineChart className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{t("chartUnavailable")}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {tvSymbol && (
          <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 spring-in">
            <div className="mb-4 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              <h2 className="editorial-h2 text-lg font-semibold">{t("technicalAnalysis")}</h2>
            </div>
            <TVTechnicalAnalysis symbol={tvSymbol} />
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
                <Shimmer className="h-3 w-full" />
                <Shimmer className="h-3 w-11/12" />
                <Shimmer className="h-3 w-9/12" />
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
