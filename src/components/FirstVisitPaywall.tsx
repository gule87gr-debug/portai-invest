import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Crown, Check, X, Sparkles } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { useSubscription } from "@/hooks/useSubscription";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

const STORAGE_PREFIX = "portai.welcomePaywall.";

export const FirstVisitPaywall = () => {
  const { currentUserId } = useApp();
  const { isPaying, trialActive } = useSubscription();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!currentUserId) return;
    if (isPaying || trialActive) return;
    try {
      const key = STORAGE_PREFIX + currentUserId;
      if (!localStorage.getItem(key)) {
        // Small delay so it doesn't interrupt the initial paint/animations
        const tm = window.setTimeout(() => setOpen(true), 600);
        return () => window.clearTimeout(tm);
      }
    } catch { /* ignore */ }
  }, [currentUserId, isPaying, trialActive]);

  const dismiss = (markSeen = true) => {
    if (markSeen && currentUserId) {
      try { localStorage.setItem(STORAGE_PREFIX + currentUserId, new Date().toISOString()); } catch { /* ignore */ }
    }
    setOpen(false);
  };

  if (!open) return null;

  const tr = (key: string, fallback: string) => {
    const v = t(key);
    return v && v !== key ? v : fallback;
  };

  const freePerks = [
    tr("welcomeFreePerk1", "1 watchlist with up to 5 assets"),
    tr("welcomeFreePerk2", "1 article bias analysis per day"),
    tr("welcomeFreePerk3", "Live news feed with trust scores"),
  ];
  const freeLimits = [
    tr("welcomeFreeLimit1", "No Pro Deep Dive on articles"),
    tr("welcomeFreeLimit2", "Limited AI Chat messages per day"),
    tr("welcomeFreeLimit3", "No real-time sentiment alerts"),
  ];
  const proPerks = [
    tr("welcomeProPerk1", "Unlimited article bias analyses"),
    tr("welcomeProPerk2", "Pro Deep Dive: stakeholder motives, omitted data, sentiment divergence"),
    tr("welcomeProPerk3", "Unlimited watchlists & assets"),
    tr("welcomeProPerk4", "Real-time sentiment alerts on your tickers"),
    tr("welcomeProPerk5", "Priority access to advanced AI models"),
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-paywall-title"
      className="fixed inset-0 z-[60] flex items-center justify-center bg-background/85 backdrop-blur-md animate-fade-in p-3 sm:p-4"
    >
      <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl border border-primary/30 bg-card shadow-2xl shadow-primary/10 spring-in">
        <button
          onClick={() => dismiss(true)}
          aria-label={tr("close", "Close")}
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="p-5 sm:p-7">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
              {tr("welcomePaywallEyebrow", "Welcome to PortAI")}
            </span>
          </div>
          <h2 id="welcome-paywall-title" className="editorial-h2 text-2xl sm:text-3xl font-bold leading-tight">
            {tr("welcomePaywallTitle", "Pick the experience that fits you")}
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            {tr("welcomePaywallSub", "You can stay on the Free tier or unlock Pro for unlimited bias analysis and deep market intelligence.")}
          </p>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {/* Free tier */}
            <div className="rounded-xl border border-border bg-accent/20 p-4 sm:p-5 flex flex-col">
              <div className="flex items-baseline justify-between mb-2">
                <h3 className="text-base font-bold">{tr("free", "Free")}</h3>
                <span className="text-sm font-semibold text-muted-foreground">€0</span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">{tr("welcomeFreeSubtitle", "Get started, no card required")}</p>

              <p className="text-[11px] font-bold uppercase tracking-wider text-gain mb-1.5">
                {tr("benefits", "Benefits")}
              </p>
              <ul className="space-y-1.5 mb-3">
                {freePerks.map((p) => (
                  <li key={p} className="flex items-start gap-2 text-xs">
                    <Check className="h-3.5 w-3.5 text-gain mt-0.5 shrink-0" />
                    <span className="text-foreground/90">{p}</span>
                  </li>
                ))}
              </ul>

              <p className="text-[11px] font-bold uppercase tracking-wider text-loss mb-1.5">
                {tr("drawbacks", "Drawbacks")}
              </p>
              <ul className="space-y-1.5 mb-4">
                {freeLimits.map((p) => (
                  <li key={p} className="flex items-start gap-2 text-xs">
                    <X className="h-3.5 w-3.5 text-loss mt-0.5 shrink-0" />
                    <span className="text-muted-foreground">{p}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => dismiss(true)}
                className="mt-auto w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-accent transition-colors"
              >
                {tr("welcomeContinueFree", "Continue with Free")}
              </button>
            </div>

            {/* Pro tier */}
            <div className="relative rounded-xl border border-primary bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-4 sm:p-5 flex flex-col">
              <span className="absolute -top-2 right-4 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-foreground shadow-md">
                {tr("bestValue", "Best Value")}
              </span>
              <div className="flex items-baseline justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Crown className="h-4 w-4 text-primary" />
                  <h3 className="text-base font-bold">Pro</h3>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-foreground">€15.99</span>
                  <span className="text-[11px] text-muted-foreground">/mo</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-3">{tr("proSubtitle", "Institutional-grade tools")}</p>

              <p className="text-[11px] font-bold uppercase tracking-wider text-primary mb-1.5">
                {tr("everythingYouGet", "Everything you get")}
              </p>
              <ul className="space-y-1.5 mb-4">
                {proPerks.map((p) => (
                  <li key={p} className="flex items-start gap-2 text-xs">
                    <Check className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                    <span className="text-foreground/90">{p}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto space-y-2">
                <button
                  onClick={() => { dismiss(true); navigate("/pricing"); }}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors active:scale-[0.98] shadow-lg shadow-primary/20"
                >
                  <Crown className="h-4 w-4" />
                  {tr("upgradeToPro", "Upgrade to Pro")}
                </button>
                <p className="text-center text-[10px] text-muted-foreground">
                  {tr("welcomeProFootnote", "Cancel anytime. 14-day free trial also available.")}
                </p>
              </div>
            </div>
          </div>

          <p className="mt-4 text-center text-[10px] text-muted-foreground">
            {tr("welcomeChangeLater", "You can change your plan anytime from Settings.")}
          </p>
        </div>
      </div>
    </div>
  );
};
