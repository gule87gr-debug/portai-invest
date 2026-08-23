import { AppSidebar } from "./AppSidebar";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { TrialEndingBanner } from "./TrialEndingBanner";
import { TrialEndedModal } from "./TrialEndedModal";
import { FirstVisitPaywall } from "./FirstVisitPaywall";
import { TickerSearch } from "./TickerSearch";
import { FloatingSentryChat } from "./FloatingSentryChat";


export const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const { t } = useLanguage();
  return (
    <div className="flex min-h-screen bg-background overflow-x-hidden max-w-[100vw] noise-overlay">
      <AppSidebar />
      <div className="flex-1 min-w-0 overflow-x-hidden overflow-y-auto w-full flex flex-col">
        <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-none">
          <div className="mx-auto max-w-6xl lg:max-w-[1400px] xl:max-w-[1600px] 2xl:max-w-[1800px] px-3 sm:px-6 lg:px-10 xl:px-14 pb-6 pt-28 lg:pt-20 overflow-x-hidden">
            <TickerSearch className="mb-4 sm:max-w-md" />
            <TrialEndingBanner />
            {children}
          </div>
        </main>
        <FirstVisitPaywall />
        <TrialEndedModal />
        <footer className="border-t border-border px-4 py-4 mt-auto">
          <div className="mx-auto max-w-6xl flex flex-col items-center gap-2">
            <p className="text-[11px] text-muted-foreground text-center max-w-lg leading-relaxed">
              {t("footerDisclaimer")}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
              <Link to="/privacy-policy" className="text-[11px] text-muted-foreground hover:text-foreground transition-colors">{t("privacy")}</Link>
              <Link to="/terms-of-service" className="text-[11px] text-muted-foreground hover:text-foreground transition-colors">{t("terms")}</Link>
              <Link to="/data-compliance" className="text-[11px] text-muted-foreground hover:text-foreground transition-colors">{t("compliance")}</Link>
              <Link to="/ip-policy" className="text-[11px] text-muted-foreground hover:text-foreground transition-colors">{t("ipPolicy")}</Link>
              <Link to="/accessibility" className="text-[11px] text-muted-foreground hover:text-foreground transition-colors">{t("accessibility")}</Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};
