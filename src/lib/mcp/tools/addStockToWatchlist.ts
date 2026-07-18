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
  name: "add_stock_to_watchlist",
  title: "Add stock to watchlist",
  description: "Add a ticker to one of the signed-in user's watchlists.",
  inputSchema: {
    watchlist_id: z.string().uuid(),
    ticker: z.string().trim().min(1).max(20),
    name: z.string().trim().min(1).max(200),
    sector: z.string().trim().max(100).optional(),
    signal: z.string().trim().max(50).optional(),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ watchlist_id, ticker, name, sector, signal }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { isError: true, content: [{ type: "text", text: "Not authenticated" }] };
    }
    const { data, error } = await db(ctx)
      .from("watchlist_stocks")
      .insert({
        watchlist_id,
        ticker: ticker.toUpperCase(),
        name,
        sector: sector ?? "",
        signal: signal ?? "hold",
      })
      .select()
      .single();
    if (error) return { isError: true, content: [{ type: "text", text: error.message }] };
    return {
      content: [{ type: "text", text: `Added ${data.ticker} to watchlist.` }],
      structuredContent: { stock: data },
    };
  },
});
