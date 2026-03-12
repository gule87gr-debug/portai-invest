import { useParams, Link } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { TradingViewChart, TradingViewTechnicalAnalysis } from "@/components/TradingViewWidgets";
import { DisclaimerBanner } from "@/components/DisclaimerBanner";
import { ArrowLeft, Building2, Newspaper, BarChart3 } from "lucide-react";

const stockInfo: Record<string, { name: string; sector: string; description: string; news: { title: string; date: string; summary: string }[] }> = {
  XLP: {
    name: "Consumer Staples Select Sector SPDR Fund",
    sector: "Consumer Staples",
    description: "The Consumer Staples Select Sector SPDR Fund (XLP) is an exchange-traded fund that tracks a market-cap-weighted index of consumer staples stocks drawn from the S&P 500. It provides investors with exposure to companies in sectors such as food and staples, beverage, food product, tobacco, household product, and personal product industries. Top holdings include Procter & Gamble, Costco, Walmart, and Coca-Cola.",
    news: [
      { title: "Consumer Staples Show Resilience in Volatile Markets", date: "Mar 10, 2026", summary: "XLP outperformed growth sectors as investors rotated into defensive positions amid rising uncertainty." },
      { title: "Procter & Gamble Beats Earnings Estimates", date: "Mar 8, 2026", summary: "P&G, XLP's top holding, reported Q1 earnings above consensus driven by price increases and volume growth." },
    ],
  },
  VDE: {
    name: "Vanguard Energy ETF",
    sector: "Energy",
    description: "Vanguard Energy ETF (VDE) tracks the MSCI US Investable Market Energy 25/50 Index. It provides broad exposure to the U.S. energy sector including oil, gas, and consumable fuels companies. Major holdings include ExxonMobil, Chevron, and ConocoPhillips. The fund offers a cost-effective way to gain diversified energy exposure.",
    news: [
      { title: "Oil Prices Surge on OPEC+ Production Cuts", date: "Mar 9, 2026", summary: "Energy stocks rally as OPEC+ announces extended production cuts, boosting crude oil above $85/barrel." },
      { title: "Renewable Energy Transition Impacts Traditional Energy ETFs", date: "Mar 6, 2026", summary: "Analysts debate the long-term outlook for fossil fuel ETFs as renewable adoption accelerates." },
    ],
  },
  QQQ: {
    name: "Invesco QQQ Trust",
    sector: "Technology",
    description: "Invesco QQQ Trust (QQQ) tracks the Nasdaq-100 Index, which includes 100 of the largest non-financial companies listed on Nasdaq. It is heavily weighted toward technology and growth stocks including Apple, Microsoft, Amazon, NVIDIA, and Meta. QQQ is one of the most heavily traded ETFs globally and a popular choice for investors seeking tech-sector exposure.",
    news: [
      { title: "Tech Rally Continues as AI Spending Accelerates", date: "Mar 11, 2026", summary: "QQQ hits new highs as major tech companies announce increased AI infrastructure spending." },
      { title: "NVIDIA Reports Record Data Center Revenue", date: "Mar 7, 2026", summary: "NVIDIA's data center business grows 150% YoY, driving QQQ's largest holding higher." },
    ],
  },
  SPY: {
    name: "SPDR S&P 500 ETF Trust",
    sector: "Broad Market",
    description: "The SPDR S&P 500 ETF Trust (SPY) is the first and largest ETF in the world, tracking the S&P 500 index. It provides exposure to 500 of the largest U.S. companies across all sectors. SPY is the most liquid equity ETF globally with billions in daily trading volume, making it a benchmark for U.S. equity performance.",
    news: [
      { title: "S&P 500 Reaches New All-Time High", date: "Mar 10, 2026", summary: "SPY surges as strong economic data and corporate earnings boost investor confidence." },
      { title: "Fed Signals Patience on Rate Cuts", date: "Mar 5, 2026", summary: "Markets digest Fed commentary suggesting rates will remain elevated longer than expected." },
    ],
  },
};

const defaultInfo = {
  name: "Exchange-Traded Fund",
  sector: "Various",
  description: "This is an exchange-traded fund that provides diversified exposure to a specific market segment. ETFs offer the benefits of diversification, low costs, and intraday trading.",
  news: [
    { title: "Market Update: ETFs See Record Inflows", date: "Mar 10, 2026", summary: "Global ETF assets surpass $12 trillion as investors continue shifting from active to passive strategies." },
  ],
};

const StockDetail = () => {
  const { ticker } = useParams<{ ticker: string }>();
  const symbol = ticker?.toUpperCase() || "SPY";
  const info = stockInfo[symbol] || { ...defaultInfo, name: `${symbol} Fund` };

  return (
    <AppLayout>
      {/* Back link + Header */}
      <div className="mb-4">
        <Link to="/watchlists" className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Watchlists
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">{symbol}</h1>
          <span className="rounded-md bg-muted px-2.5 py-1 text-xs text-muted-foreground">{info.sector}</span>
        </div>
        <p className="mt-1 text-muted-foreground">{info.name}</p>
      </div>

      {/* Chart */}
      <div className="mb-6 rounded-xl border border-border bg-card p-1">
        <TradingViewChart symbol={symbol} height={450} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Technical Analysis */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            <h2 className="text-lg font-semibold">Technical Analysis</h2>
          </div>
          <TradingViewTechnicalAnalysis symbol={symbol} />
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* About */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-3 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              <h2 className="text-lg font-semibold">About</h2>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">{info.description}</p>
          </div>

          {/* Recent News */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-3 flex items-center gap-2">
              <Newspaper className="h-4 w-4 text-primary" />
              <h2 className="text-lg font-semibold">Recent News</h2>
            </div>
            <div className="space-y-3">
              {info.news.map((n, i) => (
                <div key={i} className="rounded-lg border border-border bg-accent/20 p-3">
                  <p className="text-sm font-semibold">{n.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{n.date}</p>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{n.summary}</p>
                </div>
              ))}
            </div>
          </div>

          <DisclaimerBanner />
        </div>
      </div>
    </AppLayout>
  );
};

export default StockDetail;
