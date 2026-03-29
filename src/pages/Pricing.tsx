import { AppLayout } from "@/components/AppLayout";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { Crown, Check, Loader2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const freeTierFeatures = [
  "3 article analyses per day",
  "1 watchlist",
  "5 stocks per watchlist",
  "Forum access (read & post)",
  "Basic AI chat",
  "Take the investor quiz",
];

const proTierFeatures = [
  "Unlimited article analyses",
  "Unlimited watchlists",
  "Unlimited stocks per watchlist",
  "Full quiz results & investor profile",
  "Priority AI chat (faster, better)",
  "AI price alerts",
  "Forum access (read & post)",
];

const Pricing = () => {
  const { isPro, loading, cancelAtPeriodEnd } = useSubscription();
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const handleUpgrade = async () => {
    setCheckoutLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout");
      console.log("Checkout response:", data, error);
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      } else {
        console.error("No checkout URL returned:", data);
      }
    } catch (e: any) {
      console.error("Checkout error:", e);
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl py-8">
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">Choose Your Plan</h1>
          <p className="text-muted-foreground max-w-lg mx-auto">Invest smarter with the tools and insights that match your ambition.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Free Tier */}
          <div className={cn("rounded-2xl border p-6 sm:p-8", !isPro ? "border-primary bg-primary/5" : "border-border bg-card")}>
            {!isPro && <span className="inline-block rounded-full bg-primary/20 px-3 py-1 text-xs font-semibold text-primary mb-4">Current Plan</span>}
            <h2 className="text-2xl font-bold mb-1">Free</h2>
            <p className="text-muted-foreground text-sm mb-6">Get started with essential features</p>
            <div className="text-4xl font-bold font-mono mb-6">$0<span className="text-lg text-muted-foreground font-normal">/mo</span></div>
            <ul className="space-y-3 mb-8">
              {freeTierFeatures.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            {!isPro && (
              <button disabled className="w-full rounded-xl border border-border py-3 text-sm font-medium text-muted-foreground">
                Your Current Plan
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
            <div className="mb-1"><span className="inline-block rounded-full bg-green-500/20 px-2.5 py-0.5 text-xs font-semibold text-green-500">40% OFF</span></div>
            <div className="text-4xl font-bold font-mono mb-6">$9.99<span className="text-lg text-muted-foreground font-normal line-through ml-2">$16.99</span><span className="text-lg text-muted-foreground font-normal">/mo</span></div>
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
                onClick={handleUpgrade}
                disabled={checkoutLoading || loading}
                className="w-full rounded-xl bg-primary py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {checkoutLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crown className="h-4 w-4" />}
                {checkoutLoading ? "Redirecting..." : "Upgrade to Pro"}
              </button>
            )}
            {isPro && !cancelAtPeriodEnd && (
              <button disabled className="w-full rounded-xl border border-primary py-3 text-sm font-medium text-primary">
                Your Current Plan
              </button>
            )}
            {isPro && cancelAtPeriodEnd && (
              <button
                onClick={handleUpgrade}
                disabled={checkoutLoading}
                className="w-full rounded-xl bg-primary py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {checkoutLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
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
