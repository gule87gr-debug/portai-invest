// Region helpers kept free of any asset-data imports so that consumers which
// only need region labels (news filters, etc.) do not pull in the full
// ~7k-ticker catalog chunk.

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

const SUFFIX_ENTRIES = Object.entries(REGION_SUFFIXES).map(
  ([suffix, region]) => [suffix.toUpperCase(), region] as const,
);

export function getAssetRegion(ticker: string): AssetRegion {
  if (ticker.includes("-USD") || ticker.includes("-BTC")) return "all"; // crypto = global
  const upper = ticker.toUpperCase();
  for (const [suffix, region] of SUFFIX_ENTRIES) {
    if (upper.endsWith(suffix)) return region;
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
