import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { DisclaimerBanner } from "@/components/DisclaimerBanner";
import { Search, Link as LinkIcon, Sparkles, RefreshCw, ShieldCheck, FileText, Users, BookOpen, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const categories = ["All", "Tech", "Energy", "Healthcare", "Finance", "Consumer"];

const articles = [
  { title: "Tech Stocks Rally Amid Positive Earnings Forecasts", source: "CNBC", date: "15/11/2023", ticker: "$AAPL", score: 9, color: "bg-gain" },
  { title: "Energy Sector Faces Headwinds as Oil Prices Decline", source: "Bloomberg", date: "15/11/2023", ticker: "$XOM", score: 8, color: "bg-loss" },
  { title: "Fed Signals Potential Rate Hike in December as Inflation Persists", source: "Reuters", date: "15/11/2023", ticker: "", score: 9, color: "bg-loss" },
  { title: "Earnings Season: Strong Results Bolster Investor Confidence", source: "MarketWatch", date: "15/11/2023", ticker: "$PG", score: 7, color: "bg-trust-medium" },
  { title: "Market Analysis: Investors Eye Key Economic Indicators", source: "Wall Street Journal", date: "15/11/2023", ticker: "", score: 8, color: "bg-gain" },
  { title: "Crypto Market Rebounds as Bitcoin Surpasses $30k", source: "Financial Times", date: "15/11/2023", ticker: "$BTC", score: 8, color: "bg-gain" },
];

const trustTips = [
  { icon: FileText, title: "Check Citations", desc: "Look for articles citing SEC filings, official earnings reports, or primary data sources" },
  { icon: Users, title: "Author Credentials", desc: "Verify the author has relevant financial expertise or journalistic track record" },
  { icon: BookOpen, title: "Multiple Sources", desc: "Cross-reference claims across reputable financial outlets" },
  { icon: AlertCircle, title: "Watch for Bias", desc: "Be cautious of promotional language or undisclosed conflicts of interest" },
];

const TrustScore = ({ score }: { score: number }) => {
  const color = score >= 8 ? "text-gain border-gain" : score >= 6 ? "text-trust-medium border-trust-medium" : "text-loss border-loss";
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-mono font-semibold", color)}>
      {score}/10
    </span>
  );
};

const Dashboard = () => {
  const [active, setActive] = useState("All");
  const [search, setSearch] = useState("");

  return (
    <AppLayout>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Market Intelligence</h1>
          <p className="mt-1 text-muted-foreground">AI-curated news with trust scores and analysis</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium transition-colors hover:bg-accent">
            <LinkIcon className="h-4 w-4" /> Analyze Link
          </button>
          <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
            <Sparkles className="h-4 w-4" /> Generate News
          </button>
          <button className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium transition-colors hover:bg-accent">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Main content */}
        <div className="flex-1 space-y-4">
          {/* Search + Filters */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search articles..."
                className="h-10 w-full rounded-lg border border-border bg-card pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="flex gap-1 rounded-lg bg-card p-1">
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
          </div>

          <DisclaimerBanner />

          {/* Articles */}
          <div className="space-y-3">
            {articles.map((a, i) => (
              <div key={i} className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-accent/50 animate-fade-in cursor-pointer" style={{ animationDelay: `${i * 50}ms` }}>
                <div className={cn("h-12 w-1 rounded-full", a.color)} />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground">{a.title}</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {a.source} · {a.date}{a.ticker && ` · ${a.ticker}`}
                  </p>
                </div>
                <TrustScore score={a.score} />
              </div>
            ))}
          </div>
        </div>

        {/* Trust Tips Sidebar */}
        <div className="hidden w-64 shrink-0 lg:block">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Trust Tips
            </div>
            <div className="space-y-5">
              {trustTips.map((tip, i) => (
                <div key={i} className="flex gap-3">
                  <tip.icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{tip.title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{tip.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 border-t border-border pt-4">
              <p className="mb-2 text-xs font-semibold text-foreground">Quick Indicators</p>
              {["SEC/Official Filings", "Expert Analysis", "Raw Financial Data"].map((item) => (
                <div key={item} className="flex items-center gap-2 py-1 text-xs text-muted-foreground">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
