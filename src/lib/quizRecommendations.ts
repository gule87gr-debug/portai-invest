import { Stock } from "@/contexts/AppContext";

type QuizAnswers = Record<number, string[]>;

type Allocation = { ticker: string; name: string; pct: number; desc: string; descKey?: string };

type PortfolioResult = {
  allocations: Allocation[];
  rationale: string;
  expectedReturn: string;
  riskLevel: string;
  riskLevelKey: string;
  riskKey: "C" | "M" | "A";
  timeKey: "S" | "M" | "L";
  profitKey: "S" | "G" | "A";
  experienceKey: string;
  sectors: string[];
  bearCase: string;
  baseCase: string;
  bullCase: string;
};

// ── Asset pool ──────────────────────────────────────────────────────────
const ASSETS: Record<string, Omit<Allocation, "pct">> = {
  VOO:   { ticker: "VOO",   name: "Vanguard S&P 500 ETF",              desc: "Core large-cap exposure tracking the S&P 500 with minimal fees." },
  SPY:   { ticker: "SPY",   name: "SPDR S&P 500 ETF Trust",            desc: "Broad S&P 500 participation with high liquidity." },
  VTI:   { ticker: "VTI",   name: "Vanguard Total Stock Market ETF",    desc: "Total US stock market including small/mid-caps for diversification." },
  QQQ:   { ticker: "QQQ",   name: "Invesco QQQ Trust",                 desc: "NASDAQ-100 exposure heavy in mega-cap tech growth." },
  SCHD:  { ticker: "SCHD",  name: "Schwab U.S. Dividend Equity ETF",   desc: "High-quality dividend stocks for reliable income and lower volatility." },
  VIG:   { ticker: "VIG",   name: "Vanguard Dividend Appreciation ETF", desc: "Companies with 10+ year dividend growth streaks." },
  DVY:   { ticker: "DVY",   name: "iShares Select Dividend ETF",       desc: "High-yield dividend stocks for income-focused investors." },
  BND:   { ticker: "BND",   name: "Vanguard Total Bond Market ETF",    desc: "Broad investment-grade bond exposure for portfolio stability." },
  TLT:   { ticker: "TLT",   name: "iShares 20+ Year Treasury Bond ETF",desc: "Long-term treasuries for rate-cut upside and deflation hedge." },
  SHY:   { ticker: "SHY",   name: "iShares 1-3 Year Treasury Bond ETF",desc: "Short-term treasuries for capital preservation with minimal rate risk." },
  AGG:   { ticker: "AGG",   name: "iShares Core U.S. Aggregate Bond",  desc: "Core bond allocation blending government and corporate bonds." },
  TIPS:  { ticker: "TIPS",  name: "iShares TIPS Bond ETF",             desc: "Inflation-protected treasuries preserving purchasing power." },
  GLD:   { ticker: "GLD",   name: "SPDR Gold Shares",                  desc: "Gold allocation as inflation hedge and safe haven." },
  GDX:   { ticker: "GDX",   name: "VanEck Gold Miners ETF",            desc: "Leveraged gold exposure through mining companies." },
  XLP:   { ticker: "XLP",   name: "Consumer Staples Select SPDR",      desc: "Defensive consumer staples with steady demand in any economy." },
  XLU:   { ticker: "XLU",   name: "Utilities Select Sector SPDR",      desc: "Utility stocks for stable dividends and recession resistance." },
  XLV:   { ticker: "XLV",   name: "Health Care Select Sector SPDR",    desc: "Healthcare sector with aging-demographics tailwind." },
  XLK:   { ticker: "XLK",   name: "Technology Select Sector SPDR",     desc: "Focused tech exposure led by AAPL, MSFT, NVDA." },
  XLE:   { ticker: "XLE",   name: "Energy Select Sector SPDR",         desc: "Energy sector for commodity upside and high cash flows." },
  XLF:   { ticker: "XLF",   name: "Financial Select Sector SPDR",      desc: "Financials benefiting from rate environment and capital markets." },
  XLI:   { ticker: "XLI",   name: "Industrial Select Sector SPDR",     desc: "Industrial companies tied to infrastructure and economic growth." },
  XLY:   { ticker: "XLY",   name: "Consumer Discretionary Select SPDR",desc: "Consumer discretionary stocks thriving in strong economies." },
  NVDA:  { ticker: "NVDA",  name: "NVIDIA Corporation",                desc: "AI infrastructure leader with explosive data center revenue growth." },
  MSFT:  { ticker: "MSFT",  name: "Microsoft Corporation",             desc: "Blue-chip tech with cloud dominance, AI integration, and dividends." },
  AAPL:  { ticker: "AAPL",  name: "Apple Inc.",                        desc: "Consumer tech giant with massive ecosystem and buyback program." },
  AMZN:  { ticker: "AMZN",  name: "Amazon.com Inc.",                   desc: "E-commerce and cloud leader with expanding AI and ads revenue." },
  GOOGL: { ticker: "GOOGL", name: "Alphabet Inc.",                     desc: "Search and cloud giant with undervalued AI assets." },
  META:  { ticker: "META",  name: "Meta Platforms Inc.",               desc: "Social media leader with strong ad revenue and AI investment." },
  ARKK:  { ticker: "ARKK",  name: "ARK Innovation ETF",               desc: "Actively managed disruptive innovation across genomics, AI, fintech." },
  SOXX:  { ticker: "SOXX",  name: "iShares Semiconductor ETF",        desc: "Semiconductor sector capturing the AI chip boom." },
  BTCUSD:{ ticker: "BTCUSD",name: "Bitcoin",                          desc: "Digital asset for asymmetric upside and portfolio diversification." },
  ETHUSD:{ ticker: "ETHUSD",name: "Ethereum",                         desc: "Smart contract platform powering DeFi and web3 applications." },
  VWO:   { ticker: "VWO",   name: "Vanguard FTSE Emerging Markets ETF",desc: "Emerging markets exposure for global growth diversification." },
  VXUS:  { ticker: "VXUS",  name: "Vanguard Total International ETF",  desc: "International ex-US stocks for geographic diversification." },
  IEMG:  { ticker: "IEMG",  name: "iShares Core MSCI Emerging Markets",desc: "Broad emerging market equities at low cost." },
  VNQ:   { ticker: "VNQ",   name: "Vanguard Real Estate ETF",          desc: "REITs for real estate income and inflation protection." },
  JEPI:  { ticker: "JEPI",  name: "JPMorgan Equity Premium Income ETF",desc: "Covered-call strategy generating high monthly income with lower vol." },
  SMH:   { ticker: "SMH",   name: "VanEck Semiconductor ETF",         desc: "Top semiconductor holdings for AI and chip cycle exposure." },
  IWM:   { ticker: "IWM",   name: "iShares Russell 2000 ETF",         desc: "Small-cap US stocks for higher growth potential." },
};

