import { usePageTitle } from "@/hooks/usePageTitle";
import { LegalPageLayout } from "@/components/LegalPageLayout";
import { LegalContent } from "@/components/LegalContent";
import { useLanguage } from "@/contexts/LanguageContext";
import { getLegalCopy } from "@/lib/legalI18n";
import { getLegalPagesCopy } from "@/lib/legalPagesI18n";

const TermsOfService = () => {
  const { language } = useLanguage();
  const copy = getLegalCopy(language);
  const pages = getLegalPagesCopy(language);
  usePageTitle(pages.tosPageTitleTag);

  return (
    <LegalPageLayout title={pages.tosTitle} lastUpdated={pages.tosLastUpdated}>
      {/* Sections 1–8 (localized shell) */}
      <LegalContent nodes={pages.tosIntro} />

      {/* Section 9 — official statutory wording from legalI18n.ts (en + es reviewed) */}
      <h2>{copy.tos.sectionTitle}</h2>
      <p>
        <strong>{copy.tos.subscriptionStrong}</strong>{copy.tos.subscriptionIntro}
      </p>
      <ul className="list-disc pl-5">
        {copy.tos.subscriptionBullets.map((b, i) => <li key={i}>{b}</li>)}
      </ul>

      <p>
        <strong>{copy.tos.cancellingStrong}</strong>{copy.tos.cancellingBody}
      </p>

      <p>
        <strong>{copy.tos.planChangesStrong}</strong>{copy.tos.planChangesBody}
      </p>

      <p>
        <strong>{copy.tos.withdrawalStrong}</strong>
        {copy.tos.withdrawalBodyBefore}
        <a href={`mailto:${copy.tos.withdrawalEmailLabel}`}>{copy.tos.withdrawalEmailLabel}</a>
        {copy.tos.withdrawalBodyAfter}
      </p>

      <p>
        <em>{copy.tos.partialUseEm}</em>{copy.tos.partialUseBody}
      </p>

      <p>
        <strong>{copy.tos.refundStrong}</strong>{copy.tos.refundBody}
      </p>

      <p>
        <strong>{copy.tos.priceChangeStrong}</strong>{copy.tos.priceChangeBody}
      </p>

      <p>
        <strong>{copy.tos.failedPaymentStrong}</strong>{copy.tos.failedPaymentBody}
      </p>

      {/* Sections 10–15 (localized shell) */}
      <LegalContent nodes={pages.tosTail} />
    </LegalPageLayout>
  );
};

export default TermsOfService;
