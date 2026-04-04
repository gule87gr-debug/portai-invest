import { usePageTitle } from "@/hooks/usePageTitle";
import { LegalPageLayout } from "@/components/LegalPageLayout";

const PrivacyPolicy = () => {
  usePageTitle("Privacy Policy | PortAI");
  return (
    <LegalPageLayout title="Privacy Policy" lastUpdated="April 4, 2026">
      <h2>1. Introduction</h2>
      <p>PortAI ("we", "our", "us") operates the PortAI platform at portai-invest.com. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI-powered investment analysis platform. Please read this policy carefully.</p>

      <h2>2. Information We Collect</h2>
      <h3>2.1 Personal Information</h3>
      <p>When you register for an account, we may collect:</p>
      <ul className="list-disc pl-5">
        <li>Name and display name</li>
        <li>Email address</li>
        <li>Profile picture (if uploaded)</li>
        <li>Language preference</li>
        <li>Authentication credentials (passwords are hashed and never stored in plain text)</li>
      </ul>

      <h3>2.2 Usage Data</h3>
      <p>We automatically collect certain information when you access the platform:</p>
      <ul className="list-disc pl-5">
        <li>IP address and approximate geolocation</li>
        <li>Browser type, device type, and operating system</li>
        <li>Pages visited, features used, and time spent on the platform</li>
        <li>Search queries and stock tickers viewed</li>
        <li>AI chat conversation history (stored per user session)</li>
      </ul>

      <h3>2.3 Financial Information</h3>
      <p>We may collect information related to your use of investment features:</p>
      <ul className="list-disc pl-5">
        <li>Watchlist compositions and stock selections</li>
        <li>Quiz responses and generated investment profiles</li>
        <li>Article URLs submitted for AI analysis</li>
        <li>Forum posts and discussion content</li>
      </ul>

      <h3>2.4 Payment Information</h3>
      <p>If you subscribe to premium features, payment processing is handled by Stripe, our third-party payment processor. We do not store full credit card numbers, CVVs, or bank account details on our servers. We may retain:</p>
      <ul className="list-disc pl-5">
        <li>Last four digits of your payment card</li>
        <li>Billing address</li>
        <li>Transaction history and subscription status</li>
      </ul>

      <h2>3. How We Use Your Information</h2>
      <p>We use the information we collect to:</p>
      <ul className="list-disc pl-5">
        <li>Provide, maintain, and improve the PortAI platform</li>
        <li>Personalize your experience, including AI-generated recommendations</li>
        <li>Process transactions and manage your account via Stripe</li>
        <li>Send transactional emails (account verification, password resets, notifications)</li>
        <li>Analyze usage patterns to improve our AI models and platform features</li>
        <li>Detect, prevent, and address technical issues, fraud, or abuse</li>
        <li>Comply with legal obligations under EU/Spanish law</li>
      </ul>

      <h2>4. AI Processing</h2>
      <p>PortAI uses artificial intelligence to analyze financial articles, generate investment recommendations, fact-check forum posts, and power the AI chat advisor. Your inputs to these features (questions, URLs, quiz answers) are processed by AI models to generate responses. We may use anonymized and aggregated interaction data to improve our AI models. Individual conversations are not shared with other users.</p>

      <h2>5. Third-Party Services</h2>
      <p>We use the following third-party services to operate the platform:</p>
      <ul className="list-disc pl-5">
        <li><strong>Stripe:</strong> Payment processing for premium subscriptions</li>
        <li><strong>Cloud infrastructure:</strong> Secure database hosting, authentication, and backend services</li>
        <li><strong>AI model providers:</strong> Third-party AI services for generating analysis and chat responses</li>
        <li><strong>TradingView:</strong> Market chart widgets and financial data visualization</li>
      </ul>
      <p>Each third-party service is bound by their own privacy policy and our Data Processing Agreements.</p>

      <h2>6. Cookies and Tracking Technologies</h2>
      <p>We use cookies and similar technologies to:</p>
      <ul className="list-disc pl-5">
        <li>Maintain your session and authentication state (essential)</li>
        <li>Remember your preferences — theme, language (essential)</li>
        <li>Analyze platform usage and performance (optional)</li>
      </ul>
      <p>You can manage cookie preferences through the cookie consent banner displayed on your first visit. Essential cookies required for platform functionality cannot be disabled.</p>

      <h2>7. Data Sharing and Disclosure</h2>
      <p>We do not sell your personal information. We may share your data with:</p>
      <ul className="list-disc pl-5">
        <li><strong>Service providers:</strong> Cloud hosting, email delivery, payment processing, and analytics services that help us operate the platform</li>
        <li><strong>AI model providers:</strong> Anonymized query data may be processed by third-party AI services to generate responses</li>
        <li><strong>Legal requirements:</strong> When required by law, court order, or governmental regulation under EU/Spanish jurisdiction</li>
        <li><strong>Business transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
      </ul>

      <h2>8. Data Security</h2>
      <p>We implement industry-standard security measures including:</p>
      <ul className="list-disc pl-5">
        <li>Encryption of data in transit (TLS 1.2+) and at rest (AES-256)</li>
        <li>Row-level security policies on database tables</li>
        <li>Rate limiting on API endpoints</li>
        <li>Regular security audits and vulnerability assessments</li>
        <li>Secure authentication with hashed passwords (bcrypt)</li>
      </ul>

      <h2>9. Data Retention</h2>
      <p>We retain your personal data for as long as your account is active or as needed to provide services. Upon account deletion, we will remove your personal data within 30 days, except where we are required to retain it for legal or legitimate business purposes. Anonymized and aggregated data may be retained indefinitely.</p>

      <h2>10. Your Rights (GDPR)</h2>
      <p>Under the General Data Protection Regulation, you have the right to:</p>
      <ul className="list-disc pl-5">
        <li><strong>Access:</strong> Request a copy of the personal data we hold about you</li>
        <li><strong>Rectification:</strong> Request correction of inaccurate data</li>
        <li><strong>Erasure:</strong> Request deletion of your personal data ("right to be forgotten")</li>
        <li><strong>Portability:</strong> Receive your data in a structured, machine-readable format</li>
        <li><strong>Restriction:</strong> Request restriction of processing in certain circumstances</li>
        <li><strong>Object:</strong> Object to processing based on legitimate interests</li>
        <li><strong>Withdraw consent:</strong> Withdraw consent at any time where processing is based on consent</li>
      </ul>
      <p>To exercise these rights, contact us at privacy@portai-invest.com. We will respond within 30 days as required by GDPR.</p>

      <h2>11. International Data Transfers</h2>
      <p>Your data may be transferred to and processed in countries other than your country of residence. We ensure appropriate safeguards are in place, including Standard Contractual Clauses (SCCs) approved by the European Commission, to protect your data in accordance with GDPR.</p>

      <h2>12. Children's Privacy</h2>
      <p>PortAI is not intended for individuals under the age of 18. We do not knowingly collect personal information from minors. If we become aware that we have collected data from a minor, we will take steps to delete it promptly.</p>

      <h2>13. Changes to This Policy</h2>
      <p>We may update this Privacy Policy from time to time. We will notify you of material changes by posting the updated policy on this page and updating the "Last updated" date. Your continued use of the platform after changes constitutes acceptance of the updated policy.</p>

      <h2>14. Contact Us</h2>
      <p>If you have questions about this Privacy Policy, please contact us at:</p>
      <ul className="list-disc pl-5">
        <li>Email: privacy@portai-invest.com</li>
        <li>Data Protection Officer: dpo@portai-invest.com</li>
        <li>Website: portai-invest.com</li>
      </ul>
      <p>You also have the right to lodge a complaint with the Spanish Data Protection Authority (Agencia Española de Protección de Datos — AEPD) or your local EU supervisory authority.</p>
    </LegalPageLayout>
  );
};

export default PrivacyPolicy;
