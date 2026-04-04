import { usePageTitle } from "@/hooks/usePageTitle";
import { LegalPageLayout } from "@/components/LegalPageLayout";

const IPPolicy = () => {
  usePageTitle("Intellectual Property Policy | PortAI");
  return (
    <LegalPageLayout title="Intellectual Property Policy" lastUpdated="April 4, 2026">
      <h2>1. Ownership of PortAI Content and Platform</h2>
      <p>All content, features, functionality, design, source code, algorithms, AI models, graphics, logos, trademarks, and branding associated with PortAI are the exclusive intellectual property of PortAI and its licensors. This includes but is not limited to:</p>
      <ul className="list-disc pl-5">
        <li>The PortAI name, logo, and visual identity</li>
        <li>Platform user interface and user experience design</li>
        <li>AI analysis algorithms and trust-scoring systems</li>
        <li>Investment quiz methodology and recommendation engine</li>
        <li>All original text, graphics, and media created by PortAI</li>
      </ul>
      <p>These materials are protected by copyright, trademark, patent, trade secret, and other intellectual property laws of Spain, the European Union, and international treaties.</p>

      <h2>2. User-Generated Content</h2>
      <p>Users retain ownership of the original content they create and post on the Platform, including forum posts, comments, and watchlist configurations. By posting content on PortAI, you grant us a non-exclusive, worldwide, royalty-free, sublicensable license to:</p>
      <ul className="list-disc pl-5">
        <li>Display, distribute, and reproduce the content within the Platform</li>
        <li>Use the content to improve our AI models and services (in anonymized, aggregated form)</li>
        <li>Moderate, edit, or remove content that violates our Terms of Service</li>
      </ul>
      <p>This license terminates when you delete the content or your account, except for content that has been shared, quoted, or incorporated into forum discussions by other users.</p>

      <h2>3. Reporting Intellectual Property Infringement</h2>
      <p>If you believe that content on PortAI infringes your intellectual property rights, please contact us with the following information:</p>
      <ul className="list-disc pl-5">
        <li>A description of the copyrighted work or IP that you claim has been infringed</li>
        <li>The location (URL or description) of the allegedly infringing material on our Platform</li>
        <li>Your contact information (name, email, mailing address, phone number)</li>
        <li>A statement that you have a good-faith belief that the use is not authorized by the rights owner</li>
        <li>A statement, under penalty of perjury, that the information in your notice is accurate and that you are authorized to act on behalf of the rights owner</li>
        <li>Your physical or electronic signature</li>
      </ul>
      <p>Send IP infringement notices to: <strong>legal@portai-invest.com</strong></p>

      <h2>4. DMCA Takedown Process</h2>
      <p>Although PortAI operates under EU/Spanish law, we voluntarily comply with the spirit of the US Digital Millennium Copyright Act (DMCA) to protect intellectual property. Our takedown process:</p>
      <ol className="list-decimal pl-5">
        <li><strong>Notice:</strong> Submit a complete infringement notice to legal@portai-invest.com</li>
        <li><strong>Review:</strong> We will review the notice within 5 business days</li>
        <li><strong>Action:</strong> If valid, the infringing content will be removed or disabled promptly</li>
        <li><strong>Notification:</strong> The user who posted the content will be notified of the takedown</li>
        <li><strong>Counter-notice:</strong> The user may submit a counter-notice if they believe the takedown was in error</li>
        <li><strong>Resolution:</strong> If no counter-notice is received within 10 business days, the removal is permanent</li>
      </ol>
      <p>Repeat infringers may have their accounts terminated.</p>

      <h2>5. Prohibited Use of PortAI Branding</h2>
      <p>Without prior written permission from PortAI, you may not:</p>
      <ul className="list-disc pl-5">
        <li>Use the PortAI name, logo, or branding in any product, service, or marketing material</li>
        <li>Create derivative works based on PortAI's design or visual identity</li>
        <li>Imply endorsement, partnership, or affiliation with PortAI</li>
        <li>Use PortAI trademarks in domain names, social media handles, or advertising</li>
        <li>Reproduce or distribute screenshots of the Platform for commercial purposes</li>
      </ul>
      <p>Limited use for news reporting, reviews, and educational commentary is permitted under fair use/fair dealing principles.</p>

      <h2>6. AI-Generated Content Disclaimer</h2>
      <p>PortAI uses artificial intelligence to generate analysis, recommendations, fact-checks, and responses. Important disclosures regarding AI-generated content:</p>
      <ul className="list-disc pl-5">
        <li>AI-generated content does not represent the opinions or views of PortAI</li>
        <li>AI outputs may contain errors, hallucinations, or outdated information</li>
        <li>Users should independently verify all AI-generated information before acting on it</li>
        <li>AI-generated investment analysis does not constitute financial advice</li>
        <li>PortAI does not claim copyright over AI-generated responses provided to individual users</li>
        <li>The AI models, prompts, and systems used to generate outputs remain PortAI's intellectual property</li>
      </ul>

      <h2>7. Open Source and Third-Party Licenses</h2>
      <p>PortAI incorporates open-source software components. All third-party libraries and tools used in the Platform are used in compliance with their respective licenses. A list of major open-source dependencies and their licenses is available upon request at legal@portai-invest.com.</p>

      <h2>8. Contact</h2>
      <p>For intellectual property inquiries, contact:</p>
      <ul className="list-disc pl-5">
        <li>Email: legal@portai-invest.com</li>
        <li>Website: portai-invest.com</li>
      </ul>
    </LegalPageLayout>
  );
};

export default IPPolicy;
