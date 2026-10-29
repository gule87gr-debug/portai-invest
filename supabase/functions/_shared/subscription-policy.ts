export type Tier = "free" | "pro";
export type BillingInterval = "month" | "year";
export const PRO_PRICES = { month: "price_1UThunPJefLcxc6CcXNc6Dfp", year: "price_1UThv9PJefLcxc6CZU9sVd1Y" } as const;
export const PRO_AMOUNTS = { month: 999, year: 8900 } as const;
export const PRICE_TO_TIER: Record<string, "pro"> = {
  [PRO_PRICES.month]: "pro", [PRO_PRICES.year]: "pro",
  "price_1TPQ1oPJefLcxc6CTI4Hf42E": "pro",
  "price_1TPM56PJefLcxc6CzfD5CUaS": "pro",
  "price_1TFyVKPJefLcxc6Cn1iwdSTk": "pro",
  "price_1TPM5RPJefLcxc6Cap03GhJm": "pro",
};
export const PRODUCT_TO_TIER: Record<string, "pro"> = { prod_UEROAe01UbaEpK: "pro", prod_UO8LzRA6kfvdwm: "pro" };
export const FREE_LIMITS = { article_analysis: 3, message: 10, image_analysis: 3 } as const;
export const PRO_FAIR_USE = { message: 300, deep_dive: 30, article_analysis: 100 } as const;
export function dailyRequirements(tier: Tier, admin: boolean, action: "chat" | "analysis" | "deep_dive", images = false) {
  if (admin) return [];
  if (action === "chat") return [{ type: "message", limit: tier === "pro" ? PRO_FAIR_USE.message : FREE_LIMITS.message }, ...(images && tier === "free" ? [{ type: "image_analysis", limit: FREE_LIMITS.image_analysis }] : [])];
  if (action === "deep_dive") return tier === "pro" ? [{ type: "deep_dive", limit: PRO_FAIR_USE.deep_dive }] : [];
  return [{ type: "article_analysis", limit: tier === "pro" ? PRO_FAIR_USE.article_analysis : FREE_LIMITS.article_analysis }, ...(tier === "pro" ? [{ type: "deep_dive", limit: PRO_FAIR_USE.deep_dive }] : [])];
}