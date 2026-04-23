import { AppLayout } from "@/components/AppLayout";
import { useSubscription, type SubscriptionTier } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { Crown, Check, Loader2, X, Sparkles } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

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

const Pricing = () => {
  const { tier, loading, cancelAtPeriodEnd } = useSubscription();
  const navigate = useNavigate();
  const [checkoutLoading, setCheckoutLoading] = useState<SubscriptionTier | null>(null);

  const handleUpgrade = async (target: "plus" | "pro") => {
    setCheckoutLoading(target);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { tier: target },
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      } else {
        console.error("No checkout URL returned:", data);
      }
    } catch (e: any) {
      console.error("Checkout error:", e);
    } finally {
      setCheckoutLoading(null);
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
                onClick={() => handleUpgrade("plus")}
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
                onClick={() => handleUpgrade("plus")}
                disabled={checkoutLoading !== null}
                className="w-full rounded-xl bg-primary py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {checkoutLoading === "plus" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Resubscribe
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
            <div className="mb-1"><span className="inline-block rounded-full bg-green-500/20 px-2.5 py-0.5 text-xs font-semibold text-green-500">24% OFF</span></div>
            <div className="text-4xl font-bold font-mono mb-6">€18.99<span className="text-lg text-muted-foreground font-normal line-through ml-2">€24.99</span><span className="text-lg text-muted-foreground font-normal">/mo</span></div>
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
                onClick={() => handleUpgrade("pro")}
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
                onClick={() => handleUpgrade("pro")}
                disabled={checkoutLoading !== null}
                className="w-full rounded-xl bg-primary py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {checkoutLoading === "pro" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Resubscribe
              </button>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Pricing;
