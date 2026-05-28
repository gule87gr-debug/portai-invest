import { useEffect, useRef, useState, useCallback } from "react";
import { Trash2, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { Stock } from "@/contexts/AppContext";
import { DailySparkline } from "@/components/DailySparkline";
import { generateSparklineData } from "@/components/Sparkline";

type Quote = {
  price: number;
  changePercent: number;
  live?: boolean;
  high?: number;
  open?: number;
};

interface Props {
  stocks: Stock[];
  onReorder: (from: number, to: number) => void;
  onRemove: (ticker: string) => void;
  onOpen: (ticker: string) => void;
  quotes: Record<string, Quote>;
  quotesLoading: boolean;
  activeTypes: Record<string, string>;
}

const LONG_PRESS_MS = 280;

export const DraggableStockList = ({
  stocks, onReorder, onRemove, onOpen, quotes, quotesLoading, activeTypes,
}: Props) => {
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const [dragOffsetY, setDragOffsetY] = useState(0);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const longPressTimer = useRef<number | null>(null);
  const startYRef = useRef(0);
  const itemHeightRef = useRef(0);
  const fromIdxRef = useRef(0);
  const pointerIdRef = useRef<number | null>(null);
  const scrollIntervalRef = useRef<number | null>(null);

  const cancelLongPress = () => {
    if (longPressTimer.current) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const stopAutoScroll = () => {
    if (scrollIntervalRef.current) {
      window.clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
  };

  const endDrag = useCallback((commit: boolean) => {
    cancelLongPress();
    stopAutoScroll();
    if (commit && dragIdx !== null && overIdx !== null && dragIdx !== overIdx) {
      onReorder(dragIdx, overIdx);
    }
    setDragIdx(null);
    setOverIdx(null);
    setDragOffsetY(0);
    pointerIdRef.current = null;
  }, [dragIdx, overIdx, onReorder]);

  useEffect(() => {
    return () => { cancelLongPress(); stopAutoScroll(); };
  }, []);

  const onPointerDownHandle = (e: React.PointerEvent, idx: number) => {
    if (e.button !== undefined && e.button !== 0) return;
    const el = itemRefs.current[idx];
    if (!el) return;
    const rect = el.getBoundingClientRect();
    // Include the 12px space-y gap so the slot height matches visual stride
    itemHeightRef.current = rect.height + 12;
    startYRef.current = e.clientY;
    fromIdxRef.current = idx;
    pointerIdRef.current = e.pointerId;
    try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch { /* noop */ }
    longPressTimer.current = window.setTimeout(() => {
      setDragIdx(idx);
      setOverIdx(idx);
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        try { (navigator as any).vibrate(12); } catch { /* noop */ }
      }
    }, LONG_PRESS_MS);
  };

  const onPointerMoveHandle = (e: React.PointerEvent) => {
    if (longPressTimer.current && Math.abs(e.clientY - startYRef.current) > 8) {
      cancelLongPress();
      return;
    }
    if (dragIdx === null) return;
    e.preventDefault();
    const dy = e.clientY - startYRef.current;
    setDragOffsetY(dy);
    const shift = Math.round(dy / itemHeightRef.current);
    const next = Math.max(0, Math.min(stocks.length - 1, fromIdxRef.current + shift));
    if (next !== overIdx) setOverIdx(next);

    // Auto-scroll when near viewport edges
    const EDGE = 80;
    const vh = window.innerHeight;
    stopAutoScroll();
    if (e.clientY < EDGE) {
      scrollIntervalRef.current = window.setInterval(() => window.scrollBy({ top: -12 }), 16);
    } else if (e.clientY > vh - EDGE) {
      scrollIntervalRef.current = window.setInterval(() => window.scrollBy({ top: 12 }), 16);
    }
  };

  const onPointerUpHandle = () => endDrag(true);
  const onPointerCancelHandle = () => endDrag(false);

  // Compute per-row visual translate while dragging
  const rowTransform = (idx: number): string | undefined => {
    if (dragIdx === null || overIdx === null) return undefined;
    if (idx === dragIdx) {
      return `translateY(${dragOffsetY}px) scale(1.02)`;
    }
    if (dragIdx < overIdx && idx > dragIdx && idx <= overIdx) {
      return `translateY(${-itemHeightRef.current}px)`;
    }
    if (dragIdx > overIdx && idx < dragIdx && idx >= overIdx) {
      return `translateY(${itemHeightRef.current}px)`;
    }
    return undefined;
  };

  return (
    <div ref={containerRef} className="space-y-3 select-none">
      {stocks.map((s, idx) => {
        const quote = quotes[s.ticker.toUpperCase()];
        const hasQuote = !!quote;
        let price: number | null = null;
        let dailyPct: string;
        let isUp: boolean;
        let label: string;

        if (hasQuote) {
          price = quote.price;
          dailyPct = quote.changePercent.toFixed(2);
          isUp = quote.changePercent >= 0;
          label = quote.live ? "Live" : "Last close";
        } else if (quotesLoading) {
          dailyPct = "—";
          isUp = true;
          label = "Loading…";
        } else {
          const { pctChange, isUp: simUp } = generateSparklineData(`${s.ticker}-${new Date().toISOString().split("T")[0]}`);
          dailyPct = pctChange.toFixed(2);
          isUp = simUp;
          label = "Estimated";
        }

        const isDragging = dragIdx === idx;
        const transform = rowTransform(idx);

        return (
          <div
            key={s.ticker}
            ref={(el) => (itemRefs.current[idx] = el)}
            style={{
              transform,
              transition: isDragging ? "none" : "transform 220ms cubic-bezier(0.22, 1, 0.36, 1)",
              zIndex: isDragging ? 30 : 1,
              touchAction: dragIdx !== null ? "none" : "auto",
            }}
            className={cn(
              "relative rounded-2xl border bg-card/60 overflow-hidden",
              isDragging
                ? "border-primary shadow-2xl shadow-primary/20 ring-2 ring-primary/40"
                : "border-border hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5",
            )}
          >
            <div
              role="link"
              tabIndex={0}
              onClick={() => { if (dragIdx === null) onOpen(s.ticker); }}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(s.ticker); } }}
              aria-label={`Open ${s.ticker} ${s.name}`}
              className="cursor-pointer focus-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <div className="flex items-center justify-between px-3 sm:px-5 py-4">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <button
                    type="button"
                    aria-label={`Drag ${s.ticker} to reorder`}
                    onPointerDown={(e) => { e.stopPropagation(); onPointerDownHandle(e, idx); }}
                    onPointerMove={onPointerMoveHandle}
                    onPointerUp={(e) => { e.stopPropagation(); onPointerUpHandle(); }}
                    onPointerCancel={(e) => { e.stopPropagation(); onPointerCancelHandle(); }}
                    onClick={(e) => e.stopPropagation()}
                    className={cn(
                      "flex h-9 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors",
                      "hover:bg-accent hover:text-foreground active:bg-accent",
                      isDragging && "text-primary",
                    )}
                    style={{ touchAction: "none", cursor: isDragging ? "grabbing" : "grab" }}
                  >
                    <GripVertical className="h-4 w-4" />
                  </button>
                  <div className="min-w-0">
                    <span className="font-semibold text-sm block tracking-tight">{s.ticker}</span>
                    <span className="text-xs text-muted-foreground truncate block max-w-[140px] sm:max-w-[200px]">{s.name}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                  <div className="flex flex-col items-end gap-0.5">
                    {price !== null ? (
                      <span className="text-sm font-semibold tnum text-foreground">${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    ) : quotesLoading ? (
                      <span className="text-sm text-muted-foreground animate-pulse">···</span>
                    ) : null}
                    {dailyPct !== "—" && (
                      <span className={cn("text-xs font-semibold tnum", isUp ? "text-gain" : "text-loss")}>
                        {isUp ? "+" : ""}{dailyPct}%
                      </span>
                    )}
                    <span className="metric-label text-[9px]">{label}</span>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); onRemove(s.ticker); }}
                    aria-label={`Remove ${s.ticker} from watchlist`}
                    className="text-muted-foreground hover:text-loss transition-colors shrink-0 p-1"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              {!isDragging && (
                <div className="reveal-grid px-3 sm:px-5">
                  <div>
                    <div className="flex items-center justify-between gap-4 border-t border-border/60 py-3">
                      <DailySparkline ticker={s.ticker} type={activeTypes[s.ticker.toUpperCase()]} width={160} height={32} colorIsUp={isUp} />
                      <div className="flex items-center gap-5 text-right">
                        <div>
                          <p className="metric-label">High</p>
                          <p className="text-xs font-mono tnum text-foreground">
                            {quote?.high ? `$${quote.high.toFixed(2)}` : "—"}
                          </p>
                        </div>
                        <div>
                          <p className="metric-label">Open</p>
                          <p className="text-xs font-mono tnum text-foreground">
                            {quote?.open ? `$${quote.open.toFixed(2)}` : "—"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
