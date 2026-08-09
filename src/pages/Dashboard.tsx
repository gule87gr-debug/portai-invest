import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { SEO } from "@/components/SEO";
import { usePageTitle } from "@/hooks/usePageTitle";
import { TradingViewHeatmap } from "@/components/TradingViewWidgets";

import { TrendingStocks } from "@/components/TrendingStocks";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSubscription, trackAnalysis } from "@/hooks/useSubscription";
import { UpgradeModal } from "@/components/UpgradeModal";
import { Link as LinkIcon, Search, Globe, ShieldCheck, FileText, AlertCircle, Loader2, Crown, Lock, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ScannerSkeleton } from "@/components/ScannerSkeleton";
import { TrialActivation } from "@/components/TrialActivation";

type AnalysisResult = {
  title: string;
  source: string;
  trustScore: number;
  summary: string;
  biases: string[];
  strengths: string[];
  reasoning?: Array<{
    category?: string;
    evidence?: string;
    explanation?: string;
  }>;
  misinformation?: {
    riskLevel?: string;
    verdict?: string;
    claims?: Array<{ claim?: string; verdict?: string; note?: string }>;
  };
  corroboration?: {
    status?: string;
    note?: string;
    sources?: Array<{ source?: string; title?: string; url?: string; stance?: string }>;
  };
  proDeepDive?: {
    stakeholderMotives?: string;
    omittedDataPoints?: string;
    sentimentDivergence?: string;
  };
};


const FREE_DAILY_ANALYSES = 1;

