import { useEffect, useRef, useState } from "react";
import { WifiOff, RefreshCw, CheckCircle2 } from "lucide-react";
import { useOnline } from "@/hooks/use-online";
import { onQueueChange, queuedActionCount } from "@/lib/offlineQueue";

export const OfflineIndicator = () => {
  const online = useOnline();
  const [pending, setPending] = useState(() => queuedActionCount());
  const [justBack, setJustBack] = useState(false);
  const wasOffline = useRef(!online);

  useEffect(() => onQueueChange(setPending), []);

  useEffect(() => {
    if (!online) {
      wasOffline.current = true;
      setJustBack(false);
      return;
    }
    if (wasOffline.current) {
      wasOffline.current = false;
      setJustBack(true);
      const id = window.setTimeout(() => setJustBack(false), 4000);
      return () => window.clearTimeout(id);
    }
  }, [online]);

  if (online && !justBack) return null;

  const base =
    "fixed top-3 left-1/2 -translate-x-1/2 z-[100] pop-in flex items-center gap-2 rounded-full border bg-card/95 backdrop-blur px-4 py-2 text-xs font-medium shadow-lg";

  if (!online) {
    return (
      <div role="status" aria-live="polite" className={`${base} border-border text-foreground`}>
        <WifiOff className="h-3.5 w-3.5" aria-hidden="true" />
        <span>
          You're offline — showing cached data
          {pending > 0 ? ` · ${pending} change${pending === 1 ? "" : "s"} will sync later` : ""}
        </span>
      </div>
    );
  }

  return (
    <div role="status" aria-live="polite" className={`${base} border-border text-foreground`}>
      {pending > 0 ? (
        <>
          <RefreshCw className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          <span>Back online — syncing your changes…</span>
        </>
      ) : (
        <>
          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Back online — everything is up to date</span>
        </>
      )}
    </div>
  );
};
