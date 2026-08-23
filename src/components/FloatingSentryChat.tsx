import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { X, ArrowRight } from "lucide-react";
import { SentryMenuIcon } from "./SentryMenuIcon";

/**
 * Floating "Sentry" assistant launcher.
 * Sharp geometric dark-mode styling matching the PortAI aesthetic.
 */
export const FloatingSentryChat = () => {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  // Don't stack the launcher on top of the full chat page.
  if (pathname.startsWith("/chat")) return null;

  return (
    <div className="fixed bottom-5 right-4 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="w-[17rem] rounded-none border border-border bg-card/95 backdrop-blur-md p-4 shadow-2xl animate-fade-in">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center border border-border text-foreground">
                <SentryMenuIcon size={14} />
              </span>
              <div className="leading-tight">
                <p className="text-sm font-bold text-foreground">Sentry</p>
                <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  PortAI Assistant
                </p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close Sentry assistant"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            Ask Sentry about a ticker, a headline's bias, or how to build a watchlist.
          </p>
          <Link
            to="/chat"
            onClick={() => setOpen(false)}
            className="mt-3 flex items-center justify-center gap-2 border border-primary bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Chat with Sentry <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Hide Sentry assistant" : "Open Sentry, the PortAI AI assistant"}
        aria-expanded={open}
        className="flex items-center gap-2 border border-border bg-card px-3.5 py-2.5 text-foreground shadow-xl transition-colors hover:border-primary/40 hover:bg-accent active:scale-[0.97]"
      >
        <SentryMenuIcon size={18} />
        <span className="text-xs font-bold uppercase tracking-[0.16em]">Sentry</span>
      </button>
    </div>
  );
};
