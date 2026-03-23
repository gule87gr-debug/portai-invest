import { Crown, X, Zap, TrendingUp, BarChart3, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
}

const features = [
  { icon: Zap, text: "Unlimited article analyses" },
  { icon: TrendingUp, text: "Unlimited watchlists & stocks" },
  { icon: BarChart3, text: "Full investor quiz results" },
  { icon: MessageCircle, text: "Priority AI chat responses" },
];

export const UpgradeModal = ({ open, onClose, title = "Upgrade to Pro", description = "Unlock the full power of PortAI with unlimited features." }: UpgradeModalProps) => {
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

        <h2 className="text-xl font-bold mb-1">{title}</h2>
        <p className="text-sm text-muted-foreground mb-5">{description}</p>

        <div className="space-y-3 mb-6">
          {features.map((f, i) => (
            <div key={i} className="flex items-center gap-3 text-sm">
              <f.icon className="h-4 w-4 text-primary shrink-0" />
              <span>{f.text}</span>
            </div>
          ))}
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
            Upgrade — $9.99/mo
          </button>
        </div>
      </div>
    </div>
  );
};
