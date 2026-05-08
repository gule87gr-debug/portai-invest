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
  ...expansionExtra, ...expansion3, ...expansion4,
];

// Deduplicate by ticker — first occurrence wins
const seen = new Set<string>();
export const assetDatabase = rawAssets.filter((a) => {
  if (seen.has(a.ticker)) return false;
  seen.add(a.ticker);
  return true;
});

export type AssetRegion = "all" | "us" | "europe" | "asia" | "americas" | "africa" | "middle_east" | "oceania";

const REGION_SUFFIXES: Record<string, AssetRegion> = {
  ".L": "europe", ".DE": "europe", ".PA": "europe", ".AS": "europe", ".MI": "europe",
  ".MC": "europe", ".ST": "europe", ".OL": "europe", ".HE": "europe", ".CO": "europe",
  ".SW": "europe", ".VX": "europe", ".WA": "europe", ".IS": "europe", ".BR": "europe",
  ".VI": "europe", ".LS": "europe", ".IR": "europe", ".AT": "europe",
  ".T": "asia", ".HK": "asia", ".SS": "asia", ".SZ": "asia", ".KS": "asia", ".KQ": "asia",
  ".NS": "asia", ".BO": "asia", ".SI": "asia", ".BK": "asia", ".JK": "asia", ".KL": "asia",
  ".PS": "asia", ".VN": "asia", ".TW": "asia",
  ".TO": "americas", ".V": "americas", ".SA": "americas", ".MX": "americas",
  ".SN": "americas", ".CL": "americas",
  ".JO": "africa", ".LG": "africa", ".NR": "africa", ".CA": "africa",
  ".SR": "middle_east", ".AE": "middle_east",
  ".AX": "oceania",
};

export function getAssetRegion(ticker: string): AssetRegion {
  if (ticker.includes("-USD") || ticker.includes("-BTC")) return "all"; // crypto = global
  const upper = ticker.toUpperCase();
  for (const [suffix, region] of Object.entries(REGION_SUFFIXES)) {
    if (upper.endsWith(suffix.toUpperCase())) return region;
  }
  return "us"; // default = US
}

export const REGION_LABELS: Record<AssetRegion, string> = {
  all: "All Regions",
  us: "🇺🇸 US",
  europe: "🇪🇺 Europe",
  asia: "🌏 Asia",
  americas: "🌎 Americas",
  africa: "🌍 Africa",
  middle_east: "🕌 Middle East",
  oceania: "🌊 Oceania",
};

// Translation key + emoji prefix used by consumers via t(REGION_LABEL_KEYS[r])
export const REGION_FLAGS: Record<AssetRegion, string> = {
  all: "",
  us: "🇺🇸",
  europe: "🇪🇺",
  asia: "🌏",
  americas: "🌎",
  africa: "🌍",
  middle_east: "🕌",
  oceania: "🌊",
};

export const REGION_LABEL_KEYS: Record<AssetRegion, string> = {
  all: "regionAll",
  us: "regionUS",
  europe: "regionEurope",
  asia: "regionAsia",
  americas: "regionAmericas",
  africa: "regionAfrica",
  middle_east: "regionMiddleEast",
  oceania: "regionOceania",
};

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
