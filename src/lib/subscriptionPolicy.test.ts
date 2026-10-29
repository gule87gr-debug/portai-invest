import { describe, expect, it } from "vitest";
import { dailyRequirements, FREE_LIMITS, PRO_FAIR_USE, PRO_AMOUNTS, PRO_PRICES, PRICE_TO_TIER } from "../../supabase/functions/_shared/subscription-policy";
describe("requested subscription rules", () => {
  it("Free permits three analyses per UTC day", () => { expect(FREE_LIMITS.article_analysis).toBe(3); });
  it("Free permits ten chat messages per UTC day", () => { expect(FREE_LIMITS.message).toBe(10); });
  it("Free permits three images per UTC day", () => { expect(FREE_LIMITS.image_analysis).toBe(3); });
  it("Pro limits daily messages to 300", () => { expect(dailyRequirements("pro", false, "chat")).toEqual([{ type: "message", limit: 300 }]); });
  it("Pro limits deep dives to 30", () => { expect(PRO_FAIR_USE.deep_dive).toBe(30); });
  it("Pro limits article analyses to 100", () => { expect(PRO_FAIR_USE.article_analysis).toBe(100); });
  it("admins are exempt from all daily caps", () => { for (const action of ["chat", "analysis", "deep_dive"] as const) expect(dailyRequirements("pro", true, action, true)).toEqual([]); });
  it("Pro monthly costs 999 euro cents", () => { expect(PRO_AMOUNTS.month).toBe(999); expect(PRO_PRICES.month).toBe("price_1UThunPJefLcxc6CcXNc6Dfp"); });
  it("Pro yearly costs 8900 euro cents", () => { expect(PRO_AMOUNTS.year).toBe(8900); expect(PRO_PRICES.year).toBe("price_1UThv9PJefLcxc6CZU9sVd1Y"); });
  it("all four existing paid prices grant Pro", () => { for (const id of ["price_1TPQ1oPJefLcxc6CTI4Hf42E", "price_1TPM56PJefLcxc6CzfD5CUaS", "price_1TFyVKPJefLcxc6Cn1iwdSTk", "price_1TPM5RPJefLcxc6Cap03GhJm"]) expect(PRICE_TO_TIER[id]).toBe("pro"); });
});