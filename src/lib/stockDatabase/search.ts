import { assetDatabase } from "./index";
import type { AssetEntry } from "./types";
import { getAssetRegion, type AssetRegion } from "./index";

/**
 * Pre-built lowercase index over the asset catalog.
 * Built once on first use so per-keystroke search stays allocation-free.
 */
type IndexedAsset = {
  asset: AssetEntry;
  ticker: string;
  name: string;
  sector: string;
  order: number;
};

let INDEX: IndexedAsset[] | null = null;

function getIndex(): IndexedAsset[] {
  if (!INDEX) {
    INDEX = assetDatabase.map((asset, order) => ({
      asset,
      ticker: asset.ticker.toLowerCase(),
      name: asset.name.toLowerCase(),
      sector: asset.sector.toLowerCase(),
      order,
    }));
  }
  return INDEX;
}

/**
 * Relevance score — higher is better, 0 means no match.
 *  exact ticker > ticker prefix > name prefix > name word prefix > substring
 */
function score(item: IndexedAsset, q: string): number {
  if (item.ticker === q) return 1000;
  if (item.ticker.startsWith(q)) return 900 - item.ticker.length;
  if (item.name.startsWith(q)) return 800 - item.name.length / 10;
  if (item.ticker.includes(q)) return 600;

  // word-boundary match inside the name ("performance" -> Neo Performance Materials)
  let at = item.name.indexOf(q);
  while (at !== -1) {
    if (at === 0 || item.name[at - 1] === " ") return 700 - at;
    at = item.name.indexOf(q, at + 1);
  }
  if (item.name.includes(q)) return 500;
  if (item.sector.includes(q)) return 200;
  return 0;
}

export type SearchOptions = { region?: AssetRegion; limit?: number };

export function searchAssetsRanked(query: string, options: SearchOptions = {}): AssetEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const { region, limit = 12 } = options;
  const filterRegion = region && region !== "all" ? region : null;

  const hits: { item: IndexedAsset; s: number }[] = [];
  for (const item of getIndex()) {
    const s = score(item, q);
    if (!s) continue;
    if (filterRegion && getAssetRegion(item.asset.ticker) !== filterRegion) continue;
    hits.push({ item, s });
  }

  hits.sort((a, b) => b.s - a.s || a.item.order - b.item.order);
  return hits.slice(0, limit).map((h) => h.item.asset);
}

/** Popular fallbacks shown before the user types anything. */
export const POPULAR_TICKERS = [
  "AAPL", "MSFT", "NVDA", "AMZN", "GOOGL", "META", "TSLA",
  "SPY", "QQQ", "VOO", "VTI", "IWM",
  "BTC-USD", "ETH-USD",
  "MP", "NEO.TO", "CCJ", "LMT", "XLB", "URA",
];

export function getPopularAssets(): AssetEntry[] {
  const byTicker = new Map(assetDatabase.map((a) => [a.ticker.toUpperCase(), a]));
  return POPULAR_TICKERS.map((t) => byTicker.get(t.toUpperCase())).filter(Boolean) as AssetEntry[];
}
