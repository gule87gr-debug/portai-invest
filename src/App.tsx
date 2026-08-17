import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider, useApp } from "@/contexts/AppContext";
import { LanguageProvider, Language } from "@/contexts/LanguageContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { OnboardingTutorial } from "@/components/OnboardingTutorial";
import { lazy, Suspense, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import LandingPage from "./pages/LandingPage";
import { CookieConsent } from "./components/CookieConsent";
import { RouteSkeleton } from "./components/RouteSkeleton";
import { OfflineIndicator } from "./components/OfflineIndicator";
import { SkipToContent } from "./components/SkipToContent";

// Wrap dynamic imports so that a stale chunk (after a redeploy) triggers a
// one-time hard reload instead of leaving the user on a blank screen.
const RELOAD_KEY = "portai-chunk-reload";
function lazyWithRetry<T extends { default: React.ComponentType<any> }>(
  factory: () => Promise<T>
) {
  return lazy(async () => {
    try {
      return await factory();
    } catch (err: any) {
      const msg = String(err?.message || err);
      const isChunkErr =
        msg.includes("Importing a module script failed") ||
        msg.includes("Failed to fetch dynamically imported module") ||
        msg.includes("error loading dynamically imported module") ||
        err?.name === "ChunkLoadError";
      if (isChunkErr && typeof window !== "undefined") {
        const already = sessionStorage.getItem(RELOAD_KEY);
        if (!already) {
          sessionStorage.setItem(RELOAD_KEY, "1");
          window.location.reload();
          // Return a never-resolving promise while reload happens.
          return new Promise<T>(() => {});
        }
      }
      throw err;
    }
  });
}

// Lazy-load every authenticated/secondary route to keep the initial bundle small
const Dashboard = lazyWithRetry(() => import("./pages/Dashboard"));
const NewsPage = lazyWithRetry(() => import("./pages/NewsPage"));
const AIChat = lazyWithRetry(() => import("./pages/AIChat"));
const Quiz = lazyWithRetry(() => import("./pages/Quiz"));

const Watchlists = lazyWithRetry(() => import("./pages/Watchlists"));
const AlertsPage = lazyWithRetry(() => import("./pages/AlertsPage"));
const StockDetail = lazyWithRetry(() => import("./pages/StockDetail"));
const SettingsPage = lazyWithRetry(() => import("./pages/SettingsPage"));
const AuthPage = lazyWithRetry(() => import("./pages/AuthPage"));
const ResetPassword = lazyWithRetry(() => import("./pages/ResetPassword"));
const NotFound = lazyWithRetry(() => import("./pages/NotFound"));
const Pricing = lazyWithRetry(() => import("./pages/Pricing"));
const PrivacyPolicy = lazyWithRetry(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazyWithRetry(() => import("./pages/TermsOfService"));
const Unsubscribe = lazyWithRetry(() => import("./pages/Unsubscribe"));
const UpgradeSuccess = lazyWithRetry(() => import("./pages/UpgradeSuccess"));
const BillingConsents = lazyWithRetry(() => import("./pages/BillingConsents"));
const DataCompliance = lazyWithRetry(() => import("./pages/DataCompliance"));
const IPPolicy = lazyWithRetry(() => import("./pages/IPPolicy"));
const AdminPage = lazyWithRetry(() => import("./pages/Admin"));
const SeekingAlphaVsMotleyFool = lazyWithRetry(() => import("./pages/SeekingAlphaVsMotleyFool"));
const BestStockAdvisorServices = lazyWithRetry(() => import("./pages/BestStockAdvisorServices"));
const DetectPumpAndDump = lazyWithRetry(() => import("./pages/DetectPumpAndDump"));
const OAuthConsent = lazyWithRetry(() => import("./pages/OAuthConsent"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 min: avoid refetch on every mount
      gcTime: 30 * 60 * 1000, // 30 min: keep cached data warm
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      retry: 1,
    },
  },
});

const RouteFallback = () => (
  <div className="flex min-h-screen items-center justify-center bg-background">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
  </div>
);

const AppWithLanguage = () => {
  const { initialLanguage, showTutorial, setShowTutorial } = useApp();
  const navigate = useNavigate();

  return (
    <LanguageProvider initialLanguage={initialLanguage as Language}>
      {showTutorial && (
        <OnboardingTutorial onComplete={() => {
          setShowTutorial(false);
          navigate("/dashboard");
        }} />
      )}
      <Suspense fallback={<RouteSkeleton />}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/news" element={<NewsPage />} />
          <Route path="/chat" element={<AIChat />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/forum" element={<Navigate to="/dashboard" replace />} />
          <Route path="/watchlists" element={<Watchlists />} />
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="/stock/:ticker" element={<StockDetail />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/upgrade-success" element={<UpgradeSuccess />} />
          <Route path="/billing-consents" element={<BillingConsents />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </LanguageProvider>
  );
};

const AppRoutes = () => {
  const [session, setSession] = useState<any>(undefined);
  const [passwordRecovery, setPasswordRecovery] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<"signup" | "login">("signup");

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setPasswordRecovery(true);
        setSession(session);
        return;
      }
      setSession(session);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleGetStarted = () => {
    localStorage.setItem("portai-has-visited", "true");
    setAuthMode("signup");
    setShowAuth(true);
  };

  const handleLogIn = () => {
    localStorage.setItem("portai-has-visited", "true");
    setAuthMode("login");
    setShowAuth(true);
  };

  const handlePasswordResetComplete = () => {
    setPasswordRecovery(false);
  };

  if (session === undefined) {
    return <RouteFallback />;
  }

  if (!session) {
    return (
      <LanguageProvider initialLanguage="en">
        {showAuth ? (
          <Suspense fallback={<RouteSkeleton />}>
            <AuthPage onAuth={() => {}} initialMode={authMode} />
          </Suspense>
        ) : (
          <LandingPage onGetStarted={handleGetStarted} onLogIn={handleLogIn} />
        )}
      </LanguageProvider>
    );
  }

  if (passwordRecovery) {
    return (
      <Suspense fallback={<RouteSkeleton />}>
        <ResetPassword onComplete={handlePasswordResetComplete} />
      </Suspense>
    );
  }

  return (
    <AppProvider>
      <NotificationProvider>
        <AppWithLanguage />
      </NotificationProvider>
    </AppProvider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <LanguageProvider initialLanguage="en">
          <SkipToContent />
          <OfflineIndicator />
          <Suspense fallback={<RouteSkeleton />}>
            <Routes>
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-of-service" element={<TermsOfService />} />
              <Route path="/data-compliance" element={<DataCompliance />} />
              <Route path="/ip-policy" element={<IPPolicy />} />
              <Route path="/unsubscribe" element={<Unsubscribe />} />
              <Route path="/compare/seeking-alpha-vs-motley-fool" element={<SeekingAlphaVsMotleyFool />} />
              <Route path="/compare/best-stock-advisor-services" element={<BestStockAdvisorServices />} />
              <Route path="/blog/how-to-detect-pump-and-dump-schemes" element={<DetectPumpAndDump />} />
              <Route path="/.lovable/oauth/consent" element={<OAuthConsent />} />
              <Route path="*" element={<AppRoutes />} />
            </Routes>
          </Suspense>
          <CookieConsent />
        </LanguageProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
