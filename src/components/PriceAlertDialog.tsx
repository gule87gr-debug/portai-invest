import { useEffect, useState } from "react";
import { Bell, BellRing, Trash2, TrendingUp, TrendingDown, Sparkles, Lock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/hooks/useSubscription";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

type Alert = {
  id: string;
  ticker: string;
  target_price: number;
  direction: "above" | "below";
  triggered: boolean;
  created_at: string;
};

type Props = {
  ticker: string;
  assetName?: string;
  assetType?: string;
  currentPrice?: number;
  trigger?: React.ReactNode;
};

export const PriceAlertDialog = ({ ticker, assetName = "", assetType = "stock", currentPrice, trigger }: Props) => {
  const [open, setOpen] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeCount, setActiveCount] = useState(0);
  const [price, setPrice] = useState("");
  const [direction, setDirection] = useState<"above" | "below">("above");
  const [userId, setUserId] = useState<string | null>(null);
  const { hasPriceAlerts, isPlus, activeAlertLimit, loading: subLoading } = useSubscription();
  const atCap = isPlus && activeAlertLimit !== null && activeCount >= activeAlertLimit;
  const navigate = useNavigate();
  let t: (k: string) => string;
  try { t = useLanguage().t; } catch { t = (k) => k; }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id || null);
    });
  }, []);

  const loadAlerts = async () => {
    if (!userId) return;
    setLoading(true);
    const [rows, total] = await Promise.all([supabase
      .from("price_alerts")
      .select("id,ticker,target_price,direction,triggered,created_at")
      .eq("ticker", ticker.toUpperCase())
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
      supabase.from("price_alerts").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("triggered", false),
    ]);
    if (rows.error || total.error) { toast.error(t("alertLoadFailed")); setLoading(false); return; }
    setAlerts((rows.data as Alert[]) || []);
    setActiveCount(total.count ?? 0);
    setLoading(false);
  };

  useEffect(() => {
    if (open && userId) loadAlerts();
  }, [open, userId, ticker]);

  // Default direction based on current price input vs market price
  useEffect(() => {
    const p = parseFloat(price);
    if (!isNaN(p) && currentPrice) {
      setDirection(p >= currentPrice ? "above" : "below");
    }
  }, [price, currentPrice]);

  const handleCreate = async () => {
    const target = parseFloat(price);
    if (!userId) {
      toast.error(t("signInForAlertsToast"));
      return;
    }
    if (!hasPriceAlerts) {
      toast.error(t("alertsProToast"));
      return;
    }
    if (atCap) { toast.error(t("plusAlertCapReached")); return; }
    if (isNaN(target) || target <= 0) {
      toast.error(t("enterValidPrice"));
      return;
    }
    setSaving(true);
    const { error } = await supabase.functions.invoke("create-price-alert", { body: {
      ticker: ticker.toUpperCase(),
      asset_name: assetName,
      asset_type: assetType,
      target_price: target,
      direction,
    } });
    setSaving(false);
    if (error) {
      const response = "context" in error && error.context instanceof Response ? await error.context.json().catch(() => null) : null;
      toast.error(response?.code === "PRICE_ALERT_LIMIT_REACHED" ? t("plusAlertCapReached") : response?.code === "PRICE_ALERTS_PAID_REQUIRED" ? t("alertsProToast") : t("alertCreateFailed"));
      void loadAlerts();
      return;
    }
    toast.success(`${ticker} ${direction === "above" ? t("risesAbove") : t("fallsBelow")} $${target}`);
    setPrice("");
    // Opportunistically ask for browser push permission so users get desktop/mobile alerts
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      try { await Notification.requestPermission(); } catch { /* ignore */ }
    }
    loadAlerts();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("price_alerts").delete().eq("id", id);
    if (error) { toast.error(t("alertDeleteFailed")); return; }
    void loadAlerts();
    toast.success(t("alertRemovedToast"));
  };

  const defaultTrigger = (
    <Button variant="outline" size="sm" className="gap-2">
      <Bell className="h-4 w-4" /> {t("priceAlert")}
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BellRing className="h-5 w-5 text-primary" />
            {t("priceAlertsFor")} {ticker.toUpperCase()}
          </DialogTitle>
        </DialogHeader>

        {!userId ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            {t("signInForAlertsBody")}
          </div>
        ) : !subLoading && !hasPriceAlerts ? (
          <div className="py-6 px-2 text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/15">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-foreground">{t("priceAlert")}</h3>
              <p className="text-sm text-muted-foreground">
                {t("proFeatureBody")}
              </p>
            </div>
            <Button
              onClick={() => { setOpen(false); navigate("/pricing"); }}
              className="w-full gap-2"
            >
              <Sparkles className="h-4 w-4" /> {t("upgradeToPlus")}
            </Button>
          </div>
        ) : (
          <>
            {isPlus && <div className="space-y-2">
              <p className="text-sm font-mono" aria-live="polite">{t("plusActiveAlertCount").replace("{count}", String(activeCount))}</p>
              {atCap && <><p className="text-sm text-muted-foreground">{t("plusAlertCapReached")}</p><Button variant="outline" onClick={() => { setOpen(false); navigate("/pricing"); }}>{t("upgradeToPro")}</Button></>}
            </div>}
            <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
              {currentPrice !== undefined && (
                <p className="text-xs text-muted-foreground">
                  {t("currentPriceLabel")}: <span className="font-mono font-semibold text-foreground">${currentPrice.toFixed(2)}</span>
                </p>
              )}
              <div className="space-y-2">
                <Label htmlFor="alert-price" className="text-xs">{t("targetPriceLabel")}</Label>
                <Input
                  id="alert-price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder={t("targetPricePh")}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDirection("above")}
                  className={cn(
                    "flex items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-xs font-medium transition-colors",
                    direction === "above" ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400" : "border-border text-muted-foreground hover:bg-accent"
                  )}
                >
                  <TrendingUp className="h-3.5 w-3.5" /> {t("risesAbove")}
                </button>
                <button
                  type="button"
                  onClick={() => setDirection("below")}
                  className={cn(
                    "flex items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-xs font-medium transition-colors",
                    direction === "below" ? "border-red-500/50 bg-red-500/10 text-red-400" : "border-border text-muted-foreground hover:bg-accent"
                  )}
                >
                  <TrendingDown className="h-3.5 w-3.5" /> {t("fallsBelow")}
                </button>
              </div>
              <Button onClick={handleCreate} disabled={saving || loading || subLoading || atCap} className="w-full" size="sm">
                {saving ? t("settingDots") : t("setAlert")}
              </Button>
            </div>

            <div className="mt-2">
              <h4 className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("activeAlerts")}</h4>
              {loading ? (
                <p className="text-xs text-muted-foreground">{t("loadingDots")}</p>
              ) : alerts.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2">{t("noAlertsYet")}</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {alerts.map((a) => (
                    <div key={a.id} className="flex items-center justify-between rounded-md border border-border bg-card px-3 py-2">
                      <div className="flex items-center gap-2">
                        {a.direction === "above" ? (
                          <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                        ) : (
                          <TrendingDown className="h-3.5 w-3.5 text-red-400" />
                        )}
                        <span className="text-sm font-mono">
                          {a.direction === "above" ? t("risesAbove") : t("fallsBelow")} ${Number(a.target_price).toFixed(2)}
                        </span>
                        {a.triggered && (
                          <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">{t("alertTriggered")}</span>
                        )}
                      </div>
                      <button
                        onClick={() => handleDelete(a.id)}
                        className="text-muted-foreground hover:text-red-400"
                        aria-label={t("deleteAlertLabel")}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        <DialogFooter className="flex items-center justify-between text-[10px] text-muted-foreground sm:justify-between">
          <span>{t("alertsCheckNote")}</span>
          {userId && hasPriceAlerts && (
            <Button variant="link" size="sm"
              type="button"
              onClick={() => { setOpen(false); navigate("/alerts"); }}
              className="text-primary hover:underline font-medium whitespace-nowrap"
            >
              {t("viewAllAlerts")} →
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
