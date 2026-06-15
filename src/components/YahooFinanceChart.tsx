import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, ComposedChart, Bar, CartesianGrid,
} from "recharts";
import { Loader2, AlertTriangle, Plus, X, Search, Lock, GitCompareArrows, LineChart as LineIcon, CandlestickChart } from "lucide-react";
import { cn } from "@/lib/utils";
import { searchAssets, type AssetEntry } from "@/lib/stockDatabase";
import { useSubscription } from "@/hooks/useSubscription";
import { UpgradeModal } from "@/components/UpgradeModal";
import { useLanguage } from "@/contexts/LanguageContext";

export type ChartRange = "1D" | "5D" | "1M" | "6M" | "YTD" | "1Y" | "5Y" | "ALL";

const RANGES: ChartRange[] = ["1D", "5D", "1M", "6M", "YTD", "1Y", "5Y", "ALL"];

const COMPARE_COLORS = [
  "hsl(210 90% 60%)",
  "hsl(45 90% 55%)",
  "hsl(290 70% 65%)",
  "hsl(15 80% 60%)",
  "hsl(160 70% 50%)",
  "hsl(340 80% 60%)",
  "hsl(190 85% 55%)",
  "hsl(70 75% 50%)",
  "hsl(255 75% 65%)",
  "hsl(25 85% 55%)",
  "hsl(130 65% 50%)",
  "hsl(310 75% 60%)",
];

const MAX_COMPARE = COMPARE_COLORS.length;

interface Point { t: number; c: number; o?: number | null; h?: number | null; l?: number | null; v?: number | null; }
interface HistoryResponse {
  symbol: string;
  range: ChartRange;
  currency?: string;
  points: Point[];
  meta?: { previousClose?: number | null };
}

type ChartKind = "line" | "candle";

// Custom candle shape. Used with <Bar dataKey={(d)=>[d.l,d.h]} shape={<Candle />} />
// so Recharts gives us y/height covering the [low, high] range — no yAxis access needed.
const Candle = (props: any) => {
  const { x, y, width, height, payload } = props;
  if (!payload || payload.o == null || payload.h == null || payload.l == null || payload.c == null) return null;
  const { o, h, l, c } = payload;
  const isUp = c >= o;
  const color = isUp ? "hsl(var(--primary))" : "hsl(0 72% 60%)";
  const range = h - l;
  // Map a price to a y-pixel inside [y, y+height] (high → y, low → y+height)
  const priceToY = (p: number) => (range > 0 ? y + ((h - p) / range) * height : y + height / 2);
  const yHigh = y;
  const yLow = y + height;
  const yOpen = priceToY(o);
  const yClose = priceToY(c);
  const bodyTop = Math.min(yOpen, yClose);
  const bodyH = Math.max(1, Math.abs(yClose - yOpen));
  const cx = x + width / 2;
  const bodyW = Math.max(2, Math.min(width * 0.7, 12));
  return (
    <g>
      <line x1={cx} x2={cx} y1={yHigh} y2={yLow} stroke={color} strokeWidth={1.2} />
      <rect x={cx - bodyW / 2} y={bodyTop} width={bodyW} height={bodyH} fill={color} stroke={color} />
    </g>
  );
};

const VolumeBar = (props: any) => {
  const { x, y, width, height, payload } = props;
  if (!payload) return null;
  const isUp = (payload.c ?? 0) >= (payload.o ?? 0);
  const color = isUp ? "hsl(var(--primary))" : "hsl(0 72% 60%)";
  const w = Math.max(1, Math.min(width * 0.7, 12));
  return <rect x={x + width / 2 - w / 2} y={y} width={w} height={height} fill={color} opacity={0.55} />;
};

