import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listWatchlists from "./tools/list-watchlists";
import createWatchlist from "./tools/create-watchlist";
import addStockToWatchlist from "./tools/add-stock-to-watchlist";
import listPriceAlerts from "./tools/list-price-alerts";
import createPriceAlert from "./tools/create-price-alert";

// The OAuth issuer must be the direct Supabase host (RFC 8414 §3.3).
// Vite inlines VITE_SUPABASE_PROJECT_ID at build time so this stays import-safe.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "portai-mcp",
  title: "PortAI",
  version: "0.1.0",
  instructions:
    "Tools for PortAI, an AI investing assistant. Manage the signed-in user's watchlists and price alerts. All actions act as the connected PortAI user and respect their tier and RLS.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listWatchlists, createWatchlist, addStockToWatchlist, listPriceAlerts, createPriceAlert],
});
