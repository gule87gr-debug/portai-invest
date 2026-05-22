import { Link } from "react-router-dom";
import { AlertCircle, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useSubscription } from "@/hooks/useSubscription";

const DISMISS_KEY = "trial-ending-banner-dismissed-at";

export const TrialEndingBanner = () => {
  const { trialActive, trialEndingToday, trialDaysLeft, trialEndsAt } = useSubscription();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!trialEndsAt) return;
    const stored = localStorage.getItem(DISMISS_KEY);
    if (stored === trialEndsAt) setDismissed(true);
  }, [trialEndsAt]);

  if (!trialActive || !trialEndingToday || dismissed) return null;

  const dismiss = () => {
    if (trialEndsAt) localStorage.setItem(DISMISS_KEY, trialEndsAt);
    setDismissed(true);
  };

  return (
    <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-warning/40 bg-warning/10 px-4 py-3">
      <div className="flex items-start gap-2.5 min-w-0">
        <AlertCircle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
        <p className="text-sm text-foreground">
          {trialDaysLeft === 0
            ? "Your Pro trial is ending today."
            : "Your Pro trial is ending soon."}{" "}
          Would you like to subscribe to keep your institutional access?
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Link
          to="/pricing"
          className="rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/90"
        >
          Subscribe
        </Link>
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
