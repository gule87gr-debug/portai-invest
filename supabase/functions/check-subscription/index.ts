import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { isAdminEmail, logAdminBypass } from "../_shared/admin-bypass.ts";

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

    // Debug mode is REQUESTED via ?debug=1 query param or x-debug: 1 header,
    // but only ENABLED for authorized callers (admin email or matching x-debug-secret header).
    // This prevents accidental disclosure of internal schedule/phase data in production.
    const url = new URL(req.url);
    const debugRequested =
      url.searchParams.get("debug") === "1" ||
      req.headers.get("x-debug") === "1";

    // Optional shared-secret header bypass — set DEBUG_SECRET in edge function secrets to enable.
    const debugSecret = Deno.env.get("DEBUG_SECRET");
    const providedDebugSecret = req.headers.get("x-debug-secret");
    const hasValidDebugSecret =
      debugRequested &&
      !!debugSecret &&
      !!providedDebugSecret &&
      providedDebugSecret === debugSecret;

    // Unauthenticated / stale-token callers get a benign "free" response (status 200)
    // so the client doesn't throw FunctionsHttpError during auth-lock races.
    const unauthenticated = () =>
      new Response(
        JSON.stringify({ subscribed: false, tier: "free" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return unauthenticated();

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user?.email) return unauthenticated();
    const user = userData.user;

    // Admin bypass: looked up via DB so it's configurable in the admin panel.
    const isAdminCaller = await isAdminEmail(supabaseClient, user.email);

    const debugMode = debugRequested && (isAdminCaller || hasValidDebugSecret);
    if (debugRequested && !debugMode) {
      console.warn(
        `[check-subscription] Debug payload requested by non-privileged caller (${user.email}) — suppressed.`
      );
    }

    if (isAdminCaller) {
      await logAdminBypass(supabaseClient, user.email, "check-subscription", user.id);
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

      // The user now has a paid subscription. End any active free trial immediately
      // and mark the trial as used so it cannot be re-taken later.
      try {
        const { data: trialRow } = await supabaseClient
          .from("user_settings")
          .select("pro_trial_active, trial_used")
          .eq("user_id", user.id)
          .maybeSingle();
        if (trialRow && (trialRow.pro_trial_active || !trialRow.trial_used)) {
          await supabaseClient
            .from("user_settings")
            .update({ pro_trial_active: false, trial_used: true })
            .eq("user_id", user.id);
          await supabaseClient.from("trial_audit_log").insert({
            user_id: user.id,
            user_email: user.email ?? "",
            action: "ended_for_paid_subscription",
          });
        }
      } catch (e) {
        console.warn("[check-subscription] failed to end trial after paid sub:", (e as Error).message);
      }
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

    // Debug trace (only populated when debugMode === true).
    // Reason codes:
    //  Schedule-level skips: not_attached, schedule_status, released, completed, canceled, last_phase_ended
    //  Phase-level skips:    no_start_date, in_past, current_phase, end_in_past, no_known_price, no_tier_change
    //  Phase accepted:       candidate
    type DebugPhase = {
      start_date: string | null;
      end_date: string | null;
      tier: string | null;
      price_id: string | null;
      decision: string;
    };
    type DebugSchedule = {
      schedule_id: string;
      status: string;
      subscription: string | null;
      attached_to_current: boolean;
      released_at: string | null;
      completed_at: string | null;
      canceled_at: string | null;
      current_phase_start: string | null;
      decision: string; // "considered" | "skipped:<reason>"
      phases: DebugPhase[];
    };
    const debugSchedules: DebugSchedule[] = [];

    if (subscriptionId) {
      try {
        const schedules = await stripe.subscriptionSchedules.list({ customer: customerId, limit: 20 });
        const nowSec = Math.floor(Date.now() / 1000);
        const toIso = (s: number | null | undefined) =>
          typeof s === "number" && s > 0 ? new Date(s * 1000).toISOString() : null;

        // Only schedules in these states can still produce upcoming changes.
        // Explicitly exclude: "completed", "canceled", "released" (and any unknown future state).
        const PENDING_SCHEDULE_STATUSES = new Set(["active", "not_started"]);

        type Candidate = { startSec: number; tier: "free" | "plus" | "pro"; scheduleId: string };
        const candidates: Candidate[] = [];

        for (const sch of schedules.data) {
          const releasedAt = (sch as any).released_at as number | null | undefined;
          const completedAt = (sch as any).completed_at as number | null | undefined;
          const canceledAt = (sch as any).canceled_at as number | null | undefined;
          const currentPhaseStart = typeof (sch as any).current_phase?.start_date === "number"
            ? (sch as any).current_phase.start_date as number
            : null;

          const dbgSchedule: DebugSchedule = {
            schedule_id: sch.id,
            status: sch.status,
            subscription: typeof sch.subscription === "string" ? sch.subscription : null,
            attached_to_current: sch.subscription === subscriptionId,
            released_at: toIso(releasedAt),
            completed_at: toIso(completedAt),
            canceled_at: toIso(canceledAt),
            current_phase_start: toIso(currentPhaseStart),
            decision: "considered",
            phases: [],
          };

          // Schedule-level filters with debug reason capture
          let scheduleSkip: string | null = null;
          if (sch.subscription !== subscriptionId) scheduleSkip = "not_attached";
          else if (!PENDING_SCHEDULE_STATUSES.has(sch.status)) scheduleSkip = `schedule_status:${sch.status}`;
          else if (typeof releasedAt === "number" && releasedAt > 0) scheduleSkip = "released";
          else if (typeof completedAt === "number" && completedAt > 0) scheduleSkip = "completed";
          else if (typeof canceledAt === "number" && canceledAt > 0) scheduleSkip = "canceled";

          const phases = sch.phases ?? [];
          if (!scheduleSkip) {
            const lastPhase = phases[phases.length - 1];
            const lastEnd = typeof lastPhase?.end_date === "number" ? lastPhase.end_date : null;
            if (lastEnd !== null && lastEnd <= nowSec) scheduleSkip = "last_phase_ended";
          }

          if (scheduleSkip) {
            dbgSchedule.decision = `skipped:${scheduleSkip}`;
            if (debugMode) debugSchedules.push(dbgSchedule);
            continue;
          }

          // Track previous candidate-eligible tier within this schedule for distinct transitions.
          let prevTierForThisSchedule: "free" | "plus" | "pro" = tier;

          for (const phase of phases) {
            const startSec = typeof phase.start_date === "number" ? phase.start_date : null;
            const endSec = typeof phase.end_date === "number" ? phase.end_date : null;

            // Resolve phase tier + first known priceId for debug visibility
            let phaseTier: "free" | "plus" | "pro" | null = null;
            let firstKnownPriceId: string | null = null;
            for (const item of phase.items ?? []) {
              const priceRef = (item as any).price;
              const priceId = typeof priceRef === "string" ? priceRef : (priceRef?.id ?? "");
              if (!priceId) continue;
              const t = PRICE_TO_TIER[priceId];
              if (t) { phaseTier = t; firstKnownPriceId = priceId; break; }
            }

            const dbgPhase: DebugPhase = {
              start_date: toIso(startSec),
              end_date: toIso(endSec),
              tier: phaseTier,
              price_id: firstKnownPriceId,
              decision: "candidate",
            };

            let phaseSkip: string | null = null;
            if (startSec === null) phaseSkip = "no_start_date";
            else if (startSec <= nowSec) phaseSkip = "in_past";
            else if (currentPhaseStart !== null && startSec === currentPhaseStart) phaseSkip = "current_phase";
            else if (endSec !== null && endSec <= nowSec) phaseSkip = "end_in_past";
            else if (!phaseTier) phaseSkip = "no_known_price";
            else if (phaseTier === prevTierForThisSchedule) phaseSkip = "no_tier_change";

            if (phaseSkip) {
              dbgPhase.decision = `skipped:${phaseSkip}`;
              dbgSchedule.phases.push(dbgPhase);
              continue;
            }

            // Accepted candidate
            candidates.push({ startSec: startSec!, tier: phaseTier!, scheduleId: sch.id });
            prevTierForThisSchedule = phaseTier!;
            dbgSchedule.phases.push(dbgPhase);
          }

          if (debugMode) debugSchedules.push(dbgSchedule);
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
        if (debugMode) {
          debugSchedules.push({
            schedule_id: "(error)",
            status: "error",
            subscription: null,
            attached_to_current: false,
            released_at: null,
            completed_at: null,
            canceled_at: null,
            current_phase_start: null,
            decision: `error:${(e as Error).message}`,
            phases: [],
          });
        }
      }
    }

    const responseBody: Record<string, unknown> = {
      subscribed: hasActiveSub,
      tier,
      subscription_end: subscriptionEnd,
      cancel_at_period_end: cancelAtPeriodEnd,
      subscription_id: subscriptionId,
      subscription_status: subscriptionStatus,
      scheduled_tier: scheduledTier,
      scheduled_start: scheduledStart,
      scheduled_changes_count: scheduledChangesCount,
    };

    if (debugMode) {
      responseBody.debug = {
        now: new Date().toISOString(),
        current_tier: tier,
        subscription_id: subscriptionId,
        schedules_examined: debugSchedules.length,
        schedules: debugSchedules,
        legend: {
          schedule_skips: ["not_attached", "schedule_status:<state>", "released", "completed", "canceled", "last_phase_ended"],
          phase_skips: ["no_start_date", "in_past", "current_phase", "end_in_past", "no_known_price", "no_tier_change"],
        },
      };
    }

    return new Response(JSON.stringify(responseBody), {
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
