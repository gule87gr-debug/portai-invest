# Plan: Pricing verification, admin panel, billing widget, Stripe audit

Four independent pieces. Each is shippable on its own.

## 1. Admin bypass → database-backed + audit log

Replace hardcoded `ADMIN_EMAILS = ["gule.87.gr@gmail.com"]` in 4 edge functions (`check-subscription`, `chat`, `analyze-link`, `get-premium-articles`) with a DB lookup.

**Migration**
- `admin_emails` table: `id`, `email` (citext unique), `note`, `created_by`, `created_at`. RLS: only `service_role` reads/writes (no client access).
- `admin_bypass_audit` table: `id`, `email`, `function_name`, `user_id`, `created_at`. RLS: service-role only.
- Seed `gule.87.gr@gmail.com` so current access keeps working.
- SECURITY DEFINER function `is_admin_email(_email text) returns boolean`.
- SECURITY DEFINER function `log_admin_bypass(_email, _function_name, _user_id)` for audit insert.

**Edge functions**
- Each function calls `is_admin_email` via service-role client; on hit, calls `log_admin_bypass` and proceeds as Pro.

**Admin panel (UI)**
- New route `/admin` in `App.tsx`. Visible only when the current user's email is in `admin_emails` (checked through a new tiny edge function `admin-check` that returns `{ isAdmin: boolean }`).
- New edge function `admin-manage-bypass` (service-role, JWT-validated, gated by `is_admin_email`): supports `list`, `add`, `remove` actions, and `list_audit` (returns last 100 audit rows).
- `src/pages/Admin.tsx`: table of bypass emails with add/remove, plus audit log table. Sidebar link rendered only when admin.

## 2. Billing status widget

- New `src/components/BillingStatusWidget.tsx`: reads `useSubscription()`, shows tier badge (Free / Plus / Pro), current monthly price (€0 / €8.99 / €15.99 derived from tier), and next billing date (`subscriptionEnd` formatted; "—" when free). "Manage billing" button calls `customer-portal` for paid users; "Upgrade" opens `UpgradeModal` for free users.
- Mount on `SettingsPage` (top of the page, above existing sections) so it's visible at `/settings` where the user already is.

## 3. Stripe pricing audit

Add `supabase/functions/verify-stripe-pricing/index.ts` (admin-only). Lists all products and prices via Stripe, asserts:
- `prod_UEROAe01UbaEpK` (Pro) active, has exactly one active price = `price_1TPQ1oPJefLcxc6CTI4Hf42E` at 1599 EUR/month.
- `prod_UO8LzRA6kfvdwm` (Plus) active, has exactly one active price = `price_1TPM56PJefLcxc6CzfD5CUaS` at 899 EUR/month.
- All other prices on those products are `active: false`.
Returns `{ ok, issues[] }`. Admin panel has a "Run Stripe audit" button that displays results.

## 4. Automated test

Add `supabase/functions/check-subscription/pricing_test.ts` (Deno test, follows existing `index_test.ts` pattern). Mocks Stripe by injecting a stub or hits live test mode via `STRIPE_SECRET_KEY`:
- Asserts the price-id → tier map returns `tier: "pro"` only for `price_1TPQ1oPJefLcxc6CTI4Hf42E` (1599 EUR).
- Asserts no other active EUR Pro price exists in Stripe (via `stripe.prices.list({ product: PRO_PRODUCT })`).
- Asserts a user with that active subscription gets `subscribed: true, tier: "pro"` from the function output mapping.
- Runs via `supabase--test_edge_functions`.

## Technical details

- Tables and functions in `public` schema, `search_path = public` on all SECURITY DEFINER functions.
- `admin-manage-bypass` edge function does its own JWT validation + `is_admin_email` gate to prevent privilege escalation.
- Audit insert is fire-and-forget (don't fail the request if logging fails) but errors are `console.error`'d.
- `BillingStatusWidget` is presentation-only; no new business logic, reuses `useSubscription`.
- USD price `price_1TFyVKPJefLcxc6Cn1iwdSTk` is already deactivated; the audit function will flag if it ever flips back on.

## Out of scope
- No changes to checkout flow itself (already only references the EUR prices).
- No automated email/alerts from the audit — admin must run it manually.
- No role-based system beyond the bypass list (a dedicated `user_roles` table can come later if needed).

Approve and I'll implement all four parts.
