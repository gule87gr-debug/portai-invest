import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { SEO } from "@/components/SEO";
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
  const [heatmapSource, setHeatmapSource] = useState<string>(() => {
    try {
      const stored = localStorage.getItem("portai.heatmapSource") || "SPX500";
      // Migrate legacy TradingView dataSource values to the new canonical names.
      const legacyMap: Record<string, string> = {
        DJI: "DowJones30",
        NYSE: "NYSEComposite",
        DAX40: "DAX",
        Nikkei225: "NIKKEI225",
        BSESENSEX: "SENSEX",
        BOVESPA: "Bovespa",
      };
      return legacyMap[stored] ?? stored;
    } catch {
      return "SPX500";
    }
  });
  useEffect(() => {
    try { localStorage.setItem("portai.heatmapSource", heatmapSource); } catch { /* ignore */ }
  }, [heatmapSource]);
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
  const remaining = Math.max(0, FREE_DAILY_ANALYSES - dailyAnalysesUsed);


  return (
    <AppLayout>
      <SEO
        title="Market Intelligence — PortAI"
        description="Real-time stock heatmaps, AI bias-checked financial news and trust scores for retail investors. Your daily market briefing."
        path="/dashboard"
      />
      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} title={t("analysisLimitTitle")} description={t("analysisLimitDesc")} />

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
              {remaining > 0 ? `${remaining}/${FREE_DAILY_ANALYSES} ${t("analysesRemainingToday")}` : t("noAnalysesRemainingToday")}
            </span>
          )}
          {isPro && (
            <span className="flex items-center gap-1 text-xs text-primary font-medium">
              <Crown className="h-3.5 w-3.5" /> {t("unlimited")}
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
                aria-label={t("clearLink")}
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
                    title={t("shareToX")}
                  >
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                    {t("share")}
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
                  <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">{t("proDeepDive")}</h3>
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
                      label: t("stakeholderMotives"),
                      body: result.proDeepDive?.stakeholderMotives || t("stakeholderMotivesDesc"),
                    },
                    {
                      label: t("omittedDataPoints"),
                      body: result.proDeepDive?.omittedDataPoints || t("omittedDataPointsDesc"),
                    },
                    {
                      label: t("sentimentDivergence"),
                      body: result.proDeepDive?.sentimentDivergence || t("sentimentDivergenceDesc"),
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
                      {t("unlockDeepDive")}
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
          <h2 className="text-lg font-semibold">🇺🇸 S&P 500</h2>
        </div>
        <TradingViewHeatmap height={550} dataSource="SPX500" />
      </div>
    </AppLayout>
  );
};

const HEATMAP_OPTIONS: { value: string; label: string; flag: string; descKey: string }[] = [
  { value: "SPX500", label: "S&P 500", flag: "🇺🇸", descKey: "hmDesc_SPX500" },
  { value: "NASDAQ100", label: "Nasdaq 100", flag: "🇺🇸", descKey: "hmDesc_NASDAQ100" },
  { value: "DowJones30", label: "Dow Jones 30", flag: "🇺🇸", descKey: "hmDesc_DJI" },
  { value: "NYSEComposite", label: "NYSE Composite", flag: "🇺🇸", descKey: "hmDesc_NYSE" },
  { value: "FTSE100", label: "FTSE 100", flag: "🇬🇧", descKey: "hmDesc_FTSE100" },
  { value: "DAX", label: "DAX 40", flag: "🇩🇪", descKey: "hmDesc_DAX40" },
  { value: "CAC40", label: "CAC 40", flag: "🇫🇷", descKey: "hmDesc_CAC40" },
  { value: "IBEX35", label: "IBEX 35", flag: "🇪🇸", descKey: "hmDesc_IBEX35" },
  { value: "SMI20", label: "Swiss SMI 20", flag: "🇨🇭", descKey: "hmDesc_SMI20" },
  { value: "NIKKEI225", label: "Nikkei 225", flag: "🇯🇵", descKey: "hmDesc_NIKKEI225" },
  { value: "HSI", label: "Hang Seng", flag: "🇭🇰", descKey: "hmDesc_HSI" },
  { value: "KOSPI", label: "KOSPI", flag: "🇰🇷", descKey: "hmDesc_KOSPI" },
  { value: "SENSEX", label: "BSE Sensex", flag: "🇮🇳", descKey: "hmDesc_SENSEX" },
  { value: "ASX200", label: "ASX 200", flag: "🇦🇺", descKey: "hmDesc_ASX200" },
  { value: "Bovespa", label: "Bovespa", flag: "🇧🇷", descKey: "hmDesc_BOVESPA" },
];

