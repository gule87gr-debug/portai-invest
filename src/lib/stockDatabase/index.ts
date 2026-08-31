export type { AssetEntry } from "./types";
import { stocks } from "./stocks";
import { etfs } from "./etfs";
import { crypto } from "./crypto";
import { indexFunds } from "./indexFunds";
import { additionalStocks } from "./additionalStocks";
import { additionalCrypto } from "./additionalCrypto";
import { extraStocks } from "./extraStocks";
import { extraEtfs } from "./extraEtfs";
import { extraCrypto } from "./extraCrypto";
import { internationalStocks } from "./internationalStocks";
import { moreUSStocks } from "./moreUSStocks";
import { emergingMarketStocks } from "./emergingMarkets";
import { usMidCapStocks } from "./usMidCaps";
import { globalETFs, moreThematicETFs } from "./globalETFs";
import { moreEuropeanStocks } from "./moreEurope";
import { moreAsiaStocks } from "./moreAsia";
import { moreCrypto } from "./moreCrypto";
import { bulkUSStocks } from "./bulkUS";
import { moreInternationalStocks } from "./moreIntl";
import { megaUSStocks, moreEUStocks, latamStocks } from "./megaBatch";
import { expansionInternational, expansionUS, expansionETFs } from "./expansion";
import { expansionExtra } from "./expansion2";
import { expansion3 } from "./expansion3";
import { expansion4 } from "./expansion4";
import { expansion5 } from "./expansion5";
import { expansion6 } from "./expansion6";

const rawAssets = [
  ...stocks, ...etfs, ...crypto, ...indexFunds,
  ...additionalStocks, ...additionalCrypto,
  ...extraStocks, ...extraEtfs, ...extraCrypto,
  ...internationalStocks, ...moreUSStocks,
  ...emergingMarketStocks, ...usMidCapStocks,
  ...globalETFs, ...moreThematicETFs,
  ...moreEuropeanStocks, ...moreAsiaStocks, ...moreCrypto,
  ...bulkUSStocks, ...moreInternationalStocks,
  ...megaUSStocks, ...moreEUStocks, ...latamStocks,
  ...expansionInternational, ...expansionUS, ...expansionETFs,
  ...expansionExtra, ...expansion3, ...expansion4, ...expansion5, ...expansion6,
];

// Deduplicate by ticker — first occurrence wins
const seen = new Set<string>();
export const assetDatabase = rawAssets.filter((a) => {
  if (seen.has(a.ticker)) return false;
  seen.add(a.ticker);
  return true;
});

// O(1) ticker lookup (built lazily) instead of scanning ~7k entries per call.
let byTicker: Map<string, (typeof assetDatabase)[number]> | null = null;
export function getAsset(ticker: string) {
  if (!byTicker) {
    byTicker = new Map(assetDatabase.map((a) => [a.ticker.toUpperCase(), a]));
  }
  return byTicker.get(ticker.toUpperCase());
}

export {
  getAssetRegion,
  REGION_LABELS,
  REGION_FLAGS,
  REGION_LABEL_KEYS,
} from "./regions";
export type { AssetRegion } from "./regions";

import { getAssetRegion, type AssetRegion } from "./regions";

export function searchAssets(query: string, region?: AssetRegion) {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  return assetDatabase
    .filter((a) => {
      const matchesQuery = a.ticker.toLowerCase().includes(q) || a.name.toLowerCase().includes(q) || a.sector.toLowerCase().includes(q);
      if (!matchesQuery) return false;
      if (region && region !== "all") return getAssetRegion(a.ticker) === region;
      return true;
    })
    .slice(0, 12);
}

