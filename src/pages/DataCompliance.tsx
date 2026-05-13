import { SEO } from "@/components/SEO";
import { usePageTitle } from "@/hooks/usePageTitle";
import { LegalPageLayout } from "@/components/LegalPageLayout";
import { LegalContent } from "@/components/LegalContent";
import { useLanguage } from "@/contexts/LanguageContext";
import { getLegalPagesCopy } from "@/lib/legalPagesI18n";

const DataCompliance = () => {
  const { language } = useLanguage();
  const copy = getLegalPagesCopy(language).dataCompliance;
  usePageTitle(copy.pageTitleTag);
  return (
    <>
      <SEO
        title="Data & Compliance — PortAI"
        description="PortAI data retention, GDPR compliance and security practices. Learn how we handle, store and safeguard user information."
        path="/data-compliance"
      />
      <LegalPageLayout title={copy.title} lastUpdated={copy.lastUpdated}>
        <LegalContent nodes={copy.nodes} />
      </LegalPageLayout>
    </>
  );
};

export default DataCompliance;
