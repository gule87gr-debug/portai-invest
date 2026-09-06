import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
  compact?: boolean;
}

/**
 * Designed empty state — a thin-outlined icon, one line of explanation and a
 * single primary action. Used everywhere instead of blank screens.
 */
export const EmptyState = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
  compact = false,
}: EmptyStateProps) => (
  <div
    className={cn(
      "flex flex-col items-center justify-center text-center animate-fade-in",
      compact ? "py-8" : "py-14",
      className
    )}
  >
    <div
      className={cn(
        "mb-4 flex items-center justify-center rounded-2xl border border-border bg-card",
        compact ? "h-11 w-11" : "h-14 w-14"
      )}
    >
      <Icon className={cn("text-muted-foreground", compact ? "h-5 w-5" : "h-6 w-6")} aria-hidden="true" />
    </div>
    <h2 className={cn("font-semibold text-foreground", compact ? "text-sm" : "text-base")}>{title}</h2>
    {description && (
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">{description}</p>
    )}
    {actionLabel && onAction && (
      <button
        onClick={onAction}
        className="press-scale mt-5 rounded-lg border border-border bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        {actionLabel}
      </button>
    )}
  </div>
);

export default EmptyState;
