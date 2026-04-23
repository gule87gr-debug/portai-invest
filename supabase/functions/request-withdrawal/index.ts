// EU Art. 9 statutory right of withdrawal — in-app exercise channel.
// Required by Directive 2011/83/EU Art. 11(1): the trader must provide a means
// for the consumer to submit the withdrawal statement. We accept it in-app and
// record an immutable proof record. Refund is processed manually by legal@.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Service role: payment_consents has RLS forbidding any client INSERT, by design.
  const admin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );
  // Anon client only used to validate the JWT.
  const authClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json(401, { error: "Authentication required" });
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await authClient.auth.getUser(token);
    if (userErr || !userData.user?.email) {
      return json(401, { error: "Authentication required" });
    }
    const user = userData.user;

    let body: { reason?: unknown; subscription_id?: unknown; price_id?: unknown; tier?: unknown } = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }
    const reason =
      typeof body?.reason === "string" ? body.reason.slice(0, 2000) : "";
    const tier = body?.tier === "plus" || body?.tier === "pro" ? body.tier : null;
    const priceId = typeof body?.price_id === "string" ? body.price_id.slice(0, 100) : null;
    const subscriptionId =
      typeof body?.subscription_id === "string" ? body.subscription_id.slice(0, 100) : null;

    // Eligibility check: there must be a `checkout_terms` consent for this user
    // within the last 14 days, AND that purchase must not have been waived.
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
    const { data: recent, error: recentErr } = await admin
      .from("payment_consents")
      .select("id, created_at, consent_type, metadata, tier, price_id")
      .eq("user_id", user.id)
      .in("consent_type", ["checkout_terms", "eu_withdrawal_waiver", "no_waiver_acknowledged"])
      .gte("created_at", fourteenDaysAgo)
      .order("created_at", { ascending: false });

    if (recentErr) {
      console.error("[request-withdrawal] eligibility lookup failed", recentErr);
      return json(500, { error: "Could not verify your withdrawal eligibility." });
    }

    const hasRecentCheckout = (recent ?? []).some((r) => r.consent_type === "checkout_terms");
    if (!hasRecentCheckout) {
      return json(409, {
        error:
          "No purchase found within the last 14 days. The statutory right of withdrawal applies only within 14 calendar days of the original purchase.",
        code: "outside_withdrawal_window",
      });
    }
    const hasWaiver = (recent ?? []).some((r) => r.consent_type === "eu_withdrawal_waiver");
    if (hasWaiver) {
      return json(409, {
        error:
          "You expressly waived your 14-day right of withdrawal at checkout (Art. 16(m) of Directive 2011/83/EU). The right is no longer available for that purchase.",
        code: "waiver_active",
      });
    }

    // Prevent duplicate withdrawal requests (one per checkout window is enough).
    const { data: alreadyRequested } = await admin
      .from("payment_consents")
      .select("id")
      .eq("user_id", user.id)
      .eq("consent_type", "eu_withdrawal_exercised")
      .gte("created_at", fourteenDaysAgo)
      .limit(1);
    if (alreadyRequested && alreadyRequested.length > 0) {
      return json(409, {
        error:
          "A withdrawal request is already on file for this purchase. Our legal team will follow up by email shortly.",
        code: "already_requested",
      });
    }

    const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
    const userAgent = req.headers.get("user-agent") ?? null;

    // Verbatim Annex I(B) model withdrawal form text, completed with the user's data.
    const consentText = [
      `MODEL WITHDRAWAL FORM (Directive 2011/83/EU, Annex I(B))`,
      `To: PortAI Legal — legal@portai-invest.com`,
      `I/We hereby give notice that I/We withdraw from my/our contract for the supply of the following digital service: PortAI ${tier ? tier.toUpperCase() : "subscription"}.`,
      `Ordered on: see attached payment_consents record (checkout_terms).`,
      `Name of consumer: account holder of ${user.email}.`,
      `Date: ${new Date().toISOString()}.`,
      reason ? `Optional reason provided by consumer: ${reason}` : "",
      `Pursuant to Art. 14(3), I acknowledge that the trader may deduct an amount proportional to any service already provided.`,
    ].filter(Boolean).join("\n");

    const { error: insertErr } = await admin.from("payment_consents").insert({
      user_id: user.id,
      user_email: user.email,
      consent_type: "eu_withdrawal_exercised",
      tier,
      price_id: priceId,
      consent_text: consentText,
      ip_address: ipAddress,
      user_agent: userAgent,
      metadata: {
        reason: reason || null,
        subscription_id: subscriptionId,
        legal_basis: "Directive 2011/83/EU Art. 9 & Art. 14(3); Spanish RDL 1/2007 Art. 102, 108",
        action_required: "manual_pro_rata_refund",
      },
    });
    if (insertErr) {
      console.error("[request-withdrawal] insert failed", insertErr);
      return json(500, { error: "Could not record your withdrawal request. Please email legal@portai-invest.com." });
    }

    return json(200, {
      success: true,
      message:
        "Withdrawal request received and timestamped. Our legal team will process the pro-rata refund within 14 days (Directive 2011/83/EU Art. 13(1)).",
    });
  } catch (e) {
    console.error("request-withdrawal error", (e as Error).message);
    return json(500, { error: "Internal server error" });
  }
});
