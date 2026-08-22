import { SEO } from "@/components/SEO";
import { usePageTitle } from "@/hooks/usePageTitle";
import { LegalPageLayout } from "@/components/LegalPageLayout";
import { LegalContent } from "@/components/LegalContent";
import { useLanguage } from "@/contexts/LanguageContext";
import { getLegalPagesCopy } from "@/lib/legalPagesI18n";

const AccessibilityStatement = () => {
  const { language } = useLanguage();
  const copy = getLegalPagesCopy(language).accessibility;
  usePageTitle(copy.pageTitleTag);
  return (
    <>
      <SEO
        title="Accessibility Statement — PortAI"
        description="PortAI's accessibility statement. Learn how we make our AI-powered investment platform accessible and usable for everyone."
        path="/accessibility"
      />
      <LegalPageLayout title={copy.title} lastUpdated={copy.lastUpdated}>
        <LegalContent nodes={copy.nodes} />
      </LegalPageLayout>
    </>
  );
};

export default AccessibilityStatement;
