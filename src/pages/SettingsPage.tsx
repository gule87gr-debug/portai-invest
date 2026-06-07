import { useState, useRef, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/AppLayout";
import { SEO } from "@/components/SEO";
import { useApp } from "@/contexts/AppContext";
import { useLanguage, Language } from "@/contexts/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useSubscription } from "@/hooks/useSubscription";
import { User, Eye, EyeOff, LogOut, Globe, Sun, Moon, Check, X as XIcon, Loader2, GraduationCap, Crown, CreditCard, AlertTriangle, ShieldCheck, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "@/hooks/use-theme";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { TrialActivation } from "@/components/TrialActivation";

const SettingsPage = () => {
  const { profile, setShowTutorial } = useApp();
  const navigate = useNavigate();
  usePageTitle("Settings | PortAI");
  const { tier, isPaid, isPaying, isTrialPro, isPlus, isPro, trialDaysLeft, trialEndsAt, subscriptionEnd, cancelAtPeriodEnd, subscriptionId, subscriptionStatus, scheduledTier, scheduledStart, scheduledChangesCount, loading: subLoading, refresh } = useSubscription();

  let language: Language, setLanguage: (l: Language) => void, t: (key: string) => string, langNames: Record<Language, string>;
  try {
    const lang = useLanguage();
    language = lang.language;
    setLanguage = lang.setLanguage;
    t = lang.t;
    langNames = lang.languageNames;
  } catch {
    language = "en" as Language;
    setLanguage = () => {};
    t = (key: string) => key;
    langNames = { en: "English", es: "Español", fr: "Français", pt: "Português", de: "Deutsch", it: "Italiano" };
  }
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [userEmail, setUserEmail] = useState("");
  const { isDark, toggle: toggleTheme } = useTheme();

  const [nameStatus, setNameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [savedName, setSavedName] = useState<string>("");
  const [editingName, setEditingName] = useState<string>("");
  const [cancelLoading, setCancelLoading] = useState(false);
  const [reactivateLoading, setReactivateLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showReactivateModal, setShowReactivateModal] = useState(false);
  const [planChangeLoading, setPlanChangeLoading] = useState<"plus" | "pro" | null>(null);
  const [pendingPlanChange, setPendingPlanChange] = useState<"plus" | "pro" | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  // LEGAL: explicit informed consent that current period is non-refundable.
  const [cancelAck, setCancelAck] = useState(false);

  const formattedEnd = subscriptionEnd ? new Date(subscriptionEnd).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : null;

  const handleChangePlan = async (target: "plus" | "pro") => {
    setPlanChangeLoading(target);
    try {
      const targetLabel = target === "pro" ? "Pro" : "Plus";
      const targetPrice = target === "pro" ? "€15.99" : "€8.99";
      const fromLabel = isPro ? "Pro" : isPlus ? "Plus" : "Free";
      // Verbatim consent recorded server-side as legal proof of the user's
      // explicit confirmation in the in-app plan-change modal.
      const consentText = [
        `I confirm changing my PortAI subscription from ${fromLabel} to ${targetLabel} (${targetPrice}/month, billed monthly via Stripe).`,
        `I have read and accept the Terms of Service and Privacy Policy.`,
        `For plan changes from an existing paid subscription, my original 14-day right of withdrawal acknowledgment from initial signup remains on file; this change is initiated from my authenticated account in Settings.`,
      ].join(" ");
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          tier: target,
          accepted_terms: true,
          eu_withdrawal_waiver: false,
          consent_text: consentText,
        },
      });
      if (error) throw error;
      if (data?.action === "upgraded") {
        toast.success("Plan upgraded! You've only been charged the prorated difference.");
        await refresh();
      } else if (data?.action === "downgrade_scheduled") {
        toast.success(`Downgrade scheduled. You'll switch to ${target === "plus" ? "Plus" : "Pro"} at the end of your current billing period.`);
        await refresh();
      } else if (data?.url) {
        window.location.href = data.url;
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to change plan");
    } finally {
      setPlanChangeLoading(null);
    }
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) setUserEmail(user.email);
    });
  }, []);

  useEffect(() => {
    if (profile.name) {
      setSavedName(profile.name);
      setEditingName(profile.name);
    }
  }, [profile.name]);

  const checkNameAvailable = useCallback(async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed || trimmed.length < 2) { setNameStatus("idle"); return; }
    if (trimmed.toLowerCase() === savedName.trim().toLowerCase()) { setNameStatus("idle"); return; }
    setNameStatus("checking");
    const { data, error } = await supabase.rpc("check_username_available", { desired_username: trimmed });
    if (error) { setNameStatus("idle"); return; }
    setNameStatus(data ? "available" : "taken");
  }, [savedName]);

  useEffect(() => {
    const timer = setTimeout(() => checkNameAvailable(editingName), 400);
    return () => clearTimeout(timer);
  }, [editingName, checkNameAvailable]);

  useEffect(() => {
    const syncLang = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from("user_settings").update({ language }).eq("user_id", user.id);
    };
    syncLang();
  }, [language]);


  const handleLogout = async () => { await supabase.auth.signOut(); };

  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") {
      toast.error(t("deleteAccountTypeError") !== "deleteAccountTypeError" ? t("deleteAccountTypeError") : "Type DELETE to confirm.");
      return;
    }
    setDeleteLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("delete-account", { body: {} });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(t("deleteAccountDone") !== "deleteAccountDone" ? t("deleteAccountDone") : "Your account and data have been deleted.");
      await supabase.auth.signOut();
      navigate("/", { replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to delete account";
      toast.error(msg);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!subscriptionId) return;
    if (!cancelAck) {
      toast.error("Please confirm you understand the current period is not refunded.");
      return;
    }
    setCancelLoading(true);
    const consentText = `I confirm I want to cancel my ${isPro ? "Pro" : "Plus"} subscription. I understand my access continues until ${formattedEnd ?? "the end of the current billing period"} and that the current period is not refunded.`;
    try {
      const { error } = await supabase.functions.invoke("cancel-subscription", {
        body: {
          subscription_id: subscriptionId,
          acknowledged_no_refund: true,
          consent_text: consentText,
        },
      });
      if (error) throw error;
      toast.success("Subscription cancelled. You'll retain access until the end of your billing period.");
      await refresh();
    } catch (e: any) {
      toast.error(e.message || "Failed to cancel subscription");
    } finally {
      setCancelLoading(false);
      setShowCancelModal(false);
      setCancelAck(false);
    }
  };

  const handleReactivateSubscription = async () => {
    if (!subscriptionId) return;
    setReactivateLoading(true);
    try {
      const { error } = await supabase.functions.invoke("reactivate-subscription", { body: { subscription_id: subscriptionId } });
      if (error) throw error;
      toast.success("Subscription reactivated! You won't be charged until your next billing cycle.");
      await refresh();
    } catch (e: any) {
      toast.error(e.message || "Failed to reactivate subscription");
    } finally {
      setReactivateLoading(false);
    }
  };

  const handleManageBilling = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.error) {
        toast.error("You need an active subscription to manage billing.");
        return;
      }
      if (data?.url) window.open(data.url, "_blank");
    } catch (e: any) {
      toast.error("Failed to open billing portal. Please try again later.");
    }
  };

  return (
    <AppLayout>
      <SEO
        title="Settings | PortAI"
        description="Manage your PortAI profile, subscription, billing and preferences."
        path="/settings"
      />
      <h1 className="mb-6 text-3xl font-bold">{t("settings")}</h1>

      <div className="mx-auto max-w-2xl space-y-6">
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-semibold">{t("profile")}</h2>
            {isPro && !isTrialPro && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary">
                <Crown className="h-3 w-3" /> PRO
              </span>
            )}
            {isPlus && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary">
                <Crown className="h-3 w-3" /> PLUS
              </span>
            )}
            {isTrialPro && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary">
                <Crown className="h-3 w-3" /> PRO TRIAL
              </span>
            )}
          </div>
          <div className="mb-6 flex items-center gap-5">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              {profile.avatar ? (
                <img src={profile.avatar} alt="Avatar" className="h-20 w-20 rounded-full object-cover border-2 border-border" />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary">
                  <User className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="h-5 w-5 text-foreground" />
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
            </div>
            <div>
              <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 rounded-lg border border-border bg-accent/50 px-4 py-2 text-sm font-medium transition-colors hover:bg-accent">
                <Upload className="h-4 w-4" /> {t("uploadPhoto")}
              </button>
              <p className="mt-1 text-xs text-muted-foreground">{t("avatarRecommendation")}</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-muted-foreground">{t("displayName")}</label>
              <div className="relative">
                <input
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onBlur={() => {
                    if (nameStatus === "available" && editingName.trim() !== savedName) {
                      setProfile((prev) => ({ ...prev, name: editingName.trim() }));
                      setSavedName(editingName.trim());
                      setNameStatus("idle");
                    } else if (nameStatus !== "available") {
                      setEditingName(savedName);
                      setNameStatus("idle");
                    }
                  }}
                  className={cn(
                    "h-10 w-full rounded-lg border bg-accent/30 px-4 pr-10 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring",
                    nameStatus === "taken" ? "border-loss" : nameStatus === "available" ? "border-gain" : "border-border"
                  )}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {nameStatus === "checking" && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                  {nameStatus === "available" && <Check className="h-4 w-4 text-gain" />}
                  {nameStatus === "taken" && <XIcon className="h-4 w-4 text-loss" />}
                </div>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {nameStatus === "taken" && <span className="text-loss">{t("displayNameTaken")}</span>}
                {nameStatus === "available" && <span className="text-gain">{t("displayNameAvailable")}</span>}
                {nameStatus === "checking" && t("checkingAvailability")}
                {nameStatus === "idle" && t("changesSaveAuto")}
              </p>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-muted-foreground">{t("email")}</label>
              <input value={userEmail} readOnly className="h-10 w-full rounded-lg border border-border bg-muted/30 px-4 text-sm text-muted-foreground cursor-not-allowed" />
              <p className="mt-1 text-xs text-muted-foreground">{t("emailCannotChange")}</p>
            </div>
          </div>
        </div>

        {/* Subscription Management */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <Crown className="h-5 w-5 text-primary" />
            <div>
              <h3 className="font-semibold">{t("subscriptionH")}</h3>
              <p className="text-xs text-muted-foreground">{t("managePlanBilling")}</p>
            </div>
          </div>

          {subLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> {t("loadingSubscription")}
            </div>
          ) : isPaying ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-primary/20 px-3 py-1 text-xs font-semibold text-primary">
                  {isPro ? "Pro Plan · €15.99/mo" : "Plus Plan · €8.99/mo"}
                </span>
                {cancelAtPeriodEnd && <span className="rounded-full bg-warning/20 px-3 py-1 text-xs font-semibold text-warning">{t("cancellingBadge")}</span>}
              </div>

              {/* Expiration / renewal banner */}
              {cancelAtPeriodEnd && formattedEnd && (
                <div className="rounded-lg border border-warning/40 bg-warning/10 p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-warning mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">{t("subExpiresOn")} {formattedEnd}</p>
                      <p className="text-xs text-muted-foreground mt-1">{t("expiresUntilThen1")} {isPro ? "Pro" : "Plus"} {t("expiresUntilThen2")}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowReactivateModal(true)}
                    className="flex items-center justify-center gap-2 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    <Crown className="h-4 w-4" /> {t("resubscribeBtn")}
                  </button>
                </div>
              )}

              {!cancelAtPeriodEnd && formattedEnd && !scheduledTier && (
                <p className="text-sm text-muted-foreground">
                  {t("nextBillingLbl")}: <span className="font-medium text-foreground">{formattedEnd}</span> · {isPro ? "€15.99" : "€8.99"}/mo
                </p>
              )}

              {/* Scheduled plan change banner */}
              {!cancelAtPeriodEnd && scheduledTier && scheduledStart && (() => {
                const scheduledDate = new Date(scheduledStart).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
                const scheduledLabel = scheduledTier === "pro" ? "Pro" : scheduledTier === "plus" ? "Plus" : "Free";
                const scheduledPrice = scheduledTier === "pro" ? "€15.99" : scheduledTier === "plus" ? "€8.99" : "€0";
                return (
                  <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-1">
                    <div className="flex items-start gap-3">
                      <Crown className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-foreground">
                          You're on {isPro ? "Pro" : "Plus"} until {scheduledDate}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Then you'll switch to <span className="font-medium text-foreground">{scheduledLabel}</span> ({scheduledPrice}/mo) — first {scheduledLabel} charge on {scheduledDate}.
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Plan switcher */}
              {!cancelAtPeriodEnd && (
                <div className="rounded-lg border border-border bg-background/50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">{t("changePlanLbl")}</p>
                  {isPlus && scheduledTier !== "pro" && (
                    <button
                      onClick={() => setPendingPlanChange("pro")}
                      disabled={planChangeLoading !== null}
                      className="flex w-full items-center justify-between gap-3 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                    >
                      <span className="flex items-center gap-2">
                        {planChangeLoading === "pro" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crown className="h-4 w-4" />}
                        Upgrade to Pro
                      </span>
                      <span className="text-xs opacity-80">€15.99/mo · prorated today</span>
                    </button>
                  )}
                  {isPro && scheduledTier !== "plus" && (
                    <button
                      onClick={() => setPendingPlanChange("plus")}
                      disabled={planChangeLoading !== null}
                      className="flex w-full items-center justify-between gap-3 rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-accent disabled:opacity-50"
                    >
                      <span className="flex items-center gap-2">
                        {planChangeLoading === "plus" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        Downgrade to Plus
                      </span>
                      <span className="text-xs text-muted-foreground">€8.99/mo · starts {formattedEnd ?? "next cycle"}</span>
                    </button>
                  )}
                  {scheduledTier && (
                    <p className="text-xs text-muted-foreground text-center">{t("planChangeScheduledShort")}</p>
                  )}
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                <button onClick={handleManageBilling} className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-accent">
                  <CreditCard className="h-4 w-4" /> {t("manageBillingBtn")}
                </button>
                <button onClick={() => navigate("/billing-consents")} className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-accent">
                  <ShieldCheck className="h-4 w-4" /> {t("myBillingConsentsBtn")}
                </button>
                {!cancelAtPeriodEnd && (
                  <button onClick={() => setShowCancelModal(true)} className="flex items-center gap-2 rounded-lg border border-loss/30 px-4 py-2 text-sm font-medium text-loss hover:bg-loss/10">
                    {t("cancelSubBtn")}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {isTrialPro ? (
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Crown className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold text-foreground">
                      Pro Trial · {trialDaysLeft} day{trialDaysLeft === 1 ? "" : "s"} left
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    You're on the free 14-day Pro trial{trialEndsAt ? ` until ${new Date(trialEndsAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}` : ""}. No card on file — subscribe any time to keep Pro access.
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  You're on the <span className="font-medium text-foreground">Free</span> plan.
                </p>
              )}
              <TrialActivation />
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                <Crown className="h-4 w-4" />
                {isTrialPro ? "Subscribe to keep Pro" : "Upgrade Plan"}
              </button>
              <button
                onClick={() => navigate("/billing-consents")}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-accent"
              >
                <ShieldCheck className="h-4 w-4" /> My Billing Consents
              </button>
            </div>
          )}
        </div>

        {/* Upgrade Modal (popup) */}
        {showUpgradeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in p-4">
            <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-primary/30 bg-card p-6 shadow-xl shadow-primary/10">
              <div className="flex items-start justify-between mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20">
                  <Crown className="h-6 w-6 text-primary" />
                </div>
                <button onClick={() => setShowUpgradeModal(false)} className="text-muted-foreground hover:text-foreground">
                  <XIcon className="h-5 w-5" />
                </button>
              </div>

              <h2 className="text-xl font-bold mb-1">Upgrade your plan</h2>
              <p className="text-sm text-muted-foreground mb-5">
                Choose Plus for the essentials, or Pro for the full experience.
              </p>

              <div className="space-y-4">
                {/* Plus card */}
                <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Crown className="h-4 w-4 text-primary" />
                        <h3 className="text-base font-semibold">Plus</h3>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">Essentials for serious investors</p>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-bold text-foreground">€8.99<span className="text-xs font-normal text-muted-foreground">/mo</span></div>
                    </div>
                  </div>
                  <ul className="space-y-1.5 text-sm">
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary shrink-0" /><span>Full investor quiz results</span></li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary shrink-0" /><span>Unlimited AI chat & image analysis</span></li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary shrink-0" /><span>Unlimited watchlists & stocks</span></li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary shrink-0" /><span>AI Deep Dive (Hidden Angles)</span></li>
                  </ul>
                  <button
                    onClick={() => { setShowUpgradeModal(false); setPendingPlanChange("plus"); }}
                    disabled={planChangeLoading !== null}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-4 py-2.5 text-sm font-medium text-primary hover:bg-primary/20 disabled:opacity-50"
                  >
                    {planChangeLoading === "plus" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Upgrade to Plus
                  </button>
                </div>

                {/* Pro card */}
                <div className="relative rounded-xl border border-primary bg-primary/10 p-4 space-y-3">
                  <span className="absolute -top-2 right-4 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-foreground">Best value</span>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Crown className="h-4 w-4 text-primary" />
                        <h3 className="text-base font-semibold">Pro</h3>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">Everything in Plus, and more</p>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-bold text-foreground">€15.99<span className="text-xs font-normal text-muted-foreground">/mo</span></div>
                    </div>
                  </div>
                  <ul className="space-y-1.5 text-sm">
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary shrink-0" /><span>Full investor quiz results</span></li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary shrink-0" /><span>Unlimited AI chat & image analysis</span></li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary shrink-0" /><span>Unlimited watchlists & stocks</span></li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary shrink-0" /><span>AI Deep Dive (Hidden Angles)</span></li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary shrink-0" /><span>Unlimited article analyses</span></li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary shrink-0" /><span>AI price alerts</span></li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary shrink-0" /><span>Priority AI chat (faster, better)</span></li>
                  </ul>
                  <button
                    onClick={() => { setShowUpgradeModal(false); setPendingPlanChange("pro"); }}
                    disabled={planChangeLoading !== null}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    {planChangeLoading === "pro" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crown className="h-4 w-4" />}
                    Upgrade to Pro
                  </button>
                </div>
              </div>

              <button
                onClick={() => setShowUpgradeModal(false)}
                className="mt-5 w-full rounded-xl border border-border py-2.5 text-sm font-medium hover:bg-accent"
              >
                Maybe Later
              </button>
            </div>
          </div>
        )}

        {/* Cancel Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in p-4">
            <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/20">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                </div>
                <h2 className="text-lg font-bold">Cancel Subscription?</h2>
              </div>
              <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground space-y-2 mb-4">
                <p>
                  Your <span className="font-medium text-foreground">{isPro ? "Pro" : "Plus"}</span> access continues until <span className="font-medium text-foreground">{formattedEnd ?? "the end of the current billing period"}</span>.
                  After that, you'll be moved to the Free plan and no further charges will be made.
                </p>
                <p>
                  <span className="font-medium text-foreground">No refund</span> is issued for the remaining days of the current period (unless required by your statutory right of withdrawal — see Terms §9).
                </p>
              </div>

              <label className="flex items-start gap-2 text-xs text-muted-foreground mb-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cancelAck}
                  onChange={(e) => setCancelAck(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-primary"
                  aria-required="true"
                />
                <span>
                  I understand the current billing period is <span className="font-medium text-foreground">not refunded</span> and that my access ends on {formattedEnd ?? "the period end date"}.
                </span>
              </label>

              <div className="flex gap-3">
                <button
                  onClick={() => { setShowCancelModal(false); setCancelAck(false); }}
                  disabled={cancelLoading}
                  className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium hover:bg-accent disabled:opacity-50"
                >
                  Keep {isPro ? "Pro" : "Plus"}
                </button>
                <button
                  onClick={handleCancelSubscription}
                  disabled={cancelLoading || !cancelAck}
                  className="flex-1 rounded-xl bg-loss py-2.5 text-sm font-medium text-primary-foreground hover:bg-loss/90 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {cancelLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Confirm Cancellation
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reactivate Modal */}
        {showReactivateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in p-4">
            <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
                  <Crown className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-lg font-bold">Re-subscribe to Pro?</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                Your subscription will resume and you will <span className="font-semibold text-foreground">not</span> be charged again until your next billing cycle{formattedEnd ? ` (${formattedEnd})` : ""}.
              </p>
              <p className="text-xs text-muted-foreground mb-6">
                By confirming, you agree to resume your current plan ({isPro ? "Pro €15.99/month" : "Plus €8.99/month"}), billed at the start of each new billing period.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setShowReactivateModal(false)} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium hover:bg-accent">
                  Cancel
                </button>
                <button onClick={async () => { await handleReactivateSubscription(); setShowReactivateModal(false); }} disabled={reactivateLoading} className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2">
                  {reactivateLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Confirm Re-subscribe
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Plan Change Confirmation Modal */}
        {pendingPlanChange && (() => {
          const target = pendingPlanChange;
          const targetLabel = target === "pro" ? "Pro" : "Plus";
          const targetPrice = target === "pro" ? "€15.99" : "€8.99";
          // Determine direction: from current tier (free/plus/pro) to target
          const isUpgrade = (tier === "free") || (tier === "plus" && target === "pro");
          const isDowngrade = tier === "pro" && target === "plus";
          const isFromFree = tier === "free";

          // Subscription status & block conditions
          const status = subscriptionStatus ?? (isPaid ? "active" : null);
          const statusLabel = status
            ? status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
            : "None";
          const statusTone =
            status === "active" || status === "trialing" ? "primary"
            : status === "past_due" ? "warning"
            : status === "canceled" || status === "incomplete_expired" ? "loss"
            : "muted";

          // Block conditions
          const hasResolvedPendingChange = !!scheduledTier && scheduledTier !== tier;
          // Edge function reported queued changes but couldn't map the next phase to a known tier
          const hasUnresolvedPendingChange =
            !hasResolvedPendingChange && (scheduledChangesCount ?? 0) > 0;
          const hasPendingChange = hasResolvedPendingChange || hasUnresolvedPendingChange;
          const hasPendingCancel = cancelAtPeriodEnd;
          const isUnpaidStatus = status === "past_due" || status === "unpaid" || status === "incomplete";
          const isCanceledStatus = status === "canceled" || status === "incomplete_expired";
          // Free→paid is always allowed; otherwise block when there's a pending change/cancel or status problem
          const blocked = !isFromFree && (hasPendingChange || hasPendingCancel || isUnpaidStatus || isCanceledStatus);
          const blockReason = hasResolvedPendingChange
            ? `A switch to ${scheduledTier === "pro" ? "Pro" : "Plus"} is already scheduled${scheduledStart ? ` for ${new Date(scheduledStart).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}` : ""}. Manage it via Manage Billing first.`
            : hasUnresolvedPendingChange
            ? `A plan change is queued on your subscription, but we couldn't read its details. Open Manage Billing for full information.`
            : hasPendingCancel
            ? `Your subscription is set to cancel at period end. Re-subscribe before changing plans.`
            : isUnpaidStatus
            ? `Your subscription has an unpaid invoice (${statusLabel}). Please update your payment method via Manage Billing.`
            : isCanceledStatus
            ? `Your subscription is ${statusLabel}. Subscribe again from the Pricing page.`
            : "";

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in p-4">
              <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className={cn("flex h-10 w-10 items-center justify-center rounded-full", blocked ? "bg-loss/20" : isDowngrade ? "bg-warning/20" : "bg-primary/20")}>
                    {blocked ? <AlertTriangle className="h-5 w-5 text-loss" /> : isDowngrade ? <AlertTriangle className="h-5 w-5 text-warning" /> : <Crown className="h-5 w-5 text-primary" />}
                  </div>
                  <h2 className="text-lg font-bold">
                    {blocked ? "Cannot change plan" : isFromFree ? `Subscribe to ${targetLabel}?` : isUpgrade ? `Upgrade to ${targetLabel}?` : `Downgrade to ${targetLabel}?`}
                  </h2>
                </div>

                <div className="space-y-3 text-sm mb-6">
                  <div className="rounded-lg bg-muted/50 p-3 space-y-1">
                    <div className="flex justify-between"><span className="text-muted-foreground">New plan</span><span className="font-semibold text-foreground">{targetLabel} — {targetPrice}/mo</span></div>
                    {!isFromFree && (
                      <div className="flex justify-between"><span className="text-muted-foreground">Current plan</span><span className="text-foreground">{isPro ? "Pro — €15.99/mo" : "Plus — €8.99/mo"}</span></div>
                    )}
                    <div className="flex justify-between items-center pt-1">
                      <span className="text-muted-foreground">Status</span>
                      <span className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-semibold",
                        statusTone === "primary" && "bg-primary/15 text-primary",
                        statusTone === "warning" && "bg-warning/20 text-warning",
                        statusTone === "loss" && "bg-loss/20 text-loss",
                        statusTone === "muted" && "bg-muted text-muted-foreground"
                      )}>
                        {statusLabel}
                      </span>
                    </div>
                  </div>

                  {blocked && hasResolvedPendingChange && (() => {
                    const fromLabel = tier === "pro" ? "Pro" : tier === "plus" ? "Plus" : "Free";
                    const fromPrice = tier === "pro" ? "€15.99/mo" : tier === "plus" ? "€8.99/mo" : "€0";
                    const toLabel = scheduledTier === "pro" ? "Pro" : scheduledTier === "plus" ? "Plus" : "Free";
                    const toPrice = scheduledTier === "pro" ? "€15.99/mo" : scheduledTier === "plus" ? "€8.99/mo" : "€0";
                    const effectiveDate = scheduledStart
                      ? new Date(scheduledStart).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
                      : null;
                    const isScheduledDowngrade =
                      (tier === "pro" && (scheduledTier === "plus" || scheduledTier === "free")) ||
                      (tier === "plus" && scheduledTier === "free");
                    const extraQueued = Math.max(0, (scheduledChangesCount ?? 0) - 1);
                    return (
                      <div className="rounded-lg border border-warning/40 bg-warning/10 p-3 space-y-3">
                        <div>
                          <p className="font-semibold text-foreground mb-1">
                            {isScheduledDowngrade ? "Downgrade already scheduled" : "Plan change already scheduled"}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {extraQueued > 0
                              ? `You have ${extraQueued + 1} plan changes queued. Showing the next one — manage the full sequence via Manage Billing.`
                              : "You can't queue another change until this one is applied or cancelled via Manage Billing."}
                          </p>
                        </div>
                        <div className="rounded-md border border-border/60 bg-background/60 p-3">
                          <div className="flex items-center justify-between gap-1 mb-2">
                            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Next change</p>
                            {extraQueued > 0 && (
                              <span className="rounded-full bg-warning/20 px-2 py-0.5 text-[10px] font-semibold text-warning">
                                +{extraQueued} more queued
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex-1 text-center">
                              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">From</p>
                              <p className="text-sm font-semibold text-foreground">{fromLabel}</p>
                              <p className="text-[11px] text-muted-foreground">{fromPrice}</p>
                            </div>
                            <span aria-hidden className="text-muted-foreground text-lg leading-none">→</span>
                            <div className="flex-1 text-center">
                              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">To</p>
                              <p className="text-sm font-semibold text-primary">{toLabel}</p>
                              <p className="text-[11px] text-muted-foreground">{toPrice}</p>
                            </div>
                          </div>
                          {effectiveDate && (
                            <div className="mt-3 pt-3 border-t border-border/60 flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">Effective</span>
                              <span className="font-medium text-foreground">{effectiveDate}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                  {blocked && hasUnresolvedPendingChange && (
                    <div className="rounded-lg border border-warning/40 bg-warning/10 p-3 space-y-2">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
                        <div>
                          <p className="font-semibold text-foreground mb-1">Pending change details unavailable</p>
                          <p className="text-muted-foreground text-xs">
                            {(scheduledChangesCount ?? 0) > 1
                              ? `${scheduledChangesCount} plan changes are queued on your subscription, but we couldn't read the next phase's plan or date.`
                              : "A plan change is queued on your subscription, but we couldn't read the next phase's plan or date."}
                            {" "}This usually means the upcoming price isn't recognized by the app.
                          </p>
                          <p className="text-muted-foreground text-xs mt-1">
                            Open <span className="font-medium text-foreground">Manage Billing</span> to see the exact tier, amount, and effective date.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  {blocked && !hasPendingChange && (
                    <div className="rounded-lg border border-loss/40 bg-loss/10 p-3">
                      <p className="font-semibold text-foreground mb-1">Action required</p>
                      <p className="text-muted-foreground text-xs">{blockReason}</p>
                    </div>
                  )}
                  {!blocked && isFromFree && (
                    <p className="text-muted-foreground">
                      You'll be redirected to secure checkout. Billing starts today and renews monthly at {targetPrice}.
                    </p>
                  )}
                  {!blocked && isUpgrade && !isFromFree && (
                    <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
                      <p className="font-semibold text-foreground mb-1">Charged today: prorated difference</p>
                      <p className="text-muted-foreground text-xs">
                        You'll only pay the difference between your current plan and {targetLabel} for the remaining days of this billing cycle. Full {targetLabel} access starts immediately and your normal {targetPrice}/mo billing begins on {formattedEnd ?? "your next renewal"}.
                      </p>
                    </div>
                  )}
                  {!blocked && isDowngrade && (
                    <div className="rounded-lg border border-warning/40 bg-warning/10 p-3">
                      <p className="font-semibold text-foreground mb-1">No charge today</p>
                      <p className="text-muted-foreground text-xs">
                        You'll keep full Pro access until {formattedEnd ?? "the end of your current billing period"}. After that, you'll switch to Plus and be billed {targetPrice}/mo.
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setPendingPlanChange(null)}
                    disabled={planChangeLoading !== null}
                    className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium hover:bg-accent disabled:opacity-50"
                  >
                    {blocked ? "Close" : "Cancel"}
                  </button>
                  {!blocked && (
                    <button
                      onClick={async () => { await handleChangePlan(target); setPendingPlanChange(null); }}
                      disabled={planChangeLoading !== null}
                      className={cn(
                        "flex-1 rounded-xl py-2.5 text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50",
                        isDowngrade ? "border border-warning/40 bg-warning/20 text-foreground hover:bg-warning/30" : "bg-primary text-primary-foreground hover:bg-primary/90"
                      )}
                    >
                      {planChangeLoading === target && <Loader2 className="h-4 w-4 animate-spin" />}
                      {isFromFree ? "Continue to Checkout" : isUpgrade ? "Confirm Upgrade" : "Schedule Downgrade"}
                    </button>
                  )}
                  {blocked && (
                    <button
                      onClick={async () => { setPendingPlanChange(null); await handleManageBilling(); }}
                      className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-2"
                    >
                      <CreditCard className="h-4 w-4" /> {t("manageBillingBtn")}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <Globe className="h-5 w-5 text-primary" />
            <div>
              <h3 className="font-semibold">{t("language")}</h3>
              <p className="text-xs text-muted-foreground">{t("selectLanguage")}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(langNames) as Language[]).map((lang) => (
              <button key={lang} onClick={() => setLanguage(lang)} className={cn("rounded-lg border px-4 py-3 text-sm font-medium transition-all text-left", language === lang ? "border-primary bg-primary/10 text-primary" : "border-border bg-accent/20 text-muted-foreground hover:text-foreground hover:bg-accent/40")}>
                {langNames[lang]}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isDark ? <Moon className="h-5 w-5 text-primary" /> : <Sun className="h-5 w-5 text-warning" />}
              <div>
                <h3 className="font-semibold">{isDark ? t("darkModeLbl") : t("lightModeLbl")}</h3>
                <p className="text-xs text-muted-foreground">{t("themeSwitchDesc")}</p>
              </div>
            </div>
            <button onClick={toggleTheme} aria-pressed={isDark} aria-label="Toggle dark mode" className={cn("relative h-6 w-11 rounded-full transition-colors", isDark ? "bg-primary" : "bg-muted")}>
              <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-foreground transition-transform", isDark ? "left-[22px]" : "left-0.5")} />
            </button>
          </div>
        </div>


        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {profile.anonymous ? <EyeOff className="h-5 w-5 text-primary" /> : <Eye className="h-5 w-5 text-muted-foreground" />}
              <div>
                <h3 className="font-semibold">{t("anonymousMode")}</h3>
                <p className="text-xs text-muted-foreground">{t("hideNameAvatar")}</p>
              </div>
            </div>
            <button onClick={() => setProfile((prev) => ({ ...prev, anonymous: !prev.anonymous }))} className={cn("relative h-6 w-11 rounded-full transition-colors", profile.anonymous ? "bg-primary" : "bg-muted")}>
              <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-foreground transition-transform", profile.anonymous ? "left-[22px]" : "left-0.5")} />
            </button>
          </div>
          {profile.anonymous && <p className="mt-3 text-sm text-muted-foreground">{t("appearAs")} <span className="font-medium text-foreground">"{t("anonymousTrader")}"</span></p>}
        </div>

        {/* Take the Tour */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <GraduationCap className="h-5 w-5 text-primary" />
              <div>
                <h3 className="font-semibold">{t("takeTourTitle")}</h3>
                <p className="text-xs text-muted-foreground">{t("takeTourDesc")}</p>
              </div>
            </div>
            <button
              onClick={async () => {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                  await supabase.from("user_settings").update({ tutorial_completed: false } as any).eq("user_id", user.id);
                }
                setShowTutorial(true);
                navigate("/dashboard");
              }}
              className="rounded-lg border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
            >
              {t("startTourBtn")}
            </button>
          </div>
        </div>

        {/* Danger Zone — GDPR Art. 17 self-serve deletion */}
        <div className="rounded-2xl border border-loss/30 bg-loss/5 p-5 space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-loss/15">
              <AlertTriangle className="h-5 w-5 text-loss" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-semibold text-foreground">
                {t("dangerZone") !== "dangerZone" ? t("dangerZone") : "Danger Zone"}
              </h2>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                {t("deleteAccountBody") !== "deleteAccountBody"
                  ? t("deleteAccountBody")
                  : "Permanently delete your account and all associated data (watchlists, alerts, chats, settings). This action cannot be undone."}
              </p>
            </div>
          </div>

          {!showDeleteAccount ? (
            <button
              onClick={() => setShowDeleteAccount(true)}
              className="flex items-center gap-2 rounded-xl border border-loss/40 px-4 py-2 text-sm font-medium text-loss transition-colors hover:bg-loss/10"
            >
              <Trash2 className="h-4 w-4" />
              {t("deleteAccount") !== "deleteAccount" ? t("deleteAccount") : "Delete my account"}
            </button>
          ) : (
            <div className="space-y-3 rounded-xl border border-loss/30 bg-background/40 p-4">
              <label className="block text-xs font-medium text-foreground">
                {t("deleteAccountTypePrompt") !== "deleteAccountTypePrompt"
                  ? t("deleteAccountTypePrompt")
                  : "Type DELETE to confirm:"}
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE"
                autoComplete="off"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-loss focus:outline-none"
              />
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteLoading || deleteConfirmText !== "DELETE"}
                  className="flex items-center gap-2 rounded-xl bg-loss px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-loss/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {deleteLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  {t("permanentlyDelete") !== "permanentlyDelete" ? t("permanentlyDelete") : "Permanently delete"}
                </button>
                <button
                  onClick={() => { setShowDeleteAccount(false); setDeleteConfirmText(""); }}
                  disabled={deleteLoading}
                  className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                >
                  {t("cancel") !== "cancel" ? t("cancel") : "Cancel"}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end">
          <button onClick={handleLogout} className="flex items-center gap-2 rounded-xl border border-loss/30 px-5 py-2.5 text-sm font-medium text-loss transition-colors hover:bg-loss/10">
            <LogOut className="h-4 w-4" /> {t("logOut")}
          </button>
        </div>
      </div>
    </AppLayout>
  );
};

export default SettingsPage;
