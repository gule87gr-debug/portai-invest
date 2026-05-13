import { SEO } from "@/components/SEO";
import { usePageTitle } from "@/hooks/usePageTitle";
import { LegalPageLayout } from "@/components/LegalPageLayout";
import { LegalContent } from "@/components/LegalContent";
import { useLanguage } from "@/contexts/LanguageContext";
import { getLegalPagesCopy } from "@/lib/legalPagesI18n";

const PrivacyPolicy = () => {
  const { language } = useLanguage();
  const copy = getLegalPagesCopy(language).privacy;
  usePageTitle(copy.pageTitleTag);
  return (
    <>
      <SEO
        title="Privacy Policy — PortAI"
        description="How PortAI collects, processes and protects your personal data. GDPR-compliant privacy policy for our AI-powered investment platform."
        path="/privacy-policy"
      />
      <LegalPageLayout title={copy.title} lastUpdated={copy.lastUpdated}>
        <LegalContent nodes={copy.nodes} />
      </LegalPageLayout>
    </>
  );
};

export default PrivacyPolicy;
