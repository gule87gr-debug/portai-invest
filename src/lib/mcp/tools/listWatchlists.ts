import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";

function db(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "list_watchlists",
  title: "List watchlists",
  description: "List all watchlists owned by the signed-in PortAI user.",
  inputSchema: {},
  annotations: { readOnlyHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { isError: true, content: [{ type: "text", text: "Not authenticated" }] };
    }
    const { data, error } = await db(ctx)
      .from("watchlists")
      .select("id, name, description, created_at")
      .order("created_at", { ascending: false });
    if (error) return { isError: true, content: [{ type: "text", text: error.message }] };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { watchlists: data ?? [] },
    };
  },
});
