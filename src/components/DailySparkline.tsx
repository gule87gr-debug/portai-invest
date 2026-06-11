import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  ticker: string;
  type?: string;
  width?: number;
  height?: number;
  className?: string;
  /** When provided, overrides the auto-detected direction so the color
   *  matches the daily change shown next to the sparkline. */
  colorIsUp?: boolean;
}

// Tiny in-memory cache so re-renders / multiple rows don't re-fetch
const cache = new Map<string, { ts: number; data: number[] }>();
const TTL_MS = 60_000;

/**
 * Sparkline that renders the real daily (1D intraday) price series
 * from fetch-history — the same data source the main chart uses on its
 * "1D" tab. Falls back to a flat line while loading.
 */
export const DailySparkline = ({
  ticker,
  type,
  width = 160,
  height = 32,
  className = "",
  colorIsUp,
}: Props) => {
  const [data, setData] = useState<number[] | null>(() => {
    const c = cache.get(ticker.toUpperCase());
    return c && Date.now() - c.ts < TTL_MS ? c.data : null;
  });
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    const key = ticker.toUpperCase();
    const cached = cache.get(key);
    if (cached && Date.now() - cached.ts < TTL_MS) {
      setData(cached.data);
      return;
    }
    supabase.functions
      .invoke("fetch-history", { body: { ticker, type, range: "1D" } })
      .then(({ data: res }) => {
        const closes: number[] = Array.isArray(res?.points)
          ? res.points
              .map((p: any) => (typeof p?.c === "number" ? p.c : null))
              .filter((n: number | null): n is number => n !== null)
          : [];
        if (closes.length >= 2) {
          cache.set(key, { ts: Date.now(), data: closes });
          if (mounted.current) setData(closes);
        }
      })
      .catch(() => {});
    return () => {
      mounted.current = false;
    };
  }, [ticker, type]);

  const { points, isUp, ready } = useMemo(() => {
    if (!data || data.length < 2) {
      return { points: "", isUp: true, ready: false };
    }
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const pts = data
      .map(
        (v, i) =>
          `${(i / (data.length - 1)) * width},${
            height - ((v - min) / range) * (height - 4) - 2
          }`,
      )
      .join(" ");
    return { points: pts, isUp: data[data.length - 1] >= data[0], ready: true };
  }, [data, width, height]);

  const effectiveUp = typeof colorIsUp === "boolean" ? colorIsUp : isUp;
  const color = effectiveUp ? "#00D4B1" : "#FF4D4D";

  if (!ready) {
    return (
      <svg width={width} height={height} className={className} viewBox={`0 0 ${width} ${height}`}>
        <line
          x1={0}
          x2={width}
          y1={height / 2}
          y2={height / 2}
          stroke="hsl(var(--muted-foreground) / 0.3)"
          strokeWidth="1.5"
          strokeDasharray="3 3"
        />
      </svg>
    );
  }

  return (
    <svg width={width} height={height} className={className} viewBox={`0 0 ${width} ${height}`}>
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
      strokeLinecap="butt"
      strokeLinejoin="miter"
      />
    </svg>
  );
};
