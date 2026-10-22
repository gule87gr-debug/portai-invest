import { describe, expect, it } from "vitest";
import { ACTIVE_ALERT_LIMITS, canCreatePriceAlert } from "./priceAlertLimits";

describe("active price alert allowances", () => {
  it("Free has zero alerts", () => {
    expect(ACTIVE_ALERT_LIMITS.free).toBe(0);
    expect(canCreatePriceAlert("free", [])).toBe(false);
  });
  it("Plus allows five active alerts, but not a sixth", () => {
    expect(ACTIVE_ALERT_LIMITS.plus).toBe(5);
    expect(canCreatePriceAlert("plus", Array.from({ length: 4 }, () => ({ triggered: false })))).toBe(true);
    expect(canCreatePriceAlert("plus", Array.from({ length: 5 }, () => ({ triggered: false })))).toBe(false);
  });
  it("triggered alerts never consume the Plus allowance", () => {
    expect(canCreatePriceAlert("plus", [...Array.from({ length: 4 }, () => ({ triggered: false })), ...Array.from({ length: 100 }, () => ({ triggered: true }))])).toBe(true);
  });
  it("Pro has unlimited active alerts", () => {
    expect(ACTIVE_ALERT_LIMITS.pro).toBe(null);
    expect(canCreatePriceAlert("pro", Array.from({ length: 1000 }, () => ({ triggered: false })))).toBe(true);
  });
});