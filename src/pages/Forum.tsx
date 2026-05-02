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

  const filtered = useMemo(() => {
    if (filter === "all") return articles;
    return articles.filter((a) => {
      const t = biasBucket(a.bias_score).tone;
      if (filter === "high") return t === "loss";
      if (filter === "moderate") return t === "warning";
      return t === "gain";
    });
  }, [articles, filter]);

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
      ) : filtered.length === 0 ? (
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((a, i) => {
            const bucket = biasBucket(a.bias_score);
            const tc = toneClasses[bucket.tone];
            const pct = Math.max(6, Math.min(100, a.bias_score * 10));
            const isVind = vindicated.has(a.id);
            return (
              <article
                key={a.id}
                className={cn(
                  "rounded-2xl border border-border bg-card p-4 sm:p-5 animate-fade-in transition-shadow hover:shadow-lg",
                  bucket.tone === "loss" && "hover:" + tc.glow,
                )}
                style={{ animationDelay: `${i * 35}ms` }}
              >
                {/* Source + time */}
                <div className="mb-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground tracking-wide uppercase text-[11px]">
                      {a.source || "Unknown"}
                    </span>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-muted-foreground">{timeAgo(a.created_at)}</span>
                  </div>
                  <a
                    href={a.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary transition-colors"
                    aria-label="Open original article"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>

                {/* Headline */}
                <h2 className="text-base sm:text-lg font-semibold leading-snug mb-3">
                  {a.title}
                </h2>

                {/* Bias heat-map bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Bias Score
                    </span>
                    <span className={cn("text-xs font-mono font-bold", `text-${bucket.tone}`)}>
                      {a.bias_score}/10 · {bucket.label}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all", tc.bar)}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {/* Red flag */}
                <div className="mb-4">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-semibold",
                      tc.chip,
                    )}
                  >
                    <Flame className="h-3 w-3" />
                    {a.red_flag}
                  </span>
                </div>

                {/* AI Deep Dive */}
                <div className="mb-4 rounded-xl border border-border bg-background/50 p-3.5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                      <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                        AI Deep Dive
                      </span>
                    </div>
                    {isPaid && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                        <Crown className="h-2.5 w-2.5" /> {isPro ? "PRO" : "PLUS"}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Hidden Angle
                  </p>
                  {isPaid ? (
                    <p className="text-sm leading-relaxed text-foreground/90">
                      {a.hidden_angle || "No hidden angle detected for this article."}
                    </p>
                  ) : (
                    <div className="relative">
                      <p
                        className="text-sm leading-relaxed text-foreground/80 select-none"
                        style={{ filter: "blur(5px)" }}
                        aria-hidden="true"
                      >
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

                {/* Actions */}
                <div className="flex items-center justify-between border-t border-border pt-3">
                  <button
                    onClick={() => handleVindicate(a)}
                    disabled={isVind || vindicating === a.id}
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors",
                      isVind
                        ? "text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent",
                    )}
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
          })}
        </div>
      )}

      <p className="mt-8 text-center text-[10px] text-muted-foreground/70">
        Not financial advice. Bias scores are AI-generated estimates for informational purposes only.
      </p>

      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </AppLayout>
  );
};

export default Forum;
