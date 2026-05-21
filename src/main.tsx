import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";
import { bootReducedMotion } from "./hooks/use-reduced-motion";

// Apply persisted reduced-motion preference before first paint.
bootReducedMotion();

// Service worker registration — strictly guarded so it never runs inside
// the Lovable editor preview (iframe) or on preview hosts where it would
// cause stale-content issues.
function shouldRegisterSW(): boolean {
  if (typeof window === "undefined") return false;
  if (!("serviceWorker" in navigator)) return false;
  if (!import.meta.env.PROD) return false;
  let inIframe = true;
  try { inIframe = window.self !== window.top; } catch { inIframe = true; }
  if (inIframe) return false;
  const host = window.location.hostname;
  const isPreviewHost =
    host.includes("id-preview--") ||
    host.includes("preview--") ||
    host.endsWith("lovableproject.com") ||
    host.endsWith("lovableproject-dev.com");
  return !isPreviewHost;
}

if (shouldRegisterSW()) {
  import("virtual:pwa-register")
    .then(({ registerSW }) => registerSW({ immediate: true }))
    .catch(() => { /* PWA disabled in this build */ });
} else if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
  // Defensive cleanup: unregister any previously-installed worker when running in preview/iframe.
  navigator.serviceWorker.getRegistrations().then((rs) => rs.forEach((r) => r.unregister())).catch(() => {});
}

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);
