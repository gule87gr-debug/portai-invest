import { useMemo } from "react";

interface SparklineProps {
  width?: number;
  height?: number;
  className?: string;
  seed?: string;
}

export function seededRandom(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(31, h) + seed.charCodeAt(i) | 0;
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
    h = Math.imul(h ^ (h >>> 13), 0x45d9f3b);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

export function generateSparklineData(seed: string) {
  const rng = seededRandom(seed);
  const count = 20;
  const data: number[] = [];
  let val = 50 + rng() * 50;
  for (let i = 0; i < count; i++) {
    val += (rng() - 0.48) * 8;
    val = Math.max(10, Math.min(90, val));
    data.push(val);
  }
  const isUp = data[data.length - 1] >= data[0];
  const pctChange = ((data[data.length - 1] - data[0]) / data[0]) * 100;
  return { data, isUp, pctChange: Number(pctChange.toFixed(2)) };
}

export const Sparkline = ({ width = 80, height = 28, className = "", seed = "default" }: SparklineProps) => {
  const { points, isUp } = useMemo(() => {
    const { data, isUp } = generateSparklineData(seed);
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const normalized = data.map((v) => ((v - min) / range));
    const pts = normalized.map((v, i) => `${(i / (data.length - 1)) * width},${height - v * (height - 4) - 2}`).join(" ");
    return { points: pts, isUp };
  }, [seed, width, height]);

  const color = isUp ? "#00D4B1" : "#FF4D4D";

  return (
    <svg width={width} height={height} className={className} viewBox={`0 0 ${width} ${height}`}>
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
