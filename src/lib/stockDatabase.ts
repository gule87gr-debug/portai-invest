// Re-export from refactored module
export type { AssetEntry } from "./stockDatabase/types";
export { assetDatabase, searchAssets, getAssetRegion, REGION_LABELS } from "./stockDatabase/index";
export type { AssetRegion } from "./stockDatabase/index";