const HeatmapSelector = ({
  value,
  onChange,
}: { value: string; onChange: (v: string) => void }) => {
  const [open, setOpen] = useState(false);
  const { t } = useLanguage();
  const current = HEATMAP_OPTIONS.find((o) => o.value === value) ?? HEATMAP_OPTIONS[0];
  const initialIndex = Math.max(0, HEATMAP_OPTIONS.findIndex((o) => o.value === value));
  const [focusIndex, setFocusIndex] = useState(initialIndex);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const listboxId = "heatmap-listbox";

  // When the dialog opens, sync focus to the currently selected option
  // and scroll it into view so users with keyboards/screen readers land in the right place.
  useEffect(() => {
    if (!open) return;
    const idx = Math.max(0, HEATMAP_OPTIONS.findIndex((o) => o.value === value));
    setFocusIndex(idx);
    const id = window.setTimeout(() => {
      const el = itemRefs.current[idx];
      el?.focus();
      el?.scrollIntoView({ block: "nearest" });
    }, 50);
    return () => window.clearTimeout(id);
  }, [open, value]);

  const moveFocus = (next: number) => {
    const max = HEATMAP_OPTIONS.length - 1;
    const clamped = next < 0 ? max : next > max ? 0 : next;
    setFocusIndex(clamped);
    const el = itemRefs.current[clamped];
    el?.focus();
    el?.scrollIntoView({ block: "nearest" });
  };

  const handleListKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault(); moveFocus(focusIndex + 1); break;
      case "ArrowUp":
        e.preventDefault(); moveFocus(focusIndex - 1); break;
      case "Home":
        e.preventDefault(); moveFocus(0); break;
      case "End":
        e.preventDefault(); moveFocus(HEATMAP_OPTIONS.length - 1); break;
      case "Enter":
      case " ":
        e.preventDefault();
        onChange(HEATMAP_OPTIONS[focusIndex].value);
        setOpen(false);
        break;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={`${t("chooseMarket")}: ${current.label}`}
          className="gap-2 border-border/60 bg-background/40 hover:bg-background/80"
        >
          <span className="text-base leading-none" aria-hidden="true">{current.flag}</span>
          <span className="font-medium">{current.label}</span>
          <ChevronDown className="h-4 w-4 opacity-60" aria-hidden="true" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("chooseMarket")}</DialogTitle>
          <DialogDescription>
            {t("switchHeatmap")}
          </DialogDescription>
        </DialogHeader>
        <div
          id={listboxId}
          role="listbox"
          aria-label={t("chooseMarket")}
          aria-activedescendant={`heatmap-opt-${HEATMAP_OPTIONS[focusIndex]?.value}`}
          tabIndex={-1}
          onKeyDown={handleListKeyDown}
          className="mt-2 flex max-h-[60vh] flex-col gap-2 overflow-y-auto pr-1 focus:outline-none"
        >
          {HEATMAP_OPTIONS.map((opt, i) => {
            const active = opt.value === value;
            const focused = i === focusIndex;
            return (
              <button
                key={opt.value}
                id={`heatmap-opt-${opt.value}`}
                ref={(el) => { itemRefs.current[i] = el; }}
                role="option"
                aria-selected={active}
                tabIndex={focused ? 0 : -1}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                onFocus={() => setFocusIndex(i)}
                className={cn(
                  "flex items-center gap-3 rounded-lg border p-3 text-left transition-all",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  active
                    ? "border-primary bg-primary/10 ring-1 ring-primary/40"
                    : "border-border/60 bg-card/50 hover:border-primary/50 hover:bg-card",
                  focused && !active && "border-primary/60"
                )}
              >
                <span className="text-2xl leading-none" aria-hidden="true">{opt.flag}</span>
                <div className="flex-1">
                  <div className="font-semibold">{opt.label}</div>
                  <div className="text-xs text-muted-foreground">{t(opt.descKey)}</div>
                </div>
                {active && (
                  <span className="rounded-full bg-primary/20 px-2 py-0.5 text-xs font-medium text-primary">
                    {t("active")}
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