const A = (ticker: string, pct: number): Allocation => ({ ...ASSETS[ticker], pct, descKey: `assetDesc_${ticker}` });

// ── Template portfolios keyed by [risk][timeframe][profit] ──────────
// risk: Conservative(C) / Moderate(M) / Aggressive(A)
// timeframe: Short(S) / Medium(M) / Long(L)
// profit: Steady(S) / Growth(G) / Aggressive(A)

type RKey = "C" | "M" | "A";
type TKey = "S" | "M" | "L";
type PKey = "S" | "G" | "A";

const TEMPLATES: Record<string, Allocation[]> = {
  // ─── CONSERVATIVE ───
  "C-S-S": [A("SHY",30), A("BND",25), A("SCHD",20), A("GLD",15), A("XLP",10)],
  "C-S-G": [A("VOO",25), A("BND",25), A("SCHD",20), A("GLD",15), A("TIPS",15)],
  "C-S-A": [A("VOO",30), A("AGG",20), A("SCHD",20), A("GLD",15), A("QQQ",15)],
  "C-M-S": [A("SCHD",25), A("BND",25), A("VOO",20), A("GLD",15), A("XLU",15)],
  "C-M-G": [A("VOO",30), A("BND",20), A("VIG",20), A("GLD",15), A("VXUS",15)],
  "C-M-A": [A("VOO",30), A("QQQ",15), A("BND",20), A("GLD",15), A("VTI",20)],
  "C-L-S": [A("SCHD",25), A("VOO",25), A("BND",20), A("GLD",15), A("VNQ",15)],
  "C-L-G": [A("VOO",30), A("VTI",20), A("BND",15), A("VIG",15), A("GLD",10), A("VXUS",10)],
  "C-L-A": [A("VOO",30), A("QQQ",20), A("VTI",15), A("BND",15), A("GLD",10), A("VXUS",10)],

  // ─── MODERATE ───
  "M-S-S": [A("SPY",25), A("JEPI",20), A("AGG",20), A("GLD",15), A("SCHD",20)],
  "M-S-G": [A("SPY",30), A("QQQ",20), A("AGG",15), A("GLD",15), A("VTI",20)],
  "M-S-A": [A("QQQ",25), A("SPY",25), A("SOXX",15), A("GLD",15), A("TLT",20)],
  "M-M-S": [A("SPY",25), A("SCHD",20), A("TLT",15), A("VXUS",15), A("GLD",15), A("VNQ",10)],
  "M-M-G": [A("SPY",25), A("QQQ",20), A("VTI",20), A("TLT",15), A("GLD",10), A("VXUS",10)],
  "M-M-A": [A("QQQ",25), A("SPY",20), A("NVDA",10), A("VTI",15), A("TLT",15), A("GLD",15)],
  "M-L-S": [A("VTI",25), A("SCHD",20), A("VXUS",15), A("TLT",15), A("GLD",10), A("VNQ",15)],
  "M-L-G": [A("VTI",25), A("QQQ",20), A("VXUS",15), A("TLT",10), A("GLD",10), A("IWM",10), A("VNQ",10)],
  "M-L-A": [A("QQQ",25), A("VTI",20), A("NVDA",10), A("VXUS",15), A("GLD",10), A("SOXX",10), A("TLT",10)],

  // ─── AGGRESSIVE ───
  "A-S-S": [A("QQQ",25), A("SPY",20), A("SOXX",15), A("JEPI",15), A("GLD",15), A("BTCUSD",10)],
  "A-S-G": [A("QQQ",25), A("NVDA",15), A("SOXX",15), A("SPY",15), A("BTCUSD",15), A("GLD",15)],
  "A-S-A": [A("NVDA",20), A("QQQ",20), A("SOXX",15), A("BTCUSD",15), A("ARKK",15), A("SMH",15)],
  "A-M-S": [A("QQQ",25), A("VTI",15), A("SOXX",15), A("SCHD",15), A("BTCUSD",10), A("GDX",10), A("GLD",10)],
  "A-M-G": [A("QQQ",20), A("NVDA",15), A("VTI",15), A("SOXX",15), A("BTCUSD",10), A("VXUS",10), A("GLD",15)],
  "A-M-A": [A("NVDA",20), A("QQQ",20), A("SOXX",15), A("BTCUSD",15), A("ARKK",10), A("IWM",10), A("GDX",10)],
  "A-L-S": [A("VTI",20), A("QQQ",20), A("VXUS",15), A("SOXX",10), A("BTCUSD",10), A("SCHD",15), A("GLD",10)],
  "A-L-G": [A("QQQ",20), A("VTI",15), A("NVDA",15), A("VXUS",10), A("SOXX",10), A("BTCUSD",10), A("IWM",10), A("VWO",10)],
  "A-L-A": [A("NVDA",20), A("QQQ",15), A("BTCUSD",15), A("SOXX",15), A("ARKK",10), A("IWM",10), A("ETHUSD",10), A("SMH",5)],
};

