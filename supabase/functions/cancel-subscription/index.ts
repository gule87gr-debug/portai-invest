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
      return json(404, { error: "No active subscription found.", code: "no_active_subscription" });
    }

    // Idempotency: if already cancelling, surface that as a no-op success.
    // This prevents confusing UI states and unnecessary Stripe writes if the user clicks twice.
    if (liveSub.cancel_at_period_end) {
      const endIso = (() => {
        const v = (liveSub as any).current_period_end;
        if (typeof v === "number") return new Date(v * 1000).toISOString();
        return null;
      })();
      return json(200, {
        success: true,
        already_cancelled: true,
        cancel_at_period_end: true,
        period_end: endIso,
      });
    }

    const idemKey = `cancel_${user.id}_${liveSub.id}_${new Date().toISOString().split("T")[0]}`;
    const updated = await stripe.subscriptions.update(
      liveSub.id,
      { cancel_at_period_end: true },
      { idempotencyKey: idemKey }
    );

    const endIso = (() => {
      const v = (updated as any).current_period_end;
      if (typeof v === "number") return new Date(v * 1000).toISOString();
      return null;
    })();

    return json(200, {
      success: true,
      already_cancelled: false,
      cancel_at_period_end: true,
      period_end: endIso,
    });
  } catch (error) {
    console.error("cancel-subscription error:", (error as Error).message);
    return json(500, { error: "Internal server error" });
  }
});
