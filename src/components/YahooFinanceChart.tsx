import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { Loader2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export type ChartRange = "1D" | "1W" | "1M" | "3M" | "1Y" | "ALL";

const RANGES: ChartRange[] = ["1D", "1W", "1M", "3M", "1Y", "ALL"];

interface Point { t: number; c: number; o?: number; h?: number; l?: number; }
interface HistoryResponse {
  symbol: string;
  range: ChartRange;
  currency?: string;
  points: Point[];
  meta?: { previousClose?: number | null };
}

interface YahooFinanceChartProps {
  ticker: string;
  type?: string;
  height?: number;
}

export const YahooFinanceChart = ({ ticker, type, height = 360 }: YahooFinanceChartProps) => {
  const [range, setRange] = useState<ChartRange>("1M");
  const [data, setData] = useState<HistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    supabase.functions
      .invoke("fetch-history", { body: { ticker, type, range } })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) { setError("Failed to load chart"); return; }
        if (!data || (data as any).error) { setError("No data available"); return; }
        setData(data as HistoryResponse);
      })
      .catch(() => !cancelled && setError("Failed to load chart"))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [ticker, type, range]);

  const stats = useMemo(() => {
    if (!data?.points.length) return null;
    const first = data.points[0].c;
    const last = data.points[data.points.length - 1].c;
    const ref = data.meta?.previousClose ?? first;
    const diff = last - ref;
    const pct = ref ? (diff / ref) * 100 : 0;
    const isUp = diff >= 0;
    return { first, last, ref, diff, pct, isUp };
  }, [data]);

  const formatDate = (t: number) => {
    const d = new Date(t);
    if (range === "1D") return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (range === "1W") return d.toLocaleDateString([], { weekday: "short" });
    if (range === "ALL" || range === "1Y") return d.toLocaleDateString([], { month: "short", year: "2-digit" });
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const stroke = stats?.isUp ? "hsl(var(--primary))" : "hsl(0 72% 60%)";

  return (
    <div className="w-full">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Powered by Yahoo Finance</span>
          {data?.currency && <span className="rounded-md bg-muted px-2 py-0.5">{data.currency}</span>}
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
        {!loading && !error && data?.points && data.points.length > 0 && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.points} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={stroke} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={stroke} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="t"
                tickFormatter={formatDate}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                minTickGap={40}
              />
              <YAxis
                domain={["auto", "auto"]}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={50}
                tickFormatter={(v) => Number(v).toFixed(2)}
                orientation="right"
              />
              {stats && (
                <ReferenceLine
                  y={stats.ref}
                  stroke="hsl(var(--muted-foreground))"
                  strokeDasharray="3 3"
                  strokeOpacity={0.4}
                />
              )}
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                labelFormatter={(t) => new Date(Number(t)).toLocaleString()}
                formatter={(value: number) => [`$${Number(value).toFixed(2)}`, "Price"]}
              />
              <Area
                type="monotone"
                dataKey="c"
                stroke={stroke}
                strokeWidth={2}
                fill="url(#chartFill)"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {stats && !loading && !error && (
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
