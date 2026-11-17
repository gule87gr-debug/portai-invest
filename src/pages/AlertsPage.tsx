import { BellOff } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { SEO } from "@/components/SEO";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useLanguage } from "@/contexts/LanguageContext";

/** Price alerts are paused while PortAI moves to a new data provider; saved alerts are kept. */
const AlertsPage = () => {
  usePageTitle("Price Alerts | PortAI");
  const { t } = useLanguage();
  return (
    <AppLayout>
      <SEO title="Price Alerts — PortAI" description={t("alertsPausedNotice")} path="/alerts" />
      <div className="mx-auto max-w-2xl py-16">
        <div className="glass-card flex flex-col items-center gap-4 rounded-2xl p-8 text-center" role="status">
          <BellOff className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
          <p className="text-lg text-foreground">{t("alertsPausedNotice")}</p>
        </div>
      </div>
    </AppLayout>
  );
};

export default AlertsPage;
