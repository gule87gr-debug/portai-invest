/**
 * Maps PortAI's internal tickers (see ./index.ts) to TradingView symbols
 * (EXCHANGE:SYMBOL) for the official embed widgets.
 *
 * Only confident mappings are returned; anything else returns null so the UI
 * can say "chart unavailable" instead of showing the wrong instrument.
 * US exchanges and crypto pairs come from the generated listing snapshot
 * (scripts/generate-tradingview-symbols.ts); international tickers use the
 * exchange-suffix rules below.
 */
import { US_LISTINGS, CRYPTO_SYMBOLS } from "./tradingViewSymbols.generated";

/** Internal suffix → TradingView exchange prefix, plus symbol clean-up. */
export const SUFFIX_RULES: Record<string, { exchange: string; transform?: (base: string) => string }> = {
  ".L": { exchange: "LSE", transform: (b) => b.replace(/\.$/, "") },
  ".DE": { exchange: "XETR" },
  ".PA": { exchange: "EURONEXT" },
  ".AS": { exchange: "EURONEXT" },
  ".BR": { exchange: "EURONEXT" },
  ".LS": { exchange: "EURONEXT" },
  ".MC": { exchange: "BME" },
  ".MI": { exchange: "MIL" },
  ".SW": { exchange: "SIX" },
  ".VI": { exchange: "VIE" },
  ".AT": { exchange: "ATHEX" },
  ".WA": { exchange: "GPW" },
  ".IS": { exchange: "BIST" },
  ".ST": { exchange: "OMXSTO", transform: (b) => b.replace(/-/g, "_") },
  ".CO": { exchange: "OMXCOP", transform: (b) => b.replace(/-/g, "_") },
  ".HE": { exchange: "OMXHEX", transform: (b) => b.replace(/-/g, "_") },
  ".OL": { exchange: "OSL" },
  ".T": { exchange: "TSE" },
  ".HK": { exchange: "HKEX", transform: (b) => b.replace(/^0+(?=\d)/, "") },
  ".KS": { exchange: "KRX" },
  ".TW": { exchange: "TWSE" },
  ".SI": { exchange: "SGX" },
  ".NS": { exchange: "NSE" },
  ".BO": { exchange: "BSE" },
  ".JK": { exchange: "IDX" },
  ".BK": { exchange: "SET" },
  ".PS": { exchange: "PSE" },
  ".VN": { exchange: "HOSE" },
  ".AX": { exchange: "ASX" },
  ".TO": { exchange: "TSX", transform: (b) => b.replace(/-/g, ".") },
  ".SA": { exchange: "BMFBOVESPA" },
  ".MX": { exchange: "BMV" },
  ".SN": { exchange: "BCS" },
  ".JO": { exchange: "JSE" },
  ".SR": { exchange: "TADAWUL" },
};

let usIndex: Map<string, string> | null = null;
let cryptoIndex: Map<string, string> | null = null;

function lookupUS(ticker: string): string | undefined {
  if (!usIndex) {
    usIndex = new Map();
    for (const [exchange, list] of Object.entries(US_LISTINGS)) {
      for (const t of list.split(" ")) if (t) usIndex.set(t, exchange);
    }
  }
  const exchange = usIndex.get(ticker);
  return exchange ? `${exchange}:${ticker}` : undefined;
}

function lookupCrypto(ticker: string): string | undefined {
  if (!cryptoIndex) {
    cryptoIndex = new Map();
    for (const entry of CRYPTO_SYMBOLS.split(" ")) {
      const [t, symbol] = entry.split("=");
      if (t && symbol) cryptoIndex.set(t, symbol);
    }
  }
  return cryptoIndex.get(ticker);
}

/** Returns "EXCHANGE:SYMBOL", or null when there is no confident mapping. */
export function toTradingViewSymbol(ticker: string): string | null {
  const upper = ticker.trim().toUpperCase();
  if (!upper) return null;

  const crypto = lookupCrypto(upper);
  if (crypto) return crypto;

  const us = lookupUS(upper);
  if (us) return us;

  const dot = upper.lastIndexOf(".");
  if (dot > 0) {
    const rule = SUFFIX_RULES[upper.slice(dot)];
    if (rule) {
      const base = upper.slice(0, dot);
      const symbol = rule.transform ? rule.transform(base) : base;
      if (/^[A-Z0-9._&-]+$/.test(symbol)) return `${rule.exchange}:${symbol}`;
    }
  }
  return null;
}
