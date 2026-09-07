import { cn } from "@/lib/utils";

/** Base shimmer block — matte black/white palette, subtle sweep. */
export const Shimmer = ({ className }: { className?: string }) => (
  <div className={cn("shimmer rounded-md", className)} aria-hidden="true" />
);

const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("rounded-xl border border-border bg-card p-4", className)}>{children}</div>
);

/** Watchlist rows: ticker, price and sparkline blocks. */
export const WatchlistRowsSkeleton = ({ rows = 5 }: { rows?: number }) => (
  <div className="space-y-2" aria-busy="true" aria-live="polite">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex items-center gap-4 rounded-xl border border-border bg-card px-4 py-3">
        <Shimmer className="h-9 w-9 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Shimmer className="h-3.5 w-24" />
          <Shimmer className="h-3 w-36" />
        </div>
        <Shimmer className="hidden h-8 w-24 sm:block" />
        <div className="space-y-2 text-right">
          <Shimmer className="h-3.5 w-16" />
          <Shimmer className="ml-auto h-3 w-12" />
        </div>
      </div>
    ))}
  </div>
);

/** News feed: skeleton article cards in the masonry grid. */
export const NewsCardsSkeleton = ({ count = 6 }: { count?: number }) => (
  <div className="masonry columns-1 md:columns-2 xl:columns-3" aria-busy="true" aria-live="polite">
    {Array.from({ length: count }).map((_, i) => (
      <Card key={i} className="mb-4 break-inside-avoid bg-card/60">
        <div className="flex items-start gap-3">
          <Shimmer className="h-10 w-10 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Shimmer className="h-3.5 w-full" />
            <Shimmer className="h-3.5 w-4/5" />
            <div className="flex gap-2 pt-1">
              <Shimmer className="h-4 w-16" />
              <Shimmer className="h-4 w-10" />
              <Shimmer className="h-4 w-12" />
            </div>
          </div>
        </div>
      </Card>
    ))}
  </div>
);

/** AI chat: shimmering assistant bubble while the response streams. */
export const ChatBubbleSkeleton = () => (
  <div className="max-w-[85%] space-y-2 rounded-xl rounded-tl-none bg-card p-4 sm:max-w-[70%]" aria-busy="true">
    <Shimmer className="h-3 w-56" />
    <Shimmer className="h-3 w-44" />
    <Shimmer className="h-3 w-32" />
  </div>
);

/** Stock detail: chart and stat blocks. */
export const StockDetailSkeleton = () => (
  <div className="space-y-4" aria-busy="true" aria-live="polite">
    <div className="flex items-center gap-4">
      <Shimmer className="h-12 w-12 rounded-xl" />
      <div className="space-y-2">
        <Shimmer className="h-5 w-40" />
        <Shimmer className="h-3 w-28" />
      </div>
    </div>
    <Shimmer className="h-72 w-full rounded-xl" />
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="space-y-2">
          <Shimmer className="h-3 w-16" />
          <Shimmer className="h-5 w-24" />
        </Card>
      ))}
    </div>
  </div>
);

/** Dashboard: skeleton cards for each section. */
export const DashboardCardsSkeleton = ({ count = 3 }: { count?: number }) => (
  <div className="grid gap-4 md:grid-cols-3" aria-busy="true" aria-live="polite">
    {Array.from({ length: count }).map((_, i) => (
      <Card key={i} className="space-y-3">
        <Shimmer className="h-3 w-20" />
        <Shimmer className="h-6 w-2/3" />
        <Shimmer className="h-3 w-full" />
        <Shimmer className="h-3 w-4/5" />
      </Card>
    ))}
  </div>
);

/** Generic stat/analysis panel skeleton. */
export const AnalysisSkeleton = () => (
  <Card className="space-y-3" aria-busy="true" aria-live="polite">
    <div className="flex items-center gap-3">
      <Shimmer className="h-10 w-10 rounded-lg" />
      <div className="flex-1 space-y-2">
        <Shimmer className="h-3.5 w-1/2" />
        <Shimmer className="h-3 w-1/3" />
      </div>
    </div>
    <Shimmer className="h-3 w-full" />
    <Shimmer className="h-3 w-11/12" />
    <Shimmer className="h-3 w-3/4" />
  </Card>
);

/** Price chart placeholder — axis ticks plus a soft plot area. */
export const ChartSkeleton = ({ height = 300 }: { height?: number }) => (
  <div className="w-full space-y-3" style={{ height }} aria-busy="true" aria-live="polite">
    <Shimmer className="h-[calc(100%-2rem)] w-full rounded-xl" />
    <div className="flex justify-between">
      {Array.from({ length: 6 }).map((_, i) => (
        <Shimmer key={i} className="h-2.5 w-10" />
      ))}
    </div>
  </div>
);

/** Trending stocks tiles on the dashboard. */
export const TrendingTilesSkeleton = ({ count = 4 }: { count?: number }) => (
  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-busy="true" aria-live="polite">
    {Array.from({ length: count }).map((_, i) => (
      <Card key={i} className="space-y-2 bg-accent/20">
        <div className="flex items-center justify-between">
          <Shimmer className="h-3.5 w-14" />
          <Shimmer className="h-3 w-6" />
        </div>
        <Shimmer className="h-2.5 w-20" />
        <Shimmer className="h-4 w-16" />
      </Card>
    ))}
  </div>
);

/** Compact news list (stock detail sidebar). */
export const NewsListSkeleton = ({ rows = 5 }: { rows?: number }) => (
  <div className="divide-y divide-border" aria-busy="true" aria-live="polite">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="space-y-2 py-3">
        <Shimmer className="h-3.5 w-full" />
        <Shimmer className="h-3.5 w-3/4" />
        <div className="flex gap-2 pt-0.5">
          <Shimmer className="h-3.5 w-16" />
          <Shimmer className="h-3.5 w-10" />
        </div>
      </div>
    ))}
  </div>
);

/** Embedded third-party widget (TradingView) placeholder. */
export const WidgetSkeleton = ({ height = 400 }: { height?: number }) => (
  <div className="w-full" style={{ height }} aria-busy="true" aria-live="polite">
    <Shimmer className="h-full w-full rounded-xl" />
  </div>
);