// ── Sector swap map: which ticker to inject per sector interest ──────
const SECTOR_SWAPS: Record<string, { ticker: string; replacePreference: string[] }> = {
  Technology:  { ticker: "XLK",  replacePreference: ["XLP","XLU","VNQ","VXUS","IEMG","DVY","AGG","TIPS"] },
  Healthcare:  { ticker: "XLV",  replacePreference: ["XLP","XLU","VNQ","VXUS","IEMG","DVY","AGG","TIPS"] },
  Finance:     { ticker: "XLF",  replacePreference: ["XLP","XLU","VNQ","GDX","VXUS","DVY","AGG","TIPS"] },
  Energy:      { ticker: "XLE",  replacePreference: ["GLD","GDX","XLP","XLU","VNQ","DVY","AGG","TIPS"] },
  Consumer:    { ticker: "XLY",  replacePreference: ["XLP","XLU","GDX","VNQ","VXUS","DVY","AGG","TIPS"] },
  Industrial:  { ticker: "XLI",  replacePreference: ["XLP","XLU","GDX","VNQ","VXUS","DVY","AGG","TIPS"] },
};

// ── Experience modifier ─────────────────────────────────────────────
// Beginners get more ETFs/bonds, Advanced get more individual stocks/crypto
function applyExperienceModifier(allocs: Allocation[], experience: string): Allocation[] {
  const result = [...allocs.map(a => ({ ...a }))];

  if (experience === "Beginner") {
    // Replace individual stocks with safer ETF equivalents
    const swaps: Record<string, string> = { NVDA: "QQQ", MSFT: "XLK", AAPL: "XLK", AMZN: "QQQ", GOOGL: "QQQ", META: "QQQ", BTCUSD: "GLD", ETHUSD: "GLD", ARKK: "VTI" };
    for (const a of result) {
      if (swaps[a.ticker] && !result.some(r => r.ticker === swaps[a.ticker])) {
        const replacement = ASSETS[swaps[a.ticker]];
        a.ticker = replacement.ticker;
        a.name = replacement.name;
        a.desc = replacement.desc;
      }
    }
  }

  if (experience === "Advanced") {
    // For advanced: swap some generic ETFs for more targeted plays
    const swaps: Record<string, string> = { VOO: "SPY", VTI: "IWM" };
    for (const a of result) {
      if (swaps[a.ticker] && !result.some(r => r.ticker === swaps[a.ticker])) {
        const replacement = ASSETS[swaps[a.ticker]];
        a.ticker = replacement.ticker;
        a.name = replacement.name;
        a.desc = replacement.desc;
      }
    }
  }

  return dedup(result);
}

