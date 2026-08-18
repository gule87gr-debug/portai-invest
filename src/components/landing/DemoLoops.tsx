import { AlertTriangle, Bell, ScanLine, TrendingUp } from "lucide-react";

/**
 * Three looping, pure-CSS product mockups used under the live demo.
 * No data fetching — purely illustrative motion.
 */

const ArticleScanLoop = () => (
  <div className="relative h-full w-full overflow-hidden bg-gradient-to-br from-muted/40 to-background p-4">
    <div className="flex items-center gap-1.5 mb-3">
      <ScanLine className="h-3 w-3 text-foreground/70" />
      <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
        scanning article
      </span>
    </div>

    <div className="space-y-2">
      {["w-11/12", "w-9/12", "w-10/12", "w-7/12"].map((w, i) => (
        <div
          key={w + i}
          className={`h-2 rounded bg-muted/70 origin-left animate-[scanner-reveal_2.4s_ease-in-out_infinite] ${w}`}
          style={{ animationDelay: `${i * 140}ms` }}
        />
      ))}
    </div>

    <div className="mt-3 flex items-center gap-2">
      <span className="rounded-md border border-border bg-card px-2 py-1 font-mono text-[10px] text-foreground animate-[loop-pop_3.2s_ease-in-out_infinite]">
        bias 7/10
      </span>
      <span className="rounded-md border border-border bg-card px-2 py-1 font-mono text-[10px] text-gain animate-[loop-pop_3.2s_ease-in-out_infinite] [animation-delay:400ms]">
        trust 8.7
      </span>
    </div>

    <div
      aria-hidden
      className="pointer-events-none absolute inset-y-0 -left-1/4 w-1/4 bg-gradient-to-r from-transparent via-foreground/10 to-transparent animate-[scanner-sweep_2.6s_ease-in-out_infinite]"
    />
  </div>
);

const ALERTS = [
  { t: "NVDA", m: "Promotional tone spike", tone: "text-loss" },
  { t: "TSLA", m: "Insider selling omitted", tone: "text-warning" },
  { t: "AAPL", m: "Sources corroborated", tone: "text-gain" },
];

const WatchlistAlertsLoop = () => (
  <div className="relative h-full w-full overflow-hidden bg-gradient-to-br from-muted/40 to-background p-4">
    <div className="flex items-center gap-1.5 mb-3">
      <Bell className="h-3 w-3 text-foreground/70 animate-[loop-ring_3.6s_ease-in-out_infinite]" />
      <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
        watchlist alerts
      </span>
    </div>

    <ul className="space-y-1.5">
      {ALERTS.map((a, i) => (
        <li
          key={a.t}
          className="flex items-center gap-2 rounded-lg border border-border bg-card/80 px-2.5 py-1.5 animate-[loop-slide-in_3.6s_ease-in-out_infinite]"
          style={{ animationDelay: `${i * 500}ms` }}
        >
          <AlertTriangle className={`h-3 w-3 shrink-0 ${a.tone}`} />
          <span className="font-mono text-[10px] font-bold text-foreground">{a.t}</span>
          <span className="truncate text-[10px] text-muted-foreground">{a.m}</span>
        </li>
      ))}
    </ul>
  </div>
);

const TrustHistoryLoop = () => (
  <div className="relative h-full w-full overflow-hidden bg-gradient-to-br from-muted/40 to-background p-4">
    <div className="flex items-center gap-1.5 mb-2">
      <TrendingUp className="h-3 w-3 text-foreground/70" />
      <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
        trust score history
      </span>
    </div>

    <svg viewBox="0 0 200 70" className="w-full h-[calc(100%-2.5rem)]" preserveAspectRatio="none">
      {[0, 1, 2].map((i) => (
        <line
          key={i}
          x1="0"
          x2="200"
          y1={12 + i * 22}
          y2={12 + i * 22}
          stroke="hsl(var(--border))"
          strokeWidth="0.5"
        />
      ))}
      <polyline
        points="0,52 22,46 44,50 66,34 88,40 110,26 132,30 154,18 176,22 200,10"
        fill="none"
        stroke="hsl(var(--gain))"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        strokeDasharray="420"
        strokeDashoffset="420"
        className="animate-[loop-draw_3.4s_ease-in-out_infinite]"
      />
    </svg>

    <span className="absolute right-3 top-3 rounded-md border border-border bg-card px-2 py-0.5 font-mono text-[10px] text-gain">
      +2.4
    </span>
  </div>
);

export const DEMO_LOOPS = [
  { label: "Real-time article scan", Comp: ArticleScanLoop },
  { label: "Watchlist bias alerts", Comp: WatchlistAlertsLoop },
  { label: "Trust score history", Comp: TrustHistoryLoop },
];
