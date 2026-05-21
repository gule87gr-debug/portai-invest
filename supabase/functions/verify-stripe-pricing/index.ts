import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { isAdminEmail } from "../_shared/admin-bypass.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PRO_PRODUCT_ID = "prod_UEROAe01UbaEpK";
const PRO_PRICE_ID = "price_1TPQ1oPJefLcxc6CTI4Hf42E";
const PRO_AMOUNT = 1599;

const PLUS_PRODUCT_ID = "prod_UO8LzRA6kfvdwm";
const PLUS_PRICE_ID = "price_1TPM56PJefLcxc6CzfD5CUaS";
const PLUS_AMOUNT = 899;

const CURRENCY = "eur";
const INTERVAL = "month";

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
    if (!(await isAdminEmail(supabaseAdmin, caller.email))) {
      return json({ error: "Forbidden" }, 403);
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) return json({ error: "Stripe not configured" }, 500);
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const issues: string[] = [];

    async function auditProduct(productId: string, label: string, expectedPriceId: string, expectedAmount: number) {
      const product = await stripe.products.retrieve(productId).catch(() => null);
      if (!product) {
        issues.push(`${label} product ${productId} not found`);
        return;
      }
      if (!product.active) issues.push(`${label} product ${productId} is INACTIVE`);

      const prices = await stripe.prices.list({ product: productId, limit: 100 });
      const activePrices = prices.data.filter((p) => p.active);
      if (activePrices.length !== 1) {
        issues.push(`${label} has ${activePrices.length} active prices, expected 1`);
      }
      const expected = activePrices.find((p) => p.id === expectedPriceId);
      if (!expected) {
        issues.push(`${label} expected active price ${expectedPriceId} not found`);
      } else {
        if (expected.currency !== CURRENCY) {
          issues.push(`${label} price ${expected.id} currency is ${expected.currency}, expected ${CURRENCY}`);
        }
        if (expected.unit_amount !== expectedAmount) {
          issues.push(`${label} price ${expected.id} amount is ${expected.unit_amount}, expected ${expectedAmount}`);
        }
        if (expected.recurring?.interval !== INTERVAL) {
          issues.push(`${label} price ${expected.id} interval is ${expected.recurring?.interval}, expected ${INTERVAL}`);
        }
      }
      for (const p of activePrices) {
        if (p.id !== expectedPriceId) {
          issues.push(`${label} unexpected active price ${p.id} (${p.unit_amount} ${p.currency})`);
        }
      }
    }

    await auditProduct(PRO_PRODUCT_ID, "Pro", PRO_PRICE_ID, PRO_AMOUNT);
    await auditProduct(PLUS_PRODUCT_ID, "Plus", PLUS_PRICE_ID, PLUS_AMOUNT);

    return json({ ok: issues.length === 0, issues });
  } catch (e) {
    console.error("verify-stripe-pricing error:", e);
    return json({ ok: false, error: "Internal server error" }, 500);
  }
});
