import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

/** "Market data and charts provided by TradingView" credit line. */
export const TradingViewAttribution = ({ className }: { className?: string }) => {
  let label = "Market data and charts provided by";
  try {
    const { t } = useLanguage();
    label = t("tvAttribution");
  } catch { /* outside provider */ }
  return (
    <p className={cn("text-xs text-muted-foreground", className)}>
      {label}{" "}
      <a href="https://www.tradingview.com/" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground">
        TradingView
      </a>
    </p>
  );
};
