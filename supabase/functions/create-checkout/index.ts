import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

import { PRO_PRICES } from "../_shared/subscription-policy.ts";

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

    let body: { interval?: unknown; accepted_terms?: unknown; eu_withdrawal_waiver?: unknown; consent_text?: unknown };
    try { body = await req.json(); } catch { return json(400, { error: "Missing request body", code: "missing_body" }); }
    if (body?.interval !== "month" && body?.interval !== "year") return json(400, { error: "Interval must be month or year", code: "invalid_interval" });
    const interval = body.interval;
    const tier = "pro";

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

    const ALLOWED_ORIGINS = new Set([
      "https://portai-invest.lovable.app",
      "https://www.portai-invest.com",
      "https://portai-invest.com",
      "https://id-preview--5bccf231-23e4-4163-8c8a-8a3af99cb665.lovable.app",
      "http://localhost:3000",
    ]);
    const rawOrigin = req.headers.get("origin") ?? "";
    const origin = ALLOWED_ORIGINS.has(rawOrigin) ? rawOrigin : "https://portai-invest.lovable.app";
    const targetPriceId = PRO_PRICES[interval];

    // Idempotency key — Stripe will dedupe identical write attempts within 24h.
    // Using user id + target tier + the day yields per-day-per-intent dedup,
    // which protects against double-clicks and accidental retries.
    const idempotencyDay = new Date().toISOString().split("T")[0];
    const baseIdemKey = `chk_${user.id}_${targetPriceId}_${idempotencyDay}`;

    // Helper: record consent BEFORE any Stripe write. If recording fails, we still proceed
    // (a logging failure must not block the user from being charged for a service they want),
    // but we log loudly so legal/support can investigate.
    const recordConsent = async (consent_type: string, extra?: Record<string, unknown>) => {
      try {
        await supabaseAdmin.from("payment_consents").insert({
          user_id: user.id,
          user_email: user.email ?? "",
          consent_type,
          tier,
          price_id: targetPriceId,
          consent_text: consentText,
          ip_address: ipAddress,
          user_agent: userAgent,
          metadata: { interval, eu_waiver: euWaiver, accepted_terms: acceptedTerms, ...extra },
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
        // Never silently reprice grandfathered subscriptions or create a second one.
        const portal = await stripe.billingPortal.sessions.create({ customer: customerId, return_url: `${origin}/settings` });
        return json(200, { url: portal.url, action: "manage", reason: "already_subscribed" });
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

    // Record consent BEFORE creating the checkout session so we have proof even if
    // the user abandons mid-flow.
    await recordConsent("checkout_terms", { action: "new_checkout" });
    await recordConsent(
      euWaiver ? "eu_withdrawal_waiver" : "no_waiver_acknowledged",
      { action: "new_checkout" }
    );

    // No live subscription — normal checkout
    const session = await stripe.checkout.sessions.create(
      {
        customer: customerId,
        customer_email: customerId ? undefined : user.email,
        line_items: [{ price: targetPriceId, quantity: 1 }],
        mode: "subscription",
        success_url: `${origin}/upgrade-success`,
        cancel_url: `${origin}/pricing`,
        // NOTE: We do NOT use Stripe's `consent_collection.terms_of_service` here because it
        // requires a Terms of Service URL configured in the Stripe Dashboard's public business
        // details. Our app already collects explicit, verbatim terms acceptance BEFORE invoking
        // this function (see `accepted_terms` validation above) and persists it to the
        // `payment_consents` audit table along with IP/UA/consent_text — which is stronger legal
        // evidence than Stripe's checkbox. The custom_text below also restates the terms above
        // the pay button.
        billing_address_collection: "auto",
        // Persist consent state on the Stripe session AND propagate it to the
        // resulting subscription so it appears on every invoice / dashboard view.
        metadata: consentMetadata,
        subscription_data: { metadata: consentMetadata },
        // Custom legal text shown above the pay button in Stripe Checkout.
        // Worded differently depending on whether the user waived the EU 14-day right,
        // so the disclosure on Stripe matches what they ticked in our app.
        custom_text: {
          submit: {
            message: euWaiver
              ? "By clicking Pay, you expressly request immediate access to the digital service and acknowledge that, by doing so, you LOSE your statutory 14-day right of withdrawal once performance has fully begun (Directive 2011/83/EU, Art. 16(m)). The subscription renews automatically each billing period and can be cancelled anytime from Settings."
              : "Subscriptions renew automatically each billing period and can be cancelled anytime from Settings. EU consumers keep their full statutory 14-day right of withdrawal — to exercise it, email legal@portai-invest.com from your account email within 14 days of purchase.",
          },
        },
      },
      { idempotencyKey: `${baseIdemKey}_checkout` }
    );

    return json(200, { url: session.url, action: "checkout" });
  } catch (error) {
    console.error("create-checkout error:", (error as Error).message);
    return json(500, { error: "Internal server error" });
  }
});
