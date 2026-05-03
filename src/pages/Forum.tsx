import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { usePageTitle } from "@/hooks/usePageTitle";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/hooks/useSubscription";
import { UpgradeModal } from "@/components/UpgradeModal";
import {
  Activity,
  ThumbsUp,
  Share2,
  Lock,
  Sparkles,
  Flame,
  Loader2,
  ExternalLink,
  Crown,
} from "lucide-react";
import { cn } from "@/lib/utils";

type AnalyzedArticle = {
  id: string;
  url: string;
  source: string;
  title: string;
  bias_score: number;
  red_flag: string;
  hidden_angle: string;
  summary: string;
  vindicate_count: number;
  view_count: number;
  created_at: string;
};

const timeAgo = (iso: string): string => {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
};

// Featured fallback so the feed never feels like a ghost town.
// Scores below are TRUST scores (1-10, higher = more credible) — same scale as the analyzer.
const FEATURED_ARTICLES: AnalyzedArticle[] = [
  {
    id: "featured-tsla",
    url: "https://www.cnbc.com/quotes/TSLA",
    source: "CNBC",
    title: "Tesla margin compression: bullish coverage skips price-cut math",
    bias_score: 7,
    red_flag: "Cherry-Picked Data",
    hidden_angle: "Coverage emphasizes deliveries while omitting that gross margin has compressed for four consecutive quarters and that recent EU price cuts are not yet reflected in consensus EPS.",
    summary: "Recent TSLA reporting frames record deliveries as unambiguous strength, but ignores margin trajectory and inventory build.",
    vindicate_count: 42,
    view_count: 1280,
    created_at: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
  },
  {
    id: "featured-nvda",
    url: "https://finance.yahoo.com/quote/NVDA",
    source: "Yahoo Finance",
    title: "NVDA 'AI demand infinite' narrative ignores hyperscaler capex guidance",
    bias_score: 6,
    red_flag: "One-Sided",
    hidden_angle: "Three of the top four hyperscalers have softened FY capex language in the last earnings cycle — a material signal absent from most bullish NVDA write-ups this week.",
    summary: "Articles lean on supply-constraint quotes from sell-side desks while skipping the buy-side capex normalization signal.",
    vindicate_count: 31,
    view_count: 980,
    created_at: new Date(Date.now() - 1000 * 60 * 38).toISOString(),
  },
  {
    id: "featured-spx",
    url: "https://www.bloomberg.com/quote/SPX:IND",
    source: "Bloomberg",
    title: "S&P 500 'broadening rally' claim contradicted by equal-weight performance",
    bias_score: 8,
    red_flag: "Objective Reporting",
    hidden_angle: "Equal-weight S&P (RSP) continues to lag the cap-weighted index by a wide margin YTD, undermining the 'broadening participation' thesis being recycled across major outlets.",
    summary: "Headlines tout broadening leadership, but breadth indicators and equal-weight returns tell a different story.",
    vindicate_count: 24,
    view_count: 712,
    created_at: new Date(Date.now() - 1000 * 60 * 64).toISOString(),
  },
  {
    id: "featured-aapl",
    url: "https://www.reuters.com/markets/companies/AAPL.OQ",
    source: "Reuters",
    title: "Apple services growth: wire copy sticks to filings, avoids the hype loop",
    bias_score: 10,
    red_flag: "Objective Reporting",
    hidden_angle: "Reuters frames the print directly against the 10-Q without leaning on sell-side narratives — a useful baseline before reading downstream commentary.",
    summary: "Straight read of services revenue, gross margin, and segment mix with minimal editorializing.",
    vindicate_count: 58,
    view_count: 1640,
    created_at: new Date(Date.now() - 1000 * 60 * 95).toISOString(),
  },
  {
    id: "featured-btc",
    url: "https://seekingalpha.com/symbol/BTC-USD",
    source: "Seeking Alpha",
    title: "BTC 'institutional adoption' thesis recycled without fresh on-chain data",
    bias_score: 5,
    red_flag: "Promotional Language",
    hidden_angle: "The piece reuses ETF inflow numbers from three weeks ago and omits the recent slowdown in net flows and the spike in long-term holder distribution.",
    summary: "Bullish framing leans on stale flow data and skips contradicting on-chain signals.",
    vindicate_count: 19,
    view_count: 540,
    created_at: new Date(Date.now() - 1000 * 60 * 140).toISOString(),
  },
  {
    id: "featured-meta",
    url: "https://www.wsj.com/market-data/quotes/META",
    source: "WSJ",
    title: "Meta Reality Labs losses: WSJ separates spend from forward guidance",
    bias_score: 8,
    red_flag: "Objective Reporting",
    hidden_angle: "Cleanly separates GAAP segment losses from management's forward capex commentary — useful before reading derivative takes that conflate the two.",
    summary: "Disciplined coverage of segment economics with explicit guidance vs. actuals comparison.",
    vindicate_count: 27,
    view_count: 820,
    created_at: new Date(Date.now() - 1000 * 60 * 175).toISOString(),
  },
  {
    id: "featured-amd",
    url: "https://www.fool.com/quote/nasdaq/amd/",
    source: "The Motley Fool",
    title: "AMD MI300 ramp piece leans on selective customer quotes",
    bias_score: 4,
    red_flag: "Promotional Language",
    hidden_angle: "Quotes only design-win wins; doesn't reconcile with the most recent data center segment guide-down or the supply allocation comments from competitors.",
    summary: "Optimistic ramp narrative built on cherry-picked customer commentary.",
    vindicate_count: 14,
    view_count: 410,
    created_at: new Date(Date.now() - 1000 * 60 * 210).toISOString(),
  },
  {
    id: "featured-googl",
    url: "https://www.ft.com/content/alphabet",
    source: "Financial Times",
    title: "Alphabet ad revenue: FT highlights search-share risk most pieces skip",
    bias_score: 8,
    red_flag: "Objective Reporting",
    hidden_angle: "Surfaces the LLM-driven query-share question and quantifies the revenue exposure — a framing absent from most US-based coverage of the same print.",
    summary: "Balanced view that names the structural risk while still acknowledging cloud and YouTube strength.",
    vindicate_count: 36,
    view_count: 1090,
    created_at: new Date(Date.now() - 1000 * 60 * 245).toISOString(),
  },
  {
    id: "featured-eth",
    url: "https://www.coindesk.com/price/ethereum/",
    source: "CoinDesk",
    title: "ETH staking yield piece omits validator queue and slashing context",
    bias_score: 5,
    red_flag: "Cherry-Picked Data",
    hidden_angle: "Headline yield ignores entry/exit queue dynamics and the recent uptick in slashing events that materially affect realized returns.",
    summary: "Surface-level yield framing without the operational risk picture.",
    vindicate_count: 11,
    view_count: 380,
    created_at: new Date(Date.now() - 1000 * 60 * 290).toISOString(),
  },
  {
    id: "featured-xom",
    url: "https://www.marketwatch.com/investing/stock/xom",
    source: "MarketWatch",
    title: "XOM buyback coverage skips capex re-acceleration signal",
    bias_score: 6,
    red_flag: "One-Sided",
    hidden_angle: "Frames the buyback as pure shareholder return without flagging that capex guidance was raised — a tell for the next phase of the cycle.",
    summary: "Capital-return framing without the offsetting investment guidance context.",
    vindicate_count: 17,
    view_count: 495,
    created_at: new Date(Date.now() - 1000 * 60 * 330).toISOString(),
  },
  {
    id: "featured-amzn",
    url: "https://www.barrons.com/quote/STOCK/US/XNAS/AMZN",
    source: "Barron's",
    title: "Amazon AWS reaccel: Barron's calibrates against hyperscaler peer set",
    bias_score: 7,
    red_flag: "Objective Reporting",
    hidden_angle: "Compares AWS growth to Azure and GCP on a constant-currency basis — context most single-name pieces skip.",
    summary: "Peer-anchored analysis of cloud reacceleration with explicit FX adjustment.",
    vindicate_count: 22,
    view_count: 670,
    created_at: new Date(Date.now() - 1000 * 60 * 380).toISOString(),
  },
];

