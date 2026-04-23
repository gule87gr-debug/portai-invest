import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { usePageTitle } from "@/hooks/usePageTitle";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Loader2, Download, FileText, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

type ConsentRow = {
  id: string;
  created_at: string;
  consent_type: string;
  consent_text: string;
  consent_version: string;
  tier: string | null;
  price_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown> | null;
};

const CONSENT_LABELS: Record<string, { label: string; tone: "default" | "secondary" | "destructive" | "outline" }> = {
  checkout_terms: { label: "Checkout — Terms accepted", tone: "default" },
  eu_withdrawal_waiver: { label: "EU 14-day withdrawal — Waived", tone: "destructive" },
  no_waiver_acknowledged: { label: "EU 14-day withdrawal — Kept", tone: "secondary" },
  cancel_no_refund_acknowledged: { label: "Cancellation — No-refund acknowledged", tone: "outline" },
  reactivate: { label: "Subscription reactivated", tone: "default" },
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const BillingConsents = () => {
  usePageTitle("My Billing Consents | PortAI");
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<ConsentRow[]>([]);
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (!cancelled) {
          setAuthed(false);
          setLoading(false);
        }
        return;
      }
      if (!cancelled) setAuthed(true);
      const { data, error } = await supabase
        .from("payment_consents")
        .select("id, created_at, consent_type, consent_text, consent_version, tier, price_id, ip_address, user_agent, metadata")
        .order("created_at", { ascending: false });
      if (cancelled) return;
      if (error) {
        toast.error("Failed to load your consent records");
        setRows([]);
      } else {
        setRows((data ?? []) as ConsentRow[]);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const handleExport = () => {
    if (rows.length === 0) return;
    const blob = new Blob([JSON.stringify(rows, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `portai-billing-consents-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <AppLayout>
      <div className="mx-auto w-full max-w-4xl space-y-6 p-4 md:p-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold tracking-tight font-display">My Billing Consents</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              A tamper-resistant record of every payment, waiver, and cancellation acknowledgement you've given.
              These records are immutable — kept as legal proof of your informed consent (Directive 2011/83/EU).
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate("/settings")}>Back to Settings</Button>
            <Button variant="default" size="sm" onClick={handleExport} disabled={rows.length === 0}>
              <Download className="mr-2 h-4 w-4" /> Export
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : authed === false ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
              <AlertCircle className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Please sign in to view your billing consents.</p>
            </CardContent>
          </Card>
        ) : rows.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
              <FileText className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium">No consent records yet</p>
              <p className="text-xs text-muted-foreground max-w-md">
                Once you upgrade, change, or cancel a plan, the corresponding informed-consent records will appear
                here for your transparency and audit needs.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {rows.map((row) => {
              const meta = CONSENT_LABELS[row.consent_type] ?? { label: row.consent_type, tone: "secondary" as const };
              return (
                <Card key={row.id}>
                  <CardHeader className="pb-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <CardTitle className="text-base">{meta.label}</CardTitle>
                          <Badge variant={meta.tone}>{row.consent_version}</Badge>
                          {row.tier && <Badge variant="outline" className="capitalize">{row.tier}</Badge>}
                        </div>
                        <CardDescription className="text-xs font-mono">
                          {formatDate(row.created_at)}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-0">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Consent text</div>
                      <p className="text-sm whitespace-pre-wrap rounded-lg bg-muted/40 p-3 border border-border/40">
                        {row.consent_text}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <ProofRow label="IP address" value={row.ip_address ?? "—"} mono />
                      <ProofRow label="Price ID" value={row.price_id ?? "—"} mono />
                      <ProofRow
                        label="User agent"
                        value={row.user_agent ?? "—"}
                        mono
                        className="sm:col-span-2"
                        truncate
                      />
                      {row.metadata && Object.keys(row.metadata).length > 0 && (
                        <ProofRow
                          label="Metadata"
                          value={JSON.stringify(row.metadata, null, 2)}
                          mono
                          className="sm:col-span-2"
                          pre
                        />
                      )}
                    </div>

                    <div className="text-[11px] text-muted-foreground">
                      Record ID: <span className="font-mono">{row.id}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

const ProofRow = ({
  label,
  value,
  mono,
  className,
  truncate,
  pre,
}: {
  label: string;
  value: string;
  mono?: boolean;
  className?: string;
  truncate?: boolean;
  pre?: boolean;
}) => (
  <div className={className}>
    <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">{label}</div>
    {pre ? (
      <pre className={`text-xs rounded-md bg-muted/40 p-2 border border-border/40 overflow-x-auto ${mono ? "font-mono" : ""}`}>{value}</pre>
    ) : (
      <div
        className={`text-xs rounded-md bg-muted/40 p-2 border border-border/40 ${mono ? "font-mono" : ""} ${truncate ? "truncate" : "break-all"}`}
        title={value}
      >
        {value}
      </div>
    )}
  </div>
);

export default BillingConsents;
