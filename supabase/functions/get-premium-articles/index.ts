import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { isAdminUser, logAdminBypass } from "../_shared/admin-bypass.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

import { resolveTier } from "../_shared/tier.ts";
import { reserveDailyUsage, dailyLimitResponse } from "../_shared/daily-usage.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: userData } = await supabaseAdmin.auth.getUser(token);
    const user = userData?.user;
    if (!user?.email) {
      return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tier = await resolveTier(supabaseAdmin, user.id, user.email);
    if (tier !== "pro") return new Response(JSON.stringify({ error: "Pro required", articles: [] }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const body = await req.json().catch(() => ({}));
    const ids: string[] = Array.isArray(body?.ids) ? body.ids.slice(0, 100) : [];
    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const safeIds = ids.filter((x) => typeof x === "string" && uuidRe.test(x));
    if (!safeIds.length) {
      return new Response(JSON.stringify({ articles: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isAdmin = await isAdminUser(supabaseAdmin as any, user.id);
    for (const id of safeIds) {
      if (!await reserveDailyUsage(supabaseAdmin, user.id, tier, isAdmin, "deep_dive")) return dailyLimitResponse(tier, typeof body.language === "string" ? body.language : "en", corsHeaders);
    }
    const { data, error } = await supabaseAdmin
      .from("analyzed_articles_premium")
      .select("article_id, hidden_angle, pro_deep_dive")
      .in("article_id", safeIds);
    if (error) {
      console.error("get-premium-articles select error:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const articles = (data ?? []).map((r: any) => ({
      id: r.article_id,
      hidden_angle: r.hidden_angle,
      pro_deep_dive: r.pro_deep_dive,
    }));
    return new Response(JSON.stringify({ articles }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("get-premium-articles error:", e);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
