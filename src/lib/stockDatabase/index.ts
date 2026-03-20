export type { AssetEntry } from "./types";
import { stocks } from "./stocks";
import { etfs } from "./etfs";
import { crypto } from "./crypto";

export const assetDatabase = [...stocks, ...etfs, ...crypto];

export function searchAssets(query: string) {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  return assetDatabase
    .filter((a) => a.ticker.toLowerCase().includes(q) || a.name.toLowerCase().includes(q) || a.sector.toLowerCase().includes(q))
    .slice(0, 12);
}
