# Project architecture
- Request throttling uses the service-only atomic fixed-window database RPC; callers await it and fail open on errors to preserve availability.
- Price alert creation must use the authenticated create-price-alert edge function and its service-only atomic database RPC; this prevents direct-client and concurrent MCP quota bypasses.
- Use the shared active-alert allowance module for frontend gates and policy tests; server tier resolution never trusts cached client subscription state.
- MCP tool database/function clients use a lazy caller-token factory with runtime key fallbacks; this preserves RLS and import-safe manifest extraction.
- Standalone legal pages retain their existing fallback policy, with a fully localized accessibility page supplied separately for every supported language; this avoids changing unrelated legal documents.- Prices and charts are shown only through the official TradingView embed widgets in src/components/tradingview, keyed by toTradingViewSymbol; the server never fetches market prices, keeping data sourcing licence-clean.
- News comes only from publishers' own RSS feeds listed in supabase/functions/_shared/news-feeds.ts, storing headline/source/date/link/≤150-char snippet; no aggregators, bodies or images, to respect publisher rights.
- Article analysis checks robots.txt, TDM reservations and paywalls (shared publisher-permissions module) before fetching, never bypasses them, keeps article text in memory only, and corroborates against stored RSS headlines; this keeps analysis permission-based.
- Localized legal disclosures added after the reviewed legal documents (data sources) live in their own module per topic with every supported language; this avoids touching the fallback documents.
