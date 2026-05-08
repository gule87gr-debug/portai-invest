import { AppLayout } from "@/components/AppLayout";
import { useSubscription } from "@/hooks/useSubscription";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, Crown, Loader2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

const UpgradeSuccess = () => {
  const { t } = useLanguage();
  const { isPro, loading, refresh } = useSubscription();
  const navigate = useNavigate();
  const [attempts, setAttempts] = useState(0);
  const maxAttempts = 10;

  useEffect(() => {
    if (isPro) return;
    if (attempts >= maxAttempts) return;

    const timer = setTimeout(async () => {
      await refresh();
      setAttempts((a) => a + 1);
    }, 2000);

    return () => clearTimeout(timer);
  }, [isPro, attempts, refresh]);

  const confirmed = isPro;

  return (
    <AppLayout>
      <div className="mx-auto max-w-lg py-16 px-4 text-center">
        <div className={cn(
          "mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full transition-all duration-500",
          confirmed ? "bg-primary/20" : "bg-muted"
        )}>
          {confirmed ? (
            <CheckCircle className="h-10 w-10 text-primary animate-in zoom-in duration-500" />
          ) : (
            <Loader2 className="h-10 w-10 text-muted-foreground animate-spin" />
          )}
        </div>

        <h1 className="text-3xl font-bold mb-3">
          {confirmed ? "Welcome to Pro!" : "Confirming your subscription…"}
        </h1>

        <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
          {confirmed
            ? "Your Pro subscription is now active. You have full access to all premium features."
            : attempts >= maxAttempts
              ? "It's taking a bit longer than expected. Your subscription may need a moment to activate."
              : "We're verifying your payment with Stripe. This usually takes just a few seconds."}
        </p>

        {confirmed && (
          <div className="space-y-3">
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 mb-6">
              <div className="flex items-center justify-center gap-2 text-primary font-semibold mb-2">
                <Crown className="h-5 w-5" />
                <span>{t("proPlanActive")}</span>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>✓ Unlimited article analyses</li>
                <li>✓ Unlimited watchlists & stocks</li>
                <li>✓ Full quiz results & investor profile</li>
                <li>✓ Priority AI chat</li>
              </ul>
            </div>

            <button
              onClick={() => navigate("/dashboard")}
              className="w-full rounded-xl bg-primary py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 flex items-center justify-center gap-2"
            >
              Go to Dashboard
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {!confirmed && attempts >= maxAttempts && (
          <button
            onClick={() => refresh()}
            className="rounded-xl border border-border px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            Check again
          </button>
        )}
      </div>
    </AppLayout>
  );
};

export default UpgradeSuccess;
