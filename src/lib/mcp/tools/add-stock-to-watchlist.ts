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
  name: "add_stock_to_watchlist",
  title: "Add stock to watchlist",
  description: "Add a ticker to one of the signed-in user's PortAI watchlists.",
  inputSchema: {
    watchlist_id: z.string().uuid().describe("Target watchlist ID (from list_watchlists)."),
    ticker: z.string().trim().min(1).max(20).describe("Ticker symbol, e.g. AAPL."),
    name: z.string().trim().min(1).max(120).describe("Company/asset name."),
    sector: z.string().trim().max(80).optional(),
  },
  annotations: { readOnlyHint: false, destructiveHint: false },
  handler: async ({ watchlist_id, ticker, name, sector }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const { data, error } = await client(ctx)
      .from("watchlist_stocks")
      .insert({ watchlist_id, ticker: ticker.toUpperCase(), name, sector: sector ?? "" })
      .select("id, ticker, name")
      .single();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: `Added ${data.ticker} to watchlist.` }],
      structuredContent: { stock: data },
    };
  },
});
