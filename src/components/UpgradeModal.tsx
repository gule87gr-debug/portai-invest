import { Crown, X, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { TrialActivation } from "@/components/TrialActivation";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
}

export const UpgradeModal = ({
  open,
  onClose,
  title,
  description,
}: UpgradeModalProps) => {
  const navigate = useNavigate();
  let t: (k: string) => string;
  try { t = useLanguage().t; } catch { t = (k) => k; }

  if (!open) return null;

  const plusFeatures = [
    t("plusFeatPlan"),
    t("plusFeatChat"),
    t("plusFeatWatch"),
    t("plusFeatCompare"),
    t("plusFeatHeatmaps"),
    t("plusFeatDeepDive"),
    t("plusFeatAlerts"),
    "Advanced AI models (5 messages/day each)",
  ];

  const proFeatures = [
    "Everything in Plus, plus:",
    "Unlimited messages on all AI models",
    t("proFeatAnalyses"),
    t("proFeatFactCheck"),
    t("proFeatInstitutional"),
    t("proFeatRealtime"),
    t("proFeatPriority"),
  ];

  const goToPricing = () => {
    onClose();
    navigate("/pricing");
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="upgrade-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in p-4"
    >
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto bento-card spring-in border-primary/30 p-6 sm:p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20">
            <Crown className="h-6 w-6 text-primary" />
          </div>
          <button onClick={onClose} aria-label="Close upgrade dialog" className="text-muted-foreground hover:text-foreground focus-ring">
            <X className="h-5 w-5" />
          </button>
        </div>

        <h2 id="upgrade-modal-title" className="text-xl font-bold mb-1 editorial-h2">{title ?? t("upgradeYourPlan")}</h2>
        <p className="text-sm text-muted-foreground mb-5">{description ?? t("upgradeChoose")}</p>

        <div className="mb-5">
          <TrialActivation />
        </div>


        <div className="space-y-4">
          {/* Plus card */}
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Crown className="h-4 w-4 text-primary" />
                  <h3 className="text-base font-semibold">Plus</h3>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{t("plusEssentials")}</p>
              </div>
              <div className="text-right">
                <div className="mb-0.5"><span className="inline-block rounded-full bg-green-500/20 px-1.5 py-0.5 text-[9px] font-bold text-green-500">40% {t("off")}</span></div>
                <div className="text-base font-bold text-foreground">
                  €8.99<span className="text-xs font-normal text-muted-foreground line-through ml-1">€14.99</span><span className="text-xs font-normal text-muted-foreground">/mo</span>
                </div>
              </div>
            </div>
            <ul className="space-y-1.5 text-sm">
              {plusFeatures.map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={goToPricing}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-4 py-2.5 text-sm font-medium text-primary hover:bg-primary/20"
            >
              {t("upgradeToPlus")}
            </button>
          </div>

          {/* Pro card */}
          <div className="relative rounded-xl border border-primary bg-primary/10 p-4 space-y-3">
            <span className="absolute -top-2 right-4 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-foreground">
              {t("bestValue")}
            </span>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Crown className="h-4 w-4 text-primary" />
                  <h3 className="text-base font-semibold">Pro</h3>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{t("proSubtitle")}</p>
              </div>
              <div className="text-right">
                <div className="mb-0.5"><span className="inline-block rounded-full bg-green-500/20 px-1.5 py-0.5 text-[9px] font-bold text-green-500">36% {t("off")}</span></div>
                <div className="text-base font-bold text-foreground">
                  €15.99<span className="text-xs font-normal text-muted-foreground line-through ml-1">€24.99</span><span className="text-xs font-normal text-muted-foreground">/mo</span>
                </div>
              </div>
            </div>
            <ul className="space-y-1.5 text-sm">
              {proFeatures.map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={goToPricing}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Crown className="h-4 w-4" />
              {t("upgradeToPro")}
            </button>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-5 w-full rounded-xl border border-border py-2.5 text-sm font-medium hover:bg-accent"
        >
          {t("maybeLater")}
        </button>
      </div>
    </div>
  );
};
