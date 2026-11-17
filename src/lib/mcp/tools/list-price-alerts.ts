import { defineTool } from "@lovable.dev/mcp-js";
import { ALERTS_PAUSED_NOTICE } from "../alertsPaused";

export default defineTool({
  name: "list_price_alerts",
  title: "List price alerts",
  description: "Price alerts are temporarily unavailable while PortAI moves to a new data provider.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    return { content: [{ type: "text", text: ALERTS_PAUSED_NOTICE }], structuredContent: { paused: true, notice: ALERTS_PAUSED_NOTICE } };
  },
});
