import { useEffect, useState } from "react";
import { AlertTriangle, ArrowRight, Check, Cpu, Link2, Loader2, Play, RotateCcw } from "lucide-react";

const SAMPLE_HEADLINE = "CNBC headline: Nvidia to $250?";

const REASONS = [
  "Uses speculative language (\u201Ccould\u201D, \u201Cto $250?\u201D) without a stated time horizon",
  "Omits recent insider selling disclosed in Form 4 filings",
  "Relies on a single analyst target instead of consensus",
];

type Stage = "idle" | "running" | "done";

const LiveAnalysisDemo = ({ onGetStarted }: { onGetStarted: () => void }) => {
  const [stage, setStage] = useState<Stage>("idle");
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (stage !== "running") return;
    setStep(0);
    const timers = [
      setTimeout(() => setStep(1), 500),
      setTimeout(() => setStep(2), 1100),
      setTimeout(() => {
        setStep(3);
        setStage("done");
      }, 1700),
    ];
    return () => timers.forEach(clearTimeout);
  }, [stage]);

  const steps = [
    { icon: Link2, label: "Fetching article" },
    { icon: Cpu, label: "Scanning language & framing" },
    { icon: AlertTriangle, label: "Cross-checking sources" },
  ];

  return (
    <section
      id="live-demo"
      aria-labelledby="live-demo-heading"
      className="px-4 sm:px-6 py-16 max-w-5xl mx-auto border-t border-border"
    >
      <p className="text-center text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground mb-2">
        Live demo
      </p>
      <h2
        id="live-demo-heading"
        className="text-center editorial-heading text-3xl sm:text-4xl text-foreground mb-3"
      >
        See a headline get taken apart
      </h2>
      <p className="text-center text-sm text-muted-foreground max-w-xl mx-auto mb-10">
        Paste any article. Get a bias score and the exact reasons behind it in seconds.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
        {/* Input */}
        <div className="rounded-2xl border border-border bg-card p-5 flex flex-col">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground mb-3">Input</p>
          <div className="rounded-xl border border-border bg-background p-4 font-mono text-sm text-foreground">
            {SAMPLE_HEADLINE}
          </div>

          <div className="mt-4 space-y-2">
            {steps.map((s, i) => {
              const active = stage !== "idle" && step === i;
              const done = stage !== "idle" && step > i;
              return (
                <div
                  key={s.label}
                  className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 text-xs transition-colors ${
                    done
                      ? "border-border bg-muted/40 text-foreground"
                      : active
                        ? "border-foreground/30 bg-muted/20 text-foreground"
                        : "border-border/60 text-muted-foreground"
                  }`}
                >
                  {done ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : active ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <s.icon className="h-3.5 w-3.5" />
                  )}
                  {s.label}
                </div>
              );
            })}
          </div>

          <button
            onClick={() => setStage(stage === "running" ? "running" : "running")}
            disabled={stage === "running"}
            className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            {stage === "done" ? (
              <>
                <RotateCcw className="h-4 w-4" /> Run again
              </>
            ) : (
              <>
                <Play className="h-4 w-4" /> Run analysis
              </>
            )}
          </button>
        </div>

        {/* Output */}
        <div className="rounded-2xl border border-border bg-card p-5 flex flex-col">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground mb-3">
            AI analysis
          </p>

          {stage !== "done" ? (
            <div className="flex-1 rounded-xl border border-dashed border-border flex items-center justify-center p-8 text-center text-xs text-muted-foreground">
              {stage === "running" ? "Analyzing\u2026" : "Run the analysis to see the output card."}
            </div>
          ) : (
            <div className="flex-1 rounded-xl border border-border bg-background p-5 animate-fade-in">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                    Bias score
                  </p>
                  <p className="font-mono text-4xl font-bold text-warning leading-none mt-1">
                    7<span className="text-lg text-muted-foreground">/10</span>
                  </p>
                </div>
                <span className="rounded-full border border-warning/40 bg-warning/10 px-3 py-1 text-[11px] font-bold text-warning">
                  High promotional tone
                </span>
              </div>

              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden mb-5">
                <div className="h-full w-[70%] rounded-full bg-warning" />
              </div>

              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground mb-2">
                Why we&apos;re saying this
              </p>
              <ul className="space-y-2">
                {REASONS.map((r) => (
                  <li key={r} className="flex gap-2 text-sm text-foreground/85 leading-snug">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-warning" />
                    {r}
                  </li>
                ))}
              </ul>

              <button
                onClick={onGetStarted}
                className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-foreground hover:opacity-80 transition-opacity"
              >
                Analyze your own article <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Real product screenshots */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {DEMO_LOOPS.map(({ label, src, alt }) => (
          <figure key={label} className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="aspect-video overflow-hidden bg-background">
              <img
                src={src}
                alt={alt}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover object-left-top"
              />
            </div>
            <figcaption className="px-4 py-3 text-xs text-muted-foreground border-t border-border">
              {label}
            </figcaption>
          </figure>
        ))}
      </div>

    </section>
  );
};

export default LiveAnalysisDemo;
