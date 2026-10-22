import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@4";
import { isAdminEmail } from "../_shared/admin-bypass.ts";
import { resolveTier } from "../_shared/tier.ts";
import { ACTIVE_ALERT_LIMITS } from "../_shared/price-alert-limits.ts";

const schema = z.object({
  ticker: z.string().trim().min(1).max(20),
  asset_name: z.string().trim().max(120).default(""),
  asset_type: z.enum(["stock", "etf", "crypto", "index"]),
  target_price: z.number().finite().positive(),
  direction: z.enum(["above", "below"]),
}).strict();
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...corsHeaders, "Content-Type": "application/json" },
});

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const header = req.headers.get("Authorization");
    if (!header?.startsWith("Bearer ")) return json({ error: "Authentication required" }, 401);
    const admin = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", { auth: { persistSession: false } });
    const { data: { user }, error: authError } = await admin.auth.getUser(header.slice(7));
    if (authError || !user) return json({ error: "Authentication required" }, 401);
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return json({ error: "Invalid alert", details: parsed.error.flatten().fieldErrors }, 400);
    const tier = await isAdminEmail(admin, user.email) ? "pro" : await resolveTier(admin, user.id, user.email ?? null);
    if (tier === "free") return json({ error: "Price alerts require Plus or Pro", code: "PRICE_ALERTS_PAID_REQUIRED", limit: ACTIVE_ALERT_LIMITS.free }, 403);
    const input = parsed.data;
    // Only a server-resolved tier is passed to this service-only RPC. The database
    // serializes same-user creations, so simultaneous UI/MCP requests cannot race.
    const { data, error } = await admin.rpc("create_price_alert_checked", {
      _user_id: user.id, _tier: tier, _ticker: input.ticker,
      _asset_name: input.asset_name, _asset_type: input.asset_type,
      _target_price: input.target_price, _direction: input.direction,
    });
    if (error?.message.includes("PRICE_ALERT_LIMIT_REACHED")) return json({ error: "Plus includes up to 5 active price alerts. Upgrade to Pro for unlimited alerts.", code: "PRICE_ALERT_LIMIT_REACHED", limit: ACTIVE_ALERT_LIMITS.plus }, 409);
    if (error) { console.error("create-price-alert RPC failed", error.code); return json({ error: "Could not create alert" }, 500); }
    const alert = Array.isArray(data) ? data[0] : data;
    return json({ alert, tier });
  } catch (error) {
    console.error("create-price-alert failed", error instanceof Error ? error.message : "Unknown error");
    return json({ error: "Could not create alert" }, 500);
  }
});