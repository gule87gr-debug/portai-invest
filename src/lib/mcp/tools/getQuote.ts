import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "get_quote",
  title: "Get live quote",
  description: "Fetch the latest price, day change, and change percent for a ticker via PortAI's fetch-quotes function.",
  inputSchema: {
    ticker: z.string().trim().min(1).max(20).describe("Ticker symbol, e.g. AAPL or BTC-USD."),
  },
  annotations: { readOnlyHint: true, openWorldHint: true },
  handler: async ({ ticker }, ctx: ToolContext) => {
    if (!ctx.isAuthenticated()) {
      return { isError: true, content: [{ type: "text", text: "Not authenticated" }] };
    }
    const url = `${process.env.SUPABASE_URL}/functions/v1/fetch-quotes`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: process.env.SUPABASE_PUBLISHABLE_KEY!,
        Authorization: `Bearer ${ctx.getToken()}`,
      },
      body: JSON.stringify({ tickers: [ticker.toUpperCase()] }),
    });
    if (!res.ok) {
      return { isError: true, content: [{ type: "text", text: `fetch-quotes ${res.status}` }] };
    }
    const data = await res.json();
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: data,
    };
  },
});
