import { AppLayout } from "@/components/AppLayout";
import { useSubscription, type SubscriptionTier } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { Crown, Check, Loader2, X, Sparkles, AlertTriangle, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const freeTierFeatures = [
  "3 article analyses per day",
  "10 AI chat messages / 12h",
  "3 image analyses / 24h",
  "1 watchlist · 5 stocks",
  "Locked quiz results",
  "Forum access (read & post)",
];

const plusTierFeatures = [
  "Full quiz results & investor profile",
  "Unlimited AI chat messages",
  "Unlimited image analyses",
  "Unlimited watchlists & stocks",
  "Forum access (read & post)",
];

const proTierFeatures = [
  "Everything in Plus",
  "Unlimited article analyses",
  "AI price alerts",
  "Priority AI chat (faster, better)",
  "Forum access (read & post)",
];

const TIER_PRICE: Record<"plus" | "pro", string> = {
  plus: "€8.99",
  pro: "€15.99",
};

const Pricing = () => {
  const { tier, loading, cancelAtPeriodEnd, refresh } = useSubscription();
  const navigate = useNavigate();
  const [checkoutLoading, setCheckoutLoading] = useState<SubscriptionTier | null>(null);
  const [pendingTarget, setPendingTarget] = useState<"plus" | "pro" | null>(null);
  // LEGAL: terms acceptance is mandatory.
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  // LEGAL (EU Art. 16(m)): the 14-day right of withdrawal is only lost if the user
  // EXPRESSLY waives it. We default to false so users keep the refund right unless
  // they tick this box. We allow checkout either way — the box is informational, not blocking.
  const [euWaiver, setEuWaiver] = useState(false);
  const [reactivating, setReactivating] = useState(false);

  const beginUpgradeFlow = (target: "plus" | "pro") => {
    setAcceptedTerms(false);
    setEuWaiver(false);
    setPendingTarget(target);
  };

  const confirmUpgrade = async () => {
    if (!pendingTarget) return;
    if (!acceptedTerms) {
      toast.error("Please accept the Terms of Service and Privacy Policy to continue.");
      return;
    }
    const target = pendingTarget;
    const targetLabel = target === "pro" ? "Pro" : "Plus";
    const price = TIER_PRICE[target];
    // Verbatim consent text recorded server-side as legal proof.
    const consentText = [
      `I subscribe to PortAI ${targetLabel} at ${price}/month, billed monthly via Stripe.`,
      `I have read and accept the Terms of Service and Privacy Policy.`,
      euWaiver
        ? `I expressly request that performance of the digital service begins immediately and acknowledge that, by doing so, I lose my 14-day right of withdrawal once performance has fully begun (Directive 2011/83/EU, Art. 16(m)).`
        : `I have NOT waived my 14-day right of withdrawal. I may request a full refund within 14 calendar days of purchase, subject to a deduction proportional to any service already used.`,
    ].join(" ");
    setCheckoutLoading(target);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          tier: target,
          accepted_terms: acceptedTerms,
          eu_withdrawal_waiver: euWaiver,
          consent_text: consentText,
        },
      });
      if (error) throw error;

      // Server may detect duplicate / pending-cancel / past-due states and respond accordingly.
      if (data?.action === "manage" && data?.url) {
        toast.info(
          data.reason === "already_subscribed"
            ? "You're already on this plan — opening your billing portal."
            : "Opening your billing portal."
        );
        window.location.href = data.url;
        return;
      }
      if (data?.action === "upgraded") {
        toast.success("Plan upgraded — only the prorated difference was charged.");
        await refresh();
        navigate("/upgrade-success");
        return;
      }
      if (data?.action === "downgrade_scheduled") {
        toast.success("Downgrade scheduled for the end of your current billing period.");
        await refresh();
        navigate("/settings");
        return;
      }
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
      console.error("Unexpected checkout response:", data);
      toast.error("Couldn't start checkout — please try again.");
    } catch (e: any) {
      console.error("Checkout error:", e);
      const ctx = e?.context;
      const code = ctx?.code ?? e?.code;
      const msg =
        code === "subscription_past_due"
          ? "Your subscription has an unpaid invoice. Please update your payment method first."
          : code === "schedule_already_pending"
          ? "A plan change is already scheduled. Manage it from Settings before changing again."
          : code === "subscription_pending_cancel"
          ? "Your subscription is set to cancel. Reactivate it from Settings before changing plans."
          : code === "terms_not_accepted"
          ? "You must accept the Terms of Service and Privacy Policy to subscribe."
          : e?.message || "Checkout failed — please try again.";
      toast.error(msg);
    } finally {
      setCheckoutLoading(null);
      setPendingTarget(null);
    }
  };

  const handleReactivate = async () => {
    setReactivating(true);
    try {
      const { error } = await supabase.functions.invoke("reactivate-subscription");
      if (error) throw error;
      toast.success("Subscription reactivated — you won't be charged again until your next billing date.");
      await refresh();
    } catch (e: any) {
      toast.error(e?.message || "Failed to reactivate subscription");
    } finally {
      setReactivating(false);
    }
  };

  const isFree = tier === "free";
  const isPlus = tier === "plus";
  const isPro = tier === "pro";

  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl py-8 relative">
        <button
          onClick={() => navigate(-1)}
          className="absolute top-8 right-0 rounded-full p-2 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          title="Close"
          aria-label="Close pricing page"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">Choose Your Plan</h1>
          <p className="text-muted-foreground max-w-lg mx-auto">Invest smarter with the tools and insights that match your ambition.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Free Tier */}
          <div className={cn("rounded-2xl border p-6 sm:p-8", isFree ? "border-primary bg-primary/5" : "border-border bg-card")}>
            {isFree && <span className="inline-block rounded-full bg-primary/20 px-3 py-1 text-xs font-semibold text-primary mb-4">Current Plan</span>}
            <h2 className="text-2xl font-bold mb-1">Free</h2>
            <p className="text-muted-foreground text-sm mb-6">Get started with the essentials</p>
            <div className="text-4xl font-bold font-mono mb-6">€0<span className="text-lg text-muted-foreground font-normal">/mo</span></div>
            <ul className="space-y-3 mb-8">
              {freeTierFeatures.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            {isFree && (
              <button disabled className="w-full rounded-xl border border-border py-3 text-sm font-medium text-muted-foreground">
                Your Current Plan
              </button>
            )}
          </div>

          {/* Plus Tier */}
          <div className={cn("rounded-2xl border p-6 sm:p-8 relative", isPlus ? "border-primary bg-primary/5" : "border-border bg-card")}>
            {isPlus && !cancelAtPeriodEnd && <span className="inline-block rounded-full bg-primary/20 px-3 py-1 text-xs font-semibold text-primary mb-4">Current Plan</span>}
            {isPlus && cancelAtPeriodEnd && <span className="inline-block rounded-full bg-warning/20 px-3 py-1 text-xs font-semibold text-warning mb-4">Cancelling</span>}
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-bold">Plus</h2>
            </div>
            <p className="text-muted-foreground text-sm mb-6">Quiz, unlimited chat & watchlists</p>
            <div className="mb-1"><span className="inline-block rounded-full bg-green-500/20 px-2.5 py-0.5 text-xs font-semibold text-green-500">40% OFF</span></div>
            <div className="text-4xl font-bold font-mono mb-6">€8.99<span className="text-lg text-muted-foreground font-normal line-through ml-2">€14.99</span><span className="text-lg text-muted-foreground font-normal">/mo</span></div>
            <ul className="space-y-3 mb-8">
              {plusTierFeatures.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            {!isPlus && !isPro && (
              <button
                onClick={() => beginUpgradeFlow("plus")}
                disabled={checkoutLoading !== null || loading}
                className="w-full rounded-xl bg-primary py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {checkoutLoading === "plus" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {checkoutLoading === "plus" ? "Redirecting..." : "Upgrade to Plus"}
              </button>
            )}
            {isPlus && !cancelAtPeriodEnd && (
              <button disabled className="w-full rounded-xl border border-primary py-3 text-sm font-medium text-primary">
                Your Current Plan
              </button>
            )}
            {isPlus && cancelAtPeriodEnd && (
              <button
                onClick={handleReactivate}
                disabled={reactivating}
                className="w-full rounded-xl bg-primary py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {reactivating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Reactivate (no extra charge)
              </button>
            )}
            {isPro && (
              <button disabled className="w-full rounded-xl border border-border py-3 text-sm font-medium text-muted-foreground">
                Included in Pro
              </button>
            )}
          </div>

          {/* Pro Tier */}
          <div className={cn("rounded-2xl border p-6 sm:p-8 relative", isPro ? "border-primary bg-primary/5" : "border-border bg-card")}>
            {isPro && !cancelAtPeriodEnd && <span className="inline-block rounded-full bg-primary/20 px-3 py-1 text-xs font-semibold text-primary mb-4">Current Plan</span>}
            {isPro && cancelAtPeriodEnd && <span className="inline-block rounded-full bg-warning/20 px-3 py-1 text-xs font-semibold text-warning mb-4">Cancelling</span>}
            <div className="flex items-center gap-2 mb-1">
              <Crown className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-bold">Pro</h2>
            </div>
            <p className="text-muted-foreground text-sm mb-6">Full access to all premium features</p>
            <div className="mb-1"><span className="inline-block rounded-full bg-green-500/20 px-2.5 py-0.5 text-xs font-semibold text-green-500">36% OFF</span></div>
            <div className="text-4xl font-bold font-mono mb-6">€15.99<span className="text-lg text-muted-foreground font-normal line-through ml-2">€24.99</span><span className="text-lg text-muted-foreground font-normal">/mo</span></div>
            <ul className="space-y-3 mb-8">
              {proTierFeatures.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            {!isPro && (
              <button
                onClick={() => beginUpgradeFlow("pro")}
                disabled={checkoutLoading !== null || loading}
                className="w-full rounded-xl bg-primary py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {checkoutLoading === "pro" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crown className="h-4 w-4" />}
                {checkoutLoading === "pro" ? "Redirecting..." : isPlus ? "Upgrade to Pro" : "Upgrade to Pro"}
              </button>
            )}
            {isPro && !cancelAtPeriodEnd && (
              <button disabled className="w-full rounded-xl border border-primary py-3 text-sm font-medium text-primary">
                Your Current Plan
              </button>
            )}
            {isPro && cancelAtPeriodEnd && (
              <button
                onClick={handleReactivate}
                disabled={reactivating}
                className="w-full rounded-xl bg-primary py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {reactivating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Reactivate (no extra charge)
              </button>
            )}
          </div>
        </div>

        {/* Trust footer */}
        <div className="mt-10 grid sm:grid-cols-3 gap-4 text-xs text-muted-foreground">
          <div className="rounded-lg border border-border bg-card/50 p-3 flex items-start gap-2">
            <ShieldCheck className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <span>Secure checkout via Stripe. We never store your card details.</span>
          </div>
          <div className="rounded-lg border border-border bg-card/50 p-3 flex items-start gap-2">
            <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <span>Cancel anytime from Settings — access continues until the end of your billing period.</span>
          </div>
          <div className="rounded-lg border border-border bg-card/50 p-3 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
            <span>EU customers retain a 14-day right of withdrawal where applicable. See <Link to="/terms-of-service" className="underline">Terms</Link>.</span>
          </div>
        </div>
      </div>

      {/* Confirmation modal — required before any new charge */}
      {pendingTarget && (() => {
        const target = pendingTarget;
        const targetLabel = target === "pro" ? "Pro" : "Plus";
        const price = TIER_PRICE[target];
        const inFlight = checkoutLoading === target;
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-upgrade-title"
          >
            <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
                  {target === "pro" ? <Crown className="h-5 w-5 text-primary" /> : <Sparkles className="h-5 w-5 text-primary" />}
                </div>
                <h2 id="confirm-upgrade-title" className="text-lg font-bold">Subscribe to {targetLabel}?</h2>
              </div>

              <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-1 mb-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Plan</span>
                  <span className="font-semibold text-foreground">{targetLabel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Price</span>
                  <span className="font-semibold text-foreground">{price}/month, billed monthly</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">First charge</span>
                  <span className="text-foreground">Today</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Renews</span>
                  <span className="text-foreground">Automatically each month</span>
                </div>
              </div>

              <div className="rounded-lg border border-warning/40 bg-warning/10 p-3 text-xs text-muted-foreground mb-4 space-y-2">
                <p>
                  You will be redirected to <span className="font-medium text-foreground">Stripe</span> to complete payment.
                  Your subscription renews automatically each month at {price} until you cancel.
                </p>
                <p>
                  You can cancel anytime from Settings — your access continues until the end of the current billing period.
                  Cancelling does <span className="font-medium text-foreground">not</span> refund the current period.
                </p>
              </div>

              {/* Mandatory: Terms acceptance */}
              <label className="flex items-start gap-2 text-xs text-muted-foreground mb-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-primary"
                  aria-required="true"
                />
                <span>
                  <span className="font-medium text-foreground">Required.</span> I will be charged {price} today and every month until I cancel. I have read and accept the{" "}
                  <Link to="/terms-of-service" target="_blank" className="underline">Terms of Service</Link> and{" "}
                  <Link to="/privacy-policy" target="_blank" className="underline">Privacy Policy</Link>.
                </span>
              </label>

              {/* EU Art. 16(m) waiver — explicit informed choice */}
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 mb-4 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                  <AlertTriangle className="h-3.5 w-3.5 text-primary" />
                  EU consumers — your 14-day right of withdrawal
                </div>
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  Under EU law (Directive 2011/83/EU, Art. 16(m)), digital services normally come with a <span className="font-medium text-foreground">14-day right to cancel and get a refund</span>. You must choose one of the two options below before paying:
                </p>

                <label className="flex items-start gap-2 text-xs cursor-pointer rounded-md border border-border bg-background/60 p-2.5 hover:border-primary/40 transition-colors">
                  <input
                    type="checkbox"
                    checked={euWaiver}
                    onChange={(e) => setEuWaiver(e.target.checked)}
                    className="mt-0.5 h-4 w-4 accent-primary"
                  />
                  <span className="text-muted-foreground">
                    <span className="block font-medium text-foreground mb-0.5">✓ Tick to start using {targetLabel} immediately</span>
                    I expressly request that the service begins right now and I understand that, by doing so, I <span className="font-medium text-foreground">waive my 14-day right of withdrawal</span> as soon as performance has fully begun. No refund will be available after that point.
                  </span>
                </label>

                <div className="rounded-md border border-dashed border-border/70 bg-background/30 p-2.5 text-[11px] text-muted-foreground">
                  <span className="block font-medium text-foreground mb-0.5">☐ Leave unticked to keep your refund right</span>
                  You will still be charged {price} today and access starts immediately, but you may request a refund within <span className="font-medium text-foreground">14 days</span>. The refund will be reduced in proportion to the service already used during that period.
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setPendingTarget(null)}
                  disabled={inFlight}
                  className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium hover:bg-accent disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmUpgrade}
                  disabled={inFlight || !acceptedTerms}
                  className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {inFlight && <Loader2 className="h-4 w-4 animate-spin" />}
                  Continue to secure checkout
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </AppLayout>
  );
};

export default Pricing;
