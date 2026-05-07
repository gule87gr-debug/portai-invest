import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { usePageTitle } from "@/hooks/usePageTitle";
import { TradingViewHeatmap } from "@/components/TradingViewWidgets";
import { StockNewsFeed } from "@/components/StockNewsFeed";
import { TrendingStocks } from "@/components/TrendingStocks";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSubscription, trackAnalysis } from "@/hooks/useSubscription";
import { UpgradeModal } from "@/components/UpgradeModal";
import { Link as LinkIcon, Search, Globe, ShieldCheck, FileText, AlertCircle, Loader2, Crown, Lock, Sparkles, X, ChevronDown } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type AnalysisResult = {
  title: string;
  source: string;
  trustScore: number;
  summary: string;
  biases: string[];
  strengths: string[];
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
      toast.success("Welcome to Pro! 🎉 All features are now unlocked.");
      refresh();
    }
  }, [searchParams, refresh]);

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
      const { data, error: fnError } = await supabase.functions.invoke("analyze-link", { body: { url: url.trim() } });
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
        setError(data.reason || "The link you provided doesn't appear to be a news article. Please paste a direct link to a written article.");
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
  const remaining = Math.max(0, FREE_DAILY_ANALYSES - dailyAnalysesUsed);


  return (
    <AppLayout>
      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} title="Analysis Limit Reached" description="You've used all 3 free analyses today. Upgrade to Pro for unlimited analyses." />

      <div className="mb-6">
        <h1 className="text-3xl font-bold">{t("marketIntelligence")}</h1>
        <p className="mt-1 text-muted-foreground">{t("aiCuratedAnalysis")}</p>
      </div>

      <div className="mb-8" data-tour="news-feed">
        <StockNewsFeed />
      </div>

      <div id="analyzer" className="mb-8 rounded-xl border border-border bg-card p-4 sm:p-6 scroll-mt-20" data-tour="analyze-link">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-2 mb-2">
          <div className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">{t("analyzeLink")}</h2>
          </div>
          {!isPro && showRemaining && (
            <span className="text-xs text-muted-foreground">
              {remaining > 0 ? `${remaining}/${FREE_DAILY_ANALYSES} analyses remaining today` : "No analyses remaining today"}
            </span>
          )}
          {isPro && (
            <span className="flex items-center gap-1 text-xs text-primary font-medium">
              <Crown className="h-3.5 w-3.5" /> Unlimited
            </span>
          )}
        </div>
        <p className="mb-4 text-sm leading-relaxed text-muted-foreground">{t("pasteUrl")}</p>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAnalyze()} placeholder={t("pasteArticleUrl")} className={cn("h-11 w-full rounded-lg border border-border bg-accent/30 pl-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring", url ? "pr-10" : "pr-4")} />
            {url && (
              <button
                type="button"
                onClick={() => { setUrl(""); setError(""); }}
                aria-label="Clear link"
                className="absolute right-2 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <button onClick={handleAnalyze} disabled={isAnalyzing || !url.trim()} className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 sm:py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 shrink-0">
            {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            {isAnalyzing ? t("analyzing") : t("analyze")}
          </button>
        </div>

        {limitReached && !isPro && (
          <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-lg border border-primary/30 bg-primary/5 p-3">
            <div className="flex items-start gap-2">
              <Lock className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <p className="text-sm text-foreground">
                You've used your <span className="font-semibold">{FREE_DAILY_ANALYSES}</span> free
                {FREE_DAILY_ANALYSES === 1 ? " analysis" : " analyses"} for today.
                Your quota resets at midnight, or upgrade to Pro for unlimited analyses.
              </p>
            </div>
            <button
              onClick={() => setShowUpgrade(true)}
              className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Crown className="h-3.5 w-3.5" /> Upgrade to Pro
            </button>
          </div>
        )}

        {error && !limitReached && <p className="mt-3 text-sm text-loss">{error}</p>}

        {result && (
          <div className="mt-6 space-y-4 animate-fade-in">
            <div className={cn("rounded-xl border p-5", trustBorder(result.trustScore))}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-base">{result.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{t("source")}: {result.source}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      const text = `📊 AI Analysis: "${result.title}" — Trust Score: ${result.trustScore}/10\n\n${result.summary.slice(0, 200)}...\n\nAnalyzed on @PortAI_Invest 👉 https://portai-invest.com`;
                      window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer,width=550,height=420");
                    }}
                    className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
                    title="Share to X"
                  >
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                    Share
                  </button>
                  <div className="text-center">
                    <p className={cn("text-3xl font-bold font-mono", trustColor(result.trustScore))}>{result.trustScore}<span className="text-sm text-muted-foreground">/10</span></p>
                    <p className="text-[10px] text-muted-foreground">{t("trustScore")}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-lg bg-accent/30 p-3 mb-3">
                <p className="text-xs font-semibold text-muted-foreground mb-1">📝 {t("summary")}</p>
                <p className="text-sm leading-relaxed">{result.summary}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-lg border border-loss/20 bg-loss/5 p-3">
                  <p className="text-xs font-semibold text-loss mb-2">⚠️ {t("potentialBiases")}</p>
                  <ul className="space-y-1">
                    {result.biases.map((b, i) => <li key={i} className="text-xs text-muted-foreground">• {b}</li>)}
                  </ul>
                </div>
                <div className="rounded-lg border border-gain/20 bg-gain/5 p-3">
                  <p className="text-xs font-semibold text-gain mb-2">✅ {t("strengths")}</p>
                  <ul className="space-y-1">
                    {result.strengths.map((s, i) => <li key={i} className="text-xs text-muted-foreground">• {s}</li>)}
                  </ul>
                </div>
              </div>
            </div>

            {/* Pro-Level Deep Dive teaser */}
            <div className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary/5 to-transparent p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Pro-Level Deep Dive</h3>
                </div>
                {isPro && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary">
                    <Crown className="h-2.5 w-2.5" /> PRO
                  </span>
                )}
              </div>
              <div className="relative">
                <ul className={cn("space-y-2.5", !isPro && "select-none pointer-events-none")} aria-hidden={!isPro}>
                  {[
                    {
                      label: "Stakeholder Motives",
                      body: result.proDeepDive?.stakeholderMotives ||
                        "Identifies who benefits from this narrative — institutional positioning, recent insider trades, and analyst incentives.",
                    },
                    {
                      label: "Omitted Data Points",
                      body: result.proDeepDive?.omittedDataPoints ||
                        "Surfaces material context the article skips: contradicting filings, regulatory headlines, and historical baselines.",
                    },
                    {
                      label: "Sentiment Divergence",
                      body: result.proDeepDive?.sentimentDivergence ||
                        "Compares the article's tone to social, options-flow, and peer-coverage signals to flag manufactured consensus.",
                    },
                  ].map((it) => (
                    <li key={it.label} className="flex items-start gap-2.5 text-sm">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      <div>
                        <p className="font-semibold text-foreground">{it.label}</p>
                        <p className={cn("text-xs leading-relaxed text-muted-foreground", !isPro && "blur-[5px]")}>{it.body}</p>
                      </div>
                    </li>
                  ))}
                </ul>
                {!isPro && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <button
                      onClick={() => setShowUpgrade(true)}
                      className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/30 hover:bg-primary/90 transition-colors active:scale-[0.97]"
                    >
                      <Lock className="h-4 w-4" />
                      Unlock Deep Dive with Pro
                    </button>
                  </div>
                )}
              </div>
            </div>
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

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">{t("stockHeatmap")}</h2>
          <HeatmapSelector value={heatmapSource} onChange={setHeatmapSource} />
        </div>
        <TradingViewHeatmap height={550} dataSource={heatmapSource} />
      </div>
    </AppLayout>
  );
};

