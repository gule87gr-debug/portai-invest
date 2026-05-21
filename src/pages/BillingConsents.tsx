import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { SEO } from "@/components/SEO";
import { usePageTitle } from "@/hooks/usePageTitle";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Loader2, Download, FileText, AlertCircle, Scale, Lock, Undo2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { getLegalCopy, type LegalConsentMeta } from "@/lib/legalI18n";

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

const formatDate = (iso: string, locale: string) =>
  new Date(iso).toLocaleString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const BillingConsents = () => {
  const { language } = useLanguage();
  const copy = getLegalCopy(language);
  // Map our language codes to BCP-47 tags accepted by Intl.
  const intlLocale =
    language === "es" ? "es-ES" :
    language === "fr" ? "fr-FR" :
    language === "pt" ? "pt-PT" :
    language === "de" ? "de-DE" :
    language === "it" ? "it-IT" : "en-GB";

  usePageTitle(`${copy.page.title} | PortAI`);

  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<ConsentRow[]>([]);
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawReason, setWithdrawReason] = useState("");
  const [withdrawSubmitting, setWithdrawSubmitting] = useState(false);

  // Compute statutory withdrawal eligibility from the user's own records.
  // Eligible if: a `checkout_terms` exists in the last 14 days, AND no
  // `eu_withdrawal_waiver` was given for that purchase, AND no withdrawal
  // has already been exercised in the same window.
  const fourteenDaysAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
  const recentRows = rows.filter((r) => new Date(r.created_at).getTime() >= fourteenDaysAgo);
  const recentCheckout = recentRows.find((r) => r.consent_type === "checkout_terms");
  const recentWaiver = recentRows.find((r) => r.consent_type === "eu_withdrawal_waiver");
  const alreadyExercised = recentRows.some((r) => r.consent_type === "eu_withdrawal_exercised");
  const withdrawalEligible = !!recentCheckout && !recentWaiver && !alreadyExercised;
  const windowEnds = recentCheckout
    ? new Date(new Date(recentCheckout.created_at).getTime() + 14 * 24 * 60 * 60 * 1000)
    : null;

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

  const handleSubmitWithdrawal = async () => {
    if (!recentCheckout) return;
    setWithdrawSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("request-withdrawal", {
        body: {
          reason: withdrawReason || undefined,
          tier: recentCheckout.tier ?? undefined,
          price_id: recentCheckout.price_id ?? undefined,
        },
      });
      if (error) throw error;
      toast.success(data?.message ?? "Withdrawal request recorded.");
      setWithdrawOpen(false);
      setWithdrawReason("");
      // Refresh the log so the new immutable record appears.
      const { data: refreshed } = await supabase
        .from("payment_consents")
        .select("id, created_at, consent_type, consent_text, consent_version, tier, price_id, ip_address, user_agent, metadata")
        .order("created_at", { ascending: false });
      setRows((refreshed ?? []) as ConsentRow[]);
    } catch (e: any) {
      const msg = e?.context?.error || e?.message || "Could not submit withdrawal request.";
      toast.error(msg);
    } finally {
      setWithdrawSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <SEO
        title="My Billing Consents | PortAI"
        description="View your recorded billing consents, subscription history and legal agreements on PortAI."
        path="/billing-consents"
      />
      <div className="mx-auto w-full max-w-4xl space-y-6 p-4 md:p-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold tracking-tight font-display">{copy.page.title}</h1>
            </div>
            <p className="text-sm text-muted-foreground">{copy.page.subtitle}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate("/settings")}>{copy.page.backToSettings}</Button>
            <Button variant="default" size="sm" onClick={handleExport} disabled={rows.length === 0}>
              <Download className="mr-2 h-4 w-4" /> {copy.page.export}
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
              <p className="text-sm text-muted-foreground">{copy.page.signInRequired}</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Scale className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm">{copy.explainer.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 pt-0 text-xs text-muted-foreground">
                <p>{copy.explainer.intro}</p>
                <ul className="list-disc pl-5 space-y-1">
                  {copy.explainer.bullets.map((b, i) => (
                    <li key={i}>
                      <span className="font-medium text-foreground">{b.strong}</span>{b.rest}
                    </li>
                  ))}
                </ul>
                <div className="flex items-start gap-2 rounded-md border border-border/60 bg-background/60 p-2.5 mt-2">
                  <Lock className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                  <p>
                    <span className="font-medium text-foreground">{copy.explainer.immutableStrong}</span>{copy.explainer.immutableRest}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Statutory withdrawal CTA — shown only when actually eligible. */}
            {withdrawalEligible && windowEnds && (
              <Card className="border-warning/40 bg-warning/5">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Undo2 className="h-4 w-4 text-warning" />
                    <CardTitle className="text-sm">{copy.withdrawal.eligibleTitle}</CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    {copy.withdrawal.eligibleBodyPrefix}
                    <span className="font-medium text-foreground">{formatDate(recentCheckout!.created_at, intlLocale)}</span>
                    {copy.withdrawal.eligibleBodyMiddle}
                    <span className="font-medium text-foreground">{formatDate(windowEnds.toISOString(), intlLocale)}</span>
                    {copy.withdrawal.eligibleBodySuffix}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button size="sm" variant="outline" onClick={() => setWithdrawOpen(true)}>
                    {copy.withdrawal.submitCta}
                  </Button>
                </CardContent>
              </Card>
            )}
            {alreadyExercised && (
              <Card className="border-destructive/30 bg-destructive/5">
                <CardContent className="p-4 text-xs text-muted-foreground">
                  {copy.withdrawal.alreadyOnFile}
                </CardContent>
              </Card>
            )}

            {withdrawOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-fade-in">
                <div className="w-full max-w-lg rounded-2xl border border-warning/40 bg-card p-6 shadow-xl">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Undo2 className="h-5 w-5 text-warning" />
                      <h2 className="text-lg font-bold">{copy.withdrawal.modalTitle}</h2>
                    </div>
                    <button onClick={() => setWithdrawOpen(false)} className="text-muted-foreground hover:text-foreground">
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">{copy.withdrawal.modalIntro}</p>
                  <label className="block text-xs font-medium text-foreground mb-1">{copy.withdrawal.optionalReasonLabel}</label>
                  <textarea
                    value={withdrawReason}
                    onChange={(e) => setWithdrawReason(e.target.value.slice(0, 2000))}
                    rows={4}
                    placeholder={copy.withdrawal.optionalReasonPlaceholder}
                    className="w-full rounded-lg border border-border bg-background p-2 text-sm mb-4"
                  />
                  <div className="rounded-lg border border-border bg-muted/40 p-3 text-[11px] text-muted-foreground mb-4 space-y-1">
                    <p><span className="font-medium text-foreground">{copy.withdrawal.whatHappensNext}</span></p>
                    <ul className="list-disc pl-4 space-y-0.5">
                      {copy.withdrawal.happens.map((line, i) => <li key={i}>{line}</li>)}
                    </ul>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1" onClick={() => setWithdrawOpen(false)} disabled={withdrawSubmitting}>
                      {copy.withdrawal.cancelBtn}
                    </Button>
                    <Button className="flex-1" onClick={handleSubmitWithdrawal} disabled={withdrawSubmitting}>
                      {withdrawSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {copy.withdrawal.submitBtn}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {rows.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm font-medium">{copy.page.noRecordsTitle}</p>
                  <p className="text-xs text-muted-foreground max-w-md">{copy.page.noRecordsBody}</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {rows.map((row) => {
                  const meta: LegalConsentMeta = copy.consentLabels[row.consent_type] ?? {
                    label: row.consent_type,
                    tone: "secondary",
                    proves: copy.consentLabels.checkout_terms.proves, // safe generic fallback
                    legalBasis: "—",
                  };
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
                              {formatDate(row.created_at, intlLocale)}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4 pt-0">
                        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-1.5">
                          <div className="text-[11px] font-semibold uppercase tracking-wide text-primary">{copy.card.provesHeading}</div>
                          <p className="text-xs text-foreground leading-relaxed">{meta.proves}</p>
                          <p className="text-[11px] text-muted-foreground">
                            <span className="font-medium text-foreground">{copy.card.legalBasisLabel}</span> {meta.legalBasis}
                          </p>
                        </div>

                        <div>
                          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">{copy.card.exactTextHeading}</div>
                          <p className="text-sm whitespace-pre-wrap rounded-lg bg-muted/40 p-3 border border-border/40">
                            {row.consent_text}
                          </p>
                        </div>

                        <div>
                          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1.5">
                            <Lock className="h-3 w-3" /> {copy.card.immutableHeading}
                          </div>
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <ProofRow label={copy.card.ipLabel} value={row.ip_address ?? "—"} mono />
                            <ProofRow label={copy.card.priceIdLabel} value={row.price_id ?? "—"} mono />
                            <ProofRow
                              label={copy.card.userAgentLabel}
                              value={row.user_agent ?? "—"}
                              mono
                              className="sm:col-span-2"
                              truncate
                            />
                            {row.metadata && Object.keys(row.metadata).length > 0 && (
                              <ProofRow
                                label={copy.card.metadataLabel}
                                value={JSON.stringify(row.metadata, null, 2)}
                                mono
                                className="sm:col-span-2"
                                pre
                              />
                            )}
                          </div>
                        </div>

                        <div className="text-[11px] text-muted-foreground">
                          {copy.page.recordIdLabel} <span className="font-mono">{row.id}</span> · {copy.page.recordIdSuffix}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
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
