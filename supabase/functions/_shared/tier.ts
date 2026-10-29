// Shared subscription-tier resolution for edge functions.
// Order of precedence: admin bypass > active Pro trial > Stripe subscription.

import { isAdminUser } from "./admin-bypass.ts";
import { PRICE_TO_TIER, PRODUCT_TO_TIER, type Tier } from "./subscription-policy.ts";
export type { Tier } from "./subscription-policy.ts";

/** Resolve the effective tier for a user (trial counts as Pro). */
export async function resolveTier(
  supabaseAdmin: any,
  userId: string,
  email: string | null,
): Promise<Tier> {
  let tier: Tier = "free";
  if (await isAdminUser(supabaseAdmin, userId)) return "pro";

  try {
    const { data: settings } = await supabaseAdmin
      .from("user_settings")
      .select("pro_trial_active, trial_end_date")
      .eq("user_id", userId)
      .maybeSingle();
    if (
      settings?.pro_trial_active &&
      settings?.trial_end_date &&
      new Date(settings.trial_end_date).getTime() > Date.now()
    ) {
      return "pro";
    }
  } catch { /* ignore */ }

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  if (stripeKey && email) {
    try {
      const Stripe = (await import("https://esm.sh/stripe@18.5.0")).default;
      const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
      const customers = await stripe.customers.list({ email, limit: 1 });
      if (customers.data.length > 0) {
        const subs = await stripe.subscriptions.list({
          customer: customers.data[0].id,
          status: "active",
          limit: 5,
        });
        for (const sub of subs.data) {
          for (const item of sub.items.data) {
            const priceId = item.price?.id ?? "";
            const productId = typeof item.price?.product === "string" ? item.price.product : "";
             const t = PRICE_TO_TIER[priceId] ?? PRODUCT_TO_TIER[productId];
             if (t) tier = t;
          }
        }
      }
    } catch { /* default to free */ }
  }

  return tier;
}

/** Start of the current UTC day, as an ISO timestamp. */
export function startOfUtcDay(): string {
  return new Date(new Date().toISOString().split("T")[0] + "T00:00:00.000Z").toISOString();
}
