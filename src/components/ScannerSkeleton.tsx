import { cn } from "@/lib/utils";

interface ScannerSkeletonProps {
  lines?: number;
  className?: string;
}

/**
 * Scanning skeleton: stacked skeleton lines with a sweeping highlight bar.
 * Pure CSS, uses existing tokens — no color decisions made here.
 */
export const ScannerSkeleton = ({ lines = 5, className }: ScannerSkeletonProps) => {
  return (
    <div
      role="status"
      aria-label="Analyzing"
      className={cn("relative overflow-hidden rounded-2xl border border-border bg-card/60 p-5", className)}
    >
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => {
          const widths = ["w-11/12", "w-10/12", "w-9/12", "w-8/12", "w-11/12", "w-7/12"];
          return (
            <div
              key={i}
              className={cn(
                "h-3 rounded bg-muted/70 origin-left animate-[scanner-reveal_2.4s_ease-in-out_infinite]",
                widths[i % widths.length],
              )}
              style={{ animationDelay: `${i * 120}ms` }}
            />
          );
        })}
      </div>
      {/* Sweeping highlight bar */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-primary/15 to-transparent animate-[scanner-sweep_2.2s_ease-in-out_infinite]"
      />
    </div>
  );
};
