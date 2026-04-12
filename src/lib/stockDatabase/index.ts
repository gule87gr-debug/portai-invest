export type { AssetEntry } from "./types";
import { stocks } from "./stocks";
import { etfs } from "./etfs";
import { crypto } from "./crypto";
import { indexFunds } from "./indexFunds";
import { additionalStocks } from "./additionalStocks";
import { additionalCrypto } from "./additionalCrypto";

export const assetDatabase = [...stocks, ...etfs, ...crypto, ...indexFunds, ...additionalStocks, ...additionalCrypto];

export function searchAssets(query: string) {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  return assetDatabase
    .filter((a) => a.ticker.toLowerCase().includes(q) || a.name.toLowerCase().includes(q) || a.sector.toLowerCase().includes(q))
    .slice(0, 12);
}
