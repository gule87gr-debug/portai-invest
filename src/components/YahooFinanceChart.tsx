import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine,
} from "recharts";
import { Loader2, AlertTriangle, Plus, X, Search, Lock, GitCompareArrows } from "lucide-react";
import { cn } from "@/lib/utils";
import { searchAssets, type AssetEntry } from "@/lib/stockDatabase";
import { useSubscription } from "@/hooks/useSubscription";
import { UpgradeModal } from "@/components/UpgradeModal";

export type ChartRange = "1D" | "1W" | "1M" | "3M" | "1Y" | "ALL";

const RANGES: ChartRange[] = ["1D", "1W", "1M", "3M", "1Y", "ALL"];

const COMPARE_COLORS = [
  "hsl(210 90% 60%)",
  "hsl(45 90% 55%)",
  "hsl(290 70% 65%)",
  "hsl(15 80% 60%)",
];

interface Point { t: number; c: number; }
interface HistoryResponse {
  symbol: string;
  range: ChartRange;
  currency?: string;
  points: Point[];
  meta?: { previousClose?: number | null };
}

interface CompareItem {
  ticker: string;
  type?: string;
  color: string;
}

interface YahooFinanceChartProps {
  ticker: string;
  type?: string;
  height?: number;
}

async function fetchSeries(ticker: string, type: string | undefined, range: ChartRange) {
  const { data, error } = await supabase.functions.invoke("fetch-history", {
    body: { ticker, type, range },
  });
  if (error || !data || (data as any).error) return null;
  return data as HistoryResponse;
}

