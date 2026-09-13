import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { checkRateLimit, getClientIP, rateLimitResponse } from "../_shared/rate-limiter.ts";
import { isAdminEmail } from "../_shared/admin-bypass.ts";
import { resolveTier, startOfUtcDay, type Tier } from "../_shared/tier.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PLUS_DAILY_DEEP_DIVES = 3;
const USAGE_TYPE = "deep_dive";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

async function cacheKeyFor(url: string, language: string): Promise<string> {
  const data = new TextEncoder().encode(`${url}::${language}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const ip = getClientIP(req);
  const rl = checkRateLimit(`deepdive:${ip}`, { maxRequests: 20, windowMs: 60_000 });
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs, corsHeaders);

  try {
    const body = await req.json().catch(() => ({}));
    const action = body?.action === "claim" ? "claim" : "status";
    const url = typeof body?.url === "string" ? body.url.slice(0, 2048) : "";
    const language = typeof body?.language === "string" ? body.language.slice(0, 8) : "en";

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Authentication required" }, 401);
    const { data: userData } = await supabaseAdmin.auth.getUser(authHeader.replace("Bearer ", ""));
    if (!userData?.user) return json({ error: "Invalid or expired token" }, 401);

    const userId = userData.user.id;
    const email = userData.user.email ?? null;

    let tier: Tier = "free";
    if (await isAdminEmail(supabaseAdmin, email)) tier = "pro";
    else tier = await resolveTier(supabaseAdmin, userId, email);

    const limit = tier === "pro" ? null : PLUS_DAILY_DEEP_DIVES;

    const { count } = await supabaseAdmin
      .from("chat_usage")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("usage_type", USAGE_TYPE)
      .gte("created_at", startOfUtcDay());
    const used = count ?? 0;

    if (action === "status") {
      return json({ tier, used, limit });
    }

    if (tier === "free") {
      return json({ error: "Pro deep dives are available on Plus (3/day) and Pro (unlimited).", tier, used, limit }, 402);
    }
    if (!url) return json({ error: "Missing article url" }, 400);

    if (tier === "plus" && used >= PLUS_DAILY_DEEP_DIVES) {
      return json({
        error: `You've used all ${PLUS_DAILY_DEEP_DIVES} Pro deep dives for today. Upgrade to Pro for unlimited deep dives.`,
        tier, used, limit,
      }, 429);
    }

    const cacheKey = await cacheKeyFor(url, language || "en");
    const { data: cachedRow } = await supabaseAdmin
      .from("article_analysis_cache")
      .select("analysis")
      .eq("cache_key", cacheKey)
      .maybeSingle();

    const analysis = (cachedRow?.analysis ?? null) as Record<string, unknown> | null;
    const deepDive = analysis?.proDeepDive ?? null;
    const hiddenAngle = analysis?.hiddenAngle ?? null;

    if (!deepDive) {
      return json({ error: "No deep dive is available for this article yet. Re-run the analysis and try again.", tier, used, limit }, 404);
    }

    if (tier === "plus") {
      await supabaseAdmin.from("chat_usage").insert({ user_id: userId, usage_type: USAGE_TYPE });
    }

    return json({
      success: true,
      deepDive,
      hiddenAngle,
      tier,
      used: tier === "plus" ? used + 1 : used,
      limit,
    });
  } catch (e) {
    console.error("claim-deep-dive error:", e);
    return json({ error: "Internal server error" }, 500);
  }
});
