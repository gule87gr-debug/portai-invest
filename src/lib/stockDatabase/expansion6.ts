import type { AssetEntry } from "./types";

// Popular & in-demand names: critical minerals, rare earths, materials,
// uranium, lithium, defense and other frequently searched tickers.
export const expansion6: AssetEntry[] = [
  // Rare earths & critical minerals
  { ticker: "NEO.TO", name: "Neo Performance Materials", sector: "Materials", type: "stock" },
  { ticker: "MP", name: "MP Materials", sector: "Materials", type: "stock" },
  { ticker: "LYC.AX", name: "Lynas Rare Earths", sector: "Materials", type: "stock" },
  { ticker: "UUUU", name: "Energy Fuels", sector: "Energy", type: "stock" },
  { ticker: "TMC", name: "TMC the metals company", sector: "Materials", type: "stock" },
  { ticker: "IDR", name: "Idaho Strategic Resources", sector: "Materials", type: "stock" },
  { ticker: "ARR.AX", name: "American Rare Earths", sector: "Materials", type: "stock" },
  { ticker: "ILU.AX", name: "Iluka Resources", sector: "Materials", type: "stock" },
  { ticker: "REMX", name: "VanEck Rare Earth & Strategic Metals ETF", sector: "ETF", type: "etf" },

  // Lithium & battery materials
  { ticker: "ALB", name: "Albemarle", sector: "Materials", type: "stock" },
  { ticker: "SQM", name: "Sociedad Quimica y Minera de Chile", sector: "Materials", type: "stock" },
  { ticker: "LAC", name: "Lithium Americas", sector: "Materials", type: "stock" },
  { ticker: "LAAC", name: "Lithium Argentina", sector: "Materials", type: "stock" },
  { ticker: "PLS.AX", name: "Pilbara Minerals", sector: "Materials", type: "stock" },
  { ticker: "SGML", name: "Sigma Lithium", sector: "Materials", type: "stock" },
  { ticker: "LIT", name: "Global X Lithium & Battery Tech ETF", sector: "ETF", type: "etf" },
  { ticker: "BATT", name: "Amplify Lithium & Battery Technology ETF", sector: "ETF", type: "etf" },

  // Uranium & nuclear
  { ticker: "CCJ", name: "Cameco", sector: "Energy", type: "stock" },
  { ticker: "NXE", name: "NexGen Energy", sector: "Energy", type: "stock" },
  { ticker: "DNN", name: "Denison Mines", sector: "Energy", type: "stock" },
  { ticker: "UEC", name: "Uranium Energy Corp", sector: "Energy", type: "stock" },
  { ticker: "URA", name: "Global X Uranium ETF", sector: "ETF", type: "etf" },
  { ticker: "URNM", name: "Sprott Uranium Miners ETF", sector: "ETF", type: "etf" },
  { ticker: "SMR", name: "NuScale Power", sector: "Utilities", type: "stock" },
  { ticker: "OKLO", name: "Oklo", sector: "Utilities", type: "stock" },
  { ticker: "LEU", name: "Centrus Energy", sector: "Energy", type: "stock" },
  { ticker: "BWXT", name: "BWX Technologies", sector: "Industrials", type: "stock" },

  // Copper, gold & diversified miners
  { ticker: "FCX", name: "Freeport-McMoRan", sector: "Materials", type: "stock" },
  { ticker: "SCCO", name: "Southern Copper", sector: "Materials", type: "stock" },
  { ticker: "TECK", name: "Teck Resources", sector: "Materials", type: "stock" },
  { ticker: "IVN.TO", name: "Ivanhoe Mines", sector: "Materials", type: "stock" },
  { ticker: "HBM", name: "Hudbay Minerals", sector: "Materials", type: "stock" },
  { ticker: "ERO", name: "Ero Copper", sector: "Materials", type: "stock" },
  { ticker: "AEM", name: "Agnico Eagle Mines", sector: "Materials", type: "stock" },
  { ticker: "WPM", name: "Wheaton Precious Metals", sector: "Materials", type: "stock" },
  { ticker: "FNV", name: "Franco-Nevada", sector: "Materials", type: "stock" },
  { ticker: "KGC", name: "Kinross Gold", sector: "Materials", type: "stock" },
  { ticker: "PAAS", name: "Pan American Silver", sector: "Materials", type: "stock" },
  { ticker: "HL", name: "Hecla Mining", sector: "Materials", type: "stock" },
  { ticker: "COPX", name: "Global X Copper Miners ETF", sector: "ETF", type: "etf" },
  { ticker: "SIL", name: "Global X Silver Miners ETF", sector: "ETF", type: "etf" },
  { ticker: "PICK", name: "iShares MSCI Global Metals & Mining ETF", sector: "ETF", type: "etf" },

  // Steel, chemicals & industrial materials
  { ticker: "NUE", name: "Nucor", sector: "Materials", type: "stock" },
  { ticker: "STLD", name: "Steel Dynamics", sector: "Materials", type: "stock" },
  { ticker: "CLF", name: "Cleveland-Cliffs", sector: "Materials", type: "stock" },
  { ticker: "X", name: "United States Steel", sector: "Materials", type: "stock" },
  { ticker: "LIN", name: "Linde", sector: "Materials", type: "stock" },
  { ticker: "APD", name: "Air Products and Chemicals", sector: "Materials", type: "stock" },
  { ticker: "SHW", name: "Sherwin-Williams", sector: "Materials", type: "stock" },
  { ticker: "ECL", name: "Ecolab", sector: "Materials", type: "stock" },
  { ticker: "CE", name: "Celanese", sector: "Materials", type: "stock" },
  { ticker: "MOS", name: "Mosaic", sector: "Materials", type: "stock" },
  { ticker: "NTR", name: "Nutrien", sector: "Materials", type: "stock" },
  { ticker: "CF", name: "CF Industries", sector: "Materials", type: "stock" },
  { ticker: "XLB", name: "Materials Select Sector SPDR Fund", sector: "ETF", type: "etf" },

  // Defense & aerospace
  { ticker: "LMT", name: "Lockheed Martin", sector: "Industrials", type: "stock" },
  { ticker: "RTX", name: "RTX Corporation", sector: "Industrials", type: "stock" },
  { ticker: "NOC", name: "Northrop Grumman", sector: "Industrials", type: "stock" },
  { ticker: "GD", name: "General Dynamics", sector: "Industrials", type: "stock" },
  { ticker: "LDOS", name: "Leidos", sector: "Industrials", type: "stock" },
  { ticker: "RHM.DE", name: "Rheinmetall", sector: "Industrials", type: "stock" },
  { ticker: "BA.L", name: "BAE Systems", sector: "Industrials", type: "stock" },
  { ticker: "HO.PA", name: "Thales", sector: "Industrials", type: "stock" },
  { ticker: "ITA", name: "iShares U.S. Aerospace & Defense ETF", sector: "ETF", type: "etf" },

  // Other popular momentum names
  { ticker: "RKLB", name: "Rocket Lab", sector: "Industrials", type: "stock" },
  { ticker: "ASTS", name: "AST SpaceMobile", sector: "Communication Services", type: "stock" },
  { ticker: "IONQ", name: "IonQ", sector: "Technology", type: "stock" },
  { ticker: "RGTI", name: "Rigetti Computing", sector: "Technology", type: "stock" },
  { ticker: "QBTS", name: "D-Wave Quantum", sector: "Technology", type: "stock" },
  { ticker: "VST", name: "Vistra", sector: "Utilities", type: "stock" },
  { ticker: "CEG", name: "Constellation Energy", sector: "Utilities", type: "stock" },
  { ticker: "TLN", name: "Talen Energy", sector: "Utilities", type: "stock" },
  { ticker: "GEV", name: "GE Vernova", sector: "Industrials", type: "stock" },
  { ticker: "PWR", name: "Quanta Services", sector: "Industrials", type: "stock" },
];
