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

const rawAssets = [
  ...stocks, ...etfs, ...crypto, ...indexFunds,
  ...additionalStocks, ...additionalCrypto,
  ...extraStocks, ...extraEtfs, ...extraCrypto,
];

// Deduplicate by ticker — first occurrence wins
const seen = new Set<string>();
export const assetDatabase = rawAssets.filter((a) => {
  if (seen.has(a.ticker)) return false;
  seen.add(a.ticker);
  return true;
});

export function searchAssets(query: string) {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  return assetDatabase
    .filter((a) => a.ticker.toLowerCase().includes(q) || a.name.toLowerCase().includes(q) || a.sector.toLowerCase().includes(q))
    .slice(0, 12);
}