const Dashboard = () => {
  usePageTitle("Market Intelligence | PortAI");
  const { t } = useLanguage();
  const [url, setUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");
  const [limitReached, setLimitReached] = useState(false);
  // Only reveal the remaining-analyses counter after we've confirmed an article
  // was actually accepted (so a "not an article" reply never makes the badge tick down)
  const [showRemaining, setShowRemaining] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const { isPro, dailyAnalysesUsed, canAnalyze, refresh } = useSubscription();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get("upgrade") === "success") {
      toast.success(t("welcomePro"));
      refresh();
    }
  }, [searchParams, refresh, t]);

  // Consume any pending URL the user pasted on the landing page,
  // and scroll the Analyzer card into view when arriving via #analyzer.
  useEffect(() => {
    try {
      const pending = sessionStorage.getItem("pendingAnalyzeUrl");
      if (pending) {
        setUrl(pending);
        sessionStorage.removeItem("pendingAnalyzeUrl");
      }
    } catch { /* ignore */ }
    if (window.location.hash === "#analyzer" || sessionStorage.getItem("pendingAnalyzeUrl")) {
      requestAnimationFrame(() => {
        document.getElementById("analyzer")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }, []);

  const handleAnalyze = async () => {
    if (!url.trim()) return;
    if (!canAnalyze) {
      setLimitReached(true);
      setShowUpgrade(true);
      return;
    }
    setIsAnalyzing(true);
    setResult(null);
    setError("");
    setLimitReached(false);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("analyze-link", { body: { url: url.trim(), language: (typeof window !== "undefined" ? localStorage.getItem("portai.language") : null) || "en" } });
      if (fnError) {
        // Edge function returned non-2xx — surface limit-reached specifically
        const msg = String(fnError.message || "");
        if (/limit/i.test(msg) || /429/.test(msg)) {
          setLimitReached(true);
          return;
        }
        throw new Error(fnError.message);
      }
      if (data?.error) {
        if (/limit/i.test(String(data.error))) {
          setLimitReached(true);
          return;
        }
        throw new Error(data.error);
      }
      if (data?.notArticle) {
        // Non-article — does NOT consume a credit; keep the counter hidden
        setError(data.reason || t("notArticleDefault"));
        return;
      }
      if (data?.analysis) {
        setResult(data.analysis);
        await trackAnalysis();
        await refresh();
        // Now that a credit was actually used, reveal the remaining counter
        setShowRemaining(true);
      } else throw new Error("No analysis returned");
    } catch (e: any) {
      setError(e.message || "Analysis failed");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const trustColor = (score: number) => score >= 7 ? "text-gain" : score >= 5 ? "text-warning" : "text-loss";
  const trustBorder = (score: number) => score >= 7 ? "border-gain/40" : score >= 5 ? "border-warning/40" : "border-loss/40";
  const riskStyles = (level?: string) => {
    const l = (level ?? "").toLowerCase();
    if (/high|alto|élevé|hoch|alta/.test(l)) return "border-loss/40 bg-loss/5 text-loss";
    if (/low|bajo|faible|niedrig|baixo|basso/.test(l)) return "border-gain/40 bg-gain/5 text-gain";
    return "border-warning/40 bg-warning/5 text-warning";
  };

  const remaining = Math.max(0, FREE_DAILY_ANALYSES - dailyAnalysesUsed);


  return (
    <AppLayout>
      <SEO
        title="Market Intelligence — PortAI"
        description="Real-time stock heatmaps, AI bias-checked financial news and trust scores for retail investors. Your daily market briefing."
        path="/dashboard"
      />
      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} title={t("analysisLimitTitle")} description={t("analysisLimitDesc")} />

      <div className="mb-8">
        <h1 className="editorial-h1 text-4xl sm:text-5xl font-bold">{t("marketIntelligence")}</h1>
        <p className="mt-2 text-muted-foreground">{t("aiCuratedAnalysis")}</p>
        <div className="mt-5">
          <TrialActivation />
        </div>
      </div>

      <div id="analyzer" className="mb-8 rounded-2xl border border-border bg-card p-6 sm:p-10 scroll-mt-20" data-tour="analyze-link">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-2 mb-2">
          <div className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5 text-primary" />
            <h2 className="editorial-h2 text-xl font-semibold">{t("analyzeLink")}</h2>
          </div>
        </div>
        <p className="mb-5 text-sm leading-relaxed text-muted-foreground">{t("pasteUrl")}</p>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 focus-spring rounded-2xl border border-border bg-accent/30">
            <Globe className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAnalyze()} placeholder={t("pasteArticleUrl")} className={cn("h-14 w-full rounded-2xl bg-transparent pl-12 text-base text-foreground placeholder:text-muted-foreground focus:outline-none", url ? "pr-12" : "pr-4")} />
            {url && (
              <button
                type="button"
                onClick={() => { setUrl(""); setError(""); }}
                aria-label={t("clearLink")}
                className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <button onClick={handleAnalyze} disabled={isAnalyzing || !url.trim()} className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl bg-primary px-7 h-14 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 shrink-0">
            {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            {isAnalyzing ? t("analyzing") : t("analyze")}
          </button>
        </div>

        {isAnalyzing && (
          <div className="mt-5">
            <ScannerSkeleton lines={6} />
          </div>
        )}

        {limitReached && !isPro && (
          <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-lg border border-primary/30 bg-primary/5 p-3">
            <div className="flex items-start gap-2">
              <Lock className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <p className="text-sm text-foreground">
                {FREE_DAILY_ANALYSES === 1 ? t("freeAnalysisUsedSingle") : t("freeAnalysesUsedMulti")}{" "}
                {t("quotaResets")}
              </p>
            </div>
            <button
              onClick={() => setShowUpgrade(true)}
              className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Crown className="h-3.5 w-3.5" /> {t("upgradeToPro")}
            </button>
          </div>
        )}

        {error && !limitReached && <p className="mt-3 text-sm text-loss">{error}</p>}

        {result && (
          <div className={cn("mt-5 rounded-xl border p-4 animate-fade-in", trustBorder(result.trustScore))}>
            {/* Header: title + source + score */}
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-semibold text-lg leading-snug line-clamp-2">{result.title}</h3>
                <p className="text-sm text-muted-foreground mt-0.5 truncate">{result.source}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    const text = `📊 AI Analysis: "${result.title}" — Trust Score: ${result.trustScore}/10\n\nAnalyzed on @PortAI_Invest 👉 https://portai-invest.com`;
                    window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer,width=550,height=420");
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={t("shareToX")}
                  title={t("shareToX")}
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </button>
                <p className={cn("text-3xl font-bold font-mono tnum leading-none", trustColor(result.trustScore))}>
                  {result.trustScore}<span className="text-sm text-muted-foreground">/10</span>
                </p>
              </div>
            </div>

            {/* Summary */}
            <p className="mt-3 text-base leading-relaxed text-foreground/90">{result.summary}</p>

            {/* Biases + strengths, compact two columns */}
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="rounded-lg border border-loss/20 bg-loss/5 p-3">
                <p className="text-sm font-semibold text-loss mb-1">⚠️ {t("potentialBiases")}</p>
                <ul className="space-y-0.5">
                  {result.biases.slice(0, 3).map((b, i) => <li key={i} className="text-sm leading-relaxed text-muted-foreground">• {b}</li>)}
                </ul>
              </div>
              <div className="rounded-lg border border-gain/20 bg-gain/5 p-3">
                <p className="text-sm font-semibold text-gain mb-1">✅ {t("strengths")}</p>
                <ul className="space-y-0.5">
                  {result.strengths.slice(0, 3).map((s, i) => <li key={i} className="text-sm leading-relaxed text-muted-foreground">• {s}</li>)}
                </ul>
              </div>
            </div>

            {/* Misinformation / fact check */}
            {result.misinformation && (result.misinformation.verdict || (result.misinformation.claims?.length ?? 0) > 0) && (
              <div className={cn("mt-3 rounded-lg border p-3", riskStyles(result.misinformation.riskLevel))}>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold">🔎 {t("factCheckTitle")}</p>
                  {result.misinformation.riskLevel && (
                    <span className="rounded-full border border-current/30 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider">
                      {t("misinfoRisk")}: {result.misinformation.riskLevel}
                    </span>
                  )}
                </div>
                {result.misinformation.verdict && (
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{result.misinformation.verdict}</p>
                )}
                {(result.misinformation.claims?.length ?? 0) > 0 && (
                  <ul className="mt-2 space-y-1.5">
                    {result.misinformation.claims!.slice(0, 4).map((c, i) => (
                      <li key={i} className="text-sm leading-relaxed">
                        <span className="font-semibold text-foreground">{c.verdict}</span>
                        <span className="text-muted-foreground"> — {c.claim}{c.note ? ` (${c.note})` : ""}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Cross-source verification */}
            {result.corroboration && (result.corroboration.note || (result.corroboration.sources?.length ?? 0) > 0) && (
              <div className="mt-3 rounded-lg border border-border/60 bg-accent/20 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-foreground">🌐 {t("crossSourceTitle")}</p>
                  {result.corroboration.status && (
                    <span className="rounded-full border border-border px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {result.corroboration.status}
                    </span>
                  )}
                </div>
                {result.corroboration.note && (
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{result.corroboration.note}</p>
                )}
                {(result.corroboration.sources?.length ?? 0) > 0 && (
                  <ul className="mt-2 space-y-1">
                    {result.corroboration.sources!.slice(0, 4).map((s, i) => (
                      <li key={i} className="text-sm leading-relaxed">
                        {s.url && /^https?:\/\//i.test(s.url) ? (
                          <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                            {s.source}
                          </a>
                        ) : (
                          <span className="font-semibold text-foreground">{s.source}</span>
                        )}
                        <span className="text-muted-foreground"> — {s.title}{s.stance ? ` · ${s.stance}` : ""}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}


            {/* Why this score — collapsed into a compact details block */}
            {result.reasoning && result.reasoning.length > 0 && (
              <details className="mt-3 rounded-lg border border-border/60 bg-accent/20 p-3">
                <summary className="cursor-pointer text-sm font-semibold uppercase tracking-wider text-foreground">
                  {t("whyThisScore")}
                </summary>
                <ul className="mt-2 space-y-2">
                  {result.reasoning.slice(0, 3).map((r, i) => (
                    <li key={i} className="border-l-2 border-primary/40 pl-2.5">
                      {r.category && <span className="text-xs font-bold uppercase tracking-wider text-primary">{r.category}</span>}
                      {r.explanation && <p className="text-sm leading-relaxed text-muted-foreground">{r.explanation}</p>}
                    </li>
                  ))}
                </ul>
              </details>
            )}

            {/* Pro deep dive */}
            {isPro ? (
              result.proDeepDive && (
                <details className="mt-2 rounded-lg border border-primary/30 bg-primary/5 p-3">
                  <summary className="cursor-pointer text-sm font-semibold uppercase tracking-wider text-primary">
                    {t("proDeepDive")}
                  </summary>
                  <div className="mt-2 space-y-1.5">
                    {[
                      [t("stakeholderMotives"), result.proDeepDive.stakeholderMotives],
                      [t("omittedDataPoints"), result.proDeepDive.omittedDataPoints],
                      [t("sentimentDivergence"), result.proDeepDive.sentimentDivergence],
                    ].filter(([, v]) => !!v).map(([label, body]) => (
                      <p key={label as string} className="text-sm leading-relaxed text-muted-foreground">
                        <span className="font-semibold text-foreground">{label}: </span>{body}
                      </p>
                    ))}
                  </div>
                </details>
              )
            ) : (
              <button
                onClick={() => setShowUpgrade(true)}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2.5 text-sm font-semibold text-primary hover:bg-primary/10 transition-colors"
              >
                <Lock className="h-3.5 w-3.5" /> {t("unlockDeepDive")}
              </button>
            )}
          </div>
        )}

        {!result && !isAnalyzing && !error && (
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: ShieldCheck, titleKey: "trustScore", descKey: "trustScoreDesc" },
              { icon: FileText, titleKey: "smartSummary", descKey: "smartSummaryDesc" },
              { icon: AlertCircle, titleKey: "biasDetection", descKey: "biasDetectionDesc" },
            ].map((item) => (
              <div key={item.titleKey} className="rounded-lg border border-border bg-accent/20 p-4">
                <item.icon className="mb-2 h-5 w-5 text-primary" />
                <p className="text-sm font-semibold">{t(item.titleKey)}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t(item.descKey)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mb-8">
        <TrendingStocks />
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="editorial-h2 text-xl font-semibold">🇺🇸 S&P 500</h2>
        </div>
        <TradingViewHeatmap height={550} dataSource="SPX500" />
      </div>
    </AppLayout>
  );
};



export default Dashboard;
