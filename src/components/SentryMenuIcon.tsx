import sentryMark from "@/assets/sentry-mark.png";

/**
 * Sentry logo rendered as a currentColor mask so it blends with the
 * Lucide icons in the sidebar (same size, same coloring).
 */
export const SentryMenuIcon = ({
  className,
  size = 18,
}: {
  className?: string;
  size?: number;
}) => (
  <span
    role="img"
    aria-hidden="true"
    className={className}
    style={{
      display: "inline-block",
      flexShrink: 0,
      width: size,
      height: size,
      backgroundColor: "currentColor",
      WebkitMaskImage: `url("${sentryMark}")`,
      maskImage: `url("${sentryMark}")`,
      WebkitMaskRepeat: "no-repeat",
      maskRepeat: "no-repeat",
      WebkitMaskPosition: "center",
      maskPosition: "center",
      WebkitMaskSize: "contain",
      maskSize: "contain",
    }}
  />
);
