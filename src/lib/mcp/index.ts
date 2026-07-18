import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listWatchlists from "./tools/listWatchlists";
import listWatchlistStocks from "./tools/listWatchlistStocks";
import addStockToWatchlist from "./tools/addStockToWatchlist";
import listPriceAlerts from "./tools/listPriceAlerts";
import createPriceAlert from "./tools/createPriceAlert";
import getQuote from "./tools/getQuote";

// Vite inlines VITE_SUPABASE_PROJECT_ID at build time — safe at module top level.
// The fallback keeps the issuer well-formed during the manifest-extract eval;
// no token will actually verify against the sentinel.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "portai-mcp",
  title: "PortAI",
  version: "0.1.0",
  instructions:
    "Tools for the PortAI stock analysis app. Read the signed-in user's watchlists, add tickers, list and create price alerts, and fetch live quotes. All tools act as the authenticated user under Supabase RLS.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    listWatchlists,
    listWatchlistStocks,
    addStockToWatchlist,
    listPriceAlerts,
    createPriceAlert,
    getQuote,
  ],
});
