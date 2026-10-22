# Project architecture
- Price alert creation must use the authenticated create-price-alert edge function and its service-only atomic database RPC; this prevents direct-client and concurrent MCP quota bypasses.
- Use the shared active-alert allowance module for frontend gates and policy tests; server tier resolution never trusts cached client subscription state.
- MCP tool database/function clients use a lazy caller-token factory with runtime key fallbacks; this preserves RLS and import-safe manifest extraction.
- Standalone legal pages retain their existing fallback policy, with a fully localized accessibility page supplied separately for every supported language; this avoids changing unrelated legal documents.