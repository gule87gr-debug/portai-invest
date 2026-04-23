import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Map of Stripe price IDs to subscription tiers
const PRICE_TO_TIER: Record<string, "plus" | "pro"> = {
  // Plus
  "price_1TPM56PJefLcxc6CzfD5CUaS": "plus",
  // Pro (legacy USD + previous EUR + current EUR price)
  "price_1TFyVKPJefLcxc6Cn1iwdSTk": "pro",
  "price_1TPM5RPJefLcxc6Cap03GhJm": "pro",
  "price_1TPQ1oPJefLcxc6CTI4Hf42E": "pro",
};

const PRODUCT_TO_TIER: Record<string, "plus" | "pro"> = {
  "prod_UO8LzRA6kfvdwm": "plus",
  "prod_UEROAe01UbaEpK": "pro",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user?.email) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }
    const user = userData.user;

    // Admin override: grant permanent Pro access
    const ADMIN_EMAILS = ["gule.87.gr@gmail.com"];
    if (ADMIN_EMAILS.includes(user.email.toLowerCase())) {
      return new Response(JSON.stringify({
        subscribed: true,
        tier: "pro",
        subscription_end: null,
        cancel_at_period_end: false,
        subscription_id: "admin_override",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });

    if (customers.data.length === 0) {
      return new Response(JSON.stringify({ subscribed: false, tier: "free" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    // Include trialing/past_due so we surface accurate status in the UI
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "all",
      limit: 10,
    });
    const liveStatuses = new Set(["active", "trialing", "past_due"]);
    const liveSubs = subscriptions.data.filter((s) => liveStatuses.has(s.status));

    const hasActiveSub = liveSubs.length > 0;
    let tier: "free" | "plus" | "pro" = "free";
    let subscriptionEnd: string | null = null;
    let cancelAtPeriodEnd = false;
    let subscriptionId: string | null = null;
    let subscriptionStatus: string | null = null;

    if (hasActiveSub) {
      // Pick the highest tier among active subscriptions (pro > plus)
      const rank = { free: 0, plus: 1, pro: 2 } as const;
      let best = liveSubs[0];
      let bestTier: "free" | "plus" | "pro" = "free";
      for (const sub of liveSubs) {
        const item = sub.items.data[0];
        const priceId = item?.price?.id ?? "";
        const productId = typeof item?.price?.product === "string" ? item.price.product : "";
        const t = PRICE_TO_TIER[priceId] ?? PRODUCT_TO_TIER[productId] ?? "pro";
        if (rank[t] >= rank[bestTier]) {
          bestTier = t;
          best = sub;
        }
      }
      tier = bestTier;
      try {
        const endVal = best.current_period_end;
        if (typeof endVal === 'number') {
          subscriptionEnd = new Date(endVal * 1000).toISOString();
        } else if (typeof endVal === 'string') {
          subscriptionEnd = new Date(endVal).toISOString();
        }
      } catch {
        subscriptionEnd = null;
      }
      cancelAtPeriodEnd = best.cancel_at_period_end;
      subscriptionId = best.id;
      subscriptionStatus = best.status;
    } else {
      // Fall back to most recent canceled/incomplete sub for status info
      const fallback = subscriptions.data[0];
      if (fallback) subscriptionStatus = fallback.status;
    }

    // Detect a scheduled plan change (e.g. downgrade to Plus at period end)
    let scheduledTier: "free" | "plus" | "pro" | null = null;
    let scheduledStart: string | null = null;
    if (subscriptionId) {
      try {
        const schedules = await stripe.subscriptionSchedules.list({ customer: customerId, limit: 5 });
        for (const sch of schedules.data) {
          if (sch.subscription !== subscriptionId) continue;
          if (sch.status !== "active" && sch.status !== "not_started") continue;
          // Find the next phase that starts in the future
          const nowSec = Math.floor(Date.now() / 1000);
          const futurePhase = sch.phases.find((p) => typeof p.start_date === "number" && p.start_date > nowSec);
          if (!futurePhase) continue;
          const priceId = (futurePhase.items?.[0] as any)?.price as string | undefined;
          if (!priceId) continue;
          scheduledTier = PRICE_TO_TIER[priceId] ?? null;
          scheduledStart = new Date(futurePhase.start_date * 1000).toISOString();
          break;
        }
      } catch (e) {
        console.error("Failed to load subscription schedules:", (e as Error).message);
      }
    }

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      tier,
      subscription_end: subscriptionEnd,
      cancel_at_period_end: cancelAtPeriodEnd,
      subscription_id: subscriptionId,
      subscription_status: subscriptionStatus,
      scheduled_tier: scheduledTier,
      scheduled_start: scheduledStart,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("check-subscription error:", error.message);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
