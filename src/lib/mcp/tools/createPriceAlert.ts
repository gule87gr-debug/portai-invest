import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function db(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "create_price_alert",
  title: "Create price alert",
  description: "Create a price alert for the signed-in user that fires when the ticker crosses the target.",
  inputSchema: {
    ticker: z.string().trim().min(1).max(20),
    asset_name: z.string().trim().min(1).max(200),
    asset_type: z.enum(["stock", "crypto", "etf", "index"]).default("stock"),
    direction: z.enum(["above", "below"]),
    target_price: z.number().positive(),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ ticker, asset_name, asset_type, direction, target_price }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { isError: true, content: [{ type: "text", text: "Not authenticated" }] };
    }
    const { data, error } = await db(ctx)
      .from("price_alerts")
      .insert({
        user_id: ctx.getUserId(),
        ticker: ticker.toUpperCase(),
        asset_name,
        asset_type,
        direction,
        target_price,
      })
      .select()
      .single();
    if (error) return { isError: true, content: [{ type: "text", text: error.message }] };
    return {
      content: [{ type: "text", text: `Alert created for ${data.ticker} ${direction} ${target_price}.` }],
      structuredContent: { alert: data },
    };
  },
});
