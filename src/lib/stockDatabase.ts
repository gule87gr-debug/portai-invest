// Searchable database of stocks, ETFs, and crypto
export type AssetEntry = { ticker: string; name: string; sector: string; type: "stock" | "etf" | "crypto" };

export const assetDatabase: AssetEntry[] = [
  // Major Stocks
  { ticker: "AAPL", name: "Apple Inc.", sector: "Technology", type: "stock" },
  { ticker: "MSFT", name: "Microsoft Corporation", sector: "Technology", type: "stock" },
  { ticker: "GOOGL", name: "Alphabet Inc.", sector: "Technology", type: "stock" },
  { ticker: "AMZN", name: "Amazon.com Inc.", sector: "Technology", type: "stock" },
  { ticker: "NVDA", name: "NVIDIA Corporation", sector: "Technology", type: "stock" },
  { ticker: "META", name: "Meta Platforms Inc.", sector: "Technology", type: "stock" },
  { ticker: "TSLA", name: "Tesla Inc.", sector: "Consumer", type: "stock" },
  { ticker: "BRK.B", name: "Berkshire Hathaway Inc.", sector: "Finance", type: "stock" },
  { ticker: "JPM", name: "JPMorgan Chase & Co.", sector: "Finance", type: "stock" },
  { ticker: "V", name: "Visa Inc.", sector: "Finance", type: "stock" },
  { ticker: "JNJ", name: "Johnson & Johnson", sector: "Healthcare", type: "stock" },
  { ticker: "UNH", name: "UnitedHealth Group", sector: "Healthcare", type: "stock" },
  { ticker: "PFE", name: "Pfizer Inc.", sector: "Healthcare", type: "stock" },
  { ticker: "ABBV", name: "AbbVie Inc.", sector: "Healthcare", type: "stock" },
  { ticker: "XOM", name: "Exxon Mobil Corporation", sector: "Energy", type: "stock" },
  { ticker: "CVX", name: "Chevron Corporation", sector: "Energy", type: "stock" },
  { ticker: "PG", name: "Procter & Gamble", sector: "Consumer", type: "stock" },
  { ticker: "KO", name: "The Coca-Cola Company", sector: "Consumer", type: "stock" },
  { ticker: "PEP", name: "PepsiCo Inc.", sector: "Consumer", type: "stock" },
  { ticker: "WMT", name: "Walmart Inc.", sector: "Consumer", type: "stock" },
  { ticker: "DIS", name: "Walt Disney Company", sector: "Consumer", type: "stock" },
  { ticker: "NFLX", name: "Netflix Inc.", sector: "Technology", type: "stock" },
  { ticker: "AMD", name: "Advanced Micro Devices", sector: "Technology", type: "stock" },
  { ticker: "INTC", name: "Intel Corporation", sector: "Technology", type: "stock" },
  { ticker: "CRM", name: "Salesforce Inc.", sector: "Technology", type: "stock" },
  { ticker: "BA", name: "Boeing Company", sector: "Industrial", type: "stock" },
  { ticker: "CAT", name: "Caterpillar Inc.", sector: "Industrial", type: "stock" },
  { ticker: "GE", name: "General Electric", sector: "Industrial", type: "stock" },
  { ticker: "NEE", name: "NextEra Energy", sector: "Energy", type: "stock" },
  { ticker: "GS", name: "Goldman Sachs", sector: "Finance", type: "stock" },
  // ETFs
  { ticker: "SPY", name: "SPDR S&P 500 ETF Trust", sector: "Index", type: "etf" },
  { ticker: "QQQ", name: "Invesco QQQ Trust", sector: "Technology", type: "etf" },
  { ticker: "VTI", name: "Vanguard Total Stock Market ETF", sector: "Index", type: "etf" },
  { ticker: "VOO", name: "Vanguard S&P 500 ETF", sector: "Index", type: "etf" },
  { ticker: "IWM", name: "iShares Russell 2000 ETF", sector: "Index", type: "etf" },
  { ticker: "ARKK", name: "ARK Innovation ETF", sector: "Innovation", type: "etf" },
  { ticker: "XLV", name: "Health Care Select Sector SPDR", sector: "Healthcare", type: "etf" },
  { ticker: "XLP", name: "Consumer Staples Select Sector SPDR", sector: "Consumer", type: "etf" },
  { ticker: "XLE", name: "Energy Select Sector SPDR", sector: "Energy", type: "etf" },
  { ticker: "XLF", name: "Financial Select Sector SPDR", sector: "Finance", type: "etf" },
  { ticker: "XLI", name: "Industrial Select Sector SPDR", sector: "Industrial", type: "etf" },
  { ticker: "XLK", name: "Technology Select Sector SPDR", sector: "Technology", type: "etf" },
  { ticker: "XLU", name: "Utilities Select Sector SPDR", sector: "Utilities", type: "etf" },
  { ticker: "VDE", name: "Vanguard Energy ETF", sector: "Energy", type: "etf" },
  { ticker: "TLT", name: "iShares 20+ Year Treasury Bond ETF", sector: "Fixed Income", type: "etf" },
  { ticker: "BND", name: "Vanguard Total Bond Market ETF", sector: "Fixed Income", type: "etf" },
  { ticker: "GDX", name: "VanEck Gold Miners ETF", sector: "Materials", type: "etf" },
  { ticker: "GLD", name: "SPDR Gold Shares", sector: "Commodities", type: "etf" },
  { ticker: "SLV", name: "iShares Silver Trust", sector: "Commodities", type: "etf" },
  { ticker: "SOXX", name: "iShares Semiconductor ETF", sector: "Technology", type: "etf" },
  { ticker: "VNQ", name: "Vanguard Real Estate ETF", sector: "Real Estate", type: "etf" },
  { ticker: "SCHD", name: "Schwab U.S. Dividend Equity ETF", sector: "Index", type: "etf" },
  // Crypto
  { ticker: "BTCUSD", name: "Bitcoin", sector: "Crypto", type: "crypto" },
  { ticker: "ETHUSD", name: "Ethereum", sector: "Crypto", type: "crypto" },
  { ticker: "SOLUSD", name: "Solana", sector: "Crypto", type: "crypto" },
  { ticker: "ADAUSD", name: "Cardano", sector: "Crypto", type: "crypto" },
  { ticker: "DOTUSD", name: "Polkadot", sector: "Crypto", type: "crypto" },
  { ticker: "AVAXUSD", name: "Avalanche", sector: "Crypto", type: "crypto" },
  { ticker: "LINKUSD", name: "Chainlink", sector: "Crypto", type: "crypto" },
  { ticker: "MATICUSD", name: "Polygon", sector: "Crypto", type: "crypto" },
  { ticker: "XRPUSD", name: "XRP", sector: "Crypto", type: "crypto" },
  { ticker: "DOGEUSD", name: "Dogecoin", sector: "Crypto", type: "crypto" },
];

export function searchAssets(query: string): AssetEntry[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  return assetDatabase
    .filter((a) => a.ticker.toLowerCase().includes(q) || a.name.toLowerCase().includes(q) || a.sector.toLowerCase().includes(q))
    .slice(0, 12);
}
