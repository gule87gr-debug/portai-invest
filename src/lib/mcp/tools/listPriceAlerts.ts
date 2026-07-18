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
  name: "list_price_alerts",
  title: "List price alerts",
  description: "List the signed-in user's price alerts, optionally filtered to active (not-yet-triggered) alerts.",
  inputSchema: {
    only_active: z.boolean().optional().describe("If true, exclude alerts that already fired."),
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
  handler: async ({ only_active }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { isError: true, content: [{ type: "text", text: "Not authenticated" }] };
    }
    let q = db(ctx)
      .from("price_alerts")
      .select("id, ticker, asset_name, asset_type, direction, target_price, triggered, triggered_at, created_at")
      .order("created_at", { ascending: false });
    if (only_active) q = q.eq("triggered", false);
    const { data, error } = await q;
    if (error) return { isError: true, content: [{ type: "text", text: error.message }] };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { alerts: data ?? [] },
    };
  },
});
