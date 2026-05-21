import { WifiOff } from "lucide-react";
import { useOnline } from "@/hooks/use-online";

export const OfflineIndicator = () => {
  const online = useOnline();
  if (online) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-3 left-1/2 -translate-x-1/2 z-[100] pop-in flex items-center gap-2 rounded-full border border-warning/40 bg-card/95 backdrop-blur px-4 py-2 text-xs font-medium text-warning shadow-lg"
    >
      <WifiOff className="h-3.5 w-3.5" aria-hidden="true" />
      <span>You're offline — showing cached data</span>
    </div>
  );
};
