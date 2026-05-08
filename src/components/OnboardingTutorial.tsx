import { useState, useEffect, useCallback, useRef, useLayoutEffect, useMemo } from "react";
import { TrendingUp, ArrowRight, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";

type TutorialStep = {
  selector?: string;
  title: string;
  text: string;
  type: "modal" | "tooltip";
  buttonText?: string;
  requiresSidebar?: boolean;
};

type Rect = { top: number; left: number; width: number; height: number };

export const OnboardingTutorial = ({ onComplete }: { onComplete: () => void }) => {
  const [current, setCurrent] = useState(0);
  const [targetRect, setTargetRect] = useState<Rect | null>(null);
  const [tooltipPos, setTooltipPos] = useState<React.CSSProperties>({});
  const [animKey, setAnimKey] = useState(0);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const step = steps[current];
  const isNavStep = !!step.requiresSidebar;

  // Open/close sidebar via custom event
  useEffect(() => {
    if (step.type !== "tooltip") return;

    if (isNavStep) {
      window.dispatchEvent(new CustomEvent("tour-sidebar", { detail: { open: true } }));
    } else {
      window.dispatchEvent(new CustomEvent("tour-sidebar", { detail: { open: false } }));
    }
  }, [current, step.type, isNavStep]);

  // Close sidebar on unmount
  useEffect(() => {
    return () => {
      window.dispatchEvent(new CustomEvent("tour-sidebar", { detail: { open: false } }));
    };
  }, []);

  // Scroll target into view & measure
  const measureTarget = useCallback(() => {
    if (step.type !== "tooltip" || !step.selector) {
      setTargetRect(null);
      return;
    }
    const el = document.querySelector(step.selector) as HTMLElement | null;
    if (!el) {
      setTargetRect(null);
      return;
    }
    const r = el.getBoundingClientRect();
    setTargetRect({ top: r.top, left: r.left, width: r.width, height: r.height });
  }, [step]);

  // Scroll into view on step change, then measure
  useEffect(() => {
    if (step.type !== "tooltip" || !step.selector) return;

    // Small delay to let sidebar animation finish
    const delay = isNavStep ? 350 : 50;
    const timeout = setTimeout(() => {
      const el = document.querySelector(step.selector!) as HTMLElement | null;
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        // Measure after scroll settles
        setTimeout(measureTarget, 400);
      } else {
        measureTarget();
      }
    }, delay);

    return () => clearTimeout(timeout);
  }, [current, step, isNavStep, measureTarget]);

  // Re-measure on resize/scroll
  useEffect(() => {
    window.addEventListener("resize", measureTarget);
    window.addEventListener("scroll", measureTarget, true);
    return () => {
      window.removeEventListener("resize", measureTarget);
      window.removeEventListener("scroll", measureTarget, true);
    };
  }, [measureTarget]);

  // Position tooltip intelligently
  useLayoutEffect(() => {
    if (!targetRect || !tooltipRef.current) return;
    const tt = tooltipRef.current.getBoundingClientRect();
    const pad = 14;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const isMobile = vw < 640;

    let top: number;
    let left: number;

    if (isMobile) {
      // On mobile: place tooltip at bottom of screen as a card
      top = vh - tt.height - 16;
      left = 8;
    } else if (isNavStep) {
      // Nav items: place to the right of the sidebar element
      top = targetRect.top + targetRect.height / 2 - tt.height / 2;
      left = targetRect.left + targetRect.width + pad;

      // Clamp vertically
      if (top < 12) top = 12;
      if (top + tt.height > vh - 12) top = vh - 12 - tt.height;

      // If overflows right, put below instead
      if (left + tt.width > vw - 12) {
        left = targetRect.left;
        top = targetRect.top + targetRect.height + pad;
      }
    } else {
      // Content elements: prefer below, fallback above
      top = targetRect.top + targetRect.height + pad;
      left = targetRect.left + targetRect.width / 2 - tt.width / 2;

      if (top + tt.height > vh - 20) {
        top = targetRect.top - tt.height - pad;
      }
      if (top < 12) top = 12;
    }

    // Clamp horizontally
    if (left < 8) left = 8;
    if (left + tt.width > vw - 8) left = vw - 8 - tt.width;

    setTooltipPos({ position: "fixed", top, left, zIndex: 10002 });
  }, [targetRect, current, isNavStep]);

  const finish = async () => {
    window.dispatchEvent(new CustomEvent("tour-sidebar", { detail: { open: false } }));
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
      setAnimKey((k) => k + 1);
      setCurrent((c) => c + 1);
    }
  };

  const skip = () => finish();

  const totalTooltipSteps = steps.filter((s) => s.type === "tooltip").length;
  const currentTooltipIndex = steps.slice(0, current + 1).filter((s) => s.type === "tooltip").length;

  // Modal steps (first & last)
  if (step.type === "modal") {
    return (
      <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in px-4">
        <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 sm:p-8 text-center shadow-2xl animate-scale-in">
          <div className="mx-auto mb-5 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-primary">
            <TrendingUp className="h-6 w-6 sm:h-7 sm:w-7 text-primary-foreground" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">{step.title}</h2>
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

  // Tooltip width based on viewport
  const tooltipWidth = typeof window !== "undefined" && window.innerWidth < 640 ? "calc(100vw - 16px)" : "320px";

  return (
    <>
      <div className="fixed inset-0 z-[10000]" onClick={(e) => e.stopPropagation()}>
        {/* Overlay with cutout */}
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
            className="absolute rounded-xl border-2 border-primary pointer-events-none transition-all duration-300"
            style={{
              top: targetRect.top - 6,
              left: targetRect.left - 6,
              width: targetRect.width + 12,
              height: targetRect.height + 12,
              zIndex: 10001,
              boxShadow: "0 0 20px 4px hsl(var(--primary) / 0.4), 0 0 40px 8px hsl(var(--primary) / 0.15)",
            }}
          />
        )}

        {/* Tooltip */}
        <div
          key={animKey}
          ref={tooltipRef}
          className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-2xl animate-fade-in"
          style={{ ...tooltipPos, width: tooltipWidth, maxWidth: "calc(100vw - 16px)" }}
        >
          {/* Progress */}
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
              Step {currentTooltipIndex} of {totalTooltipSteps}
            </span>
            <button onClick={skip} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Skip Tour
            </button>
          </div>
          {/* Progress bar */}
          <div className="h-1 w-full rounded-full bg-muted mb-3 sm:mb-4">
            <div
              className="h-1 rounded-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${(currentTooltipIndex / totalTooltipSteps) * 100}%` }}
            />
          </div>
          <h3 className="text-sm sm:text-base font-semibold text-foreground mb-1">{step.title}</h3>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-3 sm:mb-4">{step.text}</p>
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
