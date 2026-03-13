import { Stock } from "@/contexts/AppContext";

type QuizAnswers = Record<number, string[]>;

type PortfolioResult = {
  allocations: { ticker: string; name: string; pct: number; desc: string }[];
  rationale: string;
  expectedReturn: string;
  riskLevel: string;
  bearCase: string;
  baseCase: string;
  bullCase: string;
};

export function generatePortfolio(answers: QuizAnswers): PortfolioResult {
  const risk = answers[0]?.[0] || "Moderate";
  const timeframe = answers[1]?.[0] || "3-7 Years";
  const profit = answers[2]?.[0] || "10% / year";
  const experience = answers[3]?.[0] || "Intermediate";
  const sectors = answers[4] || [];

  if (risk === "Conservative") {
    const allocs = [
      { ticker: "VOO", name: "Vanguard S&P 500 ETF", pct: 30, desc: "Core large-cap exposure with low volatility and consistent returns tracking the S&P 500." },
      { ticker: "BND", name: "Vanguard Total Bond Market ETF", pct: 25, desc: "Broad bond market exposure providing income stability and portfolio ballast during downturns." },
      { ticker: "SCHD", name: "Schwab U.S. Dividend Equity ETF", pct: 20, desc: "High-quality dividend-paying stocks for reliable income and lower volatility than growth stocks." },
      { ticker: "GLD", name: "SPDR Gold Shares", pct: 15, desc: "Gold allocation as inflation hedge and safe haven during market turbulence." },
      { ticker: "XLP", name: "Consumer Staples Select Sector SPDR", pct: 10, desc: "Defensive consumer staples companies with steady demand regardless of economic conditions." },
    ];
    if (sectors.includes("Technology")) { allocs[4] = { ticker: "MSFT", name: "Microsoft Corporation", pct: 10, desc: "Blue-chip tech with strong dividends, cloud growth, and defensive characteristics." }; }
    if (sectors.includes("Healthcare")) { allocs[2] = { ticker: "XLV", name: "Health Care Select Sector SPDR", pct: 20, desc: "Healthcare sector provides defensive growth with aging demographics as a tailwind." }; }
    return { allocations: allocs, rationale: `Conservative portfolio designed for capital preservation with ${timeframe.toLowerCase()} horizon. Focus on income-generating assets and defensive positions.`, expectedReturn: "5%-8% annually", riskLevel: "Low", bearCase: "-3%", baseCase: "7%", bullCase: "12%" };
  }

  if (risk === "Aggressive") {
    const allocs = [
      { ticker: "QQQ", name: "Invesco QQQ Trust", pct: 30, desc: "Heavy NASDAQ-100 exposure for maximum tech and growth stock participation." },
      { ticker: "NVDA", name: "NVIDIA Corporation", pct: 20, desc: "AI infrastructure leader with explosive revenue growth driven by data center demand." },
      { ticker: "ARKK", name: "ARK Innovation ETF", pct: 15, desc: "Actively managed fund targeting disruptive innovation across genomics, AI, and fintech." },
      { ticker: "SOXX", name: "iShares Semiconductor ETF", pct: 15, desc: "Semiconductor sector exposure capturing the AI chip boom and digital transformation." },
      { ticker: "BTCUSD", name: "Bitcoin", pct: 10, desc: "Digital asset allocation for asymmetric upside potential and portfolio diversification." },
      { ticker: "GDX", name: "VanEck Gold Miners ETF", pct: 10, desc: "Gold miners as hedge against monetary policy uncertainty and inflation." },
    ];
    if (sectors.includes("Healthcare")) { allocs[2] = { ticker: "XLV", name: "Health Care Select Sector SPDR", pct: 15, desc: "Healthcare innovation exposure with biotech upside potential." }; }
    if (sectors.includes("Energy")) { allocs[5] = { ticker: "XLE", name: "Energy Select Sector SPDR", pct: 10, desc: "Energy sector for commodity cycle upside and strong cash flows." }; }
    if (sectors.includes("Finance")) { allocs[5] = { ticker: "XLF", name: "Financial Select Sector SPDR", pct: 10, desc: "Financial sector benefits from higher rates and capital markets activity." }; }
    return { allocations: allocs, rationale: `Aggressive growth portfolio for ${experience.toLowerCase()} investor targeting ${profit} over a ${timeframe.toLowerCase()} horizon. Heavy tech and innovation weighting with crypto exposure.`, expectedReturn: "20%-30% annually", riskLevel: "High", bearCase: "-15%", baseCase: "22%", bullCase: "40%" };
  }

  // Moderate (default)
  const allocs = [
    { ticker: "SPY", name: "SPDR S&P 500 ETF Trust", pct: 30, desc: "Core S&P 500 exposure providing broad market participation with moderate volatility." },
    { ticker: "QQQ", name: "Invesco QQQ Trust", pct: 20, desc: "Growth tilt via NASDAQ-100 for tech sector participation while maintaining diversification." },
    { ticker: "VTI", name: "Vanguard Total Stock Market ETF", pct: 20, desc: "Total market exposure including small and mid-caps for broader diversification." },
    { ticker: "TLT", name: "iShares 20+ Year Treasury Bond ETF", pct: 15, desc: "Long-term treasuries for portfolio balance and rate-cut upside potential." },
    { ticker: "GLD", name: "SPDR Gold Shares", pct: 15, desc: "Gold allocation as portfolio stabilizer and inflation protection." },
  ];
  if (sectors.includes("Technology")) { allocs[1] = { ticker: "XLK", name: "Technology Select Sector SPDR", pct: 20, desc: "Focused tech sector exposure with top holdings in AAPL, MSFT, and NVDA." }; }
  if (sectors.includes("Healthcare")) { allocs[3] = { ticker: "XLV", name: "Health Care Select Sector SPDR", pct: 15, desc: "Healthcare exposure with strong defensive characteristics and growth potential." }; }
  if (sectors.includes("Energy")) { allocs[4] = { ticker: "XLE", name: "Energy Select Sector SPDR", pct: 15, desc: "Energy sector for commodity upside and high dividend yields." }; }
  return { allocations: allocs, rationale: `Balanced portfolio for ${experience.toLowerCase()} investor with ${timeframe.toLowerCase()} horizon. Mix of growth and defensive assets targeting ${profit}.`, expectedReturn: "10%-15% annually", riskLevel: "Moderate", bearCase: "-8%", baseCase: "12%", bullCase: "22%" };
}

export function portfolioToStocks(allocations: { ticker: string; name: string; pct: number }[]): Stock[] {
  return allocations.map((a) => ({
    ticker: a.ticker,
    name: a.name,
    sector: getSector(a.ticker),
    signal: "neutral",
  }));
}

function getSector(ticker: string): string {
  const map: Record<string, string> = {
    SPY: "Index", QQQ: "Tech", VTI: "Index", VOO: "Index", BND: "Fixed Income", SCHD: "Dividend",
    GLD: "Commodities", XLP: "Consumer", XLV: "Healthcare", XLE: "Energy", XLF: "Finance",
    XLK: "Tech", XLI: "Industrial", XLU: "Utilities", TLT: "Fixed Income", GDX: "Materials",
    NVDA: "Tech", MSFT: "Tech", ARKK: "Innovation", SOXX: "Tech", BTCUSD: "Crypto",
  };
  return map[ticker] || "Various";
}
