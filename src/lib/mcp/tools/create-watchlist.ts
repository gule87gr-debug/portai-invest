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
  name: "create_watchlist",
  title: "Create watchlist",
  description: "Create a new PortAI watchlist for the signed-in user.",
  inputSchema: {
    name: z.string().trim().min(1).max(80).describe("Name of the watchlist."),
    description: z.string().trim().max(500).optional().describe("Optional description."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false },
  handler: async ({ name, description }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const { data, error } = await client(ctx)
      .from("watchlists")
      .insert({ user_id: ctx.getUserId()!, name, description: description ?? "" })
      .select("id, name, description")
      .single();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: `Created watchlist "${data.name}" (${data.id})` }],
      structuredContent: { watchlist: data },
    };
  },
});
