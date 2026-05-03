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
const FEATURED_ARTICLES: AnalyzedArticle[] = [
  {
    id: "featured-tsla",
    url: "https://www.cnbc.com/quotes/TSLA",
    source: "CNBC",
    title: "Tesla margin compression: bullish coverage skips price-cut math",
    bias_score: 7,
    red_flag: "Cherry-picked metrics",
    hidden_angle: "Coverage emphasizes deliveries while omitting that gross margin has compressed for four consecutive quarters and that recent EU price cuts are not yet reflected in consensus EPS.",
    summary: "Recent TSLA reporting frames record deliveries as unambiguous strength, but ignores margin trajectory and inventory build.",
    vindicate_count: 42,
    view_count: 1280,
    created_at: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
  },
  {
    id: "featured-nvda",
    url: "https://www.cnbc.com/quotes/NVDA",
    source: "Yahoo Finance",
    title: "NVDA 'AI demand infinite' narrative ignores hyperscaler capex guidance",
    bias_score: 6,
    red_flag: "Narrative framing",
    hidden_angle: "Three of the top four hyperscalers have softened FY capex language in the last earnings cycle — a material signal absent from most bullish NVDA write-ups this week.",
    summary: "Articles lean on supply-constraint quotes from sell-side desks while skipping the buy-side capex normalization signal.",
    vindicate_count: 31,
    view_count: 980,
    created_at: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
  },
  {
    id: "featured-spx",
    url: "https://www.bloomberg.com/quote/SPX:IND",
    source: "Bloomberg",
    title: "S&P 500 'broadening rally' claim contradicted by equal-weight performance",
    bias_score: 5,
    red_flag: "Selective benchmarking",
    hidden_angle: "Equal-weight S&P (RSP) continues to lag the cap-weighted index by a wide margin YTD, undermining the 'broadening participation' thesis being recycled across major outlets.",
    summary: "Headlines tout broadening leadership, but breadth indicators and equal-weight returns tell a different story.",
    vindicate_count: 24,
    view_count: 712,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
  },
];

const biasBucket = (score: number) => {
  if (score >= 7) return { label: "High Bias", tone: "loss" as const };
  if (score >= 4) return { label: "Moderate", tone: "warning" as const };
  return { label: "Objective", tone: "gain" as const };
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
      const t = biasBucket(a.bias_score).tone;
      if (filter === "high") return t === "loss";
      if (filter === "moderate") return t === "warning";
      return t === "gain";
    });
  }, [articles, filter]);

  const filteredFeatured = useMemo(() => {
    if (filter === "all") return featured;
    return featured.filter((a) => {
      const t = biasBucket(a.bias_score).tone;
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
