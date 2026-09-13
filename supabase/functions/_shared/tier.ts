// Shared subscription-tier resolution for edge functions.
// Order of precedence: admin bypass > active Pro trial > Stripe subscription.

export type Tier = "free" | "plus" | "pro";

const PRICE_TO_TIER: Record<string, "plus" | "pro"> = {
  "price_1TPM56PJefLcxc6CzfD5CUaS": "plus",
  "price_1TFyVKPJefLcxc6Cn1iwdSTk": "pro",
  "price_1TPM5RPJefLcxc6Cap03GhJm": "pro",
  "price_1TPQ1oPJefLcxc6CTI4Hf42E": "pro",
};
const PRODUCT_TO_TIER: Record<string, "plus" | "pro"> = {
  "prod_UO8LzRA6kfvdwm": "plus",
  "prod_UEROAe01UbaEpK": "pro",
};

const RANK = { free: 0, plus: 1, pro: 2 } as const;

/** Resolve the effective tier for a user (trial counts as Pro). */
export async function resolveTier(
  supabaseAdmin: any,
  userId: string,
  email: string | null,
): Promise<Tier> {
  let tier: Tier = "free";

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
            const t = PRICE_TO_TIER[priceId] ?? PRODUCT_TO_TIER[productId] ?? "pro";
            if (RANK[t] > RANK[tier]) tier = t;
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
