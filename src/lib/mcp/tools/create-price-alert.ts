import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { ALERTS_PAUSED_NOTICE } from "../alertsPaused";

export default defineTool({
  name: "create_price_alert",
  title: "Create price alert",
  description: "Price alerts are temporarily unavailable while PortAI moves to a new data provider.",
  inputSchema: {
    ticker: z.string().trim().min(1).max(20),
    asset_name: z.string().trim().min(1).max(120),
    asset_type: z.enum(["stock", "crypto", "etf", "index"]).describe("Asset category."),
    direction: z.enum(["above", "below"]).describe("Trigger when price crosses above or below the target."),
    target_price: z.number().finite().positive(),
  },
  annotations: { readOnlyHint: true, destructiveHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    return { content: [{ type: "text", text: ALERTS_PAUSED_NOTICE }], structuredContent: { paused: true, notice: ALERTS_PAUSED_NOTICE } };
  },
});
