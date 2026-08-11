import { useCallback, useEffect, useSyncExternalStore, useRef } from "react";
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

/* ------------------------------------------------------------------ *
 * Module-level store: one network round-trip shared by every consumer *
 * ------------------------------------------------------------------ */

type Snapshot = {
  paidTier: SubscriptionTier;
  loading: boolean;
  subscriptionEnd: string | null;
  cancelAtPeriodEnd: boolean;
  subscriptionId: string | null;
  subscriptionStatus: string | null;
  scheduledTier: SubscriptionTier | null;
  scheduledStart: string | null;
  scheduledChangesCount: number;
  dailyAnalysesUsed: number;
  trialActive: boolean;
  trialUsed: boolean;
  trialEndsAt: string | null;
  proTourCompleted: boolean;
};

const emptySnapshot: Snapshot = {
  paidTier: "free",
  loading: true,
  subscriptionEnd: null,
  cancelAtPeriodEnd: false,
  subscriptionId: null,
  subscriptionStatus: null,
  scheduledTier: null,
  scheduledStart: null,
  scheduledChangesCount: 0,
  dailyAnalysesUsed: 0,
  trialActive: false,
  trialUsed: false,
  trialEndsAt: null,
  proTourCompleted: false,
};

let snapshot: Snapshot = emptySnapshot;
const listeners = new Set<() => void>();
const CACHE_PREFIX = "portai-sub-cache";

const emit = () => listeners.forEach((l) => l());

const setSnapshot = (patch: Partial<Snapshot>) => {
  const next = { ...snapshot, ...patch };
  // Recompute trial validity against the clock on every write so a banner
  // never lingers past its expiry.
  next.trialActive =
    next.trialActive && !!next.trialEndsAt && new Date(next.trialEndsAt).getTime() > Date.now();
  snapshot = next;
  emit();
};

const persist = (userId: string) => {
  try {
    localStorage.setItem(`${CACHE_PREFIX}-${userId}`, JSON.stringify({ ...snapshot, loading: false }));
  } catch { /* storage unavailable */ }
};

