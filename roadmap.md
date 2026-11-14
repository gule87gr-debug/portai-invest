# Requested updates
## Data sourcing brief (current)
- [ ] Part 1: Remove Yahoo Finance (fetch-quotes, fetch-history, callers, quote caches); server fetches no prices.
- [ ] Part 2: TradingView widget wrappers, toTradingViewSymbol mapping + unmapped count, replace stock/watchlist/ticker displays, remove custom charts, attribution.
- [ ] Part 3: fetch-news from publishers' official RSS only (config file), headline/source/date/link/150-char snippet, ticker filter, 30-day cleanup.
- [ ] Part 4: analyze-link robots.txt/TDM + paywall checks (no quota), RSS-based corroboration, cache without article text + clearing migration.
- [ ] Part 5: Pause price alerts (unschedule cron, delete check-price-alerts, notice on /alerts, MCP notice, chat no live prices, remove alerts from marketing).
- [ ] Part 6: Legal pages + cookie banner data sources, six languages.
- [ ] Final: zero-reference search, typecheck/tests, checklist (feeds for review, unmapped tickers, manual steps).
## Carried over from previous brief
- [ ] Remove remaining Plus mentions (six languages), Terms Plus paragraphs, trial "sentiment alerts" claim.
- [ ] Accessibility page "working towards WCAG 2.1 AA" in six languages.
- [ ] Delete claim-deep-dive function and references; remove duplicate Free analysis_usage insert in analyze-link.
