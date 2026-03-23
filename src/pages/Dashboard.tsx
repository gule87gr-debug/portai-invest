import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { usePageTitle } from "@/hooks/usePageTitle";
import { TradingViewHeatmap } from "@/components/TradingViewWidgets";
import { StockNewsFeed } from "@/components/StockNewsFeed";
import { TrendingStocks } from "@/components/TrendingStocks";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link as LinkIcon, Search, Globe, ShieldCheck, FileText, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

type AnalysisResult = {
  title: string;
  source: string;
  trustScore: number;
  summary: string;
  biases: string[];
  strengths: string[];
};

const Dashboard = () => {
  const { t } = useLanguage();
  const [url, setUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");

  const handleAnalyze = async () => {
    if (!url.trim()) return;
    setIsAnalyzing(true);
    setResult(null);
    setError("");
    try {
      const { data, error: fnError } = await supabase.functions.invoke("analyze-link", { body: { url: url.trim() } });
      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);
      if (data?.analysis) {
        setResult(data.analysis);
      } else throw new Error("No analysis returned");
    } catch (e: any) {
      setError(e.message || "Analysis failed");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const trustColor = (score: number) => score >= 7 ? "text-gain" : score >= 5 ? "text-warning" : "text-loss";
  const trustBorder = (score: number) => score >= 7 ? "border-gain/40" : score >= 5 ? "border-warning/40" : "border-loss/40";

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{t("marketIntelligence")}</h1>
        <p className="mt-1 text-muted-foreground">{t("aiCuratedAnalysis")}</p>
      </div>

      <div className="mb-8" data-tour="news-feed">
        <StockNewsFeed />
      </div>

      <div className="mb-8">
        <TrendingStocks />
      </div>

      <div className="mb-8 rounded-xl border border-border bg-card p-4 sm:p-6" data-tour="analyze-link">
        <div className="flex items-center gap-2 mb-2">
          <LinkIcon className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">{t("analyzeLink")}</h2>
        </div>
        <p className="mb-4 text-sm leading-relaxed text-muted-foreground">{t("pasteUrl")}</p>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAnalyze()} placeholder={t("pasteArticleUrl")} className="h-11 w-full rounded-lg border border-border bg-accent/30 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <button onClick={handleAnalyze} disabled={isAnalyzing || !url.trim()} className="flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 shrink-0">
            {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            {isAnalyzing ? t("analyzing") : t("analyze")}
          </button>
        </div>

        {error && <p className="mt-3 text-sm text-loss">{error}</p>}

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

      <div className="rounded-xl border border-border bg-card p-4">
        <h2 className="mb-3 text-lg font-semibold">{t("stockHeatmap")}</h2>
        <TradingViewHeatmap height={550} />
      </div>
    </AppLayout>
  );
};

export default Dashboard;