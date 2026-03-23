import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

type SubscriptionState = {
  isPro: boolean;
  loading: boolean;
  subscriptionEnd: string | null;
  cancelAtPeriodEnd: boolean;
  subscriptionId: string | null;
  dailyAnalysesUsed: number;
  canAnalyze: boolean;
  refresh: () => Promise<void>;
};

const FREE_DAILY_ANALYSES = 3;

export const useSubscription = (): SubscriptionState => {
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(true);
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const [cancelAtPeriodEnd, setCancelAtPeriodEnd] = useState(false);
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);
  const [dailyAnalysesUsed, setDailyAnalysesUsed] = useState(0);

  const checkSubscription = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) throw error;
      setIsPro(data?.subscribed ?? false);
      setSubscriptionEnd(data?.subscription_end ?? null);
      setCancelAtPeriodEnd(data?.cancel_at_period_end ?? false);
      setSubscriptionId(data?.subscription_id ?? null);
    } catch {
      setIsPro(false);
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

  return {
    isPro,
    loading,
    subscriptionEnd,
    cancelAtPeriodEnd,
    subscriptionId,
    dailyAnalysesUsed,
    canAnalyze: isPro || dailyAnalysesUsed < FREE_DAILY_ANALYSES,
    refresh,
  };
};

export const trackAnalysis = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("analysis_usage").insert({ user_id: user.id } as any);
};
