import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";
import { bootReducedMotion } from "./hooks/use-reduced-motion";

// Apply persisted reduced-motion preference before first paint.
bootReducedMotion();

// Clear stale-chunk reload guard once the app boots successfully.
if (typeof window !== "undefined") {
  try { sessionStorage.removeItem("portai-chunk-reload"); } catch {}
}

// Retire the previous PWA/service-worker setup so published clients stop
// serving stale bundles after updates.
async function cleanupClientCaches() {
  if (typeof window === "undefined") return;

  if ("serviceWorker" in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
    } catch {
      // Ignore cleanup failures.
    }
  }

  if ("caches" in window) {
    try {
      const cacheKeys = await caches.keys();
      await Promise.all(cacheKeys.map((key) => caches.delete(key)));
    } catch {
      // Ignore cleanup failures.
    }
  }
}

void cleanupClientCaches();

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);
