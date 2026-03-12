import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Sparkles, Plus, Trash2, MoreVertical, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

type Stock = { ticker: string; sector: string; name: string; signal: string };
type WatchlistData = { name: string; stocks: Stock[]; desc: string };

const mockLists: WatchlistData[] = [
  {
    name: "Custom Portfolio 2",
    desc: "This portfolio is designed for a conservative investor with a moderate timeframe, emphasizing steadiness with selected sector exposure while seeking a reasonable annual return of around 10%.",
    stocks: [
      { ticker: "XLP", sector: "Consumer", name: "Consumer Staples Select Sector SPDR Fund", signal: "neutral" },
      { ticker: "VDE", sector: "Energy", name: "Vanguard Energy ETF", signal: "neutral" },
      { ticker: "XLI", sector: "Industrial", name: "Industrial Select Sector SPDR Fund", signal: "neutral" },
      { ticker: "BND", sector: "Fixed Income", name: "Vanguard Total Bond Market ETF", signal: "neutral" },
    ],
  },
  {
    name: "Custom Portfolio",
    desc: "A balanced growth portfolio targeting tech and healthcare sectors with moderate risk.",
    stocks: [
      { ticker: "QQQ", sector: "Tech", name: "Invesco QQQ Trust", signal: "buy" },
      { ticker: "XLV", sector: "Healthcare", name: "Health Care Select Sector SPDR", signal: "neutral" },
      { ticker: "SPY", sector: "Index", name: "SPDR S&P 500 ETF Trust", signal: "buy" },
      { ticker: "ARKK", sector: "Innovation", name: "ARK Innovation ETF", signal: "sell" },
    ],
  },
];

const Watchlists = () => {
  const [activeIdx, setActiveIdx] = useState(0);
  const navigate = useNavigate();
  const active = mockLists[activeIdx];

  return (
    <AppLayout>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Watchlists</h1>
          <p className="mt-1 text-muted-foreground">Track stocks and get AI-powered insights</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium transition-colors hover:bg-accent">
            <Sparkles className="h-4 w-4" /> AI Suggest
          </button>
          <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
            <Plus className="h-4 w-4" /> New List
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* List panel */}
        <div className="w-60 shrink-0 space-y-3">
          {mockLists.map((list, i) => (
            <button
              key={i}
              onClick={() => setActiveIdx(i)}
              className={cn(
                "w-full rounded-xl border p-4 text-left transition-all",
                activeIdx === i
                  ? "border-primary bg-primary/10"
                  : "border-border bg-card hover:bg-accent/50"
              )}
            >
              <div className="flex items-center justify-between">
                <p className="font-semibold text-sm">{list.name}</p>
                <MoreVertical className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">{list.stocks.length} stocks</p>
            </button>
          ))}
        </div>

        {/* Detail panel */}
        <div className="flex-1 rounded-xl border border-border bg-card p-6 animate-fade-in">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold">{active.name}</h2>
              <p className="mt-1 max-w-md text-sm leading-relaxed text-muted-foreground">{active.desc}</p>
            </div>
            <div className="flex gap-2">
              <button className="flex items-center gap-2 rounded-lg border border-border bg-accent/50 px-3 py-2 text-sm font-medium transition-colors hover:bg-accent">
                <Sparkles className="h-3.5 w-3.5" /> Analyze
              </button>
              <button className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
                <Plus className="h-3.5 w-3.5" /> Add Stock
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {active.stocks.map((s) => (
              <div key={s.ticker} className="flex items-center justify-between rounded-xl border border-border bg-accent/20 px-4 py-3">
                <div className="flex items-center gap-3">
                  <div>
                    <span className="font-semibold">{s.ticker}</span>
                    <span className="ml-2 rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">{s.sector}</span>
                  </div>
                </div>
                <p className="hidden text-sm text-muted-foreground sm:block">{s.name}</p>
                <div className="flex items-center gap-3">
                  <span className={cn(
                    "rounded-md border px-2.5 py-0.5 text-xs font-medium",
                    s.signal === "buy" ? "border-gain/40 text-gain" : s.signal === "sell" ? "border-loss/40 text-loss" : "border-border text-muted-foreground"
                  )}>
                    <TrendingDown className="mr-1 inline h-3 w-3" />{s.signal}
                  </span>
                  <button className="text-muted-foreground hover:text-loss transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Watchlists;