const hydrate = (userId: string): boolean => {
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}-${userId}`);
    if (!raw) return false;
    const cached = JSON.parse(raw) as Snapshot;
    setSnapshot({ ...cached, loading: false });
    return true;
  } catch {
    return false;
  }
};

// Synchronously restore the last known snapshot at module load so the first
// paint already has the right tier/trial state (no spinner, no banner flash).
try {
  const key = Object.keys(localStorage).find((k) => k.startsWith(CACHE_PREFIX));
  if (key) {
    const cached = JSON.parse(localStorage.getItem(key) as string) as Snapshot;
    snapshot = { ...emptySnapshot, ...cached, loading: false };
    snapshot.trialActive =
      snapshot.trialActive && !!snapshot.trialEndsAt && new Date(snapshot.trialEndsAt).getTime() > Date.now();
  }
} catch { /* storage unavailable */ }

let inFlight: Promise<void> | null = null;
let started = false;
let expireInFlight = false;
let timer: ReturnType<typeof setInterval> | null = null;

const resetToFree = () => {
  snapshot = { ...emptySnapshot, loading: false };
  emit();
};

const loadAll = async (): Promise<void> => {
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user || !session?.access_token) {
    resetToFree();
    return;
  }

  const today = new Date().toISOString().split("T")[0];

  const [subRes, trialRes, usageRes] = await Promise.allSettled([
    supabase.functions.invoke("check-subscription", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    }),
    supabase
      .from("user_settings")
      .select("pro_trial_active, trial_used, trial_end_date, pro_tour_completed")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("analysis_usage")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("used_date", today),
  ]);

  const patch: Partial<Snapshot> = { loading: false };

  if (subRes.status === "fulfilled" && !subRes.value.error) {
    const data = subRes.value.data as any;
    patch.paidTier = (data?.tier ?? (data?.subscribed ? "pro" : "free")) as SubscriptionTier;
    patch.subscriptionEnd = data?.subscription_end ?? null;
    patch.cancelAtPeriodEnd = data?.cancel_at_period_end ?? false;
    patch.subscriptionId = data?.subscription_id ?? null;
    patch.subscriptionStatus = data?.subscription_status ?? null;
    patch.scheduledTier = (data?.scheduled_tier as SubscriptionTier | null) ?? null;
    patch.scheduledStart = data?.scheduled_start ?? null;
    patch.scheduledChangesCount = data?.scheduled_changes_count ?? 0;
  }

  let needsExpire = false;
  if (trialRes.status === "fulfilled") {
    const data = trialRes.value.data as any;
    if (data) {
      patch.trialUsed = !!data.trial_used;
      patch.trialEndsAt = data.trial_end_date ?? null;
      patch.proTourCompleted = !!data.pro_tour_completed;
      const stillActive =
        !!data.pro_trial_active &&
        !!data.trial_end_date &&
        new Date(data.trial_end_date).getTime() > Date.now();
      patch.trialActive = stillActive;
      needsExpire = !!data.pro_trial_active && !!data.trial_end_date && !stillActive;
    } else {
      patch.trialUsed = false;
      patch.trialEndsAt = null;
      patch.trialActive = false;
      patch.proTourCompleted = false;
    }
  }

  if (usageRes.status === "fulfilled") {
    patch.dailyAnalysesUsed = usageRes.value.count ?? 0;
  }

  setSnapshot(patch);
  persist(user.id);

  // Fire-and-forget server-side expiry; UI already reflects the expired state.
  if (needsExpire && !expireInFlight) {
    expireInFlight = true;
    supabase.functions
      .invoke("manage-trial", {
        body: { action: "expire" },
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      .catch(() => {})
      .finally(() => { expireInFlight = false; });
  }
};

const refreshStore = (): Promise<void> => {
  if (inFlight) return inFlight;
  inFlight = loadAll()
    .catch(() => { setSnapshot({ loading: false }); })
    .finally(() => { inFlight = null; });
  return inFlight;
};

const start = () => {
  if (started) return;
  started = true;

  // Paint instantly from the session cache while the network refresh runs.
  supabase.auth.getSession().then(({ data }) => {
    const uid = data.session?.user?.id;
    if (uid) hydrate(uid);
    else resetToFree();
  });

  refreshStore();

  timer = setInterval(() => { refreshStore(); }, 60000);

  supabase.auth.onAuthStateChange((event) => {
    if (event === "SIGNED_OUT") {
      try {
        Object.keys(localStorage)
          .filter((k) => k.startsWith(CACHE_PREFIX))
          .forEach((k) => localStorage.removeItem(k));
      } catch { /* ignore */ }
      resetToFree();
    } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
      refreshStore();
    }
  });

  if (typeof window !== "undefined") {
    window.addEventListener("beforeunload", () => { if (timer) clearInterval(timer); });
  }
};

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
};

const getSnapshot = () => snapshot;

export const useSubscription = (): SubscriptionState => {
  const s = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => { start(); }, []);

  // Local clock check so an expiring trial banner disappears without waiting
  // on the next network refresh.
  useEffect(() => {
    if (!s.trialActive || !s.trialEndsAt) return;
    const ms = new Date(s.trialEndsAt).getTime() - Date.now();
    if (ms <= 0) { setSnapshot({}); return; }
    if (ms < 2147483647) {
      const to = setTimeout(() => setSnapshot({}), ms + 500);
      return () => clearTimeout(to);
    }
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [s.trialActive, s.trialEndsAt]);

  const refresh = useCallback(async () => { await refreshStore(); }, []);

  const activateTrial = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return { ok: false, error: "Sign in to start your trial." };
    const { data, error } = await supabase.functions.invoke("manage-trial", {
      body: { action: "activate" },
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (error) return { ok: false, error: error.message };
    if ((data as any)?.error) return { ok: false, error: (data as any).error };
    await refreshStore();
    return { ok: true };
  }, []);

  const markProTourCompleted = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setSnapshot({ proTourCompleted: true });
    persist(user.id);
    await supabase.from("user_settings").update({ pro_tour_completed: true }).eq("user_id", user.id);
  }, []);

  const effectiveTier: SubscriptionTier =
    s.paidTier !== "free" ? s.paidTier : s.trialActive ? "pro" : "free";

  const trialDaysLeft = s.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(s.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  const isPro = effectiveTier === "pro";
  const isPlus = effectiveTier === "plus";
  const isPaid = isPro || isPlus;

  return {
    tier: effectiveTier,
    isPro,
    isPlus,
    isPaid,
    isPaying: s.paidTier !== "free",
    isTrialPro: s.trialActive && s.paidTier === "free",
    hasUnlimitedChat: isPaid,
    hasUnlimitedWatchlists: isPaid,
    hasFullQuiz: isPaid,
    loading: s.loading,
    subscriptionEnd: s.subscriptionEnd,
    cancelAtPeriodEnd: s.cancelAtPeriodEnd,
    subscriptionId: s.subscriptionId,
    subscriptionStatus: s.subscriptionStatus,
    scheduledTier: s.scheduledTier,
    scheduledStart: s.scheduledStart,
    scheduledChangesCount: s.scheduledChangesCount,
    dailyAnalysesUsed: s.dailyAnalysesUsed,
    canAnalyze: isPro || s.dailyAnalysesUsed < FREE_DAILY_ANALYSES,
    trialActive: s.trialActive,
    trialUsed: s.trialUsed,
    trialEndsAt: s.trialEndsAt,
    trialDaysLeft,
    trialEndingToday: s.trialActive && trialDaysLeft !== null && trialDaysLeft <= 1,
    proTourCompleted: s.proTourCompleted,
    activateTrial,
    markProTourCompleted,
    refresh,
  };
};

export const trackAnalysis = async () => {
  // No-op: usage is recorded server-side
};
