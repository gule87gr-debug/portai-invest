/**
 * Resolves a database ticker to a valid TradingView symbol.
 * Returns null if the ticker has no TradingView representation.
 */

// Exchange suffix → TradingView exchange prefix
const EXCHANGE_MAP: Record<string, string> = {
  ".L": "LSE",
  ".DE": "XETR",
  ".PA": "EURONEXT",
  ".MC": "BME",
  ".MI": "MIL",
  ".AS": "EURONEXT",
  ".SW": "SIX",
  ".T": "TSE",
  ".HK": "HKEX",
  ".TO": "TSX",
  ".AX": "ASX",
  ".KS": "KRX",
  ".TW": "TWSE",
  ".SI": "SGX",
  ".ST": "STO",
  ".OL": "OSL",
  ".CO": "OMXCOP",
  ".HE": "OMXHEX",
  ".SA": "BMFBOVESPA",
  ".NS": "NSE",
  ".BO": "BSE",
};

// Well-known crypto pairs available on COINBASE (USD pairs)
const COINBASE_USD = new Set([
  "BTCUSD", "ETHUSD", "SOLUSD", "ADAUSD", "DOTUSD", "AVAXUSD", "LINKUSD",
  "MATICUSD", "XRPUSD", "DOGEUSD", "SHIBUSD", "LTCUSD", "BCHUSD", "ETCUSD",
  "XLMUSD", "ALGOUSD", "ATOMUSD", "NEARUSD", "FILUSD", "ICPUSD", "GRTUSD",
  "MKRUSD", "COMPUSD", "SNXUSD", "CRVUSD", "UNIUSD", "AAVEUSD", "INJUSD",
  "APTUSD", "ARBUSD", "OPUSD", "SUIUSD", "HBARUSD", "MANAUSD", "SANDUSD",
  "FLOWUSD", "XTZUSD", "EOSUSD", "DASHUSD", "ZECUSD", "BONKUSD",
  "FETUSD", "RENDERUSD", "STXUSD", "PEPEUSD",
  "LDOUSD", "DYDXUSD", "JUPUSD", "BNBUSD",
]);

const BITSTAMP_USD = new Set([
  "BTCUSD", "ETHUSD", "XRPUSD", "LTCUSD", "BCHUSD", "LINKUSD", "XLMUSD",
  "ADAUSD", "SOLUSD", "DOTUSD", "AVAXUSD", "MATICUSD",
]);

const BINANCE_USDT_MAP: Record<string, string> = {
  "HNTUSDT": "HNTUSDT", "CFXUSDT": "CFXUSDT",
  "TONUSD": "TONUSDT", "TRXUSD": "TRXUSDT", "VETUSD": "VETUSDT",
  "FTMUSD": "FTMUSDT", "AXSUSD": "AXSUSDT", "GALAUSD": "GALAUSDT",
  "ENJUSD": "ENJUSDT", "TIAUSD": "TIAUSDT", "SEIUSD": "SEIUSDT",
  "RUNEUSD": "RUNEUSDT", "FLOKUSD": "FLOKUSDT", "WIFUSD": "WIFUSDT",
  "OCEANUSD": "OCEANUSDT", "THETAUSD": "THETAUSDT", "KASUSD": "KASUSDT",
  "QNTUSD": "QNTUSDT", "EGLDUSD": "EGLDUSDT", "ROSEUSD": "ROSEUSDT",
  "MINAUSD": "MINAUSDT", "ZILUSD": "ZILUSDT", "IOTAUSD": "IOTAUSDT",
  "NEOUSD": "NEOUSDT", "XMRUSD": "XMRUSDT", "ONDOUSD": "ONDOUSDT",
  "PENDLEUSD": "PENDLEUSDT", "ENAUSD": "ENAUSDT", "GMXUSD": "GMXUSDT",
  "1INCHUSD": "1INCHUSDT", "BALUSD": "BALUSDT", "KAVAUSD": "KAVAUSDT",
  "WAVESUSD": "WAVESUSDT", "CELOUSD": "CELOUSDT", "IOTXUSD": "IOTXUSDT",
  "CKBUSD": "CKBUSDT", "ARUSD": "ARUSDT", "METISUSD": "METISUSDT",
  "MNTUSD": "MNTUSDT", "BEAMUSD": "BEAMUSDT", "COREUSD": "COREUSDT",
  "PYTHUSD": "PYTHUSDT", "WUSD": "WUSDT", "EIGENUSD": "EIGENUSDT",
  "SCUSD": "SCUSDT", "KADENUSD": "KDAUSDT", "ERGUSD": "ERGUSDT",
  "FLUXUSD": "FLUXUSDT", "STRRUSD": "STRKUSDT", "DYDXUSD": "DYDXUSDT",
  "MANTLEUSD": "MNTUSDT", "MANTUSD": "MNTUSDT",
};

export function getTradingViewSymbol(ticker: string, type?: string): string | null {
  const upper = ticker.toUpperCase();

  // Check for international exchange suffix
  for (const [suffix, exchange] of Object.entries(EXCHANGE_MAP)) {
    if (upper.endsWith(suffix)) {
      const base = upper.slice(0, -suffix.length);
      return `${exchange}:${base}`;
    }
  }

  // Auto-detect crypto
  const isCrypto = type === "crypto" || (!type && (upper.endsWith("USD") && upper.length > 4 && !["AUDUSD", "EURUSD", "GBPUSD", "NZDUSD"].includes(upper)) || upper.endsWith("USDT"));

  if (isCrypto) {
    if (COINBASE_USD.has(upper)) return `COINBASE:${upper}`;
    if (BITSTAMP_USD.has(upper)) return `BITSTAMP:${upper}`;
    if (BINANCE_USDT_MAP[upper]) return `BINANCE:${BINANCE_USDT_MAP[upper]}`;
    return `CRYPTO:${upper}`;
  }

  // US stocks, ETFs — TradingView resolves automatically
  return upper;
}

export function hasTradingViewData(ticker: string, type?: string): boolean {
  return getTradingViewSymbol(ticker, type) !== null;
}
