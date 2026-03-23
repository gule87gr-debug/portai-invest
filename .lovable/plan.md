

# Monetization & Paywalls — Implementation Plan

This is a large feature spanning Stripe integration, subscription management, tier enforcement, and UI paywalls. Here's the plan broken into phases.

---

## Phase 1: Enable Stripe & Database Schema

**Stripe Setup**
- Enable Stripe using the Lovable Stripe tool (collects secret key, creates products/prices)
- Create a recurring subscription product: "PortAI Pro" at $9.99/month

**Database Migration** — new `subscriptions` table:
- `id`, `user_id` (references auth.users), `stripe_customer_id`, `stripe_subscription_id`, `status` (free/pro/cancelled), `current_period_end`, `cancel_at_period_end`, `created_at`, `updated_at`
- RLS: users can read their own row; service role can insert/update
- Default row created for each user with `status = 'free'`

---

## Phase 2: Stripe Edge Functions

**`create-checkout` Edge Function:**
- Accepts authenticated user, creates/retrieves Stripe customer, starts a Checkout Session for the Pro subscription
- Success URL → `/dashboard?upgrade=success`, Cancel URL → `/pricing`

**`stripe-webhook` Edge Function:**
- Handles `checkout.session.completed` → upsert subscription to `pro`
- Handles `customer.subscription.deleted` → set status to `free`, delete excess watchlists (keep most recent)
- Handles `customer.subscription.updated` → update `current_period_end`

**`cancel-subscription` Edge Function:**
- Authenticated user calls this to cancel at period end via Stripe API
- Updates `cancel_at_period_end = true` in database

**`create-portal-session` Edge Function (optional):**
- For Stripe Customer Portal access if needed

---

## Phase 3: Subscription Context & Hook

**`useSubscription` hook:**
- Queries `subscriptions` table for current user
- Exposes `isPro`, `status`, `currentPeriodEnd`, `cancelAtPeriodEnd`
- Provides helper functions: `checkAnalysisLimit()`, `checkWatchlistLimit()`, `checkStockLimit()`

**Analysis tracking:**
- New `analysis_usage` table: `user_id`, `date`, `count` — tracks daily article analyses
- Or simpler: count today's analyses from a lightweight tracking mechanism

---

## Phase 4: Pricing Page

**New `/pricing` page:**
- Two-tier comparison card (Free vs Pro at $9.99/mo)
- Free tier shows current limits; Pro shows unlimited features
- "Upgrade to Pro" button calls `create-checkout` edge function → redirects to Stripe Checkout
- If already Pro, show "Current Plan" badge
- Add route to `App.tsx`

---

## Phase 5: Upgrade Modal Component

**`UpgradeModal` component:**
- Reusable modal with customizable title/description
- "Upgrade to Pro" button links to `/pricing`
- "Maybe Later" dismiss button
- Used across all paywall touchpoints

---

## Phase 6: Enforce Limits in UI

**Dashboard (article analysis):**
- Track daily analysis count; after 3, show UpgradeModal instead of analyzing
- Show remaining analyses counter for free users

**Watchlists:**
- Block "Create Watchlist" when free user has 1 watchlist → show UpgradeModal
- Disable "Add Stock" when free user has 5 stocks in a watchlist → show upgrade tooltip
- Grey out button with tooltip text

**Quiz:**
- Free users can take the quiz but results page is blurred with an overlay UpgradeModal saying "Unlock Your Investor Profile"

**AI Chat:**
- Add "Priority AI" badge for Pro users
- Free users get basic access (no blocking, just different UX indicator)

---

## Phase 7: Settings — Subscription Management

**Add subscription section to SettingsPage:**
- Show current plan (Free / Pro) with badge
- For Pro users: show next billing date, "Cancel Subscription" button
- Cancel flow: warning modal listing what will be lost → confirm → calls `cancel-subscription` edge function
- Show "Cancelled — access until [date]" state
- For cancelled users: "Resubscribe" button linking to `/pricing`

**Cancellation email:**
- New transactional email template `subscription-cancelled`
- Sent when user cancels via the edge function

---

## Phase 8: Post-Checkout Success Flow

- Dashboard checks for `?upgrade=success` query param
- Shows a success toast: "Welcome to Pro! All features are now unlocked"
- Refetch subscription status immediately

---

## Technical Details

**Files to create:**
- `src/hooks/useSubscription.ts` — subscription state hook
- `src/components/UpgradeModal.tsx` — reusable paywall modal
- `src/pages/Pricing.tsx` — pricing comparison page
- `supabase/functions/create-checkout/index.ts`
- `supabase/functions/stripe-webhook/index.ts`
- `supabase/functions/cancel-subscription/index.ts`
- `supabase/functions/_shared/transactional-email-templates/subscription-cancelled.tsx`

**Files to modify:**
- `src/App.tsx` — add `/pricing` route
- `src/pages/Dashboard.tsx` — analysis limit enforcement
- `src/pages/Watchlists.tsx` — watchlist/stock limit enforcement
- `src/pages/Quiz.tsx` — blur results for free users
- `src/pages/AIChat.tsx` — Pro badge indicator
- `src/pages/SettingsPage.tsx` — subscription management section
- `src/contexts/AppContext.tsx` — expose subscription data
- `supabase/config.toml` — register new edge functions

**Database changes:**
- New `subscriptions` table with RLS
- New `analysis_usage` table (user_id, used_date, count) with RLS

