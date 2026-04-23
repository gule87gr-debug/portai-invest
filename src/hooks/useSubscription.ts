import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type SubscriptionTier = "free" | "plus" | "pro";

type SubscriptionState = {
  tier: SubscriptionTier;
  isPro: boolean;
  isPlus: boolean;
  isPaid: boolean;
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
  refresh: () => Promise<void>;
};

const FREE_DAILY_ANALYSES = 3;

export const useSubscription = (): SubscriptionState => {
  const [tier, setTier] = useState<SubscriptionTier>("free");
  const [loading, setLoading] = useState(true);
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const [cancelAtPeriodEnd, setCancelAtPeriodEnd] = useState(false);
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);
  const [scheduledTier, setScheduledTier] = useState<SubscriptionTier | null>(null);
  const [scheduledStart, setScheduledStart] = useState<string | null>(null);
  const [scheduledChangesCount, setScheduledChangesCount] = useState(0);
  const [dailyAnalysesUsed, setDailyAnalysesUsed] = useState(0);

  const checkSubscription = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) throw error;
      const nextTier: SubscriptionTier = data?.tier ?? (data?.subscribed ? "pro" : "free");
      setTier(nextTier);
      setSubscriptionEnd(data?.subscription_end ?? null);
      setCancelAtPeriodEnd(data?.cancel_at_period_end ?? false);
      setSubscriptionId(data?.subscription_id ?? null);
      setSubscriptionStatus(data?.subscription_status ?? null);
      setScheduledTier((data?.scheduled_tier as SubscriptionTier | null) ?? null);
      setScheduledStart(data?.scheduled_start ?? null);
      setScheduledChangesCount(data?.scheduled_changes_count ?? 0);
      setTier("free");
    }
    setLoading(false);
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
    await Promise.all([checkSubscription(), loadDailyUsage()]);
  }, [checkSubscription, loadDailyUsage]);

  useEffect(() => {
    refresh();
    const interval = setInterval(checkSubscription, 60000);
    return () => clearInterval(interval);
  }, [refresh, checkSubscription]);

  const isPro = tier === "pro";
  const isPlus = tier === "plus";
  const isPaid = isPro || isPlus;

  return {
    tier,
    isPro,
    isPlus,
    isPaid,
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
    dailyAnalysesUsed,
    // Only Pro gets unlimited article analyses; Plus uses free limit
    canAnalyze: isPro || dailyAnalysesUsed < FREE_DAILY_ANALYSES,
    refresh,
  };
};

// Usage tracking is now handled server-side in the analyze-link edge function
export const trackAnalysis = async () => {
  // No-op: usage is recorded server-side
};
