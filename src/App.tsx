import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider, useApp } from "@/contexts/AppContext";
import { LanguageProvider, Language } from "@/contexts/LanguageContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Dashboard from "./pages/Dashboard";
import HomePage from "./pages/HomePage";
import AIChat from "./pages/AIChat";
import Quiz from "./pages/Quiz";
import Forum from "./pages/Forum";
import Watchlists from "./pages/Watchlists";
import StockDetail from "./pages/StockDetail";
import SettingsPage from "./pages/SettingsPage";
import AuthPage from "./pages/AuthPage";
import LandingPage from "./pages/LandingPage";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import { CookieConsent } from "./components/CookieConsent";

const queryClient = new QueryClient();

const AppWithLanguage = () => {
  const { initialLanguage } = useApp();

  return (
    <LanguageProvider initialLanguage={initialLanguage as Language}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/chat" element={<AIChat />} />
        <Route path="/quiz" element={<Quiz />} />
        <Route path="/forum" element={<Forum />} />
        <Route path="/watchlists" element={<Watchlists />} />
        <Route path="/stock/:ticker" element={<StockDetail />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
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
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!session) {
    if (showAuth) {
      return <AuthPage onAuth={() => {}} />;
    }
    return <LandingPage onGetStarted={handleGetStarted} />;
  }

  // If user arrived via password recovery, force them to set a new password
  if (passwordRecovery) {
    return <ResetPassword onComplete={handlePasswordResetComplete} />;
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
        <AppRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
