import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PRICE_BY_TIER: Record<"plus" | "pro", string> = {
  plus: "price_1TPM56PJefLcxc6CzfD5CUaS", // €8.99/mo
  pro: "price_1TPM5RPJefLcxc6Cap03GhJm",  // €18.99/mo
};

const PRICE_TO_TIER: Record<string, "plus" | "pro"> = {
  "price_1TPM56PJefLcxc6CzfD5CUaS": "plus",
  "price_1TFyVKPJefLcxc6Cn1iwdSTk": "pro",
  "price_1TPM5RPJefLcxc6Cap03GhJm": "pro",
};

const TIER_RANK = { plus: 1, pro: 2 } as const;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    let tier: "plus" | "pro" = "pro";
    try {
      const body = await req.json();
      if (body?.tier === "plus" || body?.tier === "pro") tier = body.tier;
    } catch {
      // No body — keep default
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    const customerId = customers.data[0]?.id;

    const origin = req.headers.get("origin") || "http://localhost:3000";
    const targetPriceId = PRICE_BY_TIER[tier];

    // Check for an existing active subscription — if found, modify it instead of new checkout
    if (customerId) {
      const subs = await stripe.subscriptions.list({
        customer: customerId,
        status: "active",
        limit: 5,
      });

      if (subs.data.length > 0) {
        // Pick the highest-tier active subscription as the current one
        let current = subs.data[0];
        let currentTier: "plus" | "pro" = PRICE_TO_TIER[current.items.data[0]?.price?.id ?? ""] ?? "pro";
        for (const s of subs.data) {
          const t = PRICE_TO_TIER[s.items.data[0]?.price?.id ?? ""] ?? "pro";
          if (TIER_RANK[t] >= TIER_RANK[currentTier]) {
            current = s;
            currentTier = t;
          }
        }

        const currentItem = current.items.data[0];
        const currentPriceId = currentItem?.price?.id ?? "";

        // Same tier already — send to billing portal
        if (currentPriceId === targetPriceId) {
          const portal = await stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: `${origin}/settings`,
          });
          return new Response(JSON.stringify({ url: portal.url, action: "manage" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        }

        const isUpgrade = TIER_RANK[tier] > TIER_RANK[currentTier];

        if (isUpgrade) {
          // Upgrade: charge prorated difference immediately
          await stripe.subscriptions.update(current.id, {
            items: [{ id: currentItem.id, price: targetPriceId }],
            proration_behavior: "always_invoice",
            cancel_at_period_end: false,
          });
          return new Response(JSON.stringify({
            url: `${origin}/upgrade-success`,
            action: "upgraded",
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        } else {
          // Downgrade: schedule the change for end of current period (no immediate charge)
          // Cancel the current subscription at period end, then create a schedule
          // that switches to the new price when the current period ends.
          const schedule = await stripe.subscriptionSchedules.create({
            from_subscription: current.id,
          });

          // Find the current phase and append a new phase at period end
          const currentPhase = schedule.phases[0];
          await stripe.subscriptionSchedules.update(schedule.id, {
            end_behavior: "release",
            phases: [
              {
                items: [{ price: currentPriceId, quantity: 1 }],
                start_date: currentPhase.start_date,
                end_date: currentPhase.end_date,
                proration_behavior: "none",
              },
              {
                items: [{ price: targetPriceId, quantity: 1 }],
                proration_behavior: "none",
              },
            ],
          });

          return new Response(JSON.stringify({
            url: `${origin}/settings?downgrade=scheduled`,
            action: "downgrade_scheduled",
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        }
      }
    }

    // No active subscription — normal checkout
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [{ price: targetPriceId, quantity: 1 }],
      mode: "subscription",
      success_url: `${origin}/upgrade-success`,
      cancel_url: `${origin}/pricing`,
    });

    return new Response(JSON.stringify({ url: session.url, action: "checkout" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("create-checkout error:", error.message);
    return new Response(JSON.stringify({ error: error.message || "Internal server error" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
