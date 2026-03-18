import { useParams, Link } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { TradingViewChart, TradingViewTechnicalAnalysis } from "@/components/TradingViewWidgets";
import { StockNews } from "@/components/StockNews";
import { DisclaimerBanner } from "@/components/DisclaimerBanner";
import { useLanguage } from "@/contexts/LanguageContext";
import { getStockDescription } from "@/lib/stockDescriptions";
import { ArrowLeft, Building2, Newspaper, BarChart3 } from "lucide-react";

const StockDetail = () => {
  const { ticker } = useParams<{ ticker: string }>();
  const symbol = ticker?.toUpperCase() || "SPY";
  const info = getStockDescription(symbol);
  let t: (key: string) => string;
  try {
    const lang = useLanguage();
    t = lang.t;
  } catch {
    t = (key: string) => key;
  }

  return (
    <AppLayout>
      <div className="mb-4">
        <Link to="/watchlists" className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> {t("backToWatchlists")}
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">{symbol}</h1>
          <span className="rounded-md bg-muted px-2.5 py-1 text-xs text-muted-foreground">{info.sector}</span>
        </div>
        <p className="mt-1 text-muted-foreground">{info.name}</p>
      </div>

      <div className="mb-6 rounded-xl border border-border bg-card p-1">
        <TradingViewChart symbol={symbol} height={450} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            <h2 className="text-lg font-semibold">{t("technicalAnalysis")}</h2>
          </div>
          <TradingViewTechnicalAnalysis symbol={symbol} />
        </div>

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
            <TradingViewTimeline symbol={symbol} height={400} />
          </div>

          <DisclaimerBanner />
        </div>
      </div>
    </AppLayout>
  );
};

export default StockDetail;