const HEATMAP_OPTIONS: { value: string; label: string; flag: string; description: string }[] = [
  { value: "SPX500", label: "S&P 500", flag: "🇺🇸", description: "Top 500 US large-cap stocks" },
  { value: "NASDAQ100", label: "Nasdaq 100", flag: "🇺🇸", description: "Largest US tech & growth names" },
  { value: "FTSE100", label: "FTSE 100", flag: "🇬🇧", description: "Top UK companies on the LSE" },
  { value: "DAX40", label: "DAX 40", flag: "🇩🇪", description: "Largest German blue chips" },
  { value: "NIKKEI225", label: "Nikkei 225", flag: "🇯🇵", description: "Leading companies on the Tokyo exchange" },
];

const HeatmapSelector = ({
  value,
  onChange,
}: { value: string; onChange: (v: string) => void }) => {
  const [open, setOpen] = useState(false);
  const current = HEATMAP_OPTIONS.find((o) => o.value === value) ?? HEATMAP_OPTIONS[0];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 border-border/60 bg-background/40 hover:bg-background/80"
        >
          <span className="text-base leading-none">{current.flag}</span>
          <span className="font-medium">{current.label}</span>
          <ChevronDown className="h-4 w-4 opacity-60" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Choose a market</DialogTitle>
          <DialogDescription>
            Switch the heatmap to view a different global index.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-2 flex flex-col gap-2">
          {HEATMAP_OPTIONS.map((opt) => {
            const active = opt.value === value;
            return (
              <button
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={cn(
                  "flex items-center gap-3 rounded-lg border p-3 text-left transition-all",
                  active
                    ? "border-primary bg-primary/10 ring-1 ring-primary/40"
                    : "border-border/60 bg-card/50 hover:border-primary/50 hover:bg-card"
                )}
              >
                <span className="text-2xl leading-none">{opt.flag}</span>
                <div className="flex-1">
                  <div className="font-semibold">{opt.label}</div>
                  <div className="text-xs text-muted-foreground">{opt.description}</div>
                </div>
                {active && (
                  <span className="rounded-full bg-primary/20 px-2 py-0.5 text-xs font-medium text-primary">
                    Active
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};


export default Dashboard;
