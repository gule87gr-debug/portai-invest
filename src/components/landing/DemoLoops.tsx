import demoAnalysis from "@/assets/landing/demo-analysis.jpg";
import demoNews from "@/assets/landing/demo-news.jpg";
import demoChart from "@/assets/landing/demo-chart.jpg";

/**
 * Real product screenshots captured from the live app (not mockups).
 * Used under the live demo section on the landing page.
 */
export const DEMO_LOOPS: { label: string; src: string; alt: string }[] = [
  {
    label: "Real-time article analysis",
    src: demoAnalysis,
    alt: "PortAI article analysis card showing a 7/10 trust score, detected biases, strengths and misinformation risk for a CNBC article",
  },
  {
    label: "AI trust scores on live news",
    src: demoNews,
    alt: "PortAI news feed showing financial headlines with colour-coded AI trust scores from CNBC, AP News and Yahoo Finance",
  },
  {
    label: "Live charts & timeframe performance",
    src: demoChart,
    alt: "PortAI stock detail page for Apple with a one-month price chart, timeframe selector and live performance badge",
  },
];
