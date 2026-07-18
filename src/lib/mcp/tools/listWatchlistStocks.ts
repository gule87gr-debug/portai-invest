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
  name: "list_watchlist_stocks",
  title: "List stocks in a watchlist",
  description: "Return the tickers, names, sectors, and signals held in one of the user's watchlists.",
  inputSchema: {
    watchlist_id: z.string().uuid().describe("The watchlist's UUID (from list_watchlists)."),
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
  handler: async ({ watchlist_id }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { isError: true, content: [{ type: "text", text: "Not authenticated" }] };
    }
    const { data, error } = await db(ctx)
      .from("watchlist_stocks")
      .select("id, ticker, name, sector, signal, created_at")
      .eq("watchlist_id", watchlist_id)
      .order("created_at", { ascending: false });
    if (error) return { isError: true, content: [{ type: "text", text: error.message }] };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { stocks: data ?? [] },
    };
  },
});
