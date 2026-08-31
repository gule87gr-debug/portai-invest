# PortAI 

Build a full-stack web app called PortAI, an AI-powered investor helper for portfolio analysis, news, forums, and more. Use a modern, clean finance-themed UI (dark mode default, green accents for gains). Include user authentication with optional anonymous mode. Show prominent disclaimer banners: "Not financial advice—consult professionals" on all AI outputs. Core Features 1. Info Source Dashboard Fetch recent finance articles via NewsAPI or similar AI-generated summaries (200 words max) Trust/bias score (1-10 scale) with explanation: "Score 8/10: Cited SEC filings, reputable author; watch for primary data sources over opinions" Trust tips sidebar: "Look for: Multiple citations, expert authors, raw financials" 2. AI Functions (Premium) Portfolio analyser: Upload CSV/manual entry → sector breakdown, diversification score, risk metrics Recommendations: "Reduce tech exposure (45%→30%), add healthcare ETFs based on Q1 earnings + Fed policy" What-if simulator: Sliders for recession, rate changes → PDF reports Voice mode: Speech-to-text input → instant answers using market APIs (Alpha Vantage/Yahoo Finance) 3. Portfolio Builder Quiz (Premium) 5-step wizard: Risk tolerance (Conservative-Aggressive), timeframe (1-3/3-7/7+ years), profit goals (5%/yr, 10%/yr, etc.) Output: Sample portfolio (SPY 40%, QQQ 20%, etc.) with rationale + performance projections 4. Smart Forum Thread categories: Sectors, Events, Portfolios, Watchlists Filters: Sector (Tech, Energy), Asset (ETFs/Stocks), Events (Earnings/Fed) Anonymous toggle for portfolio shares AI Moderator: Real-time fact-checking ("NVDA P/E is 42x per latest 10-Q"), toxicity filter, thread summaries Free users: Basic posts; Premium: Fact-checker active 5. Custom Watchlists Create lists ("AI Stocks") manually or AI-suggested (news sentiment analysis) Alerts: Price targets, volume spikes, sentiment shifts Dashboard shows P&L, news, AI insights 6. Profile Customization User settings page with name field, profile picture upload (circular avatar, 200x200px recommended) Display name and avatar in forum posts, watchlist shares, and profile pages Anonymous mode hides name/avatar (shows "Anonymous Trader") Onboarding Flow Quick Quiz (30 seconds) → personalized sample portfolio Watchlist Setup → AI suggests 3 starter lists Forum Intro → top threads by user interests Featured Articles → 3 trust-scored headlines Upgrade Prompt for full AI access Data & Tech Needs Market APIs: Alpha Vantage, Yahoo Finance, FMP News: NewsAPI AI: OpenAI/Claude for analysis, summaries, moderation Database: Users, portfolios, forum posts, watchlists File uploads: Portfolio CSVs, report exports Push notifications for alerts GDPR-compliant (EU user from Madrid) Make it mobile-responsive with PWA support. Add shareable portfolio snapshots and earnings calendar integration. Launch-ready MVP with premium paywall after onboarding. Generate the complete app now!

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://portai-invest.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/5bccf231-23e4-4163-8c8a-8a3af99cb665).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
