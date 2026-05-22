import { SEO } from "@/components/SEO";
import { Helmet } from "react-helmet-async";
import { AppLayout } from "@/components/AppLayout";
import { useSubscription, type SubscriptionTier } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { Crown, Check, Loader2, X, Sparkles, AlertTriangle, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { TrialActivation } from "@/components/TrialActivation";

const TIER_PRICE: Record<"plus" | "pro", string> = {
  plus: "€8.99",
  pro: "€15.99",
};

const Pricing = () => {
  const { tier, loading, cancelAtPeriodEnd, refresh } = useSubscription();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [checkoutLoading, setCheckoutLoading] = useState<SubscriptionTier | null>(null);
  const [pendingTarget, setPendingTarget] = useState<"plus" | "pro" | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [euWaiver, setEuWaiver] = useState(false);
  const [reactivating, setReactivating] = useState(false);

  const freeTierFeatures = [
    t("featFreeAnalyses"), t("featFreeChat"), t("featFreeImg"),
    t("featFreeWatch"), t("featFreeQuiz"), t("featForumAccess"),
  ];
  const plusTierFeatures = [
    t("featPlusQuiz"), t("featPlusChat"), t("featPlusImg"),
    t("featPlusWatch"), t("featPlusDeepDive"), t("featForumAccess"),
  ];
  const proTierFeatures = [
    t("featProEverything"), t("featProAnalyses"), t("featProAlerts"),
    t("featProPriority"), t("featForumAccess"),
  ];

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
        body: { tier: target, accepted_terms: acceptedTerms, eu_withdrawal_waiver: euWaiver, consent_text: consentText },
      });
      if (error) throw error;

      if (data?.action === "manage" && data?.url) {
        toast.info(data.reason === "already_subscribed"
          ? "You're already on this plan — opening your billing portal."
          : "Opening your billing portal.");
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
      if (data?.url) { window.location.href = data.url; return; }
      toast.error("Couldn't start checkout — please try again.");
    } catch (e: any) {
      const ctx = e?.context;
      const code = ctx?.code ?? e?.code;
      const msg =
        code === "subscription_past_due" ? "Your subscription has an unpaid invoice. Please update your payment method first."
        : code === "schedule_already_pending" ? "A plan change is already scheduled. Manage it from Settings before changing again."
        : code === "subscription_pending_cancel" ? "Your subscription is set to cancel. Reactivate it from Settings before changing plans."
        : code === "terms_not_accepted" ? "You must accept the Terms of Service and Privacy Policy to subscribe."
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
      <SEO
        title="Pricing — PortAI Plus & Pro Plans"
        description="Compare PortAI Free, Plus and Pro plans. Unlock AI bias detection, fact-checking, deeper market analysis and unlimited watchlists."
        path="/pricing"
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Product",
          name: "PortAI",
          description: "AI financial news bias checker and portfolio tracker subscription.",
          brand: { "@type": "Brand", name: "PortAI" },
          offers: [
            { "@type": "Offer", name: "Free", price: "0", priceCurrency: "EUR", url: "https://portai-invest.com/pricing", availability: "https://schema.org/InStock" },
            { "@type": "Offer", name: "Plus", price: "8.99", priceCurrency: "EUR", url: "https://portai-invest.com/pricing", availability: "https://schema.org/InStock" },
            { "@type": "Offer", name: "Pro", price: "15.99", priceCurrency: "EUR", url: "https://portai-invest.com/pricing", availability: "https://schema.org/InStock" },
          ],
        })}</script>
      </Helmet>
      <div className="mx-auto max-w-6xl py-8 relative">
        <button
          onClick={() => navigate(-1)}
          className="absolute top-8 right-0 rounded-full p-2 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          title={t("cancelBtn")}
          aria-label={t("closeAria")}
        >
          <X className="h-5 w-5" />
        </button>
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">{t("choosePlan")}</h1>
          <p className="text-muted-foreground max-w-lg mx-auto">{t("pricingSubtitle")}</p>
        </div>

        <div className="mb-8">
          <TrialActivation />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Free */}
          <div className={cn("rounded-2xl border p-6 sm:p-8", isFree ? "border-primary bg-primary/5" : "border-border bg-card")}>
            {isFree && <span className="inline-block rounded-full bg-primary/20 px-3 py-1 text-xs font-semibold text-primary mb-4">{t("currentPlan")}</span>}
            <h2 className="text-2xl font-bold mb-1">{t("tierFree")}</h2>
            <p className="text-muted-foreground text-sm mb-6">{t("tierFreeDesc")}</p>
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
                {t("yourCurrentPlan")}
              </button>
            )}
          </div>

          {/* Plus */}
          <div className={cn("rounded-2xl border p-6 sm:p-8 relative", isPlus ? "border-primary bg-primary/5" : "border-border bg-card")}>
            {isPlus && !cancelAtPeriodEnd && <span className="inline-block rounded-full bg-primary/20 px-3 py-1 text-xs font-semibold text-primary mb-4">{t("currentPlan")}</span>}
            {isPlus && cancelAtPeriodEnd && <span className="inline-block rounded-full bg-warning/20 px-3 py-1 text-xs font-semibold text-warning mb-4">{t("cancellingBadge")}</span>}
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-bold">{t("tierPlus")}</h2>
            </div>
            <p className="text-muted-foreground text-sm mb-6">{t("tierPlusDesc")}</p>
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
              <>
                <button
                  onClick={() => beginUpgradeFlow("plus")}
                  disabled={checkoutLoading !== null || loading}
                  className="w-full rounded-xl bg-primary py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {checkoutLoading === "plus" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {checkoutLoading === "plus" ? t("redirecting") : t("upgradeToPlusBtn")}
                </button>
                <p className="mt-2 text-center text-[11px] text-muted-foreground flex items-center justify-center gap-1">
                  <Check className="h-3 w-3 text-primary" /> {t("cancelAnytimeShort")}
                </p>
              </>
            )}
            {isPlus && !cancelAtPeriodEnd && (
              <button disabled className="w-full rounded-xl border border-primary py-3 text-sm font-medium text-primary">
                {t("yourCurrentPlan")}
              </button>
            )}
            {isPlus && cancelAtPeriodEnd && (
              <button onClick={handleReactivate} disabled={reactivating} className="w-full rounded-xl bg-primary py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2">
                {reactivating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {t("reactivateNoCharge")}
              </button>
            )}
            {isPro && (
              <button disabled className="w-full rounded-xl border border-border py-3 text-sm font-medium text-muted-foreground">
                {t("includedInPro")}
              </button>
            )}
          </div>

          {/* Pro */}
          <div className={cn("rounded-2xl border-2 p-6 sm:p-8 relative shadow-xl shadow-primary/10", isPro ? "border-primary bg-primary/5" : "border-primary bg-gradient-to-b from-primary/[0.08] to-card")}>
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground shadow-lg shadow-primary/40 whitespace-nowrap">
              <Crown className="h-3 w-3" /> {t("mostPopular")}
            </span>
            {isPro && !cancelAtPeriodEnd && <span className="inline-block rounded-full bg-primary/20 px-3 py-1 text-xs font-semibold text-primary mb-4">{t("currentPlan")}</span>}
            {isPro && cancelAtPeriodEnd && <span className="inline-block rounded-full bg-warning/20 px-3 py-1 text-xs font-semibold text-warning mb-4">{t("cancellingBadge")}</span>}
            <div className="flex items-center gap-2 mb-1">
              <Crown className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-bold">{t("tierPro")}</h2>
            </div>
            <p className="text-muted-foreground text-sm mb-6">{t("tierProDesc")}</p>
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
              <>
                <button
                  onClick={() => beginUpgradeFlow("pro")}
                  disabled={checkoutLoading !== null || loading}
                  className="w-full rounded-xl bg-primary py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {checkoutLoading === "pro" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crown className="h-4 w-4" />}
                  {checkoutLoading === "pro" ? t("redirecting") : t("upgradeToProBtn")}
                </button>
                <p className="mt-2 text-center text-[11px] text-muted-foreground flex items-center justify-center gap-1">
                  <Check className="h-3 w-3 text-primary" /> {t("cancelAnytimeNQA")}
                </p>
              </>
            )}
            {isPro && !cancelAtPeriodEnd && (
              <button disabled className="w-full rounded-xl border border-primary py-3 text-sm font-medium text-primary">
                {t("yourCurrentPlan")}
              </button>
            )}
            {isPro && cancelAtPeriodEnd && (
              <button onClick={handleReactivate} disabled={reactivating} className="w-full rounded-xl bg-primary py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2">
                {reactivating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {t("reactivateNoCharge")}
              </button>
            )}
          </div>
        </div>

        <div className="mt-10 grid sm:grid-cols-3 gap-4 text-xs text-muted-foreground">
          <div className="rounded-lg border border-border bg-card/50 p-3 flex items-start gap-2">
            <ShieldCheck className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <span>{t("secureCheckoutNote")}</span>
          </div>
          <div className="rounded-lg border border-border bg-card/50 p-3 flex items-start gap-2">
            <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <span>{t("cancelFromSettingsNote")}</span>
          </div>
          <div className="rounded-lg border border-border bg-card/50 p-3 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
            <span>{t("euWithdrawalNote")} <Link to="/terms-of-service" className="underline">{t("terms")}</Link>.</span>
          </div>
        </div>
      </div>

      {pendingTarget && (() => {
        const target = pendingTarget;
        const targetLabel = target === "pro" ? "Pro" : "Plus";
        const price = TIER_PRICE[target];
        const inFlight = checkoutLoading === target;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in p-4" role="dialog" aria-modal="true">
            <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
                  {target === "pro" ? <Crown className="h-5 w-5 text-primary" /> : <Sparkles className="h-5 w-5 text-primary" />}
                </div>
                <h2 className="text-lg font-bold">{t("subscribeToTitle")} {targetLabel}?</h2>
              </div>

              <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-1 mb-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("planLabel")}</span>
                  <span className="font-semibold text-foreground">{targetLabel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("priceLabel")}</span>
                  <span className="font-semibold text-foreground">{price}/month, {t("billedMonthly")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("firstCharge")}</span>
                  <span className="text-foreground">{t("todayLabel")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("renewsLabel")}</span>
                  <span className="text-foreground">{t("renewsAuto")}</span>
                </div>
              </div>

              <div className="rounded-lg border border-warning/40 bg-warning/10 p-3 text-xs text-muted-foreground mb-4 space-y-2">
                <p>
                  {t("redirectStripeNotice1")} <span className="font-medium text-foreground">Stripe</span> {t("redirectStripeNotice2")} {price} {t("untilYouCancel")}
                </p>
                <p>
                  {t("cancelAnytimeInfo")} <span className="font-medium text-foreground">{t("notLabel")}</span> {t("refundCurrentPeriod")}
                </p>
              </div>

              <label className="flex items-start gap-2 text-xs text-muted-foreground mb-3 cursor-pointer">
                <input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} className="mt-0.5 h-4 w-4 accent-primary" aria-required="true" />
                <span>
                  <span className="font-medium text-foreground">{t("requiredLabel")}</span> {t("termsAcceptText1")} {price} {t("termsAcceptText2")}{" "}
                  <Link to="/terms-of-service" target="_blank" className="underline">{t("termsOfService")}</Link> {t("andLabel")}{" "}
                  <Link to="/privacy-policy" target="_blank" className="underline">{t("privacyPolicy")}</Link>.
                </span>
              </label>

              <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 mb-4 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                  <AlertTriangle className="h-3.5 w-3.5 text-primary" />
                  {t("euConsumersTitle")}
                </div>
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  {t("euLegalNotice")} <span className="font-medium text-foreground">{t("euLegal14day")}</span>{t("euLegalChoose")}
                </p>

                <label className="flex items-start gap-2 text-xs cursor-pointer rounded-md border border-border bg-background/60 p-2.5 hover:border-primary/40 transition-colors">
                  <input type="checkbox" checked={euWaiver} onChange={(e) => setEuWaiver(e.target.checked)} className="mt-0.5 h-4 w-4 accent-primary" />
                  <span className="text-muted-foreground">
                    <span className="block font-medium text-foreground mb-0.5">{t("euTickStartImmediately")} {targetLabel} {t("euTickStartImmediately2")}</span>
                    {t("euWaiveRefund")} <span className="font-medium text-foreground">{t("euWaiveRefundB")}</span> {t("euWaiveRefundC")}
                  </span>
                </label>

                <div className="rounded-md border border-dashed border-border/70 bg-background/30 p-2.5 text-[11px] text-muted-foreground">
                  <span className="block font-medium text-foreground mb-0.5">{t("euLeaveUnticked")}</span>
                  {t("euKeepRefund1")} {price} {t("euKeepRefund2")} <span className="font-medium text-foreground">{t("euKeepRefund3")}</span>{t("euKeepRefund4")}
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setPendingTarget(null)} disabled={inFlight} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium hover:bg-accent disabled:opacity-50">
                  {t("cancelBtn")}
                </button>
                <button onClick={confirmUpgrade} disabled={inFlight || !acceptedTerms} className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2">
                  {inFlight && <Loader2 className="h-4 w-4 animate-spin" />}
                  {t("continueToCheckout")}
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
