import { usePageTitle } from "@/hooks/usePageTitle";
import { LegalPageLayout } from "@/components/LegalPageLayout";
import { LegalContent } from "@/components/LegalContent";
import { useLanguage } from "@/contexts/LanguageContext";
import { getLegalPagesCopy } from "@/lib/legalPagesI18n";

const IPPolicy = () => {
  const { language } = useLanguage();
  const copy = getLegalPagesCopy(language).ipPolicy;
  usePageTitle(copy.pageTitleTag);
  return (
    <LegalPageLayout title={copy.title} lastUpdated={copy.lastUpdated}>
      <LegalContent nodes={copy.nodes} />
    </LegalPageLayout>
  );
};

export default IPPolicy;
