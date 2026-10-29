import { describe, expect, it } from "vitest";
import { ACTIVE_ALERT_LIMITS, canCreatePriceAlert } from "./priceAlertLimits";

describe("active price alert allowances", () => {
  it("Free has zero alerts", () => {
    expect(ACTIVE_ALERT_LIMITS.free).toBe(0);
    expect(canCreatePriceAlert("free", [])).toBe(false);
  });
  it("Pro has unlimited active alerts", () => {
    expect(ACTIVE_ALERT_LIMITS.pro).toBe(null);
    expect(canCreatePriceAlert("pro", Array.from({ length: 1000 }, () => ({ triggered: false })))).toBe(true);
  });
});