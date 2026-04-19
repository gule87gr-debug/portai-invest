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
  const [price, setPrice] = useState("");
  const [direction, setDirection] = useState<"above" | "below">("above");
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id || null);
    });
  }, []);

  const loadAlerts = async () => {
    if (!userId) return;
    setLoading(true);
    const { data } = await supabase
      .from("price_alerts")
      .select("*")
      .eq("ticker", ticker.toUpperCase())
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    setAlerts((data as Alert[]) || []);
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
      toast.error("Please sign in to set price alerts");
      return;
    }
    if (isNaN(target) || target <= 0) {
      toast.error("Enter a valid price greater than 0");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("price_alerts").insert({
      user_id: userId,
      ticker: ticker.toUpperCase(),
      asset_name: assetName,
      asset_type: assetType,
      target_price: target,
      direction,
    });
    setSaving(false);
    if (error) {
      toast.error("Failed to create alert");
      return;
    }
    toast.success(`Alert set for ${ticker} ${direction} $${target}`);
    setPrice("");
    loadAlerts();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("price_alerts").delete().eq("id", id);
    setAlerts((prev) => prev.filter((a) => a.id !== id));
    toast.success("Alert removed");
  };

  const defaultTrigger = (
    <Button variant="outline" size="sm" className="gap-2">
      <Bell className="h-4 w-4" /> Price Alert
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BellRing className="h-5 w-5 text-primary" />
            Price Alerts for {ticker.toUpperCase()}
          </DialogTitle>
        </DialogHeader>

        {!userId ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            Please sign in to set price alerts.
          </div>
        ) : (
          <>
            <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
              {currentPrice !== undefined && (
                <p className="text-xs text-muted-foreground">
                  Current price: <span className="font-mono font-semibold text-foreground">${currentPrice.toFixed(2)}</span>
                </p>
              )}
              <div className="space-y-2">
                <Label htmlFor="alert-price" className="text-xs">Target price ($)</Label>
                <Input
                  id="alert-price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="e.g. 250.00"
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
                  <TrendingUp className="h-3.5 w-3.5" /> Rises above
                </button>
                <button
                  type="button"
                  onClick={() => setDirection("below")}
                  className={cn(
                    "flex items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-xs font-medium transition-colors",
                    direction === "below" ? "border-red-500/50 bg-red-500/10 text-red-400" : "border-border text-muted-foreground hover:bg-accent"
                  )}
                >
                  <TrendingDown className="h-3.5 w-3.5" /> Falls below
                </button>
              </div>
              <Button onClick={handleCreate} disabled={saving} className="w-full" size="sm">
                {saving ? "Setting..." : "Set Alert"}
              </Button>
            </div>

            <div className="mt-2">
              <h4 className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Alerts</h4>
              {loading ? (
                <p className="text-xs text-muted-foreground">Loading...</p>
              ) : alerts.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2">No alerts set yet.</p>
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
                          {a.direction} ${Number(a.target_price).toFixed(2)}
                        </span>
                        {a.triggered && (
                          <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">Triggered</span>
                        )}
                      </div>
                      <button
                        onClick={() => handleDelete(a.id)}
                        className="text-muted-foreground hover:text-red-400"
                        aria-label="Delete alert"
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

        <DialogFooter className="text-[10px] text-muted-foreground">
          Alerts are checked roughly every 5 minutes during market activity.
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
