import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PRICE_BY_TIER: Record<"plus" | "pro", string> = {
  plus: "price_1TPM56PJefLcxc6CzfD5CUaS", // €8.99/mo
  pro: "price_1TPQ1oPJefLcxc6CTI4Hf42E",  // €15.99/mo
};

const PRICE_TO_TIER: Record<string, "plus" | "pro"> = {
  "price_1TPM56PJefLcxc6CzfD5CUaS": "plus",
  "price_1TFyVKPJefLcxc6Cn1iwdSTk": "pro",
  "price_1TPM5RPJefLcxc6Cap03GhJm": "pro",
  "price_1TPQ1oPJefLcxc6CTI4Hf42E": "pro",
};

const TIER_RANK = { plus: 1, pro: 2 } as const;

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  });

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );
  // Service-role client for writing immutable consent records (RLS forbids client INSERTs).
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json(401, { error: "Authentication required" });

    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) return json(401, { error: "Authentication required" });

    // STRICT input validation: tier must be explicitly provided.
    // We do NOT default to "pro" because that could charge a user €15.99 for a malformed request.
    let body: { tier?: unknown; accepted_terms?: unknown; eu_withdrawal_waiver?: unknown; consent_text?: unknown } = {};
    try {
      body = await req.json();
    } catch {
      return json(400, {
        error: "Missing request body. Specify `tier`: 'plus' or 'pro'.",
        code: "missing_body",
      });
    }
    if (body?.tier !== "plus" && body?.tier !== "pro") {
      return json(400, {
        error: "Invalid `tier`. Must be 'plus' or 'pro'.",
        code: "invalid_tier",
      });
    }
    const tier = body.tier as "plus" | "pro";

    // LEGAL: Terms acceptance is mandatory for any paid action (Directive 2011/83/EU Art. 6).
    // We refuse the request rather than silently proceeding without consent.
    const acceptedTerms = body?.accepted_terms === true;
    if (!acceptedTerms) {
      return json(400, {
        error: "You must accept the Terms of Service and Privacy Policy to subscribe.",
        code: "terms_not_accepted",
      });
    }

    // EU Art. 16(m): the 14-day right of withdrawal for digital services is lost ONLY IF the
    // consumer (a) expressly consented to immediate performance and (b) acknowledged losing
    // the right. We treat this as opt-in: if the user did NOT tick the waiver box, they keep
    // their full statutory refund right and we record that explicitly.
    const euWaiver = body?.eu_withdrawal_waiver === true;
    const consentText = typeof body?.consent_text === "string" ? body.consent_text.slice(0, 5000) : "";
    const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
    const userAgent = req.headers.get("user-agent") ?? null;

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    const customerId = customers.data[0]?.id;

    const origin = req.headers.get("origin") || "http://localhost:3000";
    const targetPriceId = PRICE_BY_TIER[tier];

    // Idempotency key — Stripe will dedupe identical write attempts within 24h.
    // Using user id + target tier + the day yields per-day-per-intent dedup,
    // which protects against double-clicks and accidental retries.
    const idempotencyDay = new Date().toISOString().split("T")[0];
    const baseIdemKey = `chk_${user.id}_${tier}_${idempotencyDay}`;

    // Helper: record consent BEFORE any Stripe write. If recording fails, we still proceed
    // (a logging failure must not block the user from being charged for a service they want),
    // but we log loudly so legal/support can investigate.
    const recordConsent = async (consent_type: string, extra?: Record<string, unknown>) => {
      try {
        await supabaseAdmin.from("payment_consents").insert({
          user_id: user.id,
          user_email: user.email!,
          consent_type,
          tier,
          price_id: targetPriceId,
          consent_text: consentText,
          ip_address: ipAddress,
          user_agent: userAgent,
          metadata: { eu_waiver: euWaiver, accepted_terms: acceptedTerms, ...extra },
        });
      } catch (e) {
        console.error("[create-checkout] failed to record consent", consent_type, e);
      }
    };

    // Stripe metadata: attach the consent state to the underlying object so it's queryable
    // from the Stripe dashboard and persisted on every invoice.
    const consentMetadata: Record<string, string> = {
      user_id: user.id,
      accepted_terms: String(acceptedTerms),
      eu_withdrawal_waiver: String(euWaiver),
      consent_recorded_at: new Date().toISOString(),
    };

    // Check for an existing subscription — if found, modify it instead of creating new checkout.
    if (customerId) {
      // Include trialing/past_due so we don't accidentally double-charge a customer who has
      // a non-active-but-still-existing subscription.
      const subs = await stripe.subscriptions.list({
        customer: customerId,
        status: "all",
        limit: 10,
      });
      const liveStatuses = new Set(["active", "trialing", "past_due"]);
      const liveSubs = subs.data.filter((s) => liveStatuses.has(s.status));

      if (liveSubs.length > 0) {
        // Pick the highest-tier live subscription as the current one
        let current = liveSubs[0];
        let currentTier: "plus" | "pro" = PRICE_TO_TIER[current.items.data[0]?.price?.id ?? ""] ?? "pro";
        for (const s of liveSubs) {
          const t = PRICE_TO_TIER[s.items.data[0]?.price?.id ?? ""] ?? "pro";
          if (TIER_RANK[t] >= TIER_RANK[currentTier]) {
            current = s;
            currentTier = t;
          }
        }

        const currentItem = current.items.data[0];
        const currentPriceId = currentItem?.price?.id ?? "";

        // SAFETY: refuse to act on a sub with payment problems — could create unexpected charges.
        if (current.status === "past_due") {
          return json(409, {
            error:
              "Your current subscription has an unpaid invoice. Please update your payment method via the billing portal before changing plans.",
            code: "subscription_past_due",
          });
        }

        // SAFETY: refuse if a schedule is already pending for this subscription.
        // Without this check, calling create-checkout twice in a row would create
        // a second schedule, leading to confusing/duplicate state in Stripe.
        const existingSchedules = await stripe.subscriptionSchedules.list({
          customer: customerId,
          limit: 20,
        });
        const pendingSchedule = existingSchedules.data.find(
          (sch) =>
            sch.subscription === current.id &&
            (sch.status === "active" || sch.status === "not_started") &&
            !(sch as any).released_at &&
            !(sch as any).completed_at &&
            !(sch as any).canceled_at
        );
        if (pendingSchedule) {
          return json(409, {
            error:
              "A plan change is already scheduled on your subscription. Please manage it via the billing portal before scheduling another change.",
            code: "schedule_already_pending",
          });
        }

        // Same tier already — do NOT create checkout. Send to billing portal so user can manage.
        // This prevents creating a duplicate subscription if they accidentally click "upgrade".
        if (currentPriceId === targetPriceId) {
          const portal = await stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: `${origin}/settings`,
          });
          return json(200, { url: portal.url, action: "manage", reason: "already_subscribed" });
        }

        // SAFETY: if the sub is set to cancel at period end, surface that explicitly.
        // Acting on a cancelling sub would silently un-cancel it as a side effect.
        if (current.cancel_at_period_end) {
          return json(409, {
            error:
              "Your subscription is set to cancel at the end of the period. Please reactivate it from Settings before changing plans.",
            code: "subscription_pending_cancel",
          });
        }

        const isUpgrade = TIER_RANK[tier] > TIER_RANK[currentTier];

        if (isUpgrade) {
          // Record consent BEFORE charging.
          await recordConsent("checkout_terms", { action: "upgrade", from_tier: currentTier });
          await recordConsent(
            euWaiver ? "eu_withdrawal_waiver" : "no_waiver_acknowledged",
            { action: "upgrade", from_tier: currentTier }
          );

          // Upgrade: charge prorated difference immediately
          await stripe.subscriptions.update(
            current.id,
            {
              items: [{ id: currentItem.id, price: targetPriceId }],
              proration_behavior: "always_invoice",
              cancel_at_period_end: false,
              metadata: consentMetadata,
            },
            { idempotencyKey: `${baseIdemKey}_upgrade` }
          );
          return json(200, {
            url: `${origin}/upgrade-success`,
            action: "upgraded",
          });
        } else {
          // Downgrade: no immediate charge, but still record the user's informed decision.
          await recordConsent("checkout_terms", { action: "downgrade_scheduled", from_tier: currentTier });

          // Downgrade: schedule the change for end of current period (no immediate charge).
          const schedule = await stripe.subscriptionSchedules.create(
            { from_subscription: current.id },
            { idempotencyKey: `${baseIdemKey}_schedule_create` }
          );

          const currentPhase = schedule.phases[0];
          await stripe.subscriptionSchedules.update(
            schedule.id,
            {
              end_behavior: "release",
              metadata: consentMetadata,
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
            },
            { idempotencyKey: `${baseIdemKey}_schedule_update` }
          );

          return json(200, {
            url: `${origin}/settings?downgrade=scheduled`,
            action: "downgrade_scheduled",
          });
        }
      }

      // Customer exists but no live sub — check for canceled/incomplete that the user may want
      // to manage rather than start a brand-new subscription.
      const fallback = subs.data.find((s) =>
        ["canceled", "incomplete", "incomplete_expired"].includes(s.status)
      );
      if (fallback?.status === "incomplete") {
        // Stripe is mid-payment — opening a new checkout could double-charge.
        const portal = await stripe.billingPortal.sessions.create({
          customer: customerId,
          return_url: `${origin}/settings`,
        });
        return json(200, {
          url: portal.url,
          action: "manage",
          reason: "previous_payment_incomplete",
        });
      }
    }

    // No live subscription — normal checkout
    const session = await stripe.checkout.sessions.create(
      {
        customer: customerId,
        customer_email: customerId ? undefined : user.email,
        line_items: [{ price: targetPriceId, quantity: 1 }],
        mode: "subscription",
        success_url: `${origin}/upgrade-success`,
        cancel_url: `${origin}/pricing`,
        // Surface terms acceptance + show clear billing terms in Stripe-hosted checkout.
        consent_collection: { terms_of_service: "required" },
        billing_address_collection: "auto",
        // Custom legal text shown above the pay button in Stripe Checkout.
        custom_text: {
          submit: {
            message:
              "Subscriptions renew automatically each month. You can cancel anytime from Settings — your access continues until the end of your current billing period. EU customers retain their statutory 14-day right of withdrawal where applicable.",
          },
        },
      },
      { idempotencyKey: `${baseIdemKey}_checkout` }
    );

    return json(200, { url: session.url, action: "checkout" });
  } catch (error) {
    console.error("create-checkout error:", (error as Error).message);
    return json(500, { error: (error as Error).message || "Internal server error" });
  }
});
