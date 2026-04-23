import { Crown, X, Zap, TrendingUp, BarChart3, MessageCircle, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
}

const plusFeatures = [
  { icon: BarChart3, text: "Full investor quiz results" },
  { icon: MessageCircle, text: "Unlimited AI chat & image analysis" },
  { icon: TrendingUp, text: "Unlimited watchlists & stocks" },
];

const proExtras = [
  { icon: Zap, text: "Unlimited article analyses & AI price alerts" },
];

export const UpgradeModal = ({ open, onClose, title = "Upgrade your plan", description = "Choose Plus for the essentials, or Pro for the full experience." }: UpgradeModalProps) => {
  const navigate = useNavigate();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in p-4">
      <div className="w-full max-w-md rounded-2xl border border-primary/30 bg-card p-6 shadow-xl shadow-primary/10">
        <div className="flex items-start justify-between mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20">
            <Crown className="h-6 w-6 text-primary" />
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-xl font-bold">{title}</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-5">{description}</p>

        <div className="space-y-4 mb-6">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-primary mb-2 flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5" /> Plus — €8.99/mo
            </div>
            <div className="space-y-2 pl-1">
              {plusFeatures.map((f, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <f.icon className="h-4 w-4 text-primary shrink-0" />
                  <span>{f.text}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="border-t border-border pt-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-primary mb-2 flex items-center gap-2">
              <Crown className="h-3.5 w-3.5" /> Pro — €15.99/mo (everything in Plus, and:)
            </div>
            <div className="space-y-2 pl-1">
              {proExtras.map((f, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <f.icon className="h-4 w-4 text-primary shrink-0" />
                  <span>{f.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium transition-colors hover:bg-accent"
          >
            Maybe Later
          </button>
          <button
            onClick={() => { onClose(); navigate("/pricing"); }}
            className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            See Plans
          </button>
        </div>
      </div>
    </div>
  );
};
