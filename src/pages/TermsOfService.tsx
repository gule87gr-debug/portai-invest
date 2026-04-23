import { usePageTitle } from "@/hooks/usePageTitle";
import { LegalPageLayout } from "@/components/LegalPageLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { getLegalCopy } from "@/lib/legalI18n";

const TermsOfService = () => {
  usePageTitle("Terms of Service | PortAI");
  const { language } = useLanguage();
  const copy = getLegalCopy(language);

  return (
    <LegalPageLayout title="Terms of Service" lastUpdated="April 4, 2026">
      <h2>1. Acceptance of Terms</h2>
      <p>By accessing or using PortAI ("the Platform"), available at portai-invest.com, you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not use the Platform. These Terms constitute a legally binding agreement between you and PortAI.</p>

      <h2>2. Description of Service</h2>
      <p>PortAI is an AI-powered investment research and analysis platform that provides:</p>
      <ul className="list-disc pl-5">
        <li>AI-generated analysis of financial articles and market data</li>
        <li>Personalized investment profile assessments via interactive quizzes</li>
        <li>AI chat advisor for investment-related questions</li>
        <li>Community forum for investment discussions with AI fact-checking</li>
        <li>Custom watchlists for tracking stocks, ETFs, and cryptocurrencies</li>
        <li>Market news curation with AI trust scoring</li>
      </ul>

      <h2>3. Important Disclaimer — Not Financial Advice</h2>
      <p><strong>PortAI is an educational and research tool only. Nothing on this platform constitutes financial advice, investment advice, trading advice, or any other form of professional advice.</strong></p>
      <p>All AI-generated content, recommendations, trust scores, investment profiles, and analysis results are provided for informational and educational purposes only. You should:</p>
      <ul className="list-disc pl-5">
        <li>Always consult with a qualified financial advisor before making investment decisions</li>
        <li>Conduct your own independent research before investing</li>
        <li>Understand that all investments carry risk, including the risk of losing your entire investment</li>
        <li>Not rely solely on AI-generated content for investment decisions</li>
      </ul>
      <p>PortAI, its creators, and affiliates are not liable for any financial losses resulting from actions taken based on information provided on the platform.</p>

      <h2>4. Account Registration</h2>
      <p>To use certain features, you must create an account. You agree to:</p>
      <ul className="list-disc pl-5">
        <li>Provide accurate, current, and complete information during registration</li>
        <li>Maintain the security of your password and account credentials</li>
        <li>Accept responsibility for all activities under your account</li>
        <li>Notify us immediately of any unauthorized use of your account</li>
        <li>Not create multiple accounts for deceptive purposes</li>
      </ul>
      <p>You must be at least 18 years old to create an account and use the Platform.</p>

      <h2>5. User Responsibilities and Acceptable Use</h2>
      <p>You agree not to:</p>
      <ul className="list-disc pl-5">
        <li>Use the Platform for any unlawful purpose or in violation of any applicable laws</li>
        <li>Post false, misleading, or fraudulent investment information on the forum</li>
        <li>Attempt to manipulate, exploit, or game the AI systems</li>
        <li>Scrape, crawl, or use automated tools to extract data from the Platform</li>
        <li>Interfere with or disrupt the Platform's infrastructure or other users' experience</li>
        <li>Impersonate another person or entity</li>
        <li>Use the Platform to promote or facilitate pump-and-dump schemes, market manipulation, or insider trading</li>
        <li>Share your account credentials with others</li>
        <li>Reverse-engineer, decompile, or attempt to extract the source code of the Platform</li>
      </ul>

      <h2>6. Prohibited Activities</h2>
      <p>In addition to the acceptable use restrictions above, the following are strictly prohibited:</p>
      <ul className="list-disc pl-5">
        <li>Using the Platform to distribute malware, viruses, or harmful code</li>
        <li>Conducting denial-of-service attacks or overloading platform infrastructure</li>
        <li>Harvesting user data, email addresses, or personal information from the Platform</li>
        <li>Using the Platform's AI capabilities to generate spam, misinformation, or harmful content</li>
        <li>Circumventing security measures, subscription restrictions, or access controls</li>
        <li>Reselling or redistributing PortAI services without authorization</li>
      </ul>

      <h2>7. User Content</h2>
      <p>You retain ownership of content you post on the Platform (forum posts, chat messages, watchlists). However, by posting content, you grant PortAI a non-exclusive, worldwide, royalty-free license to use, display, and distribute your content within the Platform.</p>
      <p>We reserve the right to remove content that violates these Terms, is flagged by our AI moderation system, or is otherwise objectionable. AI-powered fact-checking is applied to forum posts automatically, but we do not guarantee the accuracy of fact-check results.</p>

      <h2>8. AI-Generated Content</h2>
      <p>The Platform uses artificial intelligence to generate analysis, recommendations, and responses. You acknowledge that:</p>
      <ul className="list-disc pl-5">
        <li>AI-generated content may contain errors, inaccuracies, or outdated information</li>
        <li>AI models may produce different responses to similar queries</li>
        <li>Trust scores, bias detection, and analysis results are AI assessments, not objective truth</li>
        <li>Investment quiz results are algorithmic suggestions, not personalized financial advice</li>
        <li>We do not guarantee the accuracy, completeness, or reliability of any AI output</li>
      </ul>

      {/* Section 9 — localised. Spanish + English carry official statutory wording. */}
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


      <h2>10. Account Termination</h2>
      <p>We may suspend or terminate your account at any time for:</p>
      <ul className="list-disc pl-5">
        <li>Violation of these Terms of Service</li>
        <li>Engaging in prohibited activities</li>
        <li>Repeated posting of harmful or misleading content</li>
        <li>Abuse of the AI systems or platform infrastructure</li>
        <li>Non-payment of subscription fees</li>
        <li>Any other reason at our reasonable discretion</li>
      </ul>
      <p>Upon termination, your right to use the Platform ceases immediately. You may request data deletion per our Privacy Policy. You may also voluntarily delete your account at any time through the settings page.</p>

      <h2>11. Limitation of Liability</h2>
      <p>To the maximum extent permitted by applicable EU and Spanish law, PortAI and its officers, directors, employees, and agents shall not be liable for:</p>
      <ul className="list-disc pl-5">
        <li>Any indirect, incidental, special, consequential, or punitive damages</li>
        <li>Loss of profits, data, goodwill, or other intangible losses</li>
        <li>Financial losses resulting from investment decisions made using the Platform</li>
        <li>Errors or inaccuracies in AI-generated content</li>
        <li>Service interruptions, downtime, or data breaches</li>
      </ul>
      <p>Our total liability for any claims arising from your use of the Platform shall not exceed the amount you paid us in the twelve (12) months preceding the claim.</p>

      <h2>12. Indemnification</h2>
      <p>You agree to indemnify, defend, and hold harmless PortAI from any claims, damages, losses, liabilities, and expenses arising from your use of the Platform, violation of these Terms, or infringement of any third-party rights.</p>

      <h2>13. Governing Law</h2>
      <p>These Terms are governed by and construed in accordance with the laws of Spain and the European Union, including the General Data Protection Regulation (GDPR). Any disputes arising from these Terms or your use of the Platform shall be subject to the exclusive jurisdiction of the courts of Spain, unless mandatory consumer protection laws in your jurisdiction require otherwise.</p>

      <h2>14. Changes to Terms</h2>
      <p>We reserve the right to modify these Terms at any time. Material changes will be communicated through the Platform or via email. Continued use of the Platform after changes constitutes acceptance of the updated Terms.</p>

      <h2>15. Contact</h2>
      <p>For questions about these Terms, contact us at:</p>
      <ul className="list-disc pl-5">
        <li>Email: legal@portai-invest.com</li>
        <li>Website: portai-invest.com</li>
      </ul>
    </LegalPageLayout>
  );
};

export default TermsOfService;