// ── Apply sector preferences ────────────────────────────────────────
function applySectorSwaps(allocs: Allocation[], sectors: string[]): Allocation[] {
  const result = [...allocs.map(a => ({ ...a }))];

  for (const sector of sectors.slice(0, 2)) { // Max 2 sector swaps
    const swap = SECTOR_SWAPS[sector];
    if (!swap || result.some(a => a.ticker === swap.ticker)) continue;

    // Find a replaceable position
    const replaceIdx = result.findIndex(a => swap.replacePreference.includes(a.ticker));
    if (replaceIdx >= 0) {
      const target = ASSETS[swap.ticker];
      result[replaceIdx] = { ...target, pct: result[replaceIdx].pct };
    }
  }

  return result;
}

// ── Deduplicate (merge pcts of same ticker) ─────────────────────────
function dedup(allocs: Allocation[]): Allocation[] {
  const map = new Map<string, Allocation>();
  for (const a of allocs) {
    if (map.has(a.ticker)) {
      map.get(a.ticker)!.pct += a.pct;
    } else {
      map.set(a.ticker, { ...a });
    }
  }
  return Array.from(map.values());
}

// ── Normalize percentages to sum to 100 ─────────────────────────────
function normalize(allocs: Allocation[]): Allocation[] {
  const total = allocs.reduce((s, a) => s + a.pct, 0);
  if (total === 0) return allocs;
  const result = allocs.map(a => ({ ...a, pct: Math.round((a.pct / total) * 100) }));
  // Fix rounding to exactly 100
  const diff = 100 - result.reduce((s, a) => s + a.pct, 0);
  if (diff !== 0) result[0].pct += diff;
  return result;
}

