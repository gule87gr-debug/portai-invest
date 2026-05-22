import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TRIAL_DAYS = 14;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Authentication required" }, 401);
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData.user) return json({ error: "Authentication required" }, 401);
    const user = userData.user;

    const body = await req.json().catch(() => ({}));
    const action: "activate" | "expire" = body?.action;
    if (!["activate", "expire"].includes(action)) return json({ error: "Invalid action" }, 400);

    const ip =
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      null;
    const ua = req.headers.get("user-agent") || null;

    // Ensure user_settings row exists
    const { data: existing } = await supabase
      .from("user_settings")
      .select("id, trial_used, pro_trial_active, trial_end_date")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!existing) {
      await supabase.from("user_settings").insert({ user_id: user.id, display_name: "" });
    }

    if (action === "activate") {
      if (existing?.trial_used) return json({ error: "Trial already used" }, 409);

      const start = new Date();
      const end = new Date(start.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);

      const { error: upErr } = await supabase
        .from("user_settings")
        .update({
          pro_trial_active: true,
          trial_used: true,
          trial_start_date: start.toISOString(),
          trial_end_date: end.toISOString(),
        })
        .eq("user_id", user.id);
      if (upErr) throw upErr;

      await supabase.from("trial_audit_log").insert({
        user_id: user.id,
        user_email: user.email ?? "",
        action: "activated",
        trial_start_date: start.toISOString(),
        trial_end_date: end.toISOString(),
        ip_address: ip,
        user_agent: ua,
      });

      return json({
        ok: true,
        trial_start_date: start.toISOString(),
        trial_end_date: end.toISOString(),
      });
    }

    // expire
    const end = existing?.trial_end_date ?? null;
    const { error: upErr } = await supabase
      .from("user_settings")
      .update({ pro_trial_active: false })
      .eq("user_id", user.id);
    if (upErr) throw upErr;

    await supabase.from("trial_audit_log").insert({
      user_id: user.id,
      user_email: user.email ?? "",
      action: "expired",
      trial_end_date: end,
      ip_address: ip,
      user_agent: ua,
    });

    return json({ ok: true });
  } catch (e) {
    console.error("manage-trial error:", (e as Error).message);
    return json({ error: "Internal server error" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  });
}
