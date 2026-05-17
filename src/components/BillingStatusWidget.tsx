import { useEffect, useState } from "react";
import { Crown, Calendar, ExternalLink, Loader2 } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const TIER_META: Record<string, { label: string; price: string; tone: string }> = {
  free: { label: "Free", price: "€0/mo", tone: "bg-muted text-muted-foreground" },
  plus: { label: "Plus", price: "€8.99/mo", tone: "bg-primary/15 text-primary" },
  pro:  { label: "Pro",  price: "€15.99/mo", tone: "bg-primary text-primary-foreground" },
};

export const BillingStatusWidget = () => {
  const { tier, isPaid, subscriptionEnd, subscriptionStatus, cancelAtPeriodEnd, loading } = useSubscription();
  const [portalLoading, setPortalLoading] = useState(false);
  const meta = TIER_META[tier] ?? TIER_META.free;

  const nextBilling = subscriptionEnd
    ? new Date(subscriptionEnd).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })
    : "—";

  const handleManageBilling = async () => {
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      const url = (data as any)?.url;
      if (url) window.open(url, "_blank");
      else throw new Error("Unable to open billing portal");
    } catch (e: any) {
      toast.error(e?.message || "Unable to open billing portal");
    } finally {
      setPortalLoading(false);
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <Crown className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Billing
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold uppercase ${meta.tone}`}>
              {meta.label}
            </span>
            <span className="text-lg font-bold text-foreground">{meta.price}</span>
            {cancelAtPeriodEnd && (
              <span className="rounded-md bg-loss/15 px-2 py-0.5 text-[10px] font-bold uppercase text-loss">
                Canceling
              </span>
            )}
            {subscriptionStatus && subscriptionStatus !== "active" && (
              <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">
                {subscriptionStatus}
              </span>
            )}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span>
              {isPaid
                ? `${cancelAtPeriodEnd ? "Ends" : "Renews"} on ${nextBilling}`
                : "No active subscription"}
            </span>
          </div>
        </div>
        <div className="shrink-0">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : isPaid ? (
            <button
              onClick={handleManageBilling}
              disabled={portalLoading}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-transparent px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent disabled:opacity-50"
            >
              {portalLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <ExternalLink className="h-3 w-3" />}
              Manage
            </button>
          ) : (
            <a
              href="/pricing"
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/85"
            >
              <Crown className="h-3 w-3" />
              Upgrade
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
