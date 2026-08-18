import sentryMark from "@/assets/sentry-mark.png.asset.json";

/**
 * Sentry logo rendered as a currentColor mask so it blends with the
 * Lucide icons in the sidebar (same size, same coloring).
 */
export const SentryMenuIcon = ({ className }: { className?: string }) => (
  <span
    role="img"
    aria-hidden="true"
    className={className}
    style={{
      display: "inline-block",
      backgroundColor: "currentColor",
      WebkitMaskImage: `url(${sentryMark.url})`,
      maskImage: `url(${sentryMark.url})`,
      WebkitMaskRepeat: "no-repeat",
      maskRepeat: "no-repeat",
      WebkitMaskPosition: "center",
      maskPosition: "center",
      WebkitMaskSize: "contain",
      maskSize: "contain",
    }}
  />
);
