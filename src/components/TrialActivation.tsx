import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Crown, Sparkles, Clock, Loader2, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/useSubscription";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Variant = "card" | "compact" | "badge";

type Props = {
  variant?: Variant;
  className?: string;
};

const PRO_TOUR_FEATURES = [
  {
    title: "Unlimited bias analysis",
    body: "Paste any article URL to get a full trust score, summary, and bias breakdown — no daily cap.",
  },
  {
    title: "Pro Deep Dive",
    body: "Stakeholder motives, omitted data points and sentiment divergence on every analysis.",
  },
  {
    title: "Real-time sentiment alerts",
    body: "Get notified when sentiment shifts on the tickers in your watchlists.",
  },
];

export const TrialActivation = ({ variant = "card", className }: Props) => {
  const {
    isPaying,
    trialActive,
    trialUsed,
    trialDaysLeft,
    proTourCompleted,
    activateTrial,
    markProTourCompleted,
  } = useSubscription();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Show tour once after activation
  useEffect(() => {
    if (trialActive && !proTourCompleted) {
      setTourOpen(true);
    }
  }, [trialActive, proTourCompleted]);

  // Only ever show for true Free-tier users (never for paying Plus/Pro).
  // Trial badge is still shown while trial is active.
  if (isPaying) return null;
  if (trialUsed && !trialActive) return null;

  const handleActivate = async () => {
    setSubmitting(true);
    const res = await activateTrial();
    setSubmitting(false);
    if (!res.ok) {
      toast.error(res.error || "Could not start your trial");
      return;
    }
    setOpen(false);
    toast.success("Pro-Access Enabled — enjoy 14 days of unlimited analysis", {
      icon: <Crown className="h-4 w-4" />,
    });
  };

  const closeTour = async () => {
    setTourOpen(false);
    await markProTourCompleted();
  };

  // Active trial states
  if (trialActive) {
    const label = `Pro Trial Active: ${trialDaysLeft} day${trialDaysLeft === 1 ? "" : "s"} left`;
    if (variant === "badge") {
      return (
        <>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-primary",
              className,
            )}
          >
            <Crown className="h-3 w-3" /> {label}
          </span>
          <ProTourDialog open={tourOpen} onClose={closeTour} />
        </>
      );
    }
    return (
      <>
        <div
          className={cn(
            "flex items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-2.5",
            className,
          )}
        >
          <div className="flex items-center gap-2">
            <Crown className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">{label}</span>
          </div>
          <a
            href="/pricing"
            className="text-xs font-bold text-primary hover:underline"
          >
            Subscribe
          </a>
        </div>
        <ProTourDialog open={tourOpen} onClose={closeTour} />
      </>
    );
  }

  // Activation CTA
  const button =
    variant === "compact" ? (
      <button
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors",
          className,
        )}
      >
        <Sparkles className="h-3.5 w-3.5" /> Start 14-Day Free Trial
      </button>
    ) : (
      <div
        className={cn(
          "rounded-2xl border border-primary/40 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-5 sm:p-6",
          className,
        )}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className="rounded-xl bg-primary/15 p-2.5 shrink-0">
              <Crown className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-base font-bold text-foreground">
                Try Pro free for 14 days
              </p>
              <p className="mt-0.5 text-xs sm:text-sm leading-relaxed text-muted-foreground">
                Unlimited bias analysis, Pro deep dives & sentiment alerts. No card required.
              </p>
            </div>
          </div>
          <button
            onClick={() => setOpen(true)}
            className="shrink-0 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors active:scale-[0.97]"
          >
            <Sparkles className="h-4 w-4" /> Start 14-Day Free Trial
          </button>
        </div>
      </div>
    );

  return (
    <>
      {button}
      <Dialog open={open} onOpenChange={(o) => !submitting && setOpen(o)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary" />
              Unlock Pro Institutional Features
            </DialogTitle>
            <DialogDescription>
              Get 14 days of unlimited analysis, real-time sentiment alerts, and
              deep-dive bias reporting. No payment required until the trial ends.
            </DialogDescription>
          </DialogHeader>
          <ul className="space-y-2 py-2 text-sm">
            {PRO_TOUR_FEATURES.map((f) => (
              <li key={f.title} className="flex items-start gap-2">
                <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <span className="text-foreground/90">
                  <span className="font-semibold">{f.title}.</span>{" "}
                  <span className="text-muted-foreground">{f.body}</span>
                </span>
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Clock className="h-3 w-3" /> No automatic billing. You'll only be
            charged if you choose to subscribe after the trial ends.
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={submitting}
            >
              Not Now
            </Button>
            <Button onClick={handleActivate} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Start My Trial
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

const ProTourDialog = ({ open, onClose }: { open: boolean; onClose: () => void }) => (
  <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Welcome to Pro — try these first
        </DialogTitle>
        <DialogDescription>
          Three Pro features worth opening right now.
        </DialogDescription>
      </DialogHeader>
      <ol className="space-y-3 py-2 text-sm">
        {PRO_TOUR_FEATURES.map((f, i) => (
          <li key={f.title} className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
              {i + 1}
            </span>
            <div>
              <p className="font-semibold text-foreground">{f.title}</p>
              <p className="text-xs leading-relaxed text-muted-foreground">{f.body}</p>
            </div>
          </li>
        ))}
      </ol>
      <DialogFooter>
        <Button onClick={onClose}>Got it — let's go</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);
