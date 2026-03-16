import { useParams, Link } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { TradingViewChart, TradingViewTechnicalAnalysis } from "@/components/TradingViewWidgets";
import { DisclaimerBanner } from "@/components/DisclaimerBanner";
import { useLanguage } from "@/contexts/LanguageContext";
import { ArrowLeft, Building2, Newspaper, BarChart3 } from "lucide-react";

const stockInfo: Record<string, { name: string; sector: string; description: string; news: { title: string; date: string; summary: string }[] }> = {
  XLP: {
    name: "Consumer Staples Select Sector SPDR Fund",
    sector: "Consumer Staples",
    description: "The Consumer Staples Select Sector SPDR Fund (XLP) tracks a market-cap-weighted index of consumer staples stocks from the S&P 500, including companies in food, beverage, tobacco, and household products.",
    news: [
      { title: "XLP Outperforms as Defensive Rotation Accelerates", date: "Mar 14, 2026", summary: "Consumer staples ETF gains 2.3% this week as investors flee growth stocks amid tariff uncertainty." },
      { title: "Procter & Gamble Raises Dividend for 68th Consecutive Year", date: "Mar 12, 2026", summary: "P&G, XLP's top holding at 16%, announces 7% dividend increase, reinforcing its Dividend King status." },
      { title: "Costco Q2 Earnings Beat Expectations", date: "Mar 10, 2026", summary: "Costco reports strong same-store sales growth of 6.8%, driven by membership fee increases and e-commerce expansion." },
    ],
  },
  VDE: {
    name: "Vanguard Energy ETF",
    sector: "Energy",
    description: "Vanguard Energy ETF (VDE) tracks the MSCI US Investable Market Energy 25/50 Index, providing broad exposure to U.S. energy companies including oil, gas, and consumable fuels.",
    news: [
      { title: "OPEC+ Extends Production Cuts Through Q3 2026", date: "Mar 13, 2026", summary: "Saudi Arabia leads coalition in maintaining reduced output, pushing Brent crude above $87/barrel and boosting VDE holdings." },
      { title: "ExxonMobil Completes Pioneer Natural Resources Integration", date: "Mar 11, 2026", summary: "Exxon, VDE's largest holding, reports successful integration of Pioneer assets, expecting $2B in annual synergies." },
      { title: "U.S. Shale Production Growth Slows Significantly", date: "Mar 9, 2026", summary: "Permian Basin output plateaus as drilling costs rise, potentially supporting higher oil prices for VDE constituents." },
    ],
  },
  XLI: {
    name: "Industrial Select Sector SPDR Fund",
    sector: "Industrials",
    description: "Industrial Select Sector SPDR Fund (XLI) tracks industrial stocks in the S&P 500, including aerospace, defense, machinery, and transportation companies.",
    news: [
      { title: "Infrastructure Spending Boosts Industrial Stocks", date: "Mar 14, 2026", summary: "XLI rises 1.8% as new infrastructure bill allocates $200B for bridges and rail, benefiting Caterpillar and Deere." },
      { title: "Boeing Deliveries Surge in February", date: "Mar 10, 2026", summary: "Boeing, a top XLI holding, delivers 42 aircraft in February, highest monthly total since 2023 regulatory issues." },
      { title: "Defense Spending Increase Proposed for FY2027", date: "Mar 8, 2026", summary: "Pentagon requests 8% budget increase, positive for XLI defense holdings including Lockheed Martin and RTX." },
    ],
  },
  BND: {
    name: "Vanguard Total Bond Market ETF",
    sector: "Fixed Income",
    description: "Vanguard Total Bond Market ETF (BND) provides broad exposure to U.S. investment-grade bonds including treasuries, corporates, and mortgage-backed securities.",
    news: [
      { title: "BND Sees Record Inflows as Investors Seek Safety", date: "Mar 14, 2026", summary: "Bond ETF attracts $3.2B in weekly inflows, the largest since 2020, as equity volatility spikes." },
      { title: "10-Year Treasury Yield Falls Below 4%", date: "Mar 12, 2026", summary: "Weaker-than-expected jobs data pushes yields lower, boosting BND's price by 0.8% on the week." },
      { title: "Fed Minutes Signal Patience on Rate Cuts", date: "Mar 9, 2026", summary: "Federal Reserve officials indicate willingness to wait until June before considering first rate cut of 2026." },
    ],
  },
  QQQ: {
    name: "Invesco QQQ Trust",
    sector: "Technology",
    description: "Invesco QQQ Trust tracks the Nasdaq-100 Index, heavily weighted toward technology and growth stocks including Apple, Microsoft, Amazon, NVIDIA, and Meta.",
    news: [
      { title: "QQQ Reaches New All-Time High on AI Momentum", date: "Mar 15, 2026", summary: "Nasdaq-100 surges 3.2% for the week as NVIDIA and Microsoft announce expanded AI partnerships." },
      { title: "Apple Vision Pro 2 Launch Drives Stock Higher", date: "Mar 13, 2026", summary: "Apple, QQQ's second-largest holding, gains 4% after announcing Vision Pro 2 with 2x battery life and lower price point." },
      { title: "Meta's Llama 4 Sets New AI Benchmarks", date: "Mar 11, 2026", summary: "Meta Platforms releases Llama 4 open-source model, outperforming competitors and strengthening QQQ's AI thesis." },
    ],
  },
  XLV: {
    name: "Health Care Select Sector SPDR Fund",
    sector: "Healthcare",
    description: "Health Care Select Sector SPDR Fund (XLV) tracks healthcare stocks in the S&P 500, including pharmaceuticals, biotech, medical devices, and health insurance companies.",
    news: [
      { title: "Eli Lilly's GLP-1 Drug Revenue Exceeds Expectations", date: "Mar 14, 2026", summary: "Lilly, XLV's top holding, reports Mounjaro/Zepbound revenue of $6.2B in Q1, up 85% year-over-year." },
      { title: "FDA Fast-Tracks Multiple AI-Driven Drug Candidates", date: "Mar 12, 2026", summary: "Healthcare sector gets boost as FDA accelerates review of AI-discovered treatments from several XLV constituents." },
      { title: "UnitedHealth Raises Full-Year Guidance", date: "Mar 10, 2026", summary: "UNH, a major XLV component, increases 2026 EPS guidance by 5% citing Medicare Advantage enrollment growth." },
    ],
  },
  SPY: {
    name: "SPDR S&P 500 ETF Trust",
    sector: "Broad Market",
    description: "SPDR S&P 500 ETF Trust (SPY) is the world's most traded ETF, tracking the S&P 500 index and providing exposure to 500 of the largest U.S. companies.",
    news: [
      { title: "S&P 500 Closes at Record High for 15th Time in 2026", date: "Mar 15, 2026", summary: "SPY gains 1.9% for the week as strong earnings and steady jobs data fuel continued market optimism." },
      { title: "Corporate Earnings Growth Accelerates to 12%", date: "Mar 13, 2026", summary: "S&P 500 companies report average Q1 earnings growth of 12%, above the 9% consensus estimate." },
      { title: "Foreign Investors Increase U.S. Equity Allocation", date: "Mar 11, 2026", summary: "Global fund managers boost U.S. equity positions to highest levels since 2021, benefiting SPY inflows." },
    ],
  },
  ARKK: {
    name: "ARK Innovation ETF",
    sector: "Innovation",
    description: "ARK Innovation ETF (ARKK) is an actively managed fund focused on disruptive innovation across genomics, fintech, next-gen internet, and autonomous technology.",
    news: [
      { title: "Tesla Robotaxi Launch Boosts ARKK Performance", date: "Mar 14, 2026", summary: "Tesla, ARKK's largest position at 12%, surges 8% after announcing commercial robotaxi service in three major cities." },
      { title: "Cathie Wood Increases Coinbase Position", date: "Mar 12, 2026", summary: "ARK Invest adds $45M in COIN shares, citing growing institutional crypto adoption and regulatory clarity." },
      { title: "CRISPR Therapeutics Gets EU Approval for Gene Therapy", date: "Mar 9, 2026", summary: "CRSP, an ARKK genomics holding, receives European approval for sickle cell disease treatment, expanding addressable market." },
    ],
  },
};

const defaultInfo = {
  name: "Exchange-Traded Fund",
  sector: "Various",
  description: "This is an exchange-traded fund that provides diversified exposure to a specific market segment. ETFs offer the benefits of diversification, low costs, and intraday trading.",
  news: [
    { title: "Global ETF Assets Surpass $13 Trillion", date: "Mar 14, 2026", summary: "Record inflows continue as investors increasingly prefer passive strategies over active management." },
    { title: "New Thematic ETFs Launch Across Multiple Sectors", date: "Mar 12, 2026", summary: "ETF issuers launch 15 new thematic funds in Q1 2026, covering AI, nuclear energy, and longevity investing." },
  ],
};

const StockDetail = () => {
  const { ticker } = useParams<{ ticker: string }>();
  const symbol = ticker?.toUpperCase() || "SPY";
  const info = stockInfo[symbol] || { ...defaultInfo, name: `${symbol} Fund` };
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
