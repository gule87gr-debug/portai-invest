import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { SEO } from "@/components/SEO";
import { usePageTitle } from "@/hooks/usePageTitle";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Bell, BellRing, TrendingUp, TrendingDown, Trash2, CheckCircle2, Loader2, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { EmptyState } from "@/components/EmptyState";
import { WatchlistRowsSkeleton } from "@/components/Skeletons";
import { enqueueAction, isNetworkError, registerOfflineHandler } from "@/lib/offlineQueue";

type Alert = {
  id: string;
  ticker: string;
  asset_name: string;
  asset_type: string;
  target_price: number;
  direction: "above" | "below";
  triggered: boolean;
  triggered_at: string | null;
  created_at: string;
};

const CACHE_KEY = "portai-alerts-cache";

const readCache = (): Alert[] | null => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as Alert[]) : null;
  } catch { return null; }
};
const writeCache = (rows: Alert[]) => {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(rows)); } catch { /* ignore */ }
};

registerOfflineHandler("alert.delete", async ({ id }: { id: string }) => {
  const { error } = await supabase.from("price_alerts").delete().eq("id", id);
  if (error) throw error;
});

const fmtDate = (s: string | null) =>
  s ? new Date(s).toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "";

const AlertsPage = () => {
  usePageTitle("Alert History | PortAI");
  const navigate = useNavigate();
  const cached = readCache();
  const [alerts, setAlerts] = useState<Alert[]>(cached ?? []);
  const [loading, setLoading] = useState(!cached);
  const [tab, setTab] = useState<"active" | "history">("active");
  const [pushPerm, setPushPerm] = useState<NotificationPermission>(
    typeof Notification !== "undefined" ? Notification.permission : "denied"
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { navigate("/"); return; }
      const { data } = await supabase
        .from("price_alerts")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });
      if (!cancelled) {
        const rows = (data as Alert[]) || [];
        setAlerts(rows);
        writeCache(rows);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [navigate]);

  const active = useMemo(() => alerts.filter((a) => !a.triggered), [alerts]);
  const history = useMemo(() => alerts.filter((a) => a.triggered), [alerts]);

  const handleDelete = async (id: string) => {
    const snapshot = alerts;
    setAlerts((p) => {
      const next = p.filter((a) => a.id !== id);
      writeCache(next);
      return next;
    });
    try {
      const { error } = await supabase.from("price_alerts").delete().eq("id", id);
      if (error) throw error;
      toast.success("Alert removed");
    } catch (err) {
      if (isNetworkError(err)) {
        enqueueAction("alert.delete", { id });
        toast("Removed offline — will sync when you're back online");
        return;
      }
      setAlerts(snapshot);
      writeCache(snapshot);
      toast.error("Couldn't remove that alert", {
        action: { label: "Retry", onClick: () => void handleDelete(id) },
      });
    }
  };

  const enablePush = async () => {
    if (typeof Notification === "undefined") {
      toast.error("Browser notifications not supported");
      return;
    }
    const perm = await Notification.requestPermission();
    setPushPerm(perm);
    if (perm === "granted") {
      toast.success("Push notifications enabled");
      new Notification("PortAI alerts enabled", { body: "You'll be notified when your price alerts trigger." });
    } else {
      toast.error("Permission denied");
    }
  };

  const list = tab === "active" ? active : history;

  return (
    <AppLayout>
      <SEO title="Alert History — PortAI" description="View triggered and active price alerts." path="/alerts" />
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2"><BellRing className="h-7 w-7 text-primary" /> Price Alerts</h1>
          <p className="mt-1 text-sm text-muted-foreground">Active alerts and complete trigger history.</p>
        </div>
        {pushPerm !== "granted" ? (
          <Button onClick={enablePush} className="gap-2"><Bell className="h-4 w-4" /> Enable push notifications</Button>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 text-emerald-400 px-3 py-1.5 text-xs font-medium">
            <CheckCircle2 className="h-3.5 w-3.5" /> Push notifications on
          </span>
        )}
      </div>

      <div className="mb-4 inline-flex rounded-lg border border-border bg-muted/40 p-0.5">
        {(["active", "history"] as const).map((k) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={cn(
              "px-4 py-1.5 text-sm rounded-md transition-colors capitalize",
              tab === k ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {k} {k === "active" ? `(${active.length})` : `(${history.length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <WatchlistRowsSkeleton rows={4} />
      ) : list.length === 0 ? (
        <EmptyState
          icon={BellOff}
          title={tab === "active" ? "No active alerts" : "No alerts have triggered yet"}
          description={
            tab === "active"
              ? "Open any stock page and set a target price to be notified when it's reached."
              : "Once one of your price targets is hit, it will show up here."
          }
          actionLabel={tab === "active" ? "Browse watchlists" : undefined}
          onAction={tab === "active" ? () => navigate("/watchlists") : undefined}
        />
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {list.map((a, i) => {
            const isUp = a.direction === "above";
            return (
              <div
                key={a.id}
                className={cn(
                  "flex items-center justify-between gap-3 px-4 py-3 hover:bg-accent/30 transition-colors",
                  i < list.length - 1 && "border-b border-border/60"
                )}
              >
                <button
                  onClick={() => navigate(`/stock/${a.ticker}`)}
                  className="flex items-center gap-3 min-w-0 flex-1 text-left"
                >
                  <div className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                    isUp ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"
                  )}>
                    {isUp ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-semibold">{a.ticker}</span>
                      {a.asset_name && <span className="text-xs text-muted-foreground truncate">{a.asset_name}</span>}
                      {a.triggered && (
                        <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">TRIGGERED</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                      {isUp ? "↑ above" : "↓ below"} ${Number(a.target_price).toFixed(2)}
                      {" · "}
                      {a.triggered ? `triggered ${fmtDate(a.triggered_at)}` : `set ${fmtDate(a.created_at)}`}
                    </p>
                  </div>
                </button>
                <button
                  onClick={() => handleDelete(a.id)}
                  className="press-scale text-muted-foreground hover:text-red-400 shrink-0"
                  aria-label="Delete alert"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
};

export default AlertsPage;
