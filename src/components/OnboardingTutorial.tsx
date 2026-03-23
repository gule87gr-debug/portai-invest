import { useState, useEffect, useCallback, useRef } from "react";
import { TrendingUp, X, ArrowRight, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

type TutorialStep = {
  selector?: string;
  title: string;
  text: string;
  type: "modal" | "tooltip";
  buttonText?: string;
};

const steps: TutorialStep[] = [
  {
    type: "modal",
    title: "Welcome to PortAI 👋",
    text: "You're about to invest smarter. Let us show you around in 60 seconds.",
    buttonText: "Start Tour",
  },
  {
    type: "tooltip",
    selector: "[data-tour='news-feed']",
    title: "Your Market Intelligence Hub",
    text: "Get live financial news filtered by sector. Paste any article URL below to get an AI trust score, bias detection and smart summary instantly.",
  },
  {
    type: "tooltip",
    selector: "[data-tour='analyze-link']",
    title: "Detect Bias in Financial News",
    text: "Paste any financial article URL here and our AI will tell you how trustworthy it is, summarize it and flag any bias or hidden agenda.",
  },
  {
    type: "tooltip",
    selector: "[data-tour='nav-chat']",
    title: "Your Personal AI Advisor",
    text: "Ask anything about stocks, ETFs, portfolio strategy or market trends. Available 24/7, completely free.",
  },
  {
    type: "tooltip",
    selector: "[data-tour='nav-watchlists']",
    title: "Track Your Stocks",
    text: "Build custom watchlists to track 550+ stocks, ETFs and crypto with live prices and charts.",
  },
  {
    type: "tooltip",
    selector: "[data-tour='nav-quiz']",
    title: "Find Your Investor Profile",
    text: "Answer 5 quick questions and get a personalized investor profile with stock recommendations tailored to your goals.",
  },
  {
    type: "tooltip",
    selector: "[data-tour='nav-forum']",
    title: "Invest With a Community",
    text: "Discuss markets, share portfolio ideas and get AI fact-checking on every post so you always know what's real.",
  },
  {
    type: "modal",
    title: "You're all set! 🚀",
    text: "Start by analyzing a financial article or asking your AI advisor a question.",
    buttonText: "Go to Dashboard",
  },
];

type Rect = { top: number; left: number; width: number; height: number };

export const OnboardingTutorial = ({ onComplete }: { onComplete: () => void }) => {
  const [current, setCurrent] = useState(0);
  const [targetRect, setTargetRect] = useState<Rect | null>(null);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const tooltipRef = useRef<HTMLDivElement>(null);

  const step = steps[current];

  const measureTarget = useCallback(() => {
    if (step.type !== "tooltip" || !step.selector) {
      setTargetRect(null);
      return;
    }
    const el = document.querySelector(step.selector);
    if (!el) {
      setTargetRect(null);
      return;
    }
    const r = el.getBoundingClientRect();
    setTargetRect({ top: r.top, left: r.left, width: r.width, height: r.height });
  }, [step]);

  useEffect(() => {
    measureTarget();
    window.addEventListener("resize", measureTarget);
    window.addEventListener("scroll", measureTarget, true);
    return () => {
      window.removeEventListener("resize", measureTarget);
      window.removeEventListener("scroll", measureTarget, true);
    };
  }, [measureTarget]);

  // Position tooltip next to target
  useEffect(() => {
    if (!targetRect || !tooltipRef.current) return;
    const tt = tooltipRef.current.getBoundingClientRect();
    const pad = 12;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let top = targetRect.top + targetRect.height + pad;
    let left = targetRect.left + targetRect.width / 2 - tt.width / 2;

    // If below overflows, place above
    if (top + tt.height > vh - 20) {
      top = targetRect.top - tt.height - pad;
    }
    // Clamp horizontally
    if (left < 12) left = 12;
    if (left + tt.width > vw - 12) left = vw - 12 - tt.width;

    setTooltipStyle({ position: "fixed", top, left, zIndex: 10002 });
  }, [targetRect, current]);

  const finish = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("user_settings").update({ tutorial_completed: true } as any).eq("user_id", user.id);
    }
    onComplete();
  };

  const next = () => {
    if (current === steps.length - 1) {
      finish();
    } else {
      setCurrent((c) => c + 1);
    }
  };

  const skip = () => finish();

  // Modal steps (first & last)
  if (step.type === "modal") {
    return (
      <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in">
        <div className="relative mx-4 w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-2xl animate-scale-in">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
            <TrendingUp className="h-7 w-7 text-primary-foreground" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">{step.title}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-6">{step.text}</p>
          <button
            onClick={next}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.97]"
          >
            {step.buttonText} <ArrowRight className="h-4 w-4" />
          </button>
          {current === 0 && (
            <button onClick={skip} className="mt-3 block w-full text-xs text-muted-foreground hover:text-foreground transition-colors">
              Skip Tour
            </button>
          )}
        </div>
      </div>
    );
  }

  // Tooltip steps
  return (
    <>
      {/* Overlay with cutout */}
      <div className="fixed inset-0 z-[10000]" onClick={(e) => e.stopPropagation()}>
        <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: "none" }}>
          <defs>
            <mask id="tour-mask">
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              {targetRect && (
                <rect
                  x={targetRect.left - 6}
                  y={targetRect.top - 6}
                  width={targetRect.width + 12}
                  height={targetRect.height + 12}
                  rx="12"
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect
            x="0" y="0" width="100%" height="100%"
            fill="hsl(var(--background) / 0.75)"
            mask="url(#tour-mask)"
            style={{ pointerEvents: "all" }}
          />
        </svg>

        {/* Highlight glow */}
        {targetRect && (
          <div
            className="absolute rounded-xl border-2 border-primary shadow-[0_0_20px_4px_hsl(var(--primary)/0.4)] pointer-events-none"
            style={{
              top: targetRect.top - 6,
              left: targetRect.left - 6,
              width: targetRect.width + 12,
              height: targetRect.height + 12,
              zIndex: 10001,
            }}
          />
        )}

        {/* Tooltip */}
        <div
          ref={tooltipRef}
          className="w-[320px] rounded-xl border border-border bg-card p-5 shadow-2xl animate-fade-in"
          style={tooltipStyle}
        >
          {/* Progress */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
              Step {current} of {steps.length - 1}
            </span>
            <button onClick={skip} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Skip Tour
            </button>
          </div>
          {/* Progress bar */}
          <div className="h-1 w-full rounded-full bg-muted mb-4">
            <div
              className="h-1 rounded-full bg-primary transition-all duration-300"
              style={{ width: `${(current / (steps.length - 1)) * 100}%` }}
            />
          </div>
          <h3 className="text-base font-semibold text-foreground mb-1">{step.title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">{step.text}</p>
          <button
            onClick={next}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.97]"
          >
            {current === steps.length - 2 ? "Finish" : "Next"} <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </>
  );
};
