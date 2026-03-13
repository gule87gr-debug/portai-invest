import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { TradingViewHeatmap } from "@/components/TradingViewWidgets";
import { Link as LinkIcon, Search, Globe, ShieldCheck, FileText, AlertCircle, Loader2, ChevronDown, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

type AnalysisResult = {
  title: string;
  source: string;
  trustScore: number;
  summary: string;
  biases: string[];
  strengths: string[];
};

const mockAnalyses: Record<string, AnalysisResult> = {
  default: {
    title: "Financial Article Analysis",
    source: "Unknown Source",
    trustScore: 6,
    summary: "This article discusses current market conditions and provides opinions on potential investment opportunities. The author references some publicly available data but relies heavily on personal interpretation. Key claims include market projections that should be verified against official filings and consensus estimates.",
    biases: ["Limited citation of primary sources", "Author may have undisclosed positions", "Speculative forward-looking statements without data backing"],
    strengths: ["References recent earnings reports", "Acknowledges market risks", "Provides balanced bull/bear perspectives"],
  },
};

function analyzeUrl(url: string): AnalysisResult {
  const lower = url.toLowerCase();
  if (lower.includes("cnbc") || lower.includes("bloomberg")) {
    return {
      title: "Major Financial News Analysis",
      source: lower.includes("cnbc") ? "CNBC" : "Bloomberg",
      trustScore: 8,
      summary: "This article from a major financial news outlet provides well-sourced reporting on market events. The analysis is backed by official data, expert interviews, and SEC filings. The author demonstrates strong knowledge of the subject matter and presents multiple viewpoints.",
      biases: ["May favor institutional investor perspective", "Advertising relationships with featured companies"],
      strengths: ["Cited SEC filings and official data", "Reputable author with track record", "Multiple expert sources quoted", "Clear disclosure of methodology"],
    };
  }
  if (lower.includes("seekingalpha") || lower.includes("motleyfool")) {
    return {
      title: "Investment Opinion Analysis",
      source: lower.includes("seeking") ? "Seeking Alpha" : "Motley Fool",
      trustScore: 5,
      summary: "This is an opinion piece from a contributor-based platform. While it contains some useful analysis, the author's positions may influence their perspective. The financial data cited should be cross-referenced with official 10-K/10-Q filings. Some price targets appear speculative.",
      biases: ["Author holds positions in mentioned stocks", "Platform incentivizes bullish content for engagement", "Price targets lack rigorous DCF backing", "Potential affiliate relationships"],
      strengths: ["Includes fundamental data points", "Discloses author positions", "References recent earnings"],
    };
  }
  if (lower.includes("reddit") || lower.includes("twitter") || lower.includes("x.com")) {
    return {
      title: "Social Media Financial Content",
      source: "Social Media",
      trustScore: 3,
      summary: "This social media content contains unverified financial claims. The anonymous or pseudonymous nature of the source makes it difficult to assess credibility. Several claims lack citations and may constitute financial advice without proper licensing. Exercise extreme caution.",
      biases: ["Anonymous/unverified source", "No regulatory oversight", "Potential pump-and-dump schemes", "Herd mentality amplification", "No position disclosure required"],
      strengths: ["May surface early trends", "Community fact-checking possible"],
    };
  }
  return mockAnalyses.default;
}

const Dashboard = () => {
  const [url, setUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleAnalyze = async () => {
    if (!url.trim()) return;
    setIsAnalyzing(true);
    setResult(null);
    // Simulate analysis delay
    await new Promise((r) => setTimeout(r, 1500 + Math.random() * 1000));
    setResult(analyzeUrl(url));
    setIsAnalyzing(false);
  };

  const trustColor = (score: number) => {
    if (score >= 7) return "text-gain";
    if (score >= 5) return "text-warning";
    return "text-loss";
  };

  const trustBorder = (score: number) => {
    if (score >= 7) return "border-gain/40";
    if (score >= 5) return "border-warning/40";
    return "border-loss/40";
  };

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Market Intelligence</h1>
        <p className="mt-1 text-muted-foreground">AI-curated analysis with trust scores and live market data</p>
      </div>

      {/* Analyze Link Section */}
      <div className="mb-8 rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-2">
          <LinkIcon className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Analyze Link</h2>
        </div>
        <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
          Paste any financial news article, blog post, or research report URL below. Our AI will provide a <span className="text-foreground font-medium">trust/bias score (1-10)</span>, a concise summary, and bias detection.
        </p>

        <div className="flex gap-3">
          <div className="relative flex-1">
            <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
              placeholder="Paste article URL here (e.g. https://cnbc.com/article/...)"
              className="h-11 w-full rounded-lg border border-border bg-accent/30 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <button onClick={handleAnalyze} disabled={isAnalyzing || !url.trim()} className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50">
            {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            {isAnalyzing ? "Analyzing..." : "Analyze"}
          </button>
        </div>

        {/* Results */}
        {result && (
          <div className="mt-6 space-y-4 animate-fade-in">
            <div className={cn("rounded-xl border p-5", trustBorder(result.trustScore))}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-base">{result.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Source: {result.source}</p>
                </div>
                <div className="text-center">
                  <p className={cn("text-3xl font-bold font-mono", trustColor(result.trustScore))}>{result.trustScore}<span className="text-sm text-muted-foreground">/10</span></p>
                  <p className="text-[10px] text-muted-foreground">Trust Score</p>
                </div>
              </div>

              <div className="rounded-lg bg-accent/30 p-3 mb-3">
                <p className="text-xs font-semibold text-muted-foreground mb-1">📝 Summary</p>
                <p className="text-sm leading-relaxed">{result.summary}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-loss/20 bg-loss/5 p-3">
                  <p className="text-xs font-semibold text-loss mb-2">⚠️ Potential Biases</p>
                  <ul className="space-y-1">
                    {result.biases.map((b, i) => (
                      <li key={i} className="text-xs text-muted-foreground">• {b}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-lg border border-gain/20 bg-gain/5 p-3">
                  <p className="text-xs font-semibold text-gain mb-2">✅ Strengths</p>
                  <ul className="space-y-1">
                    {result.strengths.map((s, i) => (
                      <li key={i} className="text-xs text-muted-foreground">• {s}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* How it works - only show when no result */}
        {!result && !isAnalyzing && (
          <div className="mt-5 grid grid-cols-3 gap-4">
            {[
              { icon: ShieldCheck, title: "Trust Score", desc: "AI rates source credibility, author expertise, and citation quality on a 1-10 scale" },
              { icon: FileText, title: "Smart Summary", desc: "Get a concise 200-word summary highlighting key claims, data points, and conclusions" },
              { icon: AlertCircle, title: "Bias Detection", desc: "Flags promotional language, missing disclosures, and potential conflicts of interest" },
            ].map((item) => (
              <div key={item.title} className="rounded-lg border border-border bg-accent/20 p-4">
                <item.icon className="mb-2 h-5 w-5 text-primary" />
                <p className="text-sm font-semibold">{item.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Heatmap */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h2 className="mb-3 text-lg font-semibold">S&P 500 Stock Heatmap</h2>
        <TradingViewHeatmap height={550} />
      </div>
    </AppLayout>
  );
};

export default Dashboard;
