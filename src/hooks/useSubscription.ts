import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export type SubscriptionTier = "free" | "plus" | "pro";

type SubscriptionState = {
  tier: SubscriptionTier;
  isPro: boolean;
  isPlus: boolean;
  isPaid: boolean;
  /** True only when the user is actually paying (Stripe-backed sub), not via trial. */
  isPaying: boolean;
  /** True when current Pro access comes from the 14-day trial (not a paid sub). */
  isTrialPro: boolean;
  hasUnlimitedChat: boolean;
  hasUnlimitedWatchlists: boolean;
  hasFullQuiz: boolean;
  loading: boolean;
  subscriptionEnd: string | null;
  cancelAtPeriodEnd: boolean;
  subscriptionId: string | null;
  subscriptionStatus: string | null;
  scheduledTier: SubscriptionTier | null;
  scheduledStart: string | null;
  scheduledChangesCount: number;
  dailyAnalysesUsed: number;
  canAnalyze: boolean;
  // Trial fields
  trialActive: boolean;
  trialUsed: boolean;
  trialEndsAt: string | null;
  trialDaysLeft: number | null;
  trialEndingToday: boolean;
  proTourCompleted: boolean;
  activateTrial: () => Promise<{ ok: boolean; error?: string }>;
  markProTourCompleted: () => Promise<void>;
  refresh: () => Promise<void>;
};

const FREE_DAILY_ANALYSES = 1;

