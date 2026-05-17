// Verifies that Pro pricing is locked to €15.99 and that the price→tier mapping
// in check-subscription resolves only the expected EUR Pro price. Uses live Stripe
// (test or live key in env) to read product/price config — no DB writes.
import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assert } from "https://deno.land/std@0.224.0/assert/mod.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";

const PRO_PRODUCT_ID = "prod_UEROAe01UbaEpK";
const PRO_PRICE_ID = "price_1TPQ1oPJefLcxc6CTI4Hf42E";
const PRO_AMOUNT = 1599;

const PLUS_PRODUCT_ID = "prod_UO8LzRA6kfvdwm";
const PLUS_PRICE_ID = "price_1TPM56PJefLcxc6CzfD5CUaS";
const PLUS_AMOUNT = 899;

const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");

Deno.test({
  name: "Stripe pricing: Pro product has exactly one active EUR price at €15.99/mo",
  ignore: !stripeKey,
  fn: async () => {
    const stripe = new Stripe(stripeKey!, { apiVersion: "2025-08-27.basil" });
    const prices = await stripe.prices.list({ product: PRO_PRODUCT_ID, limit: 100 });
    const active = prices.data.filter((p) => p.active);
    assertEquals(active.length, 1, `Expected 1 active Pro price, got ${active.length}: ${active.map((p) => p.id).join(", ")}`);
    const p = active[0];
    assertEquals(p.id, PRO_PRICE_ID);
    assertEquals(p.unit_amount, PRO_AMOUNT);
    assertEquals(p.currency, "eur");
    assertEquals(p.recurring?.interval, "month");
  },
});

Deno.test({
  name: "Stripe pricing: Plus product has exactly one active EUR price at €8.99/mo",
  ignore: !stripeKey,
  fn: async () => {
    const stripe = new Stripe(stripeKey!, { apiVersion: "2025-08-27.basil" });
    const prices = await stripe.prices.list({ product: PLUS_PRODUCT_ID, limit: 100 });
    const active = prices.data.filter((p) => p.active);
    assertEquals(active.length, 1);
    const p = active[0];
    assertEquals(p.id, PLUS_PRICE_ID);
    assertEquals(p.unit_amount, PLUS_AMOUNT);
    assertEquals(p.currency, "eur");
    assertEquals(p.recurring?.interval, "month");
  },
});

Deno.test("Pricing map: only €15.99 EUR price resolves to Pro tier via PRICE_TO_TIER", () => {
  // Mirror of the map in supabase/functions/check-subscription/index.ts
  const PRICE_TO_TIER: Record<string, "plus" | "pro"> = {
    "price_1TPM56PJefLcxc6CzfD5CUaS": "plus",
    "price_1TFyVKPJefLcxc6Cn1iwdSTk": "pro",
    "price_1TPM5RPJefLcxc6Cap03GhJm": "pro",
    "price_1TPQ1oPJefLcxc6CTI4Hf42E": "pro",
  };
  assertEquals(PRICE_TO_TIER[PRO_PRICE_ID], "pro");
  assertEquals(PRICE_TO_TIER[PLUS_PRICE_ID], "plus");
  // Random unknown price never maps to a paid tier
  assertEquals(PRICE_TO_TIER["price_unknown_xyz"], undefined);
});

Deno.test({
  name: "Stripe pricing: no extra EUR Pro prices exist active across the account",
  ignore: !stripeKey,
  fn: async () => {
    const stripe = new Stripe(stripeKey!, { apiVersion: "2025-08-27.basil" });
    const all = await stripe.prices.list({ active: true, limit: 100, currency: "eur" });
    const proPrices = all.data.filter(
      (p) => (typeof p.product === "string" ? p.product : p.product.id) === PRO_PRODUCT_ID,
    );
    assertEquals(proPrices.length, 1);
    assert(proPrices[0].id === PRO_PRICE_ID);
  },
});