// ── Map user answers to keys ────────────────────────────────────────
function riskKey(s: string): RKey {
  if (s.toLowerCase().includes("conservative") || s.toLowerCase().includes("conservador")) return "C";
  if (s.toLowerCase().includes("aggressive") || s.toLowerCase().includes("agresivo") || s.toLowerCase().includes("agressif")) return "A";
  return "M";
}

function timeKey(s: string): TKey {
  if (s.toLowerCase().includes("short") || s.toLowerCase().includes("1") || s.toLowerCase().includes("court") || s.toLowerCase().includes("corto")) return "S";
  if (s.toLowerCase().includes("long") || s.toLowerCase().includes("10") || s.toLowerCase().includes("largo")) return "L";
  return "M";
}

function profitKey(s: string): PKey {
  if (s.toLowerCase().includes("steady") || s.toLowerCase().includes("income") || s.toLowerCase().includes("stable") || s.toLowerCase().includes("estable") || s.toLowerCase().includes("revenu")) return "S";
  if (s.toLowerCase().includes("aggressive") || s.toLowerCase().includes("agresivo") || s.toLowerCase().includes("agressif") || s.toLowerCase().includes("30") || s.toLowerCase().includes("25")) return "A";
  return "G";
}

// ── Returns / risk metadata by combo ────────────────────────────────
const METRICS: Record<RKey, Record<TKey, Record<PKey, { expectedReturn: string; riskLevel: string; bearCase: string; baseCase: string; bullCase: string }>>> = {
  C: {
    S: { S: { expectedReturn: "3%-5%", riskLevel: "Very Low", bearCase: "-2%", baseCase: "4%", bullCase: "7%" },
         G: { expectedReturn: "4%-7%", riskLevel: "Low", bearCase: "-3%", baseCase: "6%", bullCase: "9%" },
         A: { expectedReturn: "5%-9%", riskLevel: "Low-Medium", bearCase: "-5%", baseCase: "7%", bullCase: "12%" } },
    M: { S: { expectedReturn: "4%-6%", riskLevel: "Low", bearCase: "-3%", baseCase: "5%", bullCase: "9%" },
         G: { expectedReturn: "5%-8%", riskLevel: "Low", bearCase: "-4%", baseCase: "7%", bullCase: "11%" },
         A: { expectedReturn: "6%-10%", riskLevel: "Low-Medium", bearCase: "-6%", baseCase: "8%", bullCase: "14%" } },
    L: { S: { expectedReturn: "5%-7%", riskLevel: "Low", bearCase: "-3%", baseCase: "6%", bullCase: "10%" },
         G: { expectedReturn: "6%-9%", riskLevel: "Low-Medium", bearCase: "-5%", baseCase: "8%", bullCase: "13%" },
         A: { expectedReturn: "7%-11%", riskLevel: "Medium", bearCase: "-7%", baseCase: "9%", bullCase: "16%" } },
  },
  M: {
    S: { S: { expectedReturn: "5%-8%", riskLevel: "Medium-Low", bearCase: "-5%", baseCase: "7%", bullCase: "12%" },
         G: { expectedReturn: "8%-12%", riskLevel: "Medium", bearCase: "-8%", baseCase: "10%", bullCase: "18%" },
         A: { expectedReturn: "10%-16%", riskLevel: "Medium-High", bearCase: "-12%", baseCase: "13%", bullCase: "24%" } },
    M: { S: { expectedReturn: "6%-9%", riskLevel: "Medium", bearCase: "-6%", baseCase: "8%", bullCase: "14%" },
         G: { expectedReturn: "9%-14%", riskLevel: "Medium", bearCase: "-9%", baseCase: "12%", bullCase: "20%" },
         A: { expectedReturn: "12%-18%", riskLevel: "Medium-High", bearCase: "-13%", baseCase: "15%", bullCase: "26%" } },
    L: { S: { expectedReturn: "7%-10%", riskLevel: "Medium", bearCase: "-7%", baseCase: "9%", bullCase: "15%" },
         G: { expectedReturn: "10%-15%", riskLevel: "Medium", bearCase: "-10%", baseCase: "13%", bullCase: "22%" },
         A: { expectedReturn: "13%-19%", riskLevel: "Medium-High", bearCase: "-14%", baseCase: "16%", bullCase: "28%" } },
  },
  A: {
    S: { S: { expectedReturn: "8%-14%", riskLevel: "High", bearCase: "-12%", baseCase: "11%", bullCase: "22%" },
         G: { expectedReturn: "12%-20%", riskLevel: "High", bearCase: "-15%", baseCase: "16%", bullCase: "30%" },
         A: { expectedReturn: "18%-30%", riskLevel: "Very High", bearCase: "-25%", baseCase: "24%", bullCase: "45%" } },
    M: { S: { expectedReturn: "10%-16%", riskLevel: "High", bearCase: "-14%", baseCase: "13%", bullCase: "26%" },
         G: { expectedReturn: "14%-22%", riskLevel: "High", bearCase: "-18%", baseCase: "18%", bullCase: "35%" },
         A: { expectedReturn: "20%-32%", riskLevel: "Very High", bearCase: "-28%", baseCase: "26%", bullCase: "50%" } },
    L: { S: { expectedReturn: "12%-18%", riskLevel: "High", bearCase: "-15%", baseCase: "15%", bullCase: "28%" },
         G: { expectedReturn: "16%-25%", riskLevel: "High", bearCase: "-20%", baseCase: "20%", bullCase: "38%" },
         A: { expectedReturn: "22%-35%", riskLevel: "Very High", bearCase: "-30%", baseCase: "28%", bullCase: "55%" } },
  },
};

