import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { ArrowRight, Home } from "lucide-react";
import { SEO } from "@/components/SEO";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <>
      <SEO
        title="Page Not Found (404) — PortAI"
        description="This PortAI page doesn't exist. Head back to your dashboard to track stocks, ETFs and crypto with AI-powered news bias analysis."
        path="/404"
      />
      <div className="flex min-h-screen flex-col bg-background noise-overlay">
        <header className="px-6 py-5">
          <Link to="/dashboard" className="inline-flex items-center gap-2.5">
            <img src="/logo.png" alt="PortAI logo" width={36} height={36} className="h-9 w-9 rounded-lg" />
            <span className="text-lg font-bold text-foreground">PortAI</span>
          </Link>
        </header>

        <main id="main-content" className="flex flex-1 items-center justify-center px-6 py-16">
          <div className="max-w-md text-center">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.3em] text-primary">Error 404</p>
            <h1 className="mt-4 editorial-heading text-4xl sm:text-5xl text-foreground">
              This page went off the tape.
            </h1>
            <p className="mt-4 text-sm sm:text-base leading-relaxed text-muted-foreground">
              The page you requested doesn't exist or has moved. Your watchlists, alerts and bias
              analysis are still waiting on the dashboard.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/dashboard"
                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <Home className="h-4 w-4" aria-hidden="true" /> Back to dashboard
              </Link>
              <Link
                to="/news"
                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
              >
                Browse news <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </main>

        <footer className="border-t border-border px-6 py-6">
          <nav aria-label="Footer" className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-x-4 gap-y-2">
            <Link to="/dashboard" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Dashboard</Link>
            <Link to="/watchlists" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Watchlists</Link>
            <Link to="/pricing" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
            <Link to="/privacy-policy" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link to="/terms-of-service" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Terms of Service</Link>
            <Link to="/accessibility" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Accessibility</Link>
          </nav>
        </footer>
      </div>
    </>
  );
};

export default NotFound;
