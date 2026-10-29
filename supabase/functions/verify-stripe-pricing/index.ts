import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { isAdminUser } from "../_shared/admin-bypass.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

import { PRO_PRICES, PRO_AMOUNTS } from "../_shared/subscription-policy.ts";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Authentication required" }, 401);

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: userData } = await supabaseAdmin.auth.getUser(token);
    const caller = userData?.user;
    if (!caller?.email) return json({ error: "Invalid token" }, 401);
    if (!(await isAdminUser(supabaseAdmin, caller.id))) {
      return json({ error: "Forbidden" }, 403);
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) return json({ error: "Stripe not configured" }, 500);
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const issues: string[] = [];

    for (const interval of ["month", "year"] as const) {
      const price = await stripe.prices.retrieve(PRO_PRICES[interval]);
      if (!price.active || price.currency !== "eur" || price.unit_amount !== PRO_AMOUNTS[interval] || price.recurring?.interval !== interval || price.product !== "prod_UEROAe01UbaEpK") issues.push(`Pro ${interval} price does not match the current offering`);
    }

    return json({ ok: issues.length === 0, issues });
  } catch (e) {
    console.error("verify-stripe-pricing error:", e);
    return json({ ok: false, error: "Internal server error" }, 500);
  }
});
