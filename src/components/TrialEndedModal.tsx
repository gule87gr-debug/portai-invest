import { useEffect, useState } from "react";
import { Crown, X, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/hooks/useSubscription";

/**
 * Shown once per session, on the first authenticated page load, to a user
 * whose free trial has ended and who hasn't subscribed yet.
 */
export const TrialEndedModal = () => {
  const navigate = useNavigate();
  const { loading, trialUsed, trialActive, isPaying, trialEndsAt } = useSubscription();
  const [userId, setUserId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  useEffect(() => {
    if (loading || !userId) return;
    if (!trialUsed || trialActive || isPaying) return;
    const key = `portai-trial-ended-prompt-${userId}`;
    if (sessionStorage.getItem(key) === "1") return;
    sessionStorage.setItem(key, "1");
    setOpen(true);
  }, [loading, userId, trialUsed, trialActive, isPaying]);

  if (!open) return null;

  const endedOn = trialEndsAt
    ? new Date(trialEndsAt).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })
    : null;

  const dismiss = () => setOpen(false);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="trial-ended-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in p-4"
    >
      <div className="w-full max-w-md bento-card spring-in border-primary/30 p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20">
            <Crown className="h-6 w-6 text-primary" />
          </div>
          <button onClick={dismiss} aria-label="Close" className="text-muted-foreground hover:text-foreground focus-ring">
            <X className="h-5 w-5" />
          </button>
        </div>

        <h2 id="trial-ended-title" className="text-xl font-bold mb-1">Your free trial has ended</h2>
        <p className="text-sm text-muted-foreground mb-4">
          {endedOn
            ? `Your 14-day Pro trial ended on ${endedOn}. Subscribe to keep your Pro benefits.`
            : "Your 14-day Pro trial has ended. Subscribe to keep your Pro benefits."}
        </p>

        <ul className="mb-5 space-y-1.5 text-sm">
          {[
            "Unlimited article analyses",
            "Pro-only fact-check & deep dives",
            "Unlimited AI chat on all models",
            "Real-time price alerts",
          ].map((f) => (
            <li key={f} className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary shrink-0" />
              <span>{f}</span>
            </li>
          ))}
        </ul>

        <button
          onClick={() => { dismiss(); navigate("/pricing"); }}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          <Crown className="h-4 w-4" />
          See plans
        </button>

        <button
          onClick={dismiss}
          className="mt-3 w-full rounded-xl border border-border py-2.5 text-sm font-medium hover:bg-accent"
        >
          Maybe later
        </button>
      </div>
    </div>
  );
};