// Higher trustScore = more credible. We display the same scale the analyzer returns.
const trustBucket = (score: number) => {
  if (score >= 7) return { label: "Trusted", tone: "gain" as const };
  if (score >= 4) return { label: "Moderate", tone: "warning" as const };
  return { label: "Low Trust", tone: "loss" as const };
};

const toneClasses = {
  loss: {
    bar: "bg-loss",
    chip: "bg-loss/15 text-loss border-loss/30",
    glow: "shadow-[0_0_24px_-8px_hsl(var(--loss)/0.6)]",
  },
  warning: {
    bar: "bg-warning",
    chip: "bg-warning/15 text-warning border-warning/30",
    glow: "shadow-[0_0_24px_-8px_hsl(var(--warning)/0.6)]",
  },
  gain: {
    bar: "bg-gain",
    chip: "bg-gain/15 text-gain border-gain/30",
    glow: "shadow-[0_0_24px_-8px_hsl(var(--gain)/0.6)]",
  },
};

const Forum = () => {
  usePageTitle("AI Media Bias Pulse | PortAI");
  const { toast } = useToast();
  const { isPro, isPaid } = useSubscription();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [articles, setArticles] = useState<AnalyzedArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [vindicating, setVindicating] = useState<string | null>(null);
  const [vindicated, setVindicated] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<"all" | "high" | "moderate" | "objective">("all");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("analyzed_articles")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) {
      toast({ title: "Could not load Pulse", description: error.message, variant: "destructive" });
    } else {
      setArticles((data ?? []) as AnalyzedArticle[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel("analyzed_articles_pulse")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "analyzed_articles" },
        (payload) => {
          setArticles((prev) => [payload.new as AnalyzedArticle, ...prev].slice(0, 50));
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Pull in featured fallback when the community feed is sparse in the last 24h.
  const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
  const recentCount = articles.filter((a) => new Date(a.created_at).getTime() >= dayAgo).length;
  const showFeatured = !loading && recentCount < 5;
  const missing = Math.max(0, 5 - recentCount);
  const featured = showFeatured ? FEATURED_ARTICLES.slice(0, missing) : [];

  const filtered = useMemo(() => {
    if (filter === "all") return articles;
    return articles.filter((a) => {
      const t = trustBucket(a.bias_score).tone;
      if (filter === "high") return t === "loss";
      if (filter === "moderate") return t === "warning";
      return t === "gain";
    });
  }, [articles, filter]);

  const filteredFeatured = useMemo(() => {
    if (filter === "all") return featured;
    return featured.filter((a) => {
      const t = trustBucket(a.bias_score).tone;
      if (filter === "high") return t === "loss";
      if (filter === "moderate") return t === "warning";
      return t === "gain";
    });
  }, [featured, filter]);

  const handleVindicate = async (a: AnalyzedArticle) => {
    if (vindicated.has(a.id) || vindicating === a.id) return;
    setVindicating(a.id);
    // optimistic
    setArticles((prev) =>
      prev.map((x) => (x.id === a.id ? { ...x, vindicate_count: x.vindicate_count + 1 } : x)),
    );
    setVindicated((prev) => new Set(prev).add(a.id));
    const { error } = await supabase.rpc("vindicate_article", { _article_id: a.id });
    if (error) {
      // revert
      setArticles((prev) =>
        prev.map((x) => (x.id === a.id ? { ...x, vindicate_count: Math.max(0, x.vindicate_count - 1) } : x)),
      );
      setVindicated((prev) => {
        const n = new Set(prev);
        n.delete(a.id);
        return n;
      });
      toast({ title: "Sign in to vindicate", variant: "destructive" });
    }
    setVindicating(null);
  };

  const handleShare = async (a: AnalyzedArticle) => {
    const shareUrl = a.url;
    const shareText = `${a.title} — bias score ${a.bias_score}/10 (${a.red_flag}) via PortAI Media Pulse`;
    try {
      if (navigator.share) {
        await navigator.share({ title: a.title, text: shareText, url: shareUrl });
      } else {
        await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
        toast({ title: "Link copied to clipboard" });
      }
    } catch {
      /* user cancelled */
    }
  };

  const filters: { key: typeof filter; label: string; tone?: "loss" | "warning" | "gain" }[] = [
    { key: "all", label: "All" },
    { key: "high", label: "High Bias", tone: "loss" },
    { key: "moderate", label: "Moderate", tone: "warning" },
    { key: "objective", label: "Objective", tone: "gain" },
  ];

  const renderArticleCard = (a: AnalyzedArticle, i: number, isFeatured: boolean) => {
    const bucket = trustBucket(a.bias_score);
    const tc = toneClasses[bucket.tone];
    const pct = Math.max(6, Math.min(100, a.bias_score * 10));
    const isVind = vindicated.has(a.id);
    return (
      <article
        key={a.id}
        className={cn(
          "rounded-2xl border bg-card p-4 sm:p-5 animate-fade-in transition-shadow hover:shadow-lg",
          isFeatured ? "border-primary/30" : "border-border",
        )}
        style={{ animationDelay: `${i * 35}ms` }}
      >
        <div className="mb-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-bold text-foreground tracking-wide uppercase text-[11px] truncate">
              {a.source || "Unknown"}
            </span>
            <span className="text-muted-foreground">•</span>
            <span className="text-muted-foreground shrink-0">{timeAgo(a.created_at)}</span>
            {isFeatured && (
              <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-primary/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary shrink-0">
                <Sparkles className="h-2.5 w-2.5" /> Featured
              </span>
            )}
          </div>
          <a
            href={a.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-primary transition-colors shrink-0 ml-2"
            aria-label="Open original article"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>

        <h2 className="text-base sm:text-lg font-semibold leading-snug mb-3">{a.title}</h2>

        {/* Bias heat-map bar — stacked layout for mobile readability */}
        <div className="mb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Bias Score
            </span>
            <span className={cn("text-xs font-mono font-bold", `text-${bucket.tone}`)}>
              {a.bias_score}/10 · {bucket.label}
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div className={cn("h-full rounded-full transition-all", tc.bar)} style={{ width: `${pct}%` }} />
          </div>
        </div>

        <div className="mb-4">
          <span className={cn("inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-semibold", tc.chip)}>
            <Flame className="h-3 w-3" />
            {a.red_flag}
          </span>
        </div>

        <div className="mb-4 rounded-xl border border-border bg-background/50 p-3.5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-bold uppercase tracking-wider text-foreground">AI Deep Dive</span>
            </div>
            {isPaid && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                <Crown className="h-2.5 w-2.5" /> {isPro ? "PRO" : "PLUS"}
              </span>
            )}
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Hidden Angle</p>
          {isPaid ? (
            <p className="text-sm leading-relaxed text-foreground/90">
              {a.hidden_angle || "No hidden angle detected for this article."}
            </p>
          ) : (
            <div className="relative">
              <p className="text-sm leading-relaxed text-foreground/80 select-none" style={{ filter: "blur(5px)" }} aria-hidden="true">
                {a.hidden_angle ||
                  "The article omits key context about insider transactions and recent regulatory developments that contradict the bullish narrative."}
              </p>
              <div className="absolute inset-0 flex items-center justify-center">
                <button
                  onClick={() => setShowUpgrade(true)}
                  className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
                >
                  <Lock className="h-3.5 w-3.5" />
                  Unlock with Pro
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border pt-3">
          <button
            onClick={() => !isFeatured && handleVindicate(a)}
            disabled={isFeatured || isVind || vindicating === a.id}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors",
              isVind ? "text-primary" : "text-muted-foreground hover:text-foreground hover:bg-accent",
              isFeatured && "opacity-60 cursor-not-allowed hover:bg-transparent",
            )}
            title={isFeatured ? "Vindicate available on community-submitted articles" : undefined}
          >
            <ThumbsUp className={cn("h-3.5 w-3.5", isVind && "fill-current")} />
            Vindicate
            <span className="font-mono">{a.vindicate_count}</span>
          </button>
          <button
            onClick={() => handleShare(a)}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <Share2 className="h-3.5 w-3.5" />
            Share
          </button>
        </div>
      </article>
    );
  };

  return (
    <AppLayout>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 border border-primary/30">
            <Activity className="h-4.5 w-4.5 text-primary" />
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Market Media Pulse</h1>
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-loss/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-loss border border-loss/30">
              <span className="h-1.5 w-1.5 rounded-full bg-loss animate-pulse" /> Live
            </span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Live AI analysis of trending financial reporting and bias detection.
        </p>
      </div>

      {/* Filter pills */}
      <div className="mb-5 flex items-center gap-2 overflow-x-auto pb-1">
        {filters.map((f) => {
          const isActive = filter === f.key;
          const tone = f.tone ? toneClasses[f.tone] : null;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors",
                isActive
                  ? tone
                    ? tone.chip
                    : "bg-primary/15 text-primary border-primary/30"
                  : "bg-card border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Feed */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 && filteredFeatured.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 animate-fade-in text-center">
          <div className="relative mb-5">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 border-2 border-dashed border-primary/30">
              <Activity className="h-9 w-9 text-primary/60" />
            </div>
            <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary shadow-lg">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
          </div>
          <h2 className="text-lg font-bold mb-1.5">The Pulse is calibrating…</h2>
          <p className="text-sm text-muted-foreground max-w-sm">
            Paste an article link in the Analyzer to see it appear here live!
          </p>
        </div>
      ) : (
        <>
          {filteredFeatured.length > 0 && (
            <section className="mb-6">
              <div className="mb-3 flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 border border-primary/30 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
                  <Sparkles className="h-3 w-3" /> Featured Analysis
                </span>
                <span className="text-[11px] text-muted-foreground">Hand-picked by PortAI · TSLA · NVDA · S&amp;P 500</span>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredFeatured.map((a, i) => renderArticleCard(a, i, true))}
              </div>
            </section>
          )}
          {filtered.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filtered.map((a, i) => renderArticleCard(a, i, false))}
            </div>
          )}
        </>
      )}

      <p className="mt-8 text-center text-[10px] text-muted-foreground/70">
        Not financial advice. Bias scores are AI-generated estimates for informational purposes only.
      </p>

      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </AppLayout>
  );
};

export default Forum;
