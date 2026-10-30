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
import { UpgradeModal } from "@/components/UpgradeModal";
import { TrialActivation } from "@/components/TrialActivation";

const SettingsPage = () => {
  const { profile, setShowTutorial } = useApp();
  const navigate = useNavigate();
  usePageTitle("Settings | PortAI");
  const { tier, isPaid, isPaying, isTrialPro, isPro, trialDaysLeft, trialEndsAt, subscriptionEnd, cancelAtPeriodEnd, subscriptionId, subscriptionStatus, billingPrice, scheduledTier, scheduledStart, scheduledChangesCount, loading: subLoading, refresh } = useSubscription();

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

  const [cancelLoading, setCancelLoading] = useState(false);
  const [reactivateLoading, setReactivateLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showReactivateModal, setShowReactivateModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  // LEGAL: explicit informed consent that current period is non-refundable.
  const [cancelAck, setCancelAck] = useState(false);

  const formattedEnd = subscriptionEnd ? new Date(subscriptionEnd).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : null;

  useEffect(() => {
    // Use cached session (no network round-trip) — getUser() was adding noticeable delay
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) setUserEmail(session.user.email);
    });
  }, []);


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
    const consentText = `I confirm I want to cancel my $Pro subscription. I understand my access continues until ${formattedEnd ?? "the end of the current billing period"} and that the current period is not refunded.`;
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
            {isTrialPro && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary">
                <Crown className="h-3 w-3" /> PRO TRIAL
              </span>
            )}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-muted-foreground">{t("email")}</label>
            <input value={userEmail} readOnly className="h-10 w-full rounded-lg border border-border bg-muted/30 px-4 text-sm text-muted-foreground cursor-not-allowed" />
            <p className="mt-1 text-xs text-muted-foreground">{t("emailCannotChange")}</p>
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
                  {`Pro · ${billingPrice ?? t("currentPlan")}`}
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
                      <p className="text-xs text-muted-foreground mt-1">{t("expiresUntilThen1")} Pro {t("expiresUntilThen2")}</p>
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
                  {t("nextBillingLbl")}: <span className="font-medium text-foreground">{formattedEnd}</span> · {billingPrice ?? ""}
                </p>
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
                    You're on the free 7-day Pro trial{trialEndsAt ? ` until ${new Date(trialEndsAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}` : ""}. No card on file — subscribe any time to keep Pro access.
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

        <UpgradeModal open={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />

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
                  Your <span className="font-medium text-foreground">Pro</span> access continues until <span className="font-medium text-foreground">{formattedEnd ?? "the end of the current billing period"}</span>.
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
                  Keep Pro
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
                By confirming, you agree to resume your current plan ({billingPrice ?? "Pro"}), billed at the start of each new billing period.
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
