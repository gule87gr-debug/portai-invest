import { useEffect, useRef, useState } from "react";
import { WidgetSkeleton } from "@/components/Skeletons";
import { useLanguage, type Language } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

/** App language → TradingView widget locale. */
const TV_LOCALE: Record<Language, string> = { en: "en", es: "es", fr: "fr", pt: "br", de: "de_DE", it: "it" };

export function useTradingViewLocale(): string {
  try {
    return TV_LOCALE[useLanguage().language] ?? "en";
  } catch {
    return "en";
  }
}

/** Page background from the design tokens, so opaque widgets blend in. */
export function themeBackground(): string {
  if (typeof window === "undefined") return "rgba(0, 0, 0, 0)";
  const v = getComputedStyle(document.documentElement).getPropertyValue("--background").trim();
  return v ? `hsl(${v.split(/\s+/).join(", ")})` : "rgba(0, 0, 0, 0)";
}

interface EmbedProps {
  /** Widget script name, e.g. "advanced-chart" → embed-widget-advanced-chart.js */
  widget: string;
  config: Record<string, unknown>;
  height: number;
  className?: string;
}

/**
 * Official TradingView embed (https://www.tradingview.com/widget-docs/).
 * Reproduces the vendor markup as-is — container, widget div, TradingView
 * attribution link and the config script — and never touches the iframe.
 * The script is only injected once the widget scrolls near the viewport,
 * and the whole container (script + iframe) is removed on unmount.
 */
export function TradingViewEmbed({ widget, config, height, className }: EmbedProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [ready, setReady] = useState(false);
  const configKey = JSON.stringify(config);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || visible) return;
    if (typeof IntersectionObserver === "undefined") { setVisible(true); return; }
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { setVisible(true); io.disconnect(); }
    }, { rootMargin: "200px" });
    io.observe(host);
    return () => io.disconnect();
  }, [visible]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !visible) return;
    setReady(false);

    const container = document.createElement("div");
    container.className = "tradingview-widget-container";
    container.style.height = "100%";
    container.style.width = "100%";

    const widgetDiv = document.createElement("div");
    widgetDiv.className = "tradingview-widget-container__widget";
    widgetDiv.style.height = "calc(100% - 32px)";
    widgetDiv.style.width = "100%";

    const copyright = document.createElement("div");
    copyright.className = "tradingview-widget-copyright";
    copyright.innerHTML =
      '<a href="https://www.tradingview.com/" rel="noopener nofollow" target="_blank"><span class="blue-text">Track all markets on TradingView</span></a>';

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = `https://s3.tradingview.com/external-embedding/embed-widget-${widget}.js`;
    script.async = true;
    script.innerHTML = configKey;

    container.append(widgetDiv, copyright, script);
    host.appendChild(container);

    const observer = new MutationObserver(() => {
      if (host.querySelector("iframe")) { setReady(true); observer.disconnect(); }
    });
    observer.observe(host, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      container.remove();
    };
  }, [widget, configKey, visible]);

  return (
    <div className={cn("relative w-full", className)} style={{ height }}>
      {!ready && (
        <div className="absolute inset-0 pointer-events-none">
          <WidgetSkeleton height={height} />
        </div>
      )}
      <div ref={hostRef} className={cn("h-full w-full transition-opacity", ready ? "opacity-100" : "opacity-0")} />
    </div>
  );
}
