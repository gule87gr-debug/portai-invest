import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function client(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "create_price_alert",
  title: "Create price alert",
  description: "Create a new PortAI price alert for the signed-in user.",
  inputSchema: {
    ticker: z.string().trim().min(1).max(20),
    asset_name: z.string().trim().min(1).max(120),
    asset_type: z.enum(["stock", "crypto", "etf", "index"]).describe("Asset category."),
    direction: z.enum(["above", "below"]).describe("Trigger when price crosses above or below the target."),
    target_price: z.number().positive(),
  },
  annotations: { readOnlyHint: false, destructiveHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const { data, error } = await client(ctx)
      .from("price_alerts")
      .insert({
        user_id: ctx.getUserId()!,
        ticker: input.ticker.toUpperCase(),
        asset_name: input.asset_name,
        asset_type: input.asset_type,
        direction: input.direction,
        target_price: input.target_price,
      })
      .select("id, ticker, direction, target_price")
      .single();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: `Alert set: ${data.ticker} ${data.direction} ${data.target_price}` }],
      structuredContent: { alert: data },
    };
  },
});
