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

// Lazy-load every authenticated/secondary route to keep the initial bundle small
const Dashboard = lazy(() => import("./pages/Dashboard"));
const AIChat = lazy(() => import("./pages/AIChat"));
const Quiz = lazy(() => import("./pages/Quiz"));
const Forum = lazy(() => import("./pages/Forum"));
const Watchlists = lazy(() => import("./pages/Watchlists"));
const StockDetail = lazy(() => import("./pages/StockDetail"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Pricing = lazy(() => import("./pages/Pricing"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const Unsubscribe = lazy(() => import("./pages/Unsubscribe"));
const UpgradeSuccess = lazy(() => import("./pages/UpgradeSuccess"));
const BillingConsents = lazy(() => import("./pages/BillingConsents"));
const DataCompliance = lazy(() => import("./pages/DataCompliance"));
const IPPolicy = lazy(() => import("./pages/IPPolicy"));

const queryClient = new QueryClient();

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
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/chat" element={<AIChat />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/forum" element={<Forum />} />
          <Route path="/watchlists" element={<Watchlists />} />
          <Route path="/stock/:ticker" element={<StockDetail />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/upgrade-success" element={<UpgradeSuccess />} />
          <Route path="/billing-consents" element={<BillingConsents />} />
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
          <Suspense fallback={<RouteFallback />}>
            <AuthPage onAuth={() => {}} />
          </Suspense>
        ) : (
          <LandingPage onGetStarted={handleGetStarted} />
        )}
      </LanguageProvider>
    );
  }

  if (passwordRecovery) {
    return (
      <Suspense fallback={<RouteFallback />}>
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
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
            <Route path="/data-compliance" element={<DataCompliance />} />
            <Route path="/ip-policy" element={<IPPolicy />} />
            <Route path="/unsubscribe" element={<Unsubscribe />} />
            <Route path="*" element={<AppRoutes />} />
          </Routes>
        </Suspense>
        <CookieConsent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