export const YahooFinanceChart = ({ ticker, type, height = 360 }: YahooFinanceChartProps) => {
  const [range, setRange] = useState<ChartRange>("1M");
  const { isPaid, loading: subLoading } = useSubscription();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [primary, setPrimary] = useState<HistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [extras, setExtras] = useState<CompareItem[]>([]);
  const [extraSeries, setExtraSeries] = useState<Record<string, HistoryResponse | null>>({});

  // Search UI
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLDivElement>(null);

  // Reset extras when primary ticker changes
  useEffect(() => {
    setExtras([]);
    setExtraSeries({});
  }, [ticker]);

  // Close search dropdown on outside click
  useEffect(() => {
    if (!searchOpen) return;
    const onClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [searchOpen]);

  // Fetch primary
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchSeries(ticker, type, range)
      .then((d) => {
        if (cancelled) return;
        if (!d) { setError("No data available"); return; }
        setPrimary(d);
      })
      .catch(() => !cancelled && setError("Failed to load chart"))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [ticker, type, range]);

  // Fetch extras
  useEffect(() => {
    let cancelled = false;
    extras.forEach((ex) => {
      const cacheKey = `${ex.ticker}:${range}`;
      if (extraSeries[cacheKey]) return;
      fetchSeries(ex.ticker, ex.type, range).then((d) => {
        if (cancelled) return;
        setExtraSeries((prev) => ({ ...prev, [cacheKey]: d }));
      });
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [extras, range]);

  const isCompare = extras.length > 0;

  // Build merged dataset for compare mode (% change from first close)
  const compareData = useMemo(() => {
    if (!isCompare || !primary?.points.length) return [];
    const series: { key: string; points: Point[] }[] = [
      { key: ticker.toUpperCase(), points: primary.points },
    ];
    extras.forEach((ex) => {
      const s = extraSeries[`${ex.ticker}:${range}`];
      if (s?.points?.length) series.push({ key: ex.ticker.toUpperCase(), points: s.points });
    });

    // Normalize each series to % change from its first close
    const normalized = series.map((s) => {
      const base = s.points[0].c;
      return {
        key: s.key,
        map: new Map(s.points.map((p) => [p.t, base ? ((p.c - base) / base) * 100 : 0])),
      };
    });

    // Use union of all timestamps from primary (most relevant)
    return primary.points.map((p) => {
      const row: Record<string, number | string> = { t: p.t };
      normalized.forEach((n) => {
        const v = n.map.get(p.t);
        if (v !== undefined) row[n.key] = v;
      });
      return row;
    });
  }, [isCompare, primary, extras, extraSeries, range, ticker]);

  const stats = useMemo(() => {
    if (!primary?.points.length) return null;
    const first = primary.points[0].c;
    const last = primary.points[primary.points.length - 1].c;
    const ref = primary.meta?.previousClose ?? first;
    const diff = last - ref;
    const pct = ref ? (diff / ref) * 100 : 0;
    return { first, last, ref, diff, pct, isUp: diff >= 0 };
  }, [primary]);

  const formatDate = (t: number) => {
    const d = new Date(t);
    if (range === "1D") return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (range === "1W") return d.toLocaleDateString([], { weekday: "short" });
    if (range === "ALL" || range === "1Y") return d.toLocaleDateString([], { month: "short", year: "2-digit" });
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const stroke = stats?.isUp ? "hsl(var(--primary))" : "hsl(0 72% 60%)";
  const primaryUpper = ticker.toUpperCase();

  // Search results
  const results = useMemo(() => {
    if (!query.trim()) return [] as AssetEntry[];
    const taken = new Set([primaryUpper, ...extras.map((e) => e.ticker.toUpperCase())]);
    return searchAssets(query).filter((a) => !taken.has(a.ticker.toUpperCase())).slice(0, 8);
  }, [query, extras, primaryUpper]);

  const addCompare = (a: AssetEntry) => {
    if (!isPaid) {
      navigate("/upgrade");
      return;
    }
    if (extras.length >= 4) return;
    const usedColors = new Set(extras.map((e) => e.color));
    const color = COMPARE_COLORS.find((c) => !usedColors.has(c)) || COMPARE_COLORS[0];
    setExtras((prev) => [...prev, { ticker: a.ticker.toUpperCase(), type: a.type, color }]);
    setQuery("");
    setSearchOpen(false);
  };

  const removeCompare = (t: string) => {
    setExtras((prev) => prev.filter((e) => e.ticker !== t));
  };

  return (
    <div className="w-full">
      {/* Top bar: powered + range */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Powered by Yahoo Finance</span>
          {primary?.currency && !isCompare && (
            <span className="rounded-md bg-muted px-2 py-0.5">{primary.currency}</span>
          )}
          {isCompare && (
            <span className="rounded-md bg-muted px-2 py-0.5">% change</span>
          )}
        </div>
        <div className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5" role="tablist" aria-label="Chart timeframe">
          {RANGES.map((r) => (
            <button
              key={r}
              role="tab"
              aria-selected={range === r}
              onClick={() => setRange(r)}
              className={cn(
                "px-2.5 py-1 text-xs font-mono rounded-md transition-colors",
                range === r
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Compare bar */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/40 px-2 py-1 text-xs font-mono">
          <span className="h-2 w-2 rounded-full" style={{ background: stroke }} />
          {primaryUpper}
        </span>
        {extras.map((ex) => (
          <span key={ex.ticker} className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/40 px-2 py-1 text-xs font-mono">
            <span className="h-2 w-2 rounded-full" style={{ background: ex.color }} />
            {ex.ticker}
            <button
              type="button"
              onClick={() => removeCompare(ex.ticker)}
              className="ml-0.5 text-muted-foreground hover:text-foreground"
              aria-label={`Remove ${ex.ticker} from comparison`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        {extras.length < 4 && (
          <div ref={searchRef} className="relative">
            {!searchOpen ? (
              <button
                type="button"
                onClick={() => {
                  if (!subLoading && !isPaid) { navigate("/upgrade"); return; }
                  setSearchOpen(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-md border border-primary/60 bg-primary/15 px-3 py-1.5 text-xs font-semibold text-primary shadow-sm hover:bg-primary/25 hover:border-primary transition-colors"
              >
                <GitCompareArrows className="h-3.5 w-3.5" />
                Compare
                {!subLoading && !isPaid && <Lock className="h-3 w-3 opacity-80" />}
              </button>
            ) : (
              <div className="flex items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1">
                <Search className="h-3 w-3 text-muted-foreground" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search ticker or name…"
                  className="w-44 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
                />
                <button
                  type="button"
                  onClick={() => { setSearchOpen(false); setQuery(""); }}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label="Close search"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            {searchOpen && results.length > 0 && (
              <div className="absolute left-0 top-full z-20 mt-1 w-64 overflow-hidden rounded-md border border-border bg-popover shadow-lg">
                {results.map((a) => (
                  <button
                    key={a.ticker}
                    type="button"
                    onClick={() => addCompare(a)}
                    className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs hover:bg-muted/60 transition-colors"
                  >
                    <span className="font-mono font-semibold">{a.ticker}</span>
                    <span className="truncate text-muted-foreground">{a.name}</span>
                  </button>
                ))}
              </div>
            )}
            {searchOpen && query.trim() && results.length === 0 && (
              <div className="absolute left-0 top-full z-20 mt-1 w-64 rounded-md border border-border bg-popover px-3 py-2 text-xs text-muted-foreground shadow-lg">
                No matches.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="relative w-full" style={{ height }}>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        )}
        {error && !loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-sm text-muted-foreground">
            <AlertTriangle className="mb-2 h-5 w-5" />
            <span>{error}</span>
          </div>
        )}
        {!loading && !error && !isCompare && primary?.points && primary.points.length > 0 && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={primary.points} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={stroke} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={stroke} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="t" tickFormatter={formatDate} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={40} />
              <YAxis domain={["auto", "auto"]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} width={50} tickFormatter={(v) => Number(v).toFixed(2)} orientation="right" />
              {stats && (
                <ReferenceLine y={stats.ref} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" strokeOpacity={0.4} />
              )}
              <Tooltip
                contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                labelFormatter={(t) => new Date(Number(t)).toLocaleString()}
                formatter={(value: number) => [`$${Number(value).toFixed(2)}`, "Price"]}
              />
              <Area type="monotone" dataKey="c" stroke={stroke} strokeWidth={2} fill="url(#chartFill)" isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}
        {!loading && !error && isCompare && compareData.length > 0 && (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={compareData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <XAxis dataKey="t" tickFormatter={formatDate} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={40} />
              <YAxis domain={["auto", "auto"]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} width={50} tickFormatter={(v) => `${Number(v).toFixed(1)}%`} orientation="right" />
              <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" strokeOpacity={0.4} />
              <Tooltip
                contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                labelFormatter={(t) => new Date(Number(t)).toLocaleString()}
                formatter={(value: number, name) => [`${Number(value).toFixed(2)}%`, String(name)]}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey={primaryUpper} stroke={stroke} strokeWidth={2} dot={false} isAnimationActive={false} />
              {extras.map((ex) => (
                <Line key={ex.ticker} type="monotone" dataKey={ex.ticker} stroke={ex.color} strokeWidth={2} dot={false} isAnimationActive={false} connectNulls />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {stats && !loading && !error && !isCompare && (
        <div className="mt-3 flex items-center gap-3 text-xs font-mono">
          <span className="text-muted-foreground">{range} change</span>
          <span className={cn("font-semibold", stats.isUp ? "text-emerald-400" : "text-red-400")}>
            {stats.diff >= 0 ? "+" : ""}{stats.diff.toFixed(2)} ({stats.pct >= 0 ? "+" : ""}{stats.pct.toFixed(2)}%)
          </span>
        </div>
      )}
    </div>
  );
};
