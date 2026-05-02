import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function fetchYahooPrice(symbol: string): Promise<number | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!res.ok) return null;
    const data = await res.json();
    const meta = data?.chart?.result?.[0]?.meta;
    return typeof meta?.regularMarketPrice === "number" ? meta.regularMarketPrice : null;
  } catch {
    return null;
  }
}

function toYahooSymbol(ticker: string, type?: string): string {
  const upper = ticker.toUpperCase();
  if (type === "crypto") {
    const base = upper.replace(/USD[T]?$/, "");
    return `${base}-USD`;
  }
  return upper;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // Require shared cron secret to prevent public abuse
  const expected = Deno.env.get("CRON_SECRET");
  const provided = req.headers.get("x-cron-secret");
  if (!expected || provided !== expected) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get all active (untriggered) alerts
    const { data: alerts, error } = await supabase
      .from("price_alerts")
      .select("*")
      .eq("triggered", false)
      .limit(500);

    if (error) throw error;
    if (!alerts || alerts.length === 0) {
      return new Response(JSON.stringify({ checked: 0, triggered: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Group by ticker to avoid duplicate price fetches
    const tickerMap = new Map<string, { type: string; alerts: any[] }>();
    for (const a of alerts) {
      const key = a.ticker.toUpperCase();
      if (!tickerMap.has(key)) tickerMap.set(key, { type: a.asset_type, alerts: [] });
      tickerMap.get(key)!.alerts.push(a);
    }

    let triggeredCount = 0;
    const priceCache: Record<string, number | null> = {};

    for (const [ticker, group] of tickerMap.entries()) {
      const ySymbol = toYahooSymbol(ticker, group.type);
      const price = await fetchYahooPrice(ySymbol);
      priceCache[ticker] = price;
      if (price === null) continue;

      for (const alert of group.alerts) {
        const target = Number(alert.target_price);
        const hit =
          (alert.direction === "above" && price >= target) ||
          (alert.direction === "below" && price <= target);
        if (!hit) continue;

        // Mark as triggered
        const { error: upErr } = await supabase
          .from("price_alerts")
          .update({ triggered: true, triggered_at: new Date().toISOString() })
          .eq("id", alert.id)
          .eq("triggered", false); // race-safe

        if (upErr) continue;

        // Send notification via secured RPC (service role bypass)
        const dirText = alert.direction === "above" ? "rose above" : "fell below";
        const title = `${ticker} ${dirText} $${target.toFixed(2)} (now $${price.toFixed(2)})`;
        await supabase.rpc("send_notification", {
          _target_user_id: alert.user_id,
          _type: "price_alert",
          _from_user: "Price Alert",
          _thread_id: `alert-${alert.id}`,
          _thread_title: title,
        });
        triggeredCount++;
      }
    }

    return new Response(
      JSON.stringify({ checked: alerts.length, triggered: triggeredCount }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("check-price-alerts error:", e);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