// ── Main generator ──────────────────────────────────────────────────
export function generatePortfolio(answers: QuizAnswers): PortfolioResult {
  const risk = answers[0]?.[0] || "Moderate";
  const timeframe = answers[1]?.[0] || "3-7 Years";
  const profit = answers[2]?.[0] || "10% / year";
  const experience = answers[3]?.[0] || "Intermediate";
  const sectors = answers[4] || [];

  const rk = riskKey(risk);
  const tk = timeKey(timeframe);
  const pk = profitKey(profit);

  const templateKey = `${rk}-${tk}-${pk}`;
  let allocs = TEMPLATES[templateKey] || TEMPLATES["M-M-G"];

  // Deep clone
  allocs = allocs.map(a => ({ ...a }));

  // Apply sector preferences
  allocs = applySectorSwaps(allocs, sectors);

  // Apply experience modifier
  allocs = applyExperienceModifier(allocs, experience);

  // Normalize
  allocs = normalize(allocs);

  const metrics = METRICS[rk][tk][pk];

  const riskLabel = { C: "conservative", M: "moderate", A: "aggressive" }[rk];
  const timeLabel = { S: "short-term", M: "medium-term", L: "long-term" }[tk];
  const profitLabel = { S: "income-focused", G: "growth-oriented", A: "aggressive-growth" }[pk];

  const rationale = `A ${riskLabel}, ${profitLabel} portfolio designed for a ${timeLabel} horizon. ` +
    `Tailored for ${experience.toLowerCase()} investors${sectors.length > 0 ? ` with interest in ${sectors.join(", ")}` : ""}. ` +
    `This allocation balances risk and reward to target ${metrics.expectedReturn} annual returns.`;

  return {
    allocations: allocs,
    rationale,
    ...metrics,
  };
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
    NVDA: "Tech", MSFT: "Tech", AAPL: "Tech", AMZN: "Tech", GOOGL: "Tech", META: "Tech",
    ARKK: "Innovation", SOXX: "Tech", SMH: "Tech", BTCUSD: "Crypto", ETHUSD: "Crypto",
    VWO: "Emerging Markets", VXUS: "International", IEMG: "Emerging Markets", VNQ: "Real Estate",
    VIG: "Dividend", DVY: "Dividend", SHY: "Fixed Income", AGG: "Fixed Income", TIPS: "Fixed Income",
    JEPI: "Income", IWM: "Small Cap", XLY: "Consumer",
  };
  return map[ticker] || "Various";
}
