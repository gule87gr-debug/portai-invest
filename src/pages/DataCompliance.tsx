import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { usePageTitle } from "@/hooks/usePageTitle";
import { LegalPageLayout } from "@/components/LegalPageLayout";

const DataCompliance = () => {
  usePageTitle("Data & Compliance | PortAI");
  return (
    <LegalPageLayout title="Data & Compliance" lastUpdated="April 4, 2026">
      <h2>1. GDPR Compliance Statement</h2>
      <p>PortAI is fully committed to complying with the General Data Protection Regulation (GDPR) (EU) 2016/679. As a platform operated under the jurisdiction of Spain and the European Union, we take our obligations under GDPR seriously and have implemented comprehensive measures to protect user data.</p>
      <p>We act as the Data Controller for all personal data collected through the PortAI platform. We process personal data lawfully, fairly, and transparently, and only for the specific purposes outlined in our Privacy Policy.</p>

      <h2>2. How User Data Is Stored and Protected</h2>
      <p>Your data is stored using industry-leading cloud infrastructure with the following protections:</p>
      <ul className="list-disc pl-5">
        <li>Data is hosted on secure, managed database infrastructure with automatic failover and backups</li>
        <li>All database access is governed by Row-Level Security (RLS) policies, ensuring users can only access their own data</li>
        <li>Application-level authentication is enforced via secure JWT tokens</li>
        <li>Administrative access is restricted and logged</li>
        <li>Regular security audits and vulnerability assessments are conducted</li>
      </ul>

      <h2>3. Data Encryption Standards</h2>
      <ul className="list-disc pl-5">
        <li><strong>In transit:</strong> All data transmitted between your browser and our servers is encrypted using TLS 1.2+ (256-bit encryption)</li>
        <li><strong>At rest:</strong> Database storage uses AES-256 encryption for all stored data</li>
        <li><strong>Passwords:</strong> User passwords are hashed using bcrypt with salt — we never store plaintext passwords</li>
        <li><strong>API keys and secrets:</strong> All sensitive keys are stored in secure vault infrastructure, never in source code</li>
      </ul>

      <h2>4. Data Location</h2>
      <p>PortAI prioritizes hosting data within the European Union where possible. Our primary infrastructure is hosted in EU data centers. When third-party services are used (e.g., AI model providers), we ensure appropriate safeguards are in place, including Standard Contractual Clauses (SCCs) for any data transferred outside the EU/EEA.</p>

      <h2>5. Data Breach Notification Policy</h2>
      <p>In the event of a data breach that poses a risk to your rights and freedoms, PortAI will:</p>
      <ul className="list-disc pl-5">
        <li>Notify the relevant supervisory authority (Agencia Española de Protección de Datos — AEPD) within <strong>72 hours</strong> of becoming aware of the breach, as required by GDPR Article 33</li>
        <li>Notify affected users <strong>without undue delay</strong> if the breach is likely to result in a high risk to their rights, as required by GDPR Article 34</li>
        <li>Document the nature of the breach, categories of data affected, approximate number of users impacted, and remediation steps taken</li>
        <li>Take immediate technical measures to contain and mitigate the breach</li>
      </ul>

      <h2>6. Third-Party Data Sharing Policy</h2>
      <p>PortAI does not sell your personal data. We share data with third parties only when necessary to operate the platform:</p>
      <ul className="list-disc pl-5">
        <li><strong>Payment processing:</strong> Stripe processes subscription payments — they receive only billing-related data</li>
        <li><strong>AI model providers:</strong> Your queries to the AI advisor are sent to third-party AI services. We anonymize data where possible</li>
        <li><strong>Email delivery:</strong> Transactional emails (verification, notifications) are sent via a managed email service</li>
        <li><strong>Analytics:</strong> We use privacy-respecting analytics to understand platform usage. No personal data is shared with advertisers</li>
      </ul>
      <p>All third-party processors are bound by Data Processing Agreements (DPAs) that ensure GDPR compliance.</p>

      <h2>7. Data Deletion Request Process</h2>
      <p>Under GDPR Article 17 (Right to Erasure), you have the right to request deletion of your personal data. To request deletion:</p>
      <ol className="list-decimal pl-5">
        <li>Email <strong>privacy@portai-invest.com</strong> from the email address associated with your account</li>
        <li>Include the subject line: "Data Deletion Request"</li>
        <li>We will verify your identity and process the request within <strong>30 days</strong></li>
      </ol>
      <p>Upon deletion, we will remove:</p>
      <ul className="list-disc pl-5">
        <li>Your account and profile information</li>
        <li>Chat history and AI conversation data</li>
        <li>Watchlists and investment preferences</li>
        <li>Forum posts (anonymized rather than deleted to preserve discussion context)</li>
        <li>Usage analytics tied to your account</li>
      </ul>
      <p>Certain data may be retained where required by law (e.g., transaction records for tax/accounting purposes) for the minimum legally required period.</p>

      <h2>8. Your GDPR Rights</h2>
      <p>As a data subject, you have the right to:</p>
      <ul className="list-disc pl-5">
        <li><strong>Access</strong> — Request a copy of all personal data we hold about you</li>
        <li><strong>Rectification</strong> — Request correction of inaccurate or incomplete data</li>
        <li><strong>Erasure</strong> — Request deletion of your personal data</li>
        <li><strong>Restriction</strong> — Request that we limit processing of your data</li>
        <li><strong>Portability</strong> — Receive your data in a structured, machine-readable format</li>
        <li><strong>Object</strong> — Object to processing based on legitimate interests</li>
        <li><strong>Withdraw consent</strong> — Withdraw consent at any time without affecting lawfulness of prior processing</li>
      </ul>
      <p>To exercise any of these rights, contact us at <strong>privacy@portai-invest.com</strong>.</p>

      <h2>9. Data Protection Officer</h2>
      <p>For any questions or concerns regarding data protection, you may contact our Data Protection Officer:</p>
      <ul className="list-disc pl-5">
        <li>Email: dpo@portai-invest.com</li>
        <li>Address: PortAI, Spain (EU)</li>
      </ul>
      <p>You also have the right to lodge a complaint with the Spanish Data Protection Authority (AEPD) or your local EU supervisory authority.</p>
    </LegalPageLayout>
  );
};

export default DataCompliance;
