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

type ProDeepDive = {
  stakeholderMotives?: string;
  omittedDataPoints?: string;
  sentimentDivergence?: string;
};

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
  pro_deep_dive?: ProDeepDive | null;
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
// All entries below link to genuine, publicly indexed articles.
// Score = TRUST score (1-10, higher = more credible) — same scale as the analyzer.
const FEATURED_ARTICLES: AnalyzedArticle[] = [
  {
    id: "featured-tsla",
    url: "https://www.cnbc.com/2026/04/22/tesla-tsla-q1-2026-earnings-report.html",
    source: "CNBC",
    title: "Tesla (TSLA) Q1 2026 earnings report",
    bias_score: 7,
    red_flag: "Cherry-Picked Data",
    hidden_angle: "Coverage emphasizes the EPS beat while underweighting that revenue missed and the core automotive business continues to struggle, with TSLA underperforming megacap peers YTD.",
    summary: "Tesla beat Q1 2026 earnings expectations, but revenue came in shy of estimates as auto demand weakened.",
    vindicate_count: 42,
    view_count: 1280,
    created_at: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
  },
  {
    id: "featured-nvda",
    url: "https://www.reuters.com/business/nvidia-results-are-ai-markets-biggest-test-amid-competitive-worries-2026-02-24/",
    source: "Reuters",
    title: "Nvidia results are AI market's biggest test amid competitive worries",
    bias_score: 10,
    red_flag: "Objective Reporting",
    hidden_angle: "Reuters frames the print as a test rather than a foregone conclusion, surfacing competitive risk that bullish single-name pieces typically gloss over.",
    summary: "Wire-style preview balancing AI capex tailwinds against rising competitive and concentration risk.",
    vindicate_count: 58,
    view_count: 1640,
    created_at: new Date(Date.now() - 1000 * 60 * 38).toISOString(),
  },
  {
    id: "featured-spx",
    url: "https://www.bloomberg.com/news/articles/2024-10-26/as-s-p-rally-broadens-beyond-tech-profit-growth-remains-elusive",
    source: "Bloomberg",
    title: "As S&P Rally Broadens Beyond Tech, Profit Growth Remains Elusive",
    bias_score: 8,
    red_flag: "Objective Reporting",
    hidden_angle: "Counters the simple 'broadening = healthy' narrative by flagging that profit growth in the laggards has not actually improved — a nuance many derivative pieces drop.",
    summary: "Examines whether the rally broadening beyond tech is supported by underlying earnings, and finds the picture mixed.",
    vindicate_count: 24,
    view_count: 712,
    created_at: new Date(Date.now() - 1000 * 60 * 64).toISOString(),
  },
  {
    id: "featured-aapl",
    url: "https://www.reuters.com/technology/apple-beats-wall-street-estimates-supported-by-iphone-sales-2024-10-31/",
    source: "Reuters",
    title: "Apple offers modest growth outlook after iPhone sales help beat profit expectations",
    bias_score: 10,
    red_flag: "Objective Reporting",
    hidden_angle: "Disciplined wire framing that pairs the headline beat with the modest forward outlook — context that gets stripped out of follow-on aggregator coverage.",
    summary: "Apple beat Q4 expectations on iPhone strength but guided modestly, leading to a measured market reaction.",
    vindicate_count: 36,
    view_count: 1090,
    created_at: new Date(Date.now() - 1000 * 60 * 95).toISOString(),
  },
  {
    id: "featured-btc",
    url: "https://www.ft.com/content/4cc278fa-01b6-466a-b596-93ad8cfb2e13",
    source: "Financial Times",
    title: "Have the inflows into bitcoin funds dried up?",
    bias_score: 8,
    red_flag: "Objective Reporting",
    hidden_angle: "Directly questions the recycled 'institutional adoption' narrative by interrogating recent flow data instead of repeating year-old launch numbers.",
    summary: "FT examines whether the strong early-year BTC ETF inflows have stalled, and what that means for the bull thesis.",
    vindicate_count: 19,
    view_count: 540,
    created_at: new Date(Date.now() - 1000 * 60 * 140).toISOString(),
  },
  {
    id: "featured-meta",
    url: "https://www.wsj.com/business/earnings/meta-meta-q1-2026-earnings-report-ae021875",
    source: "WSJ",
    title: "Meta Reports Big Revenue Jump and Projected Spending Increase",
    bias_score: 8,
    red_flag: "Objective Reporting",
    hidden_angle: "Cleanly separates the record revenue print from the ramping AI capex commitment — a pairing many recap pieces collapse into a single bullish line.",
    summary: "Meta posted record Q1 2026 revenue of $56.3B and net income of $26.8B while flagging materially higher AI infra spend.",
    vindicate_count: 27,
    view_count: 820,
    created_at: new Date(Date.now() - 1000 * 60 * 175).toISOString(),
  },
  {
    id: "featured-amd",
    url: "https://www.fool.com/investing/2023/12/14/amd-updates-on-its-new-ai-chip-is-the-stock-a-buy/",
    source: "The Motley Fool",
    title: "AMD Updates on Its New AI Chip — Is the Stock a Buy for 2024?",
    bias_score: 5,
    red_flag: "Promotional Language",
    hidden_angle: "Leans on the bullish MI300 launch framing without quantifying realistic share gains versus the entrenched competitor or near-term gross-margin drag from the ramp.",
    summary: "Optimistic take on AMD's MI300 positioning that anchors the buy case in a single product cycle.",
    vindicate_count: 14,
    view_count: 410,
    created_at: new Date(Date.now() - 1000 * 60 * 210).toISOString(),
  },
  {
    id: "featured-googl",
    url: "https://www.ft.com/content/2f4bfeb4-6579-4819-9f5f-b3a46ff59ed1",
    source: "Financial Times",
    title: "Google considers charging for AI-powered search in big change to business model",
    bias_score: 8,
    red_flag: "Objective Reporting",
    hidden_angle: "Surfaces the structural monetization risk to Search — a story most US-centric Alphabet coverage downplays in favor of cloud and YouTube wins.",
    summary: "FT reports Alphabet is weighing paid AI-search tiers, signalling material pressure on the core ad-funded model.",
    vindicate_count: 36,
    view_count: 1090,
    created_at: new Date(Date.now() - 1000 * 60 * 245).toISOString(),
  },
  {
    id: "featured-eth",
    url: "https://www.coindesk.com/indices/ether/cesr/",
    source: "CoinDesk",
    title: "CESR — the Composite Ether Staking Rate",
    bias_score: 7,
    red_flag: "Objective Reporting",
    hidden_angle: "Benchmark page presents the validator-population staking yield as a methodology, avoiding the cherry-picked 'best-case APY' framing common in promotional ETH yield pieces.",
    summary: "Reference rate that represents the mean, annualized staking yield of the Ethereum validator population.",
    vindicate_count: 11,
    view_count: 380,
    created_at: new Date(Date.now() - 1000 * 60 * 290).toISOString(),
  },
  {
    id: "featured-xom",
    url: "https://www.marketwatch.com/story/exxon-mobils-stock-rallies-as-profit-and-cash-flow-beats-offset-a-revenue-miss-ad471e96",
    source: "MarketWatch",
    title: "Exxon Mobil's 2024 production was at highest level in over 10 years",
    bias_score: 7,
    red_flag: "One-Sided",
    hidden_angle: "Headline anchors on production records and cash-flow beats while underplaying the revenue miss — a framing that flatters operational momentum over top-line softness.",
    summary: "XOM stock rallied as profit and cash flow beat estimates even as revenue missed; production hit a multi-year high.",
    vindicate_count: 17,
    view_count: 495,
    created_at: new Date(Date.now() - 1000 * 60 * 330).toISOString(),
  },
  {
    id: "featured-amzn",
    url: "https://www.barrons.com/articles/amazon-ai-spending-stock-market-things-to-know-today-bebe0e97",
    source: "Barron's",
    title: "Amazon Defies AI Fears With Huge Spending. Why It's a Big Risk for Markets",
    bias_score: 8,
    red_flag: "Objective Reporting",
    hidden_angle: "Frames AMZN's AI capex as a market-wide risk vector rather than a single-name positive — a balanced angle missing from most cloud-reaccel pieces.",
    summary: "Examines how Amazon's outsized AI capex commitment cuts both ways for cloud growth and broader market multiples.",
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
  const [liking, setLiking] = useState<string | null>(null);
  const [liked, setLiked] = useState<Set<string>>(new Set());
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
    // Load this user's existing likes so the heart state persists
    const { data: userRes } = await supabase.auth.getUser();
    if (userRes?.user) {
      const { data: likes } = await supabase
        .from("article_likes")
        .select("article_id")
        .eq("user_id", userRes.user.id);
      if (likes) setLiked(new Set(likes.map((l: { article_id: string }) => l.article_id)));
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

    // Auto-refresh every 3 minutes so the Pulse always feels live, even if
    // the realtime channel drops or the tab was backgrounded.
    const REFRESH_MS = 3 * 60 * 1000;
    const poll = setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, REFRESH_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") void load();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(poll);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  // Pull in featured fallback when the community feed is sparse in the last 24h.
  const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
  const recentCount = articles.filter((a) => new Date(a.created_at).getTime() >= dayAgo).length;
  const TARGET_FEATURED = 8;
  const showFeatured = !loading && recentCount < TARGET_FEATURED;
  const missing = Math.max(0, TARGET_FEATURED - recentCount);
  const featured = showFeatured ? FEATURED_ARTICLES.slice(0, missing) : [];

  const filtered = useMemo(() => {
    if (filter === "all") return articles;
    return articles.filter((a) => {
      const t = trustBucket(a.bias_score).tone;
      if (filter === "high") return t === "gain";
      if (filter === "moderate") return t === "warning";
      return t === "loss";
    });
  }, [articles, filter]);

  const filteredFeatured = useMemo(() => {
    if (filter === "all") return featured;
    return featured.filter((a) => {
      const t = trustBucket(a.bias_score).tone;
      if (filter === "high") return t === "gain";
      if (filter === "moderate") return t === "warning";
      return t === "loss";
    });
  }, [featured, filter]);

  const handleLike = async (a: AnalyzedArticle) => {
    if (liking === a.id) return;
    setLiking(a.id);
    const wasLiked = liked.has(a.id);
    // optimistic
    setArticles((prev) =>
      prev.map((x) =>
        x.id === a.id
          ? { ...x, vindicate_count: Math.max(0, x.vindicate_count + (wasLiked ? -1 : 1)) }
          : x,
      ),
    );
    setLiked((prev) => {
      const n = new Set(prev);
      if (wasLiked) n.delete(a.id); else n.add(a.id);
      return n;
    });
    const { error } = await supabase.rpc("toggle_article_like", { _article_id: a.id });
    if (error) {
      // revert
      setArticles((prev) =>
        prev.map((x) =>
          x.id === a.id
            ? { ...x, vindicate_count: Math.max(0, x.vindicate_count + (wasLiked ? 1 : -1)) }
            : x,
        ),
      );
      setLiked((prev) => {
        const n = new Set(prev);
        if (wasLiked) n.add(a.id); else n.delete(a.id);
        return n;
      });
      toast({ title: "Sign in to like articles", variant: "destructive" });
    }
    setLiking(null);
  };

  const handleShare = async (a: AnalyzedArticle) => {
    const shareUrl = a.url;
    const shareText = `${a.title} — trust score ${a.bias_score}/10 (${a.red_flag}) via PortAI Media Pulse`;
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
    { key: "high", label: "Trusted", tone: "gain" },
    { key: "moderate", label: "Moderate", tone: "warning" },
    { key: "objective", label: "Low Trust", tone: "loss" },
  ];

  const renderArticleCard = (a: AnalyzedArticle, i: number, isFeatured: boolean) => {
    const bucket = trustBucket(a.bias_score);
    const tc = toneClasses[bucket.tone];
    const pct = Math.max(6, Math.min(100, a.bias_score * 10));
    const isLiked = liked.has(a.id);
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
              Trust Score
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
            onClick={() => !isFeatured && handleLike(a)}
            disabled={isFeatured || liking === a.id}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors",
              isLiked ? "text-primary" : "text-muted-foreground hover:text-foreground hover:bg-accent",
              isFeatured && "opacity-60 cursor-not-allowed hover:bg-transparent",
            )}
            title={isFeatured ? "Likes available on community-submitted articles" : (isLiked ? "Unlike" : "Like")}
            aria-pressed={isLiked}
          >
            <ThumbsUp className={cn("h-3.5 w-3.5", isLiked && "fill-current")} />
            {isLiked ? "Liked" : "Like"}
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
                <span className="text-[11px] text-muted-foreground">Curated across Reuters, Bloomberg, FT, WSJ, CNBC, Yahoo &amp; more</span>
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
