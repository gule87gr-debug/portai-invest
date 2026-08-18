import { ChevronDown, Chrome, FileWarning, Gauge, Puzzle, ShieldCheck } from "lucide-react";
import { useState } from "react";

const SITES = ["CNBC", "Yahoo Finance", "Seeking Alpha", "MarketWatch"];

const MISSING_CONTEXT = [
  "Insider selling — 2 Form 4 filings in the last 30 days",
  "Recent SEC filing — 8-K published 3 days ago",
  "Analyst conflicts — issuer has banking relationship",
];

const ExtensionShowcase = () => {
  const [open, setOpen] = useState(true);

  return (
    <section
      id="extension"
      aria-labelledby="extension-heading"
      className="px-4 sm:px-6 py-16 max-w-5xl mx-auto border-t border-border"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            <Puzzle className="h-3 w-3" /> Coming soon
          </span>
          <h2
            id="extension-heading"
            className="editorial-heading text-3xl sm:text-4xl text-foreground mt-4 mb-3"
          >
            The bias shield, right where you read
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-6">
            A browser extension that scores every article as it loads — no copy-pasting, no tab switching.
          </p>

          <div className="flex flex-wrap gap-2 mb-6">
            {SITES.map((s) => (
              <span
                key={s}
                className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground/80"
              >
                {s}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Chrome className="h-4 w-4" /> Chrome, Edge & Brave at launch
          </div>
        </div>

        {/* Mockup */}
        <div className="rounded-2xl border border-border bg-card p-3 shadow-2xl">
          <div className="flex items-center gap-1.5 px-2 py-2">
            <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
            <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
            <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
            <div className="ml-2 flex-1 truncate rounded-md bg-background px-3 py-1 font-mono text-[10px] text-muted-foreground">
              cnbc.com/markets/nvidia-price-target
            </div>
          </div>

          <div className="rounded-xl border border-border bg-background p-4">
            <div className="flex items-center gap-2 pb-3 border-b border-border">
              <img src="/logo.png" alt="PortAI extension" className="h-5 w-5" />
              <span className="text-xs font-bold text-foreground">PortAI</span>
              <span className="ml-auto text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                live
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 py-4">
              <div className="rounded-lg border border-border p-3">
                <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  <ShieldCheck className="h-3 w-3" /> Trust score
                </p>
                <p className="mt-1 font-mono text-2xl font-bold text-gain">8.7</p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  <Gauge className="h-3 w-3" /> Bias
                </p>
                <p className="mt-1 text-2xl font-bold text-warning">Moderate</p>
              </div>
            </div>

            <button
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              className="flex w-full items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-foreground hover:bg-accent transition-colors"
            >
              <FileWarning className="h-3.5 w-3.5 text-warning" />
              Missing context (3)
              <ChevronDown
                className={`ml-auto h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
              />
            </button>

            {open && (
              <ul className="mt-2 space-y-1.5 animate-fade-in">
                {MISSING_CONTEXT.map((m) => (
                  <li
                    key={m}
                    className="rounded-lg bg-muted/40 px-3 py-2 text-[11px] leading-snug text-muted-foreground"
                  >
                    {m}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ExtensionShowcase;
