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

    // Opt-in debug mode: include detailed schedule/phase decision trace.
    // Enabled via ?debug=1 query param OR x-debug: 1 header.
    const url = new URL(req.url);
    const debugMode =
      url.searchParams.get("debug") === "1" ||
      req.headers.get("x-debug") === "1";

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

    // Detect the next scheduled plan change across all schedules.
    // A customer may have multiple subscription schedules and each may have multiple
    // future phases (e.g. upgrade now + downgrade later). We pick the soonest future
    // phase whose price maps to a known tier AND differs from the current tier.
    let scheduledTier: "free" | "plus" | "pro" | null = null;
    let scheduledStart: string | null = null;
    let scheduledChangesCount = 0;
    if (subscriptionId) {
      try {
        const schedules = await stripe.subscriptionSchedules.list({ customer: customerId, limit: 20 });
        const nowSec = Math.floor(Date.now() / 1000);

        // Only schedules in these states can still produce upcoming changes.
        // Explicitly exclude: "completed", "canceled", "released" (and any unknown future state).
        const PENDING_SCHEDULE_STATUSES = new Set(["active", "not_started"]);

        type Candidate = { startSec: number; tier: "free" | "plus" | "pro"; scheduleId: string };
        const candidates: Candidate[] = [];

        for (const sch of schedules.data) {
          // Must be attached to the current subscription
          if (sch.subscription !== subscriptionId) continue;

          // Skip schedules that are not in a pending state (canceled / completed / released / unknown)
          if (!PENDING_SCHEDULE_STATUSES.has(sch.status)) continue;

          // If the schedule has already been released or fully completed it will have a
          // released_at / completed_at timestamp. Belt-and-braces guard in case status lags.
          const releasedAt = (sch as any).released_at as number | null | undefined;
          const completedAt = (sch as any).completed_at as number | null | undefined;
          const canceledAt = (sch as any).canceled_at as number | null | undefined;
          if (typeof releasedAt === "number" && releasedAt > 0) continue;
          if (typeof completedAt === "number" && completedAt > 0) continue;
          if (typeof canceledAt === "number" && canceledAt > 0) continue;

          // If end_behavior is "release" and the schedule's last phase already ended, skip it
          const phases = sch.phases ?? [];
          const lastPhase = phases[phases.length - 1];
          const lastEnd = typeof lastPhase?.end_date === "number" ? lastPhase.end_date : null;
          if (lastEnd !== null && lastEnd <= nowSec) continue;

          // The phase Stripe currently considers active on this schedule (if any).
          const currentPhaseStart = typeof (sch as any).current_phase?.start_date === "number"
            ? (sch as any).current_phase.start_date as number
            : null;

          // Track the previous candidate-eligible tier within this schedule so we can detect
          // distinct transitions even when intermediate phases happen between now and a future
          // phase (e.g. pro -> plus -> free counts as 2 changes).
          let prevTierForThisSchedule: "free" | "plus" | "pro" = tier;

          for (const phase of phases) {
            const startSec = typeof phase.start_date === "number" ? phase.start_date : null;
            if (startSec === null) continue;

            // Strictly future phases only
            if (startSec <= nowSec) continue;

            // Skip the phase that's already in progress according to Stripe
            if (currentPhaseStart !== null && startSec === currentPhaseStart) continue;

            // Skip phases whose own end_date has already passed (defensive)
            const endSec = typeof phase.end_date === "number" ? phase.end_date : null;
            if (endSec !== null && endSec <= nowSec) continue;

            // Resolve the phase tier from its first item with a known mapping
            let phaseTier: "free" | "plus" | "pro" | null = null;
            for (const item of phase.items ?? []) {
              const priceRef = (item as any).price;
              const priceId = typeof priceRef === "string" ? priceRef : (priceRef?.id ?? "");
              if (!priceId) continue;
              const t = PRICE_TO_TIER[priceId];
              if (t) { phaseTier = t; break; }
            }
            if (!phaseTier) continue;

            // Skip no-op continuation phases (same tier as the previous phase / current tier)
            if (phaseTier === prevTierForThisSchedule) continue;

            candidates.push({ startSec, tier: phaseTier, scheduleId: sch.id });
            prevTierForThisSchedule = phaseTier;
          }
        }

        // Sort chronologically and surface the soonest as the "next" change,
        // while reporting the total number of distinct queued changes.
        candidates.sort((a, b) => a.startSec - b.startSec);
        scheduledChangesCount = candidates.length;
        const next = candidates[0];
        if (next) {
          scheduledTier = next.tier;
          scheduledStart = new Date(next.startSec * 1000).toISOString();
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
      scheduled_changes_count: scheduledChangesCount,
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
