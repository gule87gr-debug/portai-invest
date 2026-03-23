import { ArrowLeft, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { usePageTitle } from "@/hooks/usePageTitle";

const TermsOfService = () => {
  usePageTitle("Terms of Service | PortAI");
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
        <h1 className="text-3xl font-bold text-foreground mb-2">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: March 23, 2026</p>

        <div className="prose prose-sm prose-invert max-w-none space-y-6 text-muted-foreground [&_h2]:text-foreground [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mt-8 [&_h2]:mb-3 [&_h3]:text-foreground [&_h3]:text-base [&_h3]:font-medium [&_h3]:mt-6 [&_h3]:mb-2 [&_p]:leading-relaxed [&_ul]:space-y-1 [&_li]:leading-relaxed">

          <h2>1. Acceptance of Terms</h2>
          <p>By accessing or using PortAI ("the Platform"), available at portai-invest.com, you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not use the Platform. These Terms constitute a legally binding agreement between you and PortAI.</p>

          <h2>2. Description of Service</h2>
          <p>PortAI is an AI-powered investment research and analysis platform that provides:</p>
          <ul className="list-disc pl-5">
            <li>AI-generated analysis of financial articles and market data</li>
            <li>Personalized investment profile assessments via interactive quizzes</li>
            <li>AI chat advisor for investment-related questions</li>
            <li>Community forum for investment discussions</li>
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

          <h2>5. Acceptable Use</h2>
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

          <h2>6. User Content</h2>
          <p>You retain ownership of content you post on the Platform (forum posts, chat messages, watchlists). However, by posting content, you grant PortAI a non-exclusive, worldwide, royalty-free license to use, display, and distribute your content within the Platform.</p>
          <p>We reserve the right to remove content that violates these Terms, is flagged by our AI moderation system, or is otherwise objectionable. AI-powered fact-checking is applied to forum posts automatically, but we do not guarantee the accuracy of fact-check results.</p>

          <h2>7. AI-Generated Content</h2>
          <p>The Platform uses artificial intelligence to generate analysis, recommendations, and responses. You acknowledge that:</p>
          <ul className="list-disc pl-5">
            <li>AI-generated content may contain errors, inaccuracies, or outdated information</li>
            <li>AI models may produce different responses to similar queries</li>
            <li>Trust scores, bias detection, and analysis results are AI assessments, not objective truth</li>
            <li>Investment quiz results are algorithmic suggestions, not personalized financial advice</li>
            <li>We do not guarantee the accuracy, completeness, or reliability of any AI output</li>
          </ul>

          <h2>8. Subscription and Payments</h2>
          <p>Certain premium features may require a paid subscription. By subscribing, you agree to:</p>
          <ul className="list-disc pl-5">
            <li>Pay all fees associated with your chosen plan</li>
            <li>Automatic renewal unless canceled before the renewal date</li>
            <li>Provide accurate and complete billing information</li>
          </ul>
          <p>Refund policies will be outlined at the time of purchase. We reserve the right to change pricing with reasonable notice to subscribers.</p>

          <h2>9. Intellectual Property</h2>
          <p>All content, features, and functionality of PortAI — including but not limited to the AI models, algorithms, design, graphics, code, and branding — are owned by PortAI and protected by intellectual property laws. You may not reproduce, distribute, or create derivative works without our express written permission.</p>

          <h2>10. Third-Party Services</h2>
          <p>The Platform integrates with third-party services including:</p>
          <ul className="list-disc pl-5">
            <li>TradingView for chart widgets and market data</li>
            <li>Third-party AI model providers for content generation</li>
            <li>News APIs for market news aggregation</li>
            <li>Payment processors for subscription billing</li>
          </ul>
          <p>We are not responsible for the content, privacy practices, or availability of third-party services. Your use of such services is subject to their respective terms and policies.</p>

          <h2>11. Limitation of Liability</h2>
          <p>To the maximum extent permitted by law, PortAI and its officers, directors, employees, and agents shall not be liable for:</p>
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

          <h2>13. Termination</h2>
          <p>We may suspend or terminate your account at any time for violation of these Terms or for any other reason at our discretion. Upon termination, your right to use the Platform ceases immediately. You may delete your account at any time through the settings page.</p>

          <h2>14. Governing Law</h2>
          <p>These Terms are governed by and construed in accordance with applicable laws. Any disputes arising from these Terms or your use of the Platform shall be resolved through binding arbitration, except where prohibited by law.</p>

          <h2>15. Changes to Terms</h2>
          <p>We reserve the right to modify these Terms at any time. Material changes will be communicated through the Platform or via email. Continued use of the Platform after changes constitutes acceptance of the updated Terms.</p>

          <h2>16. Contact</h2>
          <p>For questions about these Terms, contact us at:</p>
          <ul className="list-disc pl-5">
            <li>Email: legal@portai-invest.com</li>
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

export default TermsOfService;
