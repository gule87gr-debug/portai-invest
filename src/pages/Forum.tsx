import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Search, Plus, Filter, ThumbsUp, MessageCircle, Sparkles, MoreVertical, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const categories = ["All", "Sectors", "Events", "Portfolios", "Watchlists", "General"];

const threads = [
  {
    author: "guich", avatar: "g", time: "about 1 month ago", tags: [{ label: "general", color: "bg-muted text-muted-foreground" }],
    title: "What do you think about Trump's threats on Greenland?",
    body: "Does he actually have intents to invade or is it just a strategy for something else",
    likes: 3, comments: 1,
  },
  {
    author: "TechInvestor2025", avatar: "T", time: "about 1 month ago",
    tags: [{ label: "portfolios", color: "bg-primary/20 text-primary" }, { label: "tech", color: "bg-muted text-muted-foreground" }],
    title: "My AI/Tech Heavy Portfolio - Thoughts?",
    body: "Just restructured my portfolio: 35% NVDA, 20% MSFT, 15% GOOGL, 15% AMZN, 10% META, 5% cash. I know it's tech heavy but I believe in the AI thesis for the next decade. Looking for constructive feedback on diversification and risk management. Should I add some defensive positions?",
    likes: 42, comments: 18, expanded: true,
  },
  {
    author: "MacroTrader", avatar: "M", time: "about 1 month ago",
    tags: [{ label: "markets", color: "bg-primary/20 text-primary" }, { label: "fed", color: "bg-muted text-muted-foreground" }],
    title: "Fed Rate Decision Impact Analysis",
    body: "The Fed is expected to hold rates steady. How are you all positioning for this? I'm looking at TLT and utilities.",
    likes: 28, comments: 12,
  },
];

const Forum = () => {
  const [active, setActive] = useState("All");

  return (
    <AppLayout>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Smart Forum</h1>
          <p className="mt-1 text-muted-foreground">Discuss investments with AI-powered fact-checking</p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
          <Plus className="h-4 w-4" /> New Thread
        </button>
      </div>

      {/* Search + Filter */}
      <div className="mb-4 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input placeholder="Search threads..." className="h-10 w-full rounded-lg border border-border bg-card pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <button className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium transition-colors hover:bg-accent">
          <Filter className="h-3.5 w-3.5" /> All Sectors <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Categories */}
      <div className="mb-6 flex gap-1 rounded-lg bg-card p-1 w-fit">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActive(cat)}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              active === cat ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Threads */}
      <div className="space-y-4">
        {threads.map((t, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5 animate-fade-in" style={{ animationDelay: `${i * 60}ms` }}>
            {/* Author */}
            <div className="mb-3 flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
                {t.avatar}
              </div>
              <span className="text-sm font-semibold">{t.author}</span>
              <span className="text-xs text-muted-foreground">{t.time}</span>
            </div>

            {/* Tags */}
            <div className="mb-2 flex gap-1.5">
              {t.tags.map((tag) => (
                <span key={tag.label} className={cn("rounded-md px-2 py-0.5 text-xs font-medium", tag.color)}>
                  {tag.label}
                </span>
              ))}
            </div>

            <h3 className="text-base font-semibold">{t.title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {t.expanded ? t.body : t.body.slice(0, 120) + "..."}
            </p>
            {t.expanded && (
              <button className="mt-1 text-xs font-medium text-primary hover:underline">
                <ChevronDown className="mr-0.5 inline h-3 w-3" /> Read more
              </button>
            )}

            {/* Footer */}
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <button className="flex items-center gap-1 hover:text-primary transition-colors">
                  <ThumbsUp className="h-3.5 w-3.5" /> {t.likes}
                </button>
                <button className="flex items-center gap-1 hover:text-primary transition-colors">
                  <MessageCircle className="h-3.5 w-3.5" /> {t.comments}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-1 text-xs text-primary hover:underline">
                  <Sparkles className="h-3.5 w-3.5" /> Fact Check
                </button>
                <button className="text-muted-foreground hover:text-foreground">
                  <MoreVertical className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </AppLayout>
  );
};

export default Forum;
