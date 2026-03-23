Monetization system: Free vs Pro ($9.99/mo) tiers with Stripe integration

## Stripe IDs
- Product: prod_UCbv3XBPzcIcTF
- Price: price_1TEChWAIaAlyM68hjTFBLtAl

## Free Tier Limits
- 3 article analyses/day (tracked in analysis_usage table)
- 1 watchlist, 5 stocks per watchlist
- Quiz results are blurred/locked
- Basic AI chat (no Priority badge)

## Edge Functions
- create-checkout: Stripe Checkout session
- check-subscription: Queries Stripe for active subscription
- cancel-subscription: Sets cancel_at_period_end
- customer-portal: Stripe billing portal

## Key Files
- src/hooks/useSubscription.ts: subscription state + daily usage tracking
- src/components/UpgradeModal.tsx: reusable paywall modal
- src/pages/Pricing.tsx: tier comparison page
- Settings has subscription management section with cancel flow
