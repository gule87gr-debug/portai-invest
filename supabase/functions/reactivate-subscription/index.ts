import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json(401, { error: "Authentication required" });

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user?.email) {
      return json(401, { error: "Authentication required" });
    }
    const user = userData.user;

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    if (customers.data.length === 0) {
      return json(404, { error: "No subscription found.", code: "no_customer" });
    }

    const subs = await stripe.subscriptions.list({
      customer: customers.data[0].id,
      status: "all",
      limit: 5,
    });
    const liveSub = subs.data.find((s) =>
      ["active", "trialing", "past_due"].includes(s.status)
    );
    if (!liveSub) {
      return json(404, {
        error: "No active subscription to reactivate.",
        code: "no_active_subscription",
      });
    }

    // No-op short-circuit: if not cancelling, there is nothing to reactivate.
    // Returning success here keeps the UI consistent without writing to Stripe again.
    if (!liveSub.cancel_at_period_end) {
      return json(200, {
        success: true,
        already_active: true,
        cancel_at_period_end: false,
      });
    }

    const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
    const userAgent = req.headers.get("user-agent") ?? null;
    const priceId = liveSub.items.data[0]?.price?.id ?? null;
    const periodEnd = (() => {
      const v = (liveSub as any).current_period_end;
      return typeof v === "number" ? new Date(v * 1000).toISOString() : null;
    })();

    // Record consent BEFORE the Stripe write so we keep proof even if the API call fails.
    // Reactivating restarts auto-renewal — under Directive 2011/83/EU Art. 8(2) this is a
    // new commercial commitment and must be recorded.
    try {
      await supabaseClient.from("payment_consents").insert({
        user_id: user.id,
        user_email: user.email,
        consent_type: "reactivate",
        price_id: priceId,
        consent_text:
          `I reactivate my PortAI subscription. Auto-renewal resumes immediately. ` +
          `My next billing date remains ${periodEnd ?? "the previously scheduled period end"}, ` +
          `and the original Terms of Service, Privacy Policy and pricing continue to apply.`,
        ip_address: ipAddress,
        user_agent: userAgent,
        metadata: {
          subscription_id: liveSub.id,
          period_end: periodEnd,
        },
      });
    } catch (e) {
      console.error("[reactivate-subscription] failed to record consent", e);
    }

    const idemKey = `reactivate_${user.id}_${liveSub.id}_${new Date().toISOString().split("T")[0]}`;
    await stripe.subscriptions.update(
      liveSub.id,
      { cancel_at_period_end: false },
      { idempotencyKey: idemKey }
    );

    return json(200, {
      success: true,
      already_active: false,
      cancel_at_period_end: false,
    });
  } catch (error) {
    console.error("reactivate-subscription error:", (error as Error).message);
    return json(500, { error: "Internal server error" });
  }
});
