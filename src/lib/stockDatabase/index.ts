export type { AssetEntry } from "./types";
import { stocks } from "./stocks";
import { etfs } from "./etfs";
import { crypto } from "./crypto";
import { indexFunds } from "./indexFunds";
import { additionalStocks } from "./additionalStocks";
import { additionalCrypto } from "./additionalCrypto";
import { extraStocks } from "./extraStocks";
import { extraEtfs } from "./extraEtfs";
import { extraIndices } from "./extraIndices";
import { extraCrypto } from "./extraCrypto";

export const assetDatabase = [
  ...stocks, ...etfs, ...crypto, ...indexFunds,
  ...additionalStocks, ...additionalCrypto,
  ...extraStocks, ...extraEtfs, ...extraIndices, ...extraCrypto,
];

export function searchAssets(query: string) {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  return assetDatabase
    .filter((a) => a.ticker.toLowerCase().includes(q) || a.name.toLowerCase().includes(q) || a.sector.toLowerCase().includes(q))
    .slice(0, 12);
}
