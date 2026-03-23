import { ArrowLeft, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { usePageTitle } from "@/hooks/usePageTitle";

const PrivacyPolicy = () => {
  usePageTitle("Privacy Policy | PortAI");
  return (
    <div className="min-h-screen bg-background">
      <nav className="flex items-center justify-between px-6 py-5 max-w-4xl mx-auto">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <TrendingUp className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold text-foreground">PortAI</span>
        </Link>
        <Link to="/" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
      </nav>

      <main className="px-6 py-10 max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-foreground mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: March 23, 2026</p>

        <div className="prose prose-sm prose-invert max-w-none space-y-6 text-muted-foreground [&_h2]:text-foreground [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mt-8 [&_h2]:mb-3 [&_h3]:text-foreground [&_h3]:text-base [&_h3]:font-medium [&_h3]:mt-6 [&_h3]:mb-2 [&_p]:leading-relaxed [&_ul]:space-y-1 [&_li]:leading-relaxed">

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
          <p>If you subscribe to premium features, payment processing is handled by our third-party payment processor. We do not store full credit card numbers, CVVs, or bank account details on our servers. We may retain:</p>
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
            <li>Process transactions and manage your account</li>
            <li>Send transactional emails (account verification, password resets, notifications)</li>
            <li>Analyze usage patterns to improve our AI models and platform features</li>
            <li>Detect, prevent, and address technical issues, fraud, or abuse</li>
            <li>Comply with legal obligations</li>
          </ul>

          <h2>4. AI Processing</h2>
          <p>PortAI uses artificial intelligence to analyze financial articles, generate investment recommendations, fact-check forum posts, and power the AI chat advisor. Your inputs to these features (questions, URLs, quiz answers) are processed by AI models to generate responses. We may use anonymized and aggregated interaction data to improve our AI models. Individual conversations are not shared with other users.</p>

          <h2>5. Cookies and Tracking Technologies</h2>
          <p>We use cookies and similar technologies to:</p>
          <ul className="list-disc pl-5">
            <li>Maintain your session and authentication state</li>
            <li>Remember your preferences (theme, language)</li>
            <li>Analyze platform usage and performance</li>
            <li>Provide essential platform functionality</li>
          </ul>
          <p>You can manage cookie preferences through the cookie consent banner displayed on your first visit. Essential cookies required for platform functionality cannot be disabled.</p>

          <h2>6. Data Sharing and Disclosure</h2>
          <p>We do not sell your personal information. We may share your data with:</p>
          <ul className="list-disc pl-5">
            <li><strong>Service providers:</strong> Cloud hosting, email delivery, payment processing, and analytics services that help us operate the platform</li>
            <li><strong>AI model providers:</strong> Anonymized query data may be processed by third-party AI services to generate responses</li>
            <li><strong>Legal requirements:</strong> When required by law, court order, or governmental regulation</li>
            <li><strong>Business transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
          </ul>

          <h2>7. Data Security</h2>
          <p>We implement industry-standard security measures including:</p>
          <ul className="list-disc pl-5">
            <li>Encryption of data in transit (TLS/SSL) and at rest</li>
            <li>Row-level security policies on database tables</li>
            <li>Rate limiting on API endpoints</li>
            <li>Regular security audits and vulnerability assessments</li>
            <li>Secure authentication with hashed passwords</li>
          </ul>

          <h2>8. Data Retention</h2>
          <p>We retain your personal data for as long as your account is active or as needed to provide services. Upon account deletion, we will remove your personal data within 30 days, except where we are required to retain it for legal or legitimate business purposes. Anonymized and aggregated data may be retained indefinitely.</p>

          <h2>9. Your Rights (GDPR / CCPA)</h2>
          <p>Depending on your jurisdiction, you may have the right to:</p>
          <ul className="list-disc pl-5">
            <li><strong>Access:</strong> Request a copy of the personal data we hold about you</li>
            <li><strong>Rectification:</strong> Request correction of inaccurate data</li>
            <li><strong>Erasure:</strong> Request deletion of your personal data</li>
            <li><strong>Portability:</strong> Receive your data in a machine-readable format</li>
            <li><strong>Restriction:</strong> Request restriction of processing in certain circumstances</li>
            <li><strong>Object:</strong> Object to processing based on legitimate interests</li>
            <li><strong>Withdraw consent:</strong> Withdraw consent at any time where processing is based on consent</li>
          </ul>
          <p>To exercise these rights, contact us at privacy@portai-invest.com.</p>

          <h2>10. International Data Transfers</h2>
          <p>Your data may be transferred to and processed in countries other than your country of residence. We ensure appropriate safeguards are in place, including standard contractual clauses, to protect your data in accordance with applicable data protection laws.</p>

          <h2>11. Children's Privacy</h2>
          <p>PortAI is not intended for individuals under the age of 18. We do not knowingly collect personal information from minors. If we become aware that we have collected data from a minor, we will take steps to delete it promptly.</p>

          <h2>12. Changes to This Policy</h2>
          <p>We may update this Privacy Policy from time to time. We will notify you of material changes by posting the updated policy on this page and updating the "Last updated" date. Your continued use of the platform after changes constitutes acceptance of the updated policy.</p>

          <h2>13. Contact Us</h2>
          <p>If you have questions about this Privacy Policy, please contact us at:</p>
          <ul className="list-disc pl-5">
            <li>Email: privacy@portai-invest.com</li>
            <li>Website: portai-invest.com</li>
          </ul>
        </div>
      </main>

      <footer className="border-t border-border px-6 py-6 text-center">
        <p className="text-xs text-muted-foreground">© 2026 PortAI. For educational purposes only. Not financial advice.</p>
      </footer>
    </div>
  );
};

export default PrivacyPolicy;
