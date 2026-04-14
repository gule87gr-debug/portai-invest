import { useState, useRef, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useApp } from "@/contexts/AppContext";
import { useLanguage, Language } from "@/contexts/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useSubscription } from "@/hooks/useSubscription";
import { User, Eye, EyeOff, Upload, Camera, LogOut, Globe, Sun, Moon, Check, X as XIcon, Loader2, GraduationCap, Crown, CreditCard, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "@/hooks/use-theme";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const SettingsPage = () => {
  const { profile, setProfile, setShowTutorial } = useApp();
  const navigate = useNavigate();
  usePageTitle("Settings | PortAI");
  const { isPro, subscriptionEnd, cancelAtPeriodEnd, subscriptionId, loading: subLoading, refresh } = useSubscription();

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

  const formattedEnd = subscriptionEnd ? new Date(subscriptionEnd).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : null;

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

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setProfile((prev) => ({ ...prev, avatar: reader.result as string }));
    reader.readAsDataURL(file);
  };

  const handleLogout = async () => { await supabase.auth.signOut(); };

  const handleCancelSubscription = async () => {
    if (!subscriptionId) return;
    setCancelLoading(true);
    try {
      const { error } = await supabase.functions.invoke("cancel-subscription", { body: { subscription_id: subscriptionId } });
      if (error) throw error;
      toast.success("Subscription cancelled. You'll retain access until the end of your billing period.");
      await refresh();
    } catch (e: any) {
      toast.error(e.message || "Failed to cancel subscription");
    } finally {
      setCancelLoading(false);
      setShowCancelModal(false);
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
      <h1 className="mb-6 text-3xl font-bold">{t("settings")}</h1>

      <div className="mx-auto max-w-2xl space-y-6">
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-semibold">{t("profile")}</h2>
            {isPro && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary">
                <Crown className="h-3 w-3" /> PRO
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
                {nameStatus === "taken" && <span className="text-loss">This name is already taken by another user</span>}
                {nameStatus === "available" && <span className="text-gain">Name is available — click away to save</span>}
                {nameStatus === "checking" && "Checking availability..."}
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
              <h3 className="font-semibold">Subscription</h3>
              <p className="text-xs text-muted-foreground">Manage your plan and billing</p>
            </div>
          </div>

          {subLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading subscription...
            </div>
          ) : isPro ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-primary/20 px-3 py-1 text-xs font-semibold text-primary">Pro Plan</span>
                {cancelAtPeriodEnd && <span className="rounded-full bg-warning/20 px-3 py-1 text-xs font-semibold text-warning">Cancelling</span>}
              </div>

              {/* Expiration / renewal banner */}
              {cancelAtPeriodEnd && formattedEnd && (
                <div className="rounded-lg border border-warning/40 bg-warning/10 p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-warning mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">Your subscription expires on {formattedEnd}</p>
                      <p className="text-xs text-muted-foreground mt-1">You'll retain full Pro access until then. After that you'll be downgraded to the Free plan.</p>
                    </div>
                  </div>
                  <button
                    onClick={handleReactivateSubscription}
                    disabled={reactivateLoading}
                    className="flex items-center justify-center gap-2 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    {reactivateLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                    <Crown className="h-4 w-4" /> Re-subscribe to Pro
                  </button>
                </div>
              )}

              {!cancelAtPeriodEnd && formattedEnd && (
                <p className="text-sm text-muted-foreground">
                  Next billing: {formattedEnd}
                </p>
              )}

              <div className="flex gap-3">
                <button onClick={handleManageBilling} className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-accent">
                  <CreditCard className="h-4 w-4" /> Manage Billing
                </button>
                {!cancelAtPeriodEnd && (
                  <button onClick={() => setShowCancelModal(true)} className="flex items-center gap-2 rounded-lg border border-loss/30 px-4 py-2 text-sm font-medium text-loss hover:bg-loss/10">
                    Cancel Subscription
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">You're on the <span className="font-medium text-foreground">Free</span> plan.</p>
              <button onClick={() => navigate("/pricing")} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                <Crown className="h-4 w-4" /> Upgrade to Pro — $9.99/mo
              </button>
            </div>
          )}
        </div>

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
              <p className="text-sm text-muted-foreground mb-6">
                You'll keep Pro access until the end of your current billing period{formattedEnd ? ` (${formattedEnd})` : ""}. After that, you'll be downgraded to the Free plan.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setShowCancelModal(false)} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium hover:bg-accent">
                  Keep Pro
                </button>
                <button onClick={handleCancelSubscription} disabled={cancelLoading} className="flex-1 rounded-xl bg-loss py-2.5 text-sm font-medium text-white hover:bg-loss/90 disabled:opacity-50 flex items-center justify-center gap-2">
                  {cancelLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Cancel Subscription
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
                <h3 className="font-semibold">{isDark ? "Dark Mode" : "Light Mode"}</h3>
                <p className="text-xs text-muted-foreground">Switch between dark and light appearance</p>
              </div>
            </div>
            <button onClick={toggleTheme} className={cn("relative h-6 w-11 rounded-full transition-colors", isDark ? "bg-primary" : "bg-muted")}>
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
                <h3 className="font-semibold">Take the Tour</h3>
                <p className="text-xs text-muted-foreground">Replay the onboarding walkthrough</p>
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
              Start Tour
            </button>
          </div>
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
