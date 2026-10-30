import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "create_price_alert",
  title: "Create price alert",
  description: "Create a price alert: Pro unlimited, Free none. Server-side access checks apply.",
  inputSchema: {
    ticker: z.string().trim().min(1).max(20),
    asset_name: z.string().trim().min(1).max(120),
    asset_type: z.enum(["stock", "crypto", "etf", "index"]).describe("Asset category."),
    direction: z.enum(["above", "below"]).describe("Trigger when price crosses above or below the target."),
    target_price: z.number().finite().positive(),
  },
  annotations: { readOnlyHint: false, destructiveHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const { data, error } = await supabaseForUser(ctx).functions.invoke("create-price-alert", { body: input });
    if (error) {
      const response = "context" in error && error.context instanceof Response ? await error.context.json().catch(() => null) : null;
      return { content: [{ type: "text", text: response?.error ?? error.message }], isError: true };
    }
    const alert = data?.alert;
    if (!alert) return { content: [{ type: "text", text: "Could not create alert" }], isError: true };
    return {
      content: [{ type: "text", text: `Alert set: ${alert.ticker} ${alert.direction} ${alert.target_price}` }],
      structuredContent: { alert: { id: alert.id, ticker: alert.ticker, direction: alert.direction, target_price: alert.target_price } },
    };
  },
});