const fmtVol = (n: number) => {
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(2)}K`;
  return n.toLocaleString();
};

const fmtTs = (t: number) => {
  const d = new Date(t);
  return d.toLocaleString(undefined, {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

// Yahoo-style OHLC tooltip
const OHLCTooltip = ({ active, payload, currency, refPrice }: any) => {
  if (!active || !payload?.length) return null;
  const p = payload[0]?.payload;
  if (!p) return null;
  const o = Number(p.o ?? 0), h = Number(p.h ?? 0), l = Number(p.l ?? 0), c = Number(p.c ?? 0);
  const isUp = c >= o;
  const diff = c - o;
  const pct = o ? (diff / o) * 100 : 0;
  const ref = Number(refPrice ?? 0);
  const rDiff = ref ? c - ref : 0;
  const rPct = ref ? (rDiff / ref) * 100 : 0;
  const rUp = rDiff >= 0;
  const cur = currency || "USD";
  const Row = ({ k, v, cls = "" }: { k: string; v: string; cls?: string }) => (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{k}</span>
      <span className={`font-mono tabular-nums font-semibold ${cls}`}>{v}</span>
    </div>
  );
  return (
    <div className="rounded-lg border border-border bg-popover/95 backdrop-blur-sm px-3 py-2 text-[11px] shadow-xl min-w-[200px]">
      <div className="mb-1.5 text-[10px] text-muted-foreground">{fmtTs(p.t)}</div>
      <div className="space-y-0.5">
        <Row k="Open" v={o.toFixed(2)} />
        <Row k="High" v={h.toFixed(2)} cls="text-emerald-400" />
        <Row k="Low" v={l.toFixed(2)} cls="text-red-400" />
        <Row k="Close" v={c.toFixed(2)} cls={isUp ? "text-emerald-400" : "text-red-400"} />
        <Row
          k="Change"
          v={`${diff >= 0 ? "+" : ""}${diff.toFixed(2)} (${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%)`}
          cls={isUp ? "text-emerald-400" : "text-red-400"}
        />
        {ref > 0 && (
          <Row
            k="From start"
            v={`${rDiff >= 0 ? "+" : ""}${rDiff.toFixed(2)} (${rPct >= 0 ? "+" : ""}${rPct.toFixed(2)}%)`}
            cls={rUp ? "text-emerald-400" : "text-red-400"}
          />
        )}
        {p.v != null && <Row k="Volume" v={fmtVol(Number(p.v))} />}
        <div className="mt-1 pt-1 border-t border-border/60 text-[9px] text-muted-foreground text-right">{cur}</div>
      </div>
    </div>
  );
};


const VolumeTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const p = payload[0]?.payload;
  if (!p) return null;
  const isUp = (p.c ?? 0) >= (p.o ?? 0);
  return (
    <div className="rounded-lg border border-border bg-popover/95 backdrop-blur-sm px-3 py-2 text-[11px] shadow-xl">
      <div className="text-[10px] text-muted-foreground mb-1">{fmtTs(p.t)}</div>
      <div className="flex justify-between gap-4">
        <span className="text-muted-foreground">Volume</span>
        <span className={`font-mono tabular-nums font-semibold ${isUp ? "text-emerald-400" : "text-red-400"}`}>
          {fmtVol(Number(p.v ?? 0))}
        </span>
      </div>
    </div>
  );
};

// Yahoo-style line tooltip — date + price + change vs reference (prev close on 1D, range start otherwise)
const LineTooltip = ({ active, payload, currency, refPrice }: any) => {
  if (!active || !payload?.length) return null;
  const p = payload[0]?.payload;
  if (!p) return null;
  const c = Number(p.c ?? 0);
  const ref = Number(refPrice ?? p.c ?? 0);
  const diff = c - ref;
  const pct = ref ? (diff / ref) * 100 : 0;
  const isUp = diff >= 0;
  const cur = currency || "USD";
  return (
    <div className="rounded-lg border border-border bg-popover/95 backdrop-blur-sm px-3 py-2 text-[11px] shadow-xl min-w-[170px]">
      <div className="mb-1 text-[10px] text-muted-foreground">{fmtTs(p.t)}</div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-mono tabular-nums text-[13px] font-semibold text-foreground">{c.toFixed(2)}</span>
        <span className={`font-mono tabular-nums text-[11px] font-semibold ${isUp ? "text-emerald-400" : "text-red-400"}`}>
          {diff >= 0 ? "+" : ""}{diff.toFixed(2)} ({pct >= 0 ? "+" : ""}{pct.toFixed(2)}%)
        </span>
      </div>
      <div className="mt-0.5 text-right text-[9px] text-muted-foreground">{cur}</div>
    </div>
  );
};


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
  const [chartKind, setChartKind] = useState<ChartKind>("line");
  const [showVolume, setShowVolume] = useState(true);
  let t: (k: string) => string;
  try { t = useLanguage().t; } catch { t = (k) => k; }
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

    // Normalize each series to % change from its first close, keep sorted points
    const normalized = series.map((s) => {
      const sorted = [...s.points].sort((a, b) => a.t - b.t);
      const base = sorted[0].c;
      return {
        key: s.key,
        points: sorted.map((p) => ({ t: p.t, v: base ? ((p.c - base) / base) * 100 : 0 })),
      };
    });

    // Union of all timestamps across all series
    const timeSet = new Set<number>();
    normalized.forEach((n) => n.points.forEach((p) => timeSet.add(p.t)));
    const timestamps = Array.from(timeSet).sort((a, b) => a - b);

    // For each series build a value lookup by nearest previous timestamp (step-forward)
    return timestamps.map((t) => {
      const row: Record<string, number | string> = { t };
      normalized.forEach((n) => {
        // binary search for the latest point with time <= t
        let lo = 0, hi = n.points.length - 1, idx = -1;
        while (lo <= hi) {
          const mid = (lo + hi) >> 1;
          if (n.points[mid].t <= t) { idx = mid; lo = mid + 1; } else { hi = mid - 1; }
        }
        // Fall back to first point if t precedes the series start
        if (idx === -1 && n.points.length) idx = 0;
        if (idx >= 0) row[n.key] = n.points[idx].v;
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
    if (range === "5D") return d.toLocaleDateString([], { weekday: "short", hour: "2-digit", minute: "2-digit" });
    if (range === "1M") return d.toLocaleDateString([], { month: "short", day: "numeric" });
    if (range === "6M" || range === "YTD" || range === "1Y") return d.toLocaleDateString([], { month: "short", day: "numeric" });
    // 5Y, ALL
    return d.toLocaleDateString([], { month: "short", year: "2-digit" });
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
      setShowUpgrade(true);
      return;
    }
    if (extras.length >= MAX_COMPARE) return;
    const usedColors = new Set(extras.map((e) => e.color));
    const color = COMPARE_COLORS.find((c) => !usedColors.has(c)) || COMPARE_COLORS[0];
    setExtras((prev) => [...prev, { ticker: a.ticker.toUpperCase(), type: a.type, color }]);
    setQuery("");
    setSearchOpen(false);
  };

  const removeCompare = (t: string) => {
    setExtras((prev) => prev.filter((e) => e.ticker !== t));
  };

  // Yahoo Finance-style labels: 1D, 5D, 1M, 6M, YTD, 1Y, 5Y, All
  const rangeLabel = (r: ChartRange) => (r === "ALL" ? "All" : r);

  return (
    <div className="w-full">
      {/* Top bar: powered + range */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{t("powByYahoo")}</span>
          {primary?.currency && !isCompare && (
            <span className="rounded-md bg-muted px-2 py-0.5">{primary.currency}</span>
          )}
          {isCompare && (
            <span className="rounded-md bg-muted px-2 py-0.5">{t("pctChangeLbl")}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!isCompare && (
            <div className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5" role="tablist" aria-label="Chart type">
              <button
                role="tab"
                aria-selected={chartKind === "line"}
                onClick={() => setChartKind("line")}
                title="Line"
                className={cn(
                  "px-2 py-1 rounded-md transition-colors",
                  chartKind === "line" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <LineIcon className="h-3.5 w-3.5" />
              </button>
              <button
                role="tab"
                aria-selected={chartKind === "candle"}
                onClick={() => setChartKind("candle")}
                title="Candlestick"
                className={cn(
                  "px-2 py-1 rounded-md transition-colors",
                  chartKind === "candle" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <CandlestickChart className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
          {!isCompare && chartKind === "candle" && (
            <button
              type="button"
              onClick={() => setShowVolume((v) => !v)}
              title={showVolume ? "Hide volume" : "Show volume"}
              className={cn(
                "rounded-md border border-border px-2 py-1 text-[11px] font-mono transition-colors",
                showVolume ? "bg-primary/15 text-primary border-primary/40" : "bg-muted/40 text-muted-foreground hover:text-foreground"
              )}
            >
              VOL
            </button>
          )}
          <div className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5" role="tablist" aria-label={t("chartTimeframe")}>
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
                {rangeLabel(r)}
              </button>
            ))}
          </div>
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
            aria-label={`${t("removeFromCompare")}: ${ex.ticker}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        {extras.length < MAX_COMPARE && (
          <div ref={searchRef} className="relative">
            {!searchOpen ? (
              <button
                type="button"
                onClick={() => {
                  if (!subLoading && !isPaid) { setShowUpgrade(true); return; }
                  setSearchOpen(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-md border border-primary/60 bg-primary/15 px-3 py-1.5 text-xs font-semibold text-primary shadow-sm hover:bg-primary/25 hover:border-primary transition-colors"
              >
                <GitCompareArrows className="h-3.5 w-3.5" />
                {t("compareBtnLbl")}
                {!subLoading && !isPaid && <Lock className="h-3 w-3 opacity-80" />}
              </button>
            ) : (
              <div className="flex items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1">
                <Search className="h-3 w-3 text-muted-foreground" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("searchTickerPh")}
                  className="w-44 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
                />
                <button
                  type="button"
                  onClick={() => { setSearchOpen(false); setQuery(""); }}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label={t("closeSearchAria")}
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
                {t("noMatchesLbl")}
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
        {!loading && !error && !isCompare && primary?.points && primary.points.length > 0 && chartKind === "line" && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={primary.points} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={stroke} stopOpacity={0.28} />
                  <stop offset="100%" stopColor={stroke} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="hsl(var(--border))" strokeOpacity={0.35} strokeDasharray="2 4" vertical={false} />
              {range === "1D" || range === "5D" ? (
                <XAxis dataKey="t" type="category" tickFormatter={(v) => formatDate(Number(v))} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={48} interval="preserveStartEnd" />
              ) : (
                <XAxis dataKey="t" type="number" scale="time" domain={["dataMin", "dataMax"]} tickFormatter={formatDate} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={48} />
              )}
              <YAxis domain={["auto", "auto"]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} width={56} tickFormatter={(v) => Number(v).toFixed(2)} orientation="right" />
              {stats && (
                <ReferenceLine y={stats.ref} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" strokeOpacity={0.45} />
              )}
              <Tooltip
                cursor={{ stroke: "hsl(var(--muted-foreground))", strokeDasharray: "3 3", strokeOpacity: 0.6 }}
                content={<LineTooltip currency={primary.currency} refPrice={range === "1D" ? stats?.ref : stats?.first} />}
              />

              <Area type="linear" dataKey="c" stroke={stroke} strokeWidth={1.6} fill="url(#chartFill)" isAnimationActive={true} animationDuration={1000} animationEasing="ease-out" dot={false} activeDot={{ r: 3, stroke: stroke, strokeWidth: 1, fill: "hsl(var(--background))" }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
        {!loading && !error && !isCompare && primary?.points && primary.points.length > 0 && chartKind === "candle" && (
          <div className="flex h-full w-full flex-col">
            <div className={cn("w-full", showVolume ? "h-[72%]" : "h-full")}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={primary.points} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid stroke="hsl(var(--border))" strokeOpacity={0.35} strokeDasharray="2 4" vertical={false} />
                  <XAxis
                    dataKey="t"
                    tickFormatter={formatDate}
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    minTickGap={40}
                    hide={showVolume}
                  />
                  <YAxis
                    domain={[
                      (dataMin: number) => dataMin * 0.999,
                      (dataMax: number) => dataMax * 1.001,
                    ]}
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={50}
                    tickFormatter={(v) => Number(v).toFixed(2)}
                    orientation="right"
                  />
                  {stats && (
                    <ReferenceLine y={stats.ref} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" strokeOpacity={0.4} />
                  )}
                  <Tooltip
                    cursor={{ stroke: "hsl(var(--muted-foreground))", strokeDasharray: "3 3", strokeOpacity: 0.5 }}
                    content={<OHLCTooltip currency={primary.currency} refPrice={range === "1D" ? stats?.ref : stats?.first} />}
                  />

                  <Bar dataKey={(d: any) => [d.l, d.h]} shape={<Candle />} isAnimationActive={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            {showVolume && (
              <div className="h-[28%] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={primary.points} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                    <XAxis dataKey="t" tickFormatter={formatDate} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={40} />
                    <YAxis
                      domain={[0, "auto"]}
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      width={50}
                      orientation="right"
                      tickFormatter={(v) => {
                        const n = Number(v);
                        if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
                        if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
                        if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
                        return String(n);
                      }}
                    />
                    <Tooltip
                      cursor={{ stroke: "hsl(var(--muted-foreground))", strokeDasharray: "3 3", strokeOpacity: 0.5 }}
                      content={<VolumeTooltip />}
                    />
                    <Bar dataKey="v" shape={<VolumeBar />} isAnimationActive={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}
        {!loading && !error && isCompare && compareData.length > 0 && (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={compareData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid stroke="hsl(var(--border))" strokeOpacity={0.35} strokeDasharray="2 4" vertical={false} />
              <XAxis dataKey="t" type="number" scale="time" domain={["dataMin", "dataMax"]} tickFormatter={formatDate} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={48} />
              <YAxis domain={["auto", "auto"]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} width={56} tickFormatter={(v) => `${Number(v).toFixed(1)}%`} orientation="right" />
              <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" strokeOpacity={0.45} />
              <Tooltip
                contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                labelFormatter={(t) => new Date(Number(t)).toLocaleString()}
                formatter={(value: number, name) => [`${Number(value).toFixed(2)}%`, String(name)]}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="linear" dataKey={primaryUpper} stroke={stroke} strokeWidth={2} dot={false} isAnimationActive={true} animationDuration={1000} animationEasing="ease-out" />
              {extras.map((ex, idx) => (
                <Line key={ex.ticker} type="linear" dataKey={ex.ticker} stroke={ex.color} strokeWidth={2} dot={false} isAnimationActive={true} animationDuration={1000} animationBegin={150 * (idx + 1)} animationEasing="ease-out" connectNulls />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {stats && !loading && !error && !isCompare && (
        <div className="mt-3 flex items-center gap-3 text-xs font-mono">
          <span className="text-muted-foreground">{rangeLabel(range)} {t("rangeChange")}</span>
          <span className={cn("font-semibold", stats.isUp ? "text-emerald-400" : "text-red-400")}>
            {stats.diff >= 0 ? "+" : ""}{stats.diff.toFixed(2)} ({stats.pct >= 0 ? "+" : ""}{stats.pct.toFixed(2)}%)
          </span>
        </div>
      )}
      <UpgradeModal
        open={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        title={t("compareUpgradeTitle")}
        description={t("compareUpgradeDesc")}
      />
    </div>
  );
};
