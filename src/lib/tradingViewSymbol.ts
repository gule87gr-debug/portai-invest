/**
 * Resolves a database ticker to a valid TradingView symbol.
 * Returns null if the ticker has no TradingView representation.
 */

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

// Pairs on BITSTAMP
const BITSTAMP_USD = new Set([
  "BTCUSD", "ETHUSD", "XRPUSD", "LTCUSD", "BCHUSD", "LINKUSD", "XLMUSD",
  "ADAUSD", "SOLUSD", "DOTUSD", "AVAXUSD", "MATICUSD",
]);

// Pairs available as USDT on BINANCE
const BINANCE_USDT_MAP: Record<string, string> = {
  "HNTUSDT": "HNTUSDT",
  "CFXUSDT": "CFXUSDT",
  "TONUSD": "TONUSDT",
  "TRXUSD": "TRXUSDT",
  "VETUSD": "VETUSDT",
  "FTMUSD": "FTMUSDT",
  "AXSUSD": "AXSUSDT",
  "GALAUSD": "GALAUSDT",
  "ENJUSD": "ENJUSDT",
  "TIAUSD": "TIAUSDT",
  "SEIUSD": "SEIUSDT",
  "RUNEUSD": "RUNEUSDT",
  "FLOKUSD": "FLOKUSDT",
  "WIFUSD": "WIFUSDT",
  "OCEANUSD": "OCEANUSDT",
  "THETAUSD": "THETAUSDT",
  "KASUSD": "KASUSDT",
  "QNTUSD": "QNTUSDT",
  "EGLDUSD": "EGLDUSDT",
  "ROSEUSD": "ROSEUSDT",
  "MINAUSD": "MINAUSDT",
  "ZILUSD": "ZILUSDT",
  "IOTAUSD": "IOTAUSDT",
  "NEOUSD": "NEOUSDT",
  "XMRUSD": "XMRUSDT",
  "ONDOUSD": "ONDOUSDT",
  "PENDLEUSD": "PENDLEUSDT",
  "ENAUSD": "ENAUSDT",
  "GMXUSD": "GMXUSDT",
  "1INCHUSD": "1INCHUSDT",
  "BALUSD": "BALUSDT",
  "KAVAUSD": "KAVAUSDT",
  "WAVESUSD": "WAVESUSDT",
  "CELOUSD": "CELOUSDT",
  "IOTXUSD": "IOTXUSDT",
  "CKBUSD": "CKBUSDT",
  "ARUSD": "ARUSDT",
  "METISUSD": "METISUSDT",
  "MNTUSD": "MNTUSDT",
  "BEAMUSD": "BEAMUSDT",
  "COREUSD": "COREUSDT",
  "PYTHUSD": "PYTHUSDT",
  "WUSD": "WUSDT",
  "EIGENUSD": "EIGENUSDT",
  "SCUSD": "SCUSDT",
  "KADENUSD": "KDAUSDT",
  "ERGUSD": "ERGUSDT",
  "FLUXUSD": "FLUXUSDT",
  "STRRUSD": "STRKUSDT",
  "DYDXUSD": "DYDXUSDT",
  "MANTLEUSD": "MNTUSDT",
  "MANTUSD": "MNTUSDT",
};

export function getTradingViewSymbol(ticker: string, type?: string): string | null {
  const upper = ticker.toUpperCase();

  // Synthetic / non-tradeable indices → no TradingView data
  if (upper.includes("-")) {
    return null;
  }

  // Auto-detect crypto if type not provided
  const isCrypto = type === "crypto" || (!type && (upper.endsWith("USD") && upper.length > 4 && !["AUDUSD", "EURUSD", "GBPUSD", "NZDUSD"].includes(upper)) || upper.endsWith("USDT"));

  // Crypto resolution
  if (isCrypto) {
    // Check COINBASE first (most common)
    if (COINBASE_USD.has(upper)) return `COINBASE:${upper}`;
    // Check BITSTAMP
    if (BITSTAMP_USD.has(upper)) return `BITSTAMP:${upper}`;
    // Check BINANCE USDT mapping
    if (BINANCE_USDT_MAP[upper]) return `BINANCE:${BINANCE_USDT_MAP[upper]}`;
    // Generic attempt — many obscure tokens won't resolve but worth trying
    return `CRYPTO:${upper}`;
  }

  // Stocks, ETFs, index funds — TradingView resolves these automatically
  return upper;
}

/**
 * Returns true if the asset has a valid TradingView symbol
 */
export function hasTradingViewData(ticker: string, type?: string): boolean {
  return getTradingViewSymbol(ticker, type) !== null;
}