export const useSubscription = (): SubscriptionState => {
  const [tier, setTier] = useState<SubscriptionTier>("free");
  const [paidTier, setPaidTier] = useState<SubscriptionTier>("free");
  const [loading, setLoading] = useState(true);
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const [cancelAtPeriodEnd, setCancelAtPeriodEnd] = useState(false);
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);
  const [scheduledTier, setScheduledTier] = useState<SubscriptionTier | null>(null);
  const [scheduledStart, setScheduledStart] = useState<string | null>(null);
  const [scheduledChangesCount, setScheduledChangesCount] = useState(0);
  const [dailyAnalysesUsed, setDailyAnalysesUsed] = useState(0);

  const [trialActive, setTrialActive] = useState(false);
  const [trialUsed, setTrialUsed] = useState(false);
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);
  const [proTourCompleted, setProTourCompleted] = useState(false);
  const expireInFlight = useRef(false);

  const resetToFree = useCallback(() => {
    setTier("free");
    setPaidTier("free");
    setSubscriptionEnd(null);
    setCancelAtPeriodEnd(false);
    setSubscriptionId(null);
    setSubscriptionStatus(null);
    setScheduledTier(null);
    setScheduledStart(null);
    setScheduledChangesCount(0);
    setDailyAnalysesUsed(0);
    setTrialActive(false);
    setTrialUsed(false);
    setTrialEndsAt(null);
    setProTourCompleted(false);
  }, []);

  const checkSubscription = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        resetToFree();
        setLoading(false);
        return;
      }
      const { data, error } = await supabase.functions.invoke("check-subscription", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) {
        resetToFree();
        setLoading(false);
        return;
      }
      const nextTier: SubscriptionTier = data?.tier ?? (data?.subscribed ? "pro" : "free");
      setPaidTier(nextTier);
      setSubscriptionEnd(data?.subscription_end ?? null);
      setCancelAtPeriodEnd(data?.cancel_at_period_end ?? false);
      setSubscriptionId(data?.subscription_id ?? null);
      setSubscriptionStatus(data?.subscription_status ?? null);
      setScheduledTier((data?.scheduled_tier as SubscriptionTier | null) ?? null);
      setScheduledStart(data?.scheduled_start ?? null);
      setScheduledChangesCount(data?.scheduled_changes_count ?? 0);
    } catch {
      resetToFree();
    }
    setLoading(false);
  }, [resetToFree]);

  const loadTrial = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("user_settings")
      .select("pro_trial_active, trial_used, trial_end_date, pro_tour_completed")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!data) {
      setTrialActive(false);
      setTrialUsed(false);
      setTrialEndsAt(null);
      setProTourCompleted(false);
      return;
    }
    setTrialUsed(!!data.trial_used);
    setTrialEndsAt(data.trial_end_date ?? null);
    setProTourCompleted(!!data.pro_tour_completed);

    const stillActive =
      !!data.pro_trial_active &&
      !!data.trial_end_date &&
      new Date(data.trial_end_date).getTime() > Date.now();
    setTrialActive(stillActive);

    // Auto-expire on the client (idempotent on the server)
    if (data.pro_trial_active && data.trial_end_date && !stillActive && !expireInFlight.current) {
      expireInFlight.current = true;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          await supabase.functions.invoke("manage-trial", {
            body: { action: "expire" },
            headers: { Authorization: `Bearer ${session.access_token}` },
          });
        }
      } finally {
        expireInFlight.current = false;
      }
    }
  }, []);

  const loadDailyUsage = useCallback(async () => {
    const today = new Date().toISOString().split("T")[0];
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { count } = await supabase
      .from("analysis_usage")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("used_date", today);
    setDailyAnalysesUsed(count ?? 0);
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    await Promise.all([checkSubscription(), loadDailyUsage(), loadTrial()]);
  }, [checkSubscription, loadDailyUsage, loadTrial]);

  useEffect(() => {
    refresh();
    const interval = setInterval(() => {
      checkSubscription();
      loadTrial();
    }, 60000);
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        resetToFree();
        setLoading(false);
      } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        refresh();
      }
    });
    return () => {
      clearInterval(interval);
      sub.subscription.unsubscribe();
    };
  }, [refresh, checkSubscription, loadTrial, resetToFree]);

  // Effective tier: paid wins; otherwise trial promotes free→pro
  const effectiveTier: SubscriptionTier =
    paidTier !== "free" ? paidTier : trialActive ? "pro" : "free";

  // Keep `tier` in sync without an effect dependency loop
  useEffect(() => {
    setTier(effectiveTier);
  }, [effectiveTier]);

  const trialDaysLeft = trialEndsAt
    ? Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;
  const trialEndingToday = trialActive && trialDaysLeft !== null && trialDaysLeft <= 1;

  const activateTrial = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return { ok: false, error: "Sign in to start your trial." };
    const { data, error } = await supabase.functions.invoke("manage-trial", {
      body: { action: "activate" },
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (error) return { ok: false, error: error.message };
    if ((data as any)?.error) return { ok: false, error: (data as any).error };
    await loadTrial();
    return { ok: true };
  }, [loadTrial]);

  const markProTourCompleted = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setProTourCompleted(true);
    await supabase
      .from("user_settings")
      .update({ pro_tour_completed: true })
      .eq("user_id", user.id);
  }, []);

  const isPro = effectiveTier === "pro";
  const isPlus = effectiveTier === "plus";
  const isPaid = isPro || isPlus;
  const isPaying = paidTier !== "free";
  const isTrialPro = trialActive && paidTier === "free";

  return {
    tier: effectiveTier,
    isPro,
    isPlus,
    isPaid,
    isPaying,
    isTrialPro,
    // Plus & Pro both grant these:
    hasUnlimitedChat: isPaid,
    hasUnlimitedWatchlists: isPaid,
    hasFullQuiz: isPaid,
    loading,
    subscriptionEnd,
    cancelAtPeriodEnd,
    subscriptionId,
    subscriptionStatus,
    scheduledTier,
    scheduledStart,
    scheduledChangesCount,
    dailyAnalysesUsed,
    // Only Pro gets unlimited article analyses; Plus uses free limit
    canAnalyze: isPro || dailyAnalysesUsed < FREE_DAILY_ANALYSES,
    trialActive,
    trialUsed,
    trialEndsAt,
    trialDaysLeft,
    trialEndingToday,
    proTourCompleted,
    activateTrial,
    markProTourCompleted,
    refresh,
  };
};

export const trackAnalysis = async () => {
  // No-op: usage is recorded server-side
};
