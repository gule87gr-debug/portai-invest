Full backup of payment/subscription features removed per user request. Reinstall when user says "reinstall all payment features".

## Files That Were Payment-Only (kept but unused)
- src/pages/Pricing.tsx — full pricing page with Free vs Pro comparison
- src/components/UpgradeModal.tsx — reusable paywall modal
- src/hooks/useSubscription.ts — subscription state hook + trackAnalysis
- supabase/functions/create-checkout/index.ts
- supabase/functions/check-subscription/index.ts
- supabase/functions/cancel-subscription/index.ts
- supabase/functions/customer-portal/index.ts

## Route Removed
- App.tsx: `<Route path="/pricing" element={<Pricing />} />` and `import Pricing from "./pages/Pricing"`

## Dashboard.tsx Changes
- Removed imports: useSubscription, trackAnalysis, UpgradeModal, Crown
- Removed: showUpgrade state, isPro/dailyAnalysesUsed/canAnalyze/refresh from useSubscription
- Removed: UpgradeModal component in render
- Removed: canAnalyze check in handleAnalyze (lines 48-51)
- Removed: trackAnalysis() call after successful analysis (line 61)
- Removed: refresh() call after analysis (line 62)
- Removed: upgrade success toast from searchParams (lines 37-44)
- Removed: remaining counter display (lines 98-107, line 73)
- Kept: FREE_DAILY_ANALYSES const was removed

## AIChat.tsx Changes
- Removed: useSubscription import and usage
- Removed: Crown import
- Removed: isPro Priority badge (lines 203-207)

## Quiz.tsx Changes
- Removed: useSubscription import and usage, UpgradeModal import
- Removed: isPro check — quiz results now always shown unlocked
- Removed: blur overlay for free users (lines 78-94)
- Removed: isPro conditional on action buttons (line 143)
- Changed: results always show retake + build portfolio buttons

## Watchlists.tsx Changes
- Removed: useSubscription import, UpgradeModal import
- Removed: isPro, showUpgrade, upgradeMsg state
- Removed: FREE_MAX_WATCHLISTS, FREE_MAX_STOCKS limits
- Removed: canCreateWatchlist/canAddStock checks
- Removed: UpgradeModal in render
- Removed: upgrade limit checks in handleNewListClick, handleAddStockClick, handleAddStock
- Removed: stock count display for free users (line 240-242)
- Removed: tooltip upgrade messages

## SettingsPage.tsx Changes
- Removed: useSubscription import
- Removed: subscription management section (lines 121-211) — the entire card with plan display, cancel modal, manage billing
- Removed: Crown, CreditCard, AlertTriangle imports (subscription-related only)
- Removed: cancelLoading, showCancelModal states
- Removed: handleCancelSubscription, handleManageBilling functions
- Removed: formattedEnd, subscriptionEnd, cancelAtPeriodEnd, subscriptionId variables

## Stripe Config (kept)
- Product: prod_UCbv3XBPzcIcTF
- Price: price_1TEChWAIaAlyM68hjTFBLtAl
- Edge functions kept deployed but unused
