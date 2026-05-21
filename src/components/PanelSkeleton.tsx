import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface PanelSkeletonProps {
  className?: string;
  lines?: number;
  title?: boolean;
}

/**
 * Reserved-space skeleton for premium / AI panels (portfolio analyser,
 * what-if simulator, voice mode, forum summaries). Renders inside the
 * same bento-card geometry as the live panel so there is no layout
 * shift when async content swaps in.
 */
export const PanelSkeleton = ({ className, lines = 4, title = true }: PanelSkeletonProps) => (
  <div className={cn("bento-card spring-in space-y-4", className)} aria-busy="true" aria-live="polite">
    {title && (
      <div className="space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-6 w-2/3" />
      </div>
    )}
    <div className="space-y-2.5">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={cn("h-3", i === lines - 1 ? "w-1/2" : "w-full")} />
      ))}
    </div>
  </div>
);

export default PanelSkeleton;
