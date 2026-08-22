// Multilingual content for the 4 standalone legal pages:
// Privacy Policy, Terms of Service (intro + tail), Data & Compliance, IP Policy.
//
// Same convention as legalI18n.ts: English is the canonical source of truth and
// Spanish is fully reviewed (PortAI is established in Spain). Other supported
// languages fall back to English so the legal meaning is never lost in an
// unreviewed translation. Drop in fr/pt/de/it when reviewed.

import type { Language } from "@/contexts/LanguageContext";

// ── Node types used by <LegalContent /> renderer ─────────────────────────
// `**text**` inside a string renders as <strong>text</strong>.
// `__text__` renders as <em>text</em>.
export type LegalNode =
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] };

export type LegalPageCopy = {
  title: string;
  lastUpdated: string;
  pageTitleTag: string; // for usePageTitle
  nodes: LegalNode[];
};

export type LegalPagesCopy = {
  privacy: LegalPageCopy;
  dataCompliance: LegalPageCopy;
  ipPolicy: LegalPageCopy;
  accessibility: LegalPageCopy;
  // ToS shell (sections 1–8, 10–15). Section 9 stays in legalI18n.ts.
  tosIntro: LegalNode[];
  tosTail: LegalNode[];
  tosTitle: string;
  tosLastUpdated: string;
  tosPageTitleTag: string;
};

// ─────────────────────────────────────────────────────────────────────────
// English (canonical)
// ─────────────────────────────────────────────────────────────────────────
const en: LegalPagesCopy = {
  privacy: {
    title: "Privacy Policy",
    pageTitleTag: "Privacy Policy | PortAI",
    lastUpdated: "April 4, 2026",
    nodes: [
      { type: "h2", text: "1. Introduction" },
      { type: "p", text: "PortAI (\"we\", \"our\", \"us\") operates the PortAI platform at portai-invest.com. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI-powered investment analysis platform. Please read this policy carefully." },

      { type: "h2", text: "2. Information We Collect" },
      { type: "h3", text: "2.1 Personal Information" },
      { type: "p", text: "When you register for an account, we may collect:" },
      { type: "ul", items: [
        "Name and display name",
        "Email address",
        "Profile picture (if uploaded)",
        "Language preference",
        "Authentication credentials (passwords are hashed and never stored in plain text)",
      ]},
      { type: "h3", text: "2.2 Usage Data" },
      { type: "p", text: "We automatically collect certain information when you access the platform:" },
      { type: "ul", items: [
        "IP address and approximate geolocation",
        "Browser type, device type, and operating system",
        "Pages visited, features used, and time spent on the platform",
        "Search queries and stock tickers viewed",
        "AI chat conversation history (stored per user session)",
      ]},
      { type: "h3", text: "2.3 Financial Information" },
      { type: "p", text: "We may collect information related to your use of investment features:" },
      { type: "ul", items: [
        "Watchlist compositions and stock selections",
        "Quiz responses and generated investment profiles",
        "Article URLs submitted for AI analysis",
        "Forum posts and discussion content",
      ]},
      { type: "h3", text: "2.4 Payment Information" },
      { type: "p", text: "If you subscribe to premium features, payment processing is handled by Stripe, our third-party payment processor. We do not store full credit card numbers, CVVs, or bank account details on our servers. We may retain:" },
      { type: "ul", items: [
        "Last four digits of your payment card",
        "Billing address",
        "Transaction history and subscription status",
      ]},

      { type: "h2", text: "3. How We Use Your Information" },
      { type: "p", text: "We use the information we collect to:" },
      { type: "ul", items: [
        "Provide, maintain, and improve the PortAI platform",
        "Personalize your experience, including AI-generated recommendations",
        "Process transactions and manage your account via Stripe",
        "Send transactional emails (account verification, password resets, notifications)",
        "Analyze usage patterns to improve our AI models and platform features",
        "Detect, prevent, and address technical issues, fraud, or abuse",
        "Comply with legal obligations under EU/Spanish law",
      ]},

      { type: "h2", text: "4. AI Processing" },
      { type: "p", text: "PortAI uses artificial intelligence to analyze financial articles, generate investment recommendations, fact-check forum posts, and power the AI chat advisor. Your inputs to these features (questions, URLs, quiz answers) are processed by AI models to generate responses. We may use anonymized and aggregated interaction data to improve our AI models. Individual conversations are not shared with other users." },

      { type: "h2", text: "5. Third-Party Services" },
      { type: "p", text: "We use the following third-party services to operate the platform:" },
      { type: "ul", items: [
        "**Stripe:** Payment processing for premium subscriptions",
        "**Cloud infrastructure:** Secure database hosting, authentication, and backend services",
        "**AI model providers:** Third-party AI services for generating analysis and chat responses",
        "**TradingView:** Market chart widgets and financial data visualization",
      ]},
      { type: "p", text: "Each third-party service is bound by their own privacy policy and our Data Processing Agreements." },

      { type: "h2", text: "6. Cookies and Tracking Technologies" },
      { type: "p", text: "We use cookies and similar technologies to:" },
      { type: "ul", items: [
        "Maintain your session and authentication state (essential)",
        "Remember your preferences — theme, language (essential)",
        "Analyze platform usage and performance (optional)",
      ]},
      { type: "p", text: "You can manage cookie preferences through the cookie consent banner displayed on your first visit. Essential cookies required for platform functionality cannot be disabled." },

      { type: "h2", text: "7. Data Sharing and Disclosure" },
      { type: "p", text: "We do not sell your personal information. We may share your data with:" },
      { type: "ul", items: [
        "**Service providers:** Cloud hosting, email delivery, payment processing, and analytics services that help us operate the platform",
        "**AI model providers:** Anonymized query data may be processed by third-party AI services to generate responses",
        "**Legal requirements:** When required by law, court order, or governmental regulation under EU/Spanish jurisdiction",
        "**Business transfers:** In connection with a merger, acquisition, or sale of assets",
      ]},

      { type: "h2", text: "8. Data Security" },
      { type: "p", text: "We implement industry-standard security measures including:" },
      { type: "ul", items: [
        "Encryption of data in transit (TLS 1.2+) and at rest (AES-256)",
        "Row-level security policies on database tables",
        "Rate limiting on API endpoints",
        "Regular security audits and vulnerability assessments",
        "Secure authentication with hashed passwords (bcrypt)",
      ]},

      { type: "h2", text: "9. Data Retention" },
      { type: "p", text: "We retain your personal data for as long as your account is active or as needed to provide services. Upon account deletion, we will remove your personal data within 30 days, except where we are required to retain it for legal or legitimate business purposes. Anonymized and aggregated data may be retained indefinitely." },

      { type: "h2", text: "10. Your Rights (GDPR)" },
      { type: "p", text: "Under the General Data Protection Regulation, you have the right to:" },
      { type: "ul", items: [
        "**Access:** Request a copy of the personal data we hold about you",
        "**Rectification:** Request correction of inaccurate data",
        "**Erasure:** Request deletion of your personal data (\"right to be forgotten\")",
        "**Portability:** Receive your data in a structured, machine-readable format",
        "**Restriction:** Request restriction of processing in certain circumstances",
        "**Object:** Object to processing based on legitimate interests",
        "**Withdraw consent:** Withdraw consent at any time where processing is based on consent",
      ]},
      { type: "p", text: "To exercise these rights, contact us at privacy@portai-invest.com. We will respond within 30 days as required by GDPR." },

      { type: "h2", text: "11. California Residents (CCPA / CPRA)" },
      { type: "p", text: "If you are a California resident, the California Consumer Privacy Act of 2018 (\"CCPA\"), as amended by the California Privacy Rights Act (\"CPRA\"), gives you the following rights regarding your personal information:" },
      { type: "ul", items: [
        "**Right to Know** — Request disclosure of the categories and specific pieces of personal information we have collected about you in the preceding 12 months, the categories of sources, the business purpose for collecting it, and the categories of third parties with whom we share it.",
        "**Right to Delete** — Request that we delete personal information we collected from you, subject to legal exceptions.",
        "**Right to Correct** — Request correction of inaccurate personal information we maintain about you.",
        "**Right to Opt-Out of Sale or Sharing** — As stated below, **PortAI does not sell or \"share\" (as defined under the CPRA, for cross-context behavioral advertising) your personal information**, and has not done so in the preceding 12 months. There is therefore no opt-out required, but you may submit a request at any time to confirm this.",
        "**Right to Limit Use of Sensitive Personal Information** — We do not use sensitive personal information for any purpose other than what is reasonably necessary to provide the service you requested.",
        "**Right to Non-Discrimination** — We will not discriminate against you for exercising any of these rights.",
      ]},
      { type: "p", text: "**Categories of personal information collected in the past 12 months:** identifiers (name, email, IP address), commercial information (subscription/transaction history), internet/network activity (pages visited, features used, search queries), geolocation data (approximate, from IP), and user-generated content (forum posts, watchlists, AI chat history). Sources and purposes are described in Sections 2 and 3 above." },
      { type: "p", text: "**Do Not Sell or Share My Personal Information:** PortAI does not sell or share your personal information for monetary or other valuable consideration, and does not engage in cross-context behavioral advertising. To submit any CCPA/CPRA request, email **privacy@portai-invest.com** with the subject line \"California Privacy Request\". We will verify your identity and respond within 45 days as required by law. You may also designate an authorized agent to make a request on your behalf." },

      { type: "h2", text: "12. International Data Transfers" },
      { type: "p", text: "Your data may be transferred to and processed in countries other than your country of residence. We ensure appropriate safeguards are in place, including Standard Contractual Clauses (SCCs) approved by the European Commission, to protect your data in accordance with GDPR." },


      { type: "h2", text: "13. Children's Privacy" },
      { type: "p", text: "PortAI is not intended for individuals under the age of 18. We do not knowingly collect personal information from minors. If we become aware that we have collected data from a minor, we will take steps to delete it promptly." },

      { type: "h2", text: "14. Changes to This Policy" },
      { type: "p", text: "We may update this Privacy Policy from time to time. We will notify you of material changes by posting the updated policy on this page and updating the \"Last updated\" date. Your continued use of the platform after changes constitutes acceptance of the updated policy." },

      { type: "h2", text: "15. Contact Us" },
      { type: "p", text: "If you have questions about this Privacy Policy, please contact us at:" },
      { type: "ul", items: [
        "Email: privacy@portai-invest.com",
        "Data Protection Officer: dpo@portai-invest.com",
        "Website: portai-invest.com",
      ]},
      { type: "p", text: "You also have the right to lodge a complaint with the Spanish Data Protection Authority (Agencia Española de Protección de Datos — AEPD) or your local EU supervisory authority." },
    ],
  },

  dataCompliance: {
    title: "Data & Compliance",
    pageTitleTag: "Data & Compliance | PortAI",
    lastUpdated: "April 4, 2026",
    nodes: [
      { type: "h2", text: "1. GDPR Compliance Statement" },
      { type: "p", text: "PortAI is fully committed to complying with the General Data Protection Regulation (GDPR) (EU) 2016/679. As a platform operated under the jurisdiction of Spain and the European Union, we take our obligations under GDPR seriously and have implemented comprehensive measures to protect user data." },
      { type: "p", text: "We act as the Data Controller for all personal data collected through the PortAI platform. We process personal data lawfully, fairly, and transparently, and only for the specific purposes outlined in our Privacy Policy." },

      { type: "h2", text: "2. How User Data Is Stored and Protected" },
      { type: "p", text: "Your data is stored using industry-leading cloud infrastructure with the following protections:" },
      { type: "ul", items: [
        "Data is hosted on secure, managed database infrastructure with automatic failover and backups",
        "All database access is governed by Row-Level Security (RLS) policies, ensuring users can only access their own data",
        "Application-level authentication is enforced via secure JWT tokens",
        "Administrative access is restricted and logged",
        "Regular security audits and vulnerability assessments are conducted",
      ]},

      { type: "h2", text: "3. Data Encryption Standards" },
      { type: "ul", items: [
        "**In transit:** All data transmitted between your browser and our servers is encrypted using TLS 1.2+ (256-bit encryption)",
        "**At rest:** Database storage uses AES-256 encryption for all stored data",
        "**Passwords:** User passwords are hashed using bcrypt with salt — we never store plaintext passwords",
        "**API keys and secrets:** All sensitive keys are stored in secure vault infrastructure, never in source code",
      ]},

      { type: "h2", text: "4. Data Location" },
      { type: "p", text: "PortAI prioritizes hosting data within the European Union where possible. Our primary infrastructure is hosted in EU data centers. When third-party services are used (e.g., AI model providers), we ensure appropriate safeguards are in place, including Standard Contractual Clauses (SCCs) for any data transferred outside the EU/EEA." },

      { type: "h2", text: "5. Data Breach Notification Policy" },
      { type: "p", text: "In the event of a data breach that poses a risk to your rights and freedoms, PortAI will:" },
      { type: "ul", items: [
        "Notify the relevant supervisory authority (Agencia Española de Protección de Datos — AEPD) within **72 hours** of becoming aware of the breach, as required by GDPR Article 33",
        "Notify affected users **without undue delay** if the breach is likely to result in a high risk to their rights, as required by GDPR Article 34",
        "Document the nature of the breach, categories of data affected, approximate number of users impacted, and remediation steps taken",
        "Take immediate technical measures to contain and mitigate the breach",
      ]},

      { type: "h2", text: "6. Third-Party Data Sharing Policy" },
      { type: "p", text: "PortAI does not sell your personal data. We share data with third parties only when necessary to operate the platform:" },
      { type: "ul", items: [
        "**Payment processing:** Stripe processes subscription payments — they receive only billing-related data",
        "**AI model providers:** Your queries to the AI advisor are sent to third-party AI services. We anonymize data where possible",
        "**Email delivery:** Transactional emails (verification, notifications) are sent via a managed email service",
        "**Analytics:** We use privacy-respecting analytics to understand platform usage. No personal data is shared with advertisers",
      ]},
      { type: "p", text: "All third-party processors are bound by Data Processing Agreements (DPAs) that ensure GDPR compliance." },

      { type: "h2", text: "7. Data Deletion Request Process" },
      { type: "p", text: "Under GDPR Article 17 (Right to Erasure), you have the right to request deletion of your personal data. To request deletion:" },
      { type: "ol", items: [
        "Email **privacy@portai-invest.com** from the email address associated with your account",
        "Include the subject line: \"Data Deletion Request\"",
        "We will verify your identity and process the request within **30 days**",
      ]},
      { type: "p", text: "Upon deletion, we will remove:" },
      { type: "ul", items: [
        "Your account and profile information",
        "Chat history and AI conversation data",
        "Watchlists and investment preferences",
        "Forum posts (anonymized rather than deleted to preserve discussion context)",
        "Usage analytics tied to your account",
      ]},
      { type: "p", text: "Certain data may be retained where required by law (e.g., transaction records for tax/accounting purposes) for the minimum legally required period." },

      { type: "h2", text: "8. Your GDPR Rights" },
      { type: "p", text: "As a data subject, you have the right to:" },
      { type: "ul", items: [
        "**Access** — Request a copy of all personal data we hold about you",
        "**Rectification** — Request correction of inaccurate or incomplete data",
        "**Erasure** — Request deletion of your personal data",
        "**Restriction** — Request that we limit processing of your data",
        "**Portability** — Receive your data in a structured, machine-readable format",
        "**Object** — Object to processing based on legitimate interests",
        "**Withdraw consent** — Withdraw consent at any time without affecting lawfulness of prior processing",
      ]},
      { type: "p", text: "To exercise any of these rights, contact us at **privacy@portai-invest.com**." },

      { type: "h2", text: "9. Data Protection Officer" },
      { type: "p", text: "For any questions or concerns regarding data protection, you may contact our Data Protection Officer:" },
      { type: "ul", items: [
        "Email: dpo@portai-invest.com",
        "Address: PortAI, Spain (EU)",
      ]},
      { type: "p", text: "You also have the right to lodge a complaint with the Spanish Data Protection Authority (AEPD) or your local EU supervisory authority." },
    ],
  },

  ipPolicy: {
    title: "Intellectual Property Policy",
    pageTitleTag: "Intellectual Property Policy | PortAI",
    lastUpdated: "April 4, 2026",
    nodes: [
      { type: "h2", text: "1. Ownership of PortAI Content and Platform" },
      { type: "p", text: "All content, features, functionality, design, source code, algorithms, AI models, graphics, logos, trademarks, and branding associated with PortAI are the exclusive intellectual property of PortAI and its licensors. This includes but is not limited to:" },
      { type: "ul", items: [
        "The PortAI name, logo, and visual identity",
        "Platform user interface and user experience design",
        "AI analysis algorithms and trust-scoring systems",
        "Investment quiz methodology and recommendation engine",
        "All original text, graphics, and media created by PortAI",
      ]},
      { type: "p", text: "These materials are protected by copyright, trademark, patent, trade secret, and other intellectual property laws of Spain, the European Union, and international treaties." },

      { type: "h2", text: "2. User-Generated Content" },
      { type: "p", text: "Users retain ownership of the original content they create and post on the Platform, including forum posts, comments, and watchlist configurations. By posting content on PortAI, you grant us a non-exclusive, worldwide, royalty-free, sublicensable license to:" },
      { type: "ul", items: [
        "Display, distribute, and reproduce the content within the Platform",
        "Use the content to improve our AI models and services (in anonymized, aggregated form)",
        "Moderate, edit, or remove content that violates our Terms of Service",
      ]},
      { type: "p", text: "This license terminates when you delete the content or your account, except for content that has been shared, quoted, or incorporated into forum discussions by other users." },

      { type: "h2", text: "3. Reporting Intellectual Property Infringement" },
      { type: "p", text: "If you believe that content on PortAI infringes your intellectual property rights, please contact us with the following information:" },
      { type: "ul", items: [
        "A description of the copyrighted work or IP that you claim has been infringed",
        "The location (URL or description) of the allegedly infringing material on our Platform",
        "Your contact information (name, email, mailing address, phone number)",
        "A statement that you have a good-faith belief that the use is not authorized by the rights owner",
        "A statement, under penalty of perjury, that the information in your notice is accurate and that you are authorized to act on behalf of the rights owner",
        "Your physical or electronic signature",
      ]},
      { type: "p", text: "Send IP infringement notices to: **legal@portai-invest.com**" },

      { type: "h2", text: "4. DMCA Takedown Process" },
      { type: "p", text: "Although PortAI operates under EU/Spanish law, we voluntarily comply with the spirit of the US Digital Millennium Copyright Act (DMCA) to protect intellectual property. Our takedown process:" },
      { type: "ol", items: [
        "**Notice:** Submit a complete infringement notice to legal@portai-invest.com",
        "**Review:** We will review the notice within 5 business days",
        "**Action:** If valid, the infringing content will be removed or disabled promptly",
        "**Notification:** The user who posted the content will be notified of the takedown",
        "**Counter-notice:** The user may submit a counter-notice if they believe the takedown was in error",
        "**Resolution:** If no counter-notice is received within 10 business days, the removal is permanent",
      ]},
      { type: "p", text: "Repeat infringers may have their accounts terminated." },

      { type: "h3", text: "4.1 Designated Copyright Agent (DMCA §512(c))" },
      { type: "p", text: "In accordance with 17 U.S.C. §512(c)(2), PortAI has designated the following agent to receive notifications of claimed copyright infringement. Notices that do not substantially comply with the statutory requirements may not be effective." },
      { type: "ul", items: [
        "**Designated Agent:** PortAI Copyright Agent",
        "**Email (preferred):** dmca@portai-invest.com",
        "**Postal address:** PortAI Legal — DMCA Agent, c/o PortAI, Spain (EU). A full street address is available upon written request to legal@portai-invest.com.",
        "**Operating entity:** PortAI (operated from Spain, European Union)",
      ]},
      { type: "p", text: "Counter-notifications under 17 U.S.C. §512(g) must be sent to the same agent and must include all information required by the statute." },

      { type: "h2", text: "5. Prohibited Use of PortAI Branding" },
      { type: "p", text: "Without prior written permission from PortAI, you may not:" },
      { type: "ul", items: [
        "Use the PortAI name, logo, or branding in any product, service, or marketing material",
        "Create derivative works based on PortAI's design or visual identity",
        "Imply endorsement, partnership, or affiliation with PortAI",
        "Use PortAI trademarks in domain names, social media handles, or advertising",
        "Reproduce or distribute screenshots of the Platform for commercial purposes",
      ]},
      { type: "p", text: "Limited use for news reporting, reviews, and educational commentary is permitted under fair use/fair dealing principles." },

      { type: "h2", text: "6. AI-Generated Content Disclaimer" },
      { type: "p", text: "PortAI uses artificial intelligence to generate analysis, recommendations, fact-checks, and responses. Important disclosures regarding AI-generated content:" },
      { type: "ul", items: [
        "AI-generated content does not represent the opinions or views of PortAI",
        "AI outputs may contain errors, hallucinations, or outdated information",
        "Users should independently verify all AI-generated information before acting on it",
        "AI-generated investment analysis does not constitute financial advice",
        "PortAI does not claim copyright over AI-generated responses provided to individual users",
        "The AI models, prompts, and systems used to generate outputs remain PortAI's intellectual property",
      ]},

      { type: "h2", text: "7. Open Source and Third-Party Licenses" },
      { type: "p", text: "PortAI incorporates open-source software components. All third-party libraries and tools used in the Platform are used in compliance with their respective licenses. A list of major open-source dependencies and their licenses is available upon request at legal@portai-invest.com." },

      { type: "h2", text: "8. Contact" },
      { type: "p", text: "For intellectual property inquiries, contact:" },
      { type: "ul", items: [
        "Email: legal@portai-invest.com",
        "Website: portai-invest.com",
      ]},
    ],
  },

  accessibility: {
    title: "Accessibility Statement",
    pageTitleTag: "Accessibility Statement | PortAI",
    lastUpdated: "August 22, 2026",
    nodes: [
      { type: "h2", text: "1. Our Commitment" },
      { type: "p", text: "PortAI is committed to making our AI-powered investment platform accessible and usable for everyone, including people with disabilities. We aim to meet or exceed the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA standards and continue improving the accessibility of our product, content, and services." },

      { type: "h2", text: "2. Accessibility Measures" },
      { type: "p", text: "To support an inclusive experience, we have implemented the following measures:" },
      { type: "ul", items: [
        "Semantic HTML and ARIA landmarks to help screen-reader users navigate pages",
        "Keyboard-accessible navigation and interactive controls throughout the platform",
        "Descriptive labels on buttons, links, and form inputs, including icon-only controls",
        "Color contrast that meets WCAG AA thresholds for text and interactive elements",
        "Responsive layouts that adapt to zoom, magnification, and mobile screen readers",
        "Focus indicators that make the current interactive element visible",
        "A 'Skip to content' link for fast keyboard navigation past repeated menus",
        "Reduced-motion support for users who prefer less animation",
      ]},

      { type: "h2", text: "3. Accessible Features" },
      { type: "p", text: "Key areas of the platform have been built with accessibility in mind:" },
      { type: "ul", items: [
        "All charts and data visualizations expose their underlying values in text and tables where possible",
        "Article analysis results are structured with headings and lists for easy screen-reader scanning",
        "The navigation menu, search dialog, and settings are operable with keyboard and assistive technology",
        "Form validation errors are associated with their inputs and announced clearly",
        "Authentication, subscription, and billing flows are keyboard and screen-reader friendly",
      ]},

      { type: "h2", text: "4. Known Limitations" },
      { type: "p", text: "Some third-party content and embedded widgets may not fully conform to WCAG 2.1 Level AA. Examples include:" },
      { type: "ul", items: [
        "Third-party chart and market-data widgets that manage their own rendering and focus",
        "External news article content loaded via links or previews, which we do not control",
        "Embedded videos or social-media content if added to our marketing pages in the future",
      ]},
      { type: "p", text: "When we become aware of accessibility issues in third-party components, we report them to the vendor and provide alternatives where feasible." },

      { type: "h2", text: "5. Feedback and Assistance" },
      { type: "p", text: "We welcome your feedback on accessibility. If you encounter barriers, need information in a different format, or have suggestions for improvement, please contact us:" },
      { type: "ul", items: [
        "Email: accessibility@portai-invest.com",
        "Website: portai-invest.com",
      ]},
      { type: "p", text: "We aim to respond to accessibility inquiries within **5 business days** and resolve verifiable issues in a timely manner." },

      { type: "h2", text: "6. Assessment and Testing" },
      { type: "p", text: "Accessibility is evaluated through a combination of automated testing, manual keyboard navigation, and screen-reader checks. We review major updates and new features for accessibility before release and address issues as they are reported." },

      { type: "h2", text: "7. Third-Party Tools and Assistive Technology" },
      { type: "p", text: "PortAI is designed to work with modern browsers and assistive technologies, including:" },
      { type: "ul", items: [
        "Screen readers such as NVDA, JAWS, VoiceOver, and TalkBack",
        "Keyboard-only navigation and standard browser zoom up to 200%",
        "Voice-control software and switch devices on supported platforms",
      ]},
      { type: "p", text: "For the best experience, we recommend using the latest version of your browser and assistive technology." },

      { type: "h2", text: "8. Changes to This Statement" },
      { type: "p", text: "We may update this Accessibility Statement as we improve the platform. Changes will be posted on this page with an updated 'Last updated' date." },
    ],
  },

  tosTitle: "Terms of Service",
  tosPageTitleTag: "Terms of Service | PortAI",
  tosLastUpdated: "April 4, 2026",
  tosIntro: [
    { type: "h2", text: "1. Acceptance of Terms" },
    { type: "p", text: "By accessing or using PortAI (\"the Platform\"), available at portai-invest.com, you agree to be bound by these Terms of Service (\"Terms\"). If you do not agree to these Terms, do not use the Platform. These Terms constitute a legally binding agreement between you and PortAI." },

    { type: "h2", text: "2. Description of Service" },
    { type: "p", text: "PortAI is an AI-powered investment research and analysis platform that provides:" },
    { type: "ul", items: [
      "AI-generated analysis of financial articles and market data",
      "Personalized investment profile assessments via interactive quizzes",
      "AI chat advisor for investment-related questions",
      "Community forum for investment discussions with AI fact-checking",
      "Custom watchlists for tracking stocks, ETFs, and cryptocurrencies",
      "Market news curation with AI trust scoring",
    ]},

    { type: "h2", text: "3. Important Disclaimer — Not Financial Advice" },
    { type: "p", text: "**PortAI is an educational and research tool only. Nothing on this platform constitutes financial advice, investment advice, trading advice, or any other form of professional advice.**" },
    { type: "p", text: "All AI-generated content, recommendations, trust scores, investment profiles, and analysis results are provided for informational and educational purposes only. You should:" },
    { type: "ul", items: [
      "Always consult with a qualified financial advisor before making investment decisions",
      "Conduct your own independent research before investing",
      "Understand that all investments carry risk, including the risk of losing your entire investment",
      "Not rely solely on AI-generated content for investment decisions",
    ]},
    { type: "p", text: "PortAI, its creators, and affiliates are not liable for any financial losses resulting from actions taken based on information provided on the platform." },

    { type: "h2", text: "4. Account Registration" },
    { type: "p", text: "To use certain features, you must create an account. You agree to:" },
    { type: "ul", items: [
      "Provide accurate, current, and complete information during registration",
      "Maintain the security of your password and account credentials",
      "Accept responsibility for all activities under your account",
      "Notify us immediately of any unauthorized use of your account",
      "Not create multiple accounts for deceptive purposes",
    ]},
    { type: "p", text: "You must be at least 18 years old to create an account and use the Platform." },

    { type: "h2", text: "5. User Responsibilities and Acceptable Use" },
    { type: "p", text: "You agree not to:" },
    { type: "ul", items: [
      "Use the Platform for any unlawful purpose or in violation of any applicable laws",
      "Post false, misleading, or fraudulent investment information on the forum",
      "Attempt to manipulate, exploit, or game the AI systems",
      "Scrape, crawl, or use automated tools to extract data from the Platform",
      "Interfere with or disrupt the Platform's infrastructure or other users' experience",
      "Impersonate another person or entity",
      "Use the Platform to promote or facilitate pump-and-dump schemes, market manipulation, or insider trading",
      "Share your account credentials with others",
      "Reverse-engineer, decompile, or attempt to extract the source code of the Platform",
    ]},

    { type: "h2", text: "6. Prohibited Activities" },
    { type: "p", text: "In addition to the acceptable use restrictions above, the following are strictly prohibited:" },
    { type: "ul", items: [
      "Using the Platform to distribute malware, viruses, or harmful code",
      "Conducting denial-of-service attacks or overloading platform infrastructure",
      "Harvesting user data, email addresses, or personal information from the Platform",
      "Using the Platform's AI capabilities to generate spam, misinformation, or harmful content",
      "Circumventing security measures, subscription restrictions, or access controls",
      "Reselling or redistributing PortAI services without authorization",
    ]},

    { type: "h2", text: "7. User Content" },
    { type: "p", text: "You retain ownership of content you post on the Platform (forum posts, chat messages, watchlists). However, by posting content, you grant PortAI a non-exclusive, worldwide, royalty-free license to use, display, and distribute your content within the Platform." },
    { type: "p", text: "We reserve the right to remove content that violates these Terms, is flagged by our AI moderation system, or is otherwise objectionable. AI-powered fact-checking is applied to forum posts automatically, but we do not guarantee the accuracy of fact-check results." },

    { type: "h2", text: "8. AI-Generated Content" },
    { type: "p", text: "The Platform uses artificial intelligence to generate analysis, recommendations, and responses. You acknowledge that:" },
    { type: "ul", items: [
      "AI-generated content may contain errors, inaccuracies, or outdated information",
      "AI models may produce different responses to similar queries",
      "Trust scores, bias detection, and analysis results are AI assessments, not objective truth",
      "Investment quiz results are algorithmic suggestions, not personalized financial advice",
      "We do not guarantee the accuracy, completeness, or reliability of any AI output",
    ]},
  ],
  tosTail: [
    { type: "h2", text: "10. Account Termination" },
    { type: "p", text: "We may suspend or terminate your account at any time for:" },
    { type: "ul", items: [
      "Violation of these Terms of Service",
      "Engaging in prohibited activities",
      "Repeated posting of harmful or misleading content",
      "Abuse of the AI systems or platform infrastructure",
      "Non-payment of subscription fees",
      "Any other reason at our reasonable discretion",
    ]},
    { type: "p", text: "Upon termination, your right to use the Platform ceases immediately. You may request data deletion per our Privacy Policy. You may also voluntarily delete your account at any time through the settings page." },

    { type: "h2", text: "11. Limitation of Liability" },
    { type: "p", text: "To the maximum extent permitted by applicable EU and Spanish law, PortAI and its officers, directors, employees, and agents shall not be liable for:" },
    { type: "ul", items: [
      "Any indirect, incidental, special, consequential, or punitive damages",
      "Loss of profits, data, goodwill, or other intangible losses",
      "Financial losses resulting from investment decisions made using the Platform",
      "Errors or inaccuracies in AI-generated content",
      "Service interruptions, downtime, or data breaches",
    ]},
    { type: "p", text: "Our total liability for any claims arising from your use of the Platform shall not exceed the amount you paid us in the twelve (12) months preceding the claim." },

    { type: "h2", text: "12. Indemnification" },
    { type: "p", text: "You agree to indemnify, defend, and hold harmless PortAI from any claims, damages, losses, liabilities, and expenses arising from your use of the Platform, violation of these Terms, or infringement of any third-party rights." },

    { type: "h2", text: "13. Governing Law" },
    { type: "p", text: "These Terms are governed by and construed in accordance with the laws of Spain and the European Union, including the General Data Protection Regulation (GDPR). Any disputes arising from these Terms or your use of the Platform shall be subject to the exclusive jurisdiction of the courts of Spain, unless mandatory consumer protection laws in your jurisdiction require otherwise." },

    { type: "h2", text: "14. Changes to Terms" },
    { type: "p", text: "We reserve the right to modify these Terms at any time. Material changes will be communicated through the Platform or via email. Continued use of the Platform after changes constitutes acceptance of the updated Terms." },

    { type: "h2", text: "15. Contact" },
    { type: "p", text: "For questions about these Terms, contact us at:" },
    { type: "ul", items: [
      "Email: legal@portai-invest.com",
      "Website: portai-invest.com",
    ]},
  ],
};

// ─────────────────────────────────────────────────────────────────────────
// Spanish (reviewed — primary jurisdiction)
// ─────────────────────────────────────────────────────────────────────────
const es: LegalPagesCopy = {
  privacy: {
    title: "Política de Privacidad",
    pageTitleTag: "Política de Privacidad | PortAI",
    lastUpdated: "4 de abril de 2026",
    nodes: [
      { type: "h2", text: "1. Introducción" },
      { type: "p", text: "PortAI (\"nosotros\", \"nuestro\") opera la plataforma PortAI en portai-invest.com. Esta Política de Privacidad explica cómo recopilamos, utilizamos, divulgamos y protegemos tu información cuando usas nuestra plataforma de análisis de inversiones impulsada por IA. Por favor, lee esta política con atención." },

      { type: "h2", text: "2. Información que Recopilamos" },
      { type: "h3", text: "2.1 Información Personal" },
      { type: "p", text: "Cuando te registras para crear una cuenta, podemos recopilar:" },
      { type: "ul", items: [
        "Nombre y nombre para mostrar",
        "Dirección de correo electrónico",
        "Foto de perfil (si la subes)",
        "Preferencia de idioma",
        "Credenciales de autenticación (las contraseñas se almacenan cifradas y nunca en texto plano)",
      ]},
      { type: "h3", text: "2.2 Datos de Uso" },
      { type: "p", text: "Recopilamos automáticamente cierta información cuando accedes a la plataforma:" },
      { type: "ul", items: [
        "Dirección IP y geolocalización aproximada",
        "Tipo de navegador, tipo de dispositivo y sistema operativo",
        "Páginas visitadas, funciones utilizadas y tiempo de permanencia en la plataforma",
        "Consultas de búsqueda y tickers de acciones consultados",
        "Historial de conversaciones del chat de IA (almacenado por sesión de usuario)",
      ]},
      { type: "h3", text: "2.3 Información Financiera" },
      { type: "p", text: "Podemos recopilar información relacionada con tu uso de las funciones de inversión:" },
      { type: "ul", items: [
        "Composición de listas de seguimiento y selección de valores",
        "Respuestas al cuestionario y perfiles de inversión generados",
        "URLs de artículos enviados para análisis con IA",
        "Publicaciones del foro y contenido de las discusiones",
      ]},
      { type: "h3", text: "2.4 Información de Pago" },
      { type: "p", text: "Si te suscribes a las funciones premium, el procesamiento del pago lo realiza Stripe, nuestro procesador de pagos de terceros. No almacenamos números completos de tarjeta de crédito, CVV ni datos de cuentas bancarias en nuestros servidores. Podemos conservar:" },
      { type: "ul", items: [
        "Los últimos cuatro dígitos de tu tarjeta de pago",
        "Dirección de facturación",
        "Historial de transacciones y estado de la suscripción",
      ]},

      { type: "h2", text: "3. Cómo Utilizamos tu Información" },
      { type: "p", text: "Utilizamos la información que recopilamos para:" },
      { type: "ul", items: [
        "Proporcionar, mantener y mejorar la plataforma PortAI",
        "Personalizar tu experiencia, incluidas las recomendaciones generadas por IA",
        "Procesar transacciones y gestionar tu cuenta a través de Stripe",
        "Enviar correos transaccionales (verificación de cuenta, restablecimiento de contraseña, notificaciones)",
        "Analizar patrones de uso para mejorar nuestros modelos de IA y funciones de la plataforma",
        "Detectar, prevenir y abordar problemas técnicos, fraudes o abusos",
        "Cumplir con las obligaciones legales bajo el Derecho de la UE y España",
      ]},

      { type: "h2", text: "4. Procesamiento con IA" },
      { type: "p", text: "PortAI utiliza inteligencia artificial para analizar artículos financieros, generar recomendaciones de inversión, verificar publicaciones del foro e impulsar el asesor de chat IA. Tus entradas en estas funciones (preguntas, URLs, respuestas del cuestionario) son procesadas por modelos de IA para generar respuestas. Podemos usar datos de interacción anonimizados y agregados para mejorar nuestros modelos de IA. Las conversaciones individuales no se comparten con otros usuarios." },

      { type: "h2", text: "5. Servicios de Terceros" },
      { type: "p", text: "Utilizamos los siguientes servicios de terceros para operar la plataforma:" },
      { type: "ul", items: [
        "**Stripe:** Procesamiento de pagos para suscripciones premium",
        "**Infraestructura en la nube:** Alojamiento seguro de bases de datos, autenticación y servicios backend",
        "**Proveedores de modelos de IA:** Servicios de IA de terceros para generar análisis y respuestas del chat",
        "**TradingView:** Widgets de gráficos de mercado y visualización de datos financieros",
      ]},
      { type: "p", text: "Cada servicio de terceros está sujeto a su propia política de privacidad y a nuestros Acuerdos de Tratamiento de Datos." },

      { type: "h2", text: "6. Cookies y Tecnologías de Seguimiento" },
      { type: "p", text: "Usamos cookies y tecnologías similares para:" },
      { type: "ul", items: [
        "Mantener tu sesión y estado de autenticación (esenciales)",
        "Recordar tus preferencias — tema, idioma (esenciales)",
        "Analizar el uso y el rendimiento de la plataforma (opcionales)",
      ]},
      { type: "p", text: "Puedes gestionar tus preferencias de cookies a través del banner de consentimiento mostrado en tu primera visita. Las cookies esenciales necesarias para el funcionamiento de la plataforma no pueden desactivarse." },

      { type: "h2", text: "7. Compartición y Divulgación de Datos" },
      { type: "p", text: "No vendemos tu información personal. Podemos compartir tus datos con:" },
      { type: "ul", items: [
        "**Proveedores de servicios:** Alojamiento en la nube, entrega de correo, procesamiento de pagos y servicios de analítica que nos ayudan a operar la plataforma",
        "**Proveedores de modelos de IA:** Datos de consulta anonimizados pueden ser procesados por servicios de IA de terceros para generar respuestas",
        "**Requisitos legales:** Cuando lo exija la ley, una orden judicial o una autoridad gubernamental bajo la jurisdicción de la UE/España",
        "**Transferencias empresariales:** En relación con una fusión, adquisición o venta de activos",
      ]},

      { type: "h2", text: "8. Seguridad de los Datos" },
      { type: "p", text: "Implementamos medidas de seguridad estándar de la industria, entre ellas:" },
      { type: "ul", items: [
        "Cifrado de los datos en tránsito (TLS 1.2+) y en reposo (AES-256)",
        "Políticas de seguridad a nivel de fila en las tablas de la base de datos",
        "Limitación de tasa en los endpoints de la API",
        "Auditorías de seguridad y evaluaciones de vulnerabilidad periódicas",
        "Autenticación segura con contraseñas cifradas (bcrypt)",
      ]},

      { type: "h2", text: "9. Conservación de los Datos" },
      { type: "p", text: "Conservamos tus datos personales mientras tu cuenta esté activa o sea necesario para prestar nuestros servicios. Tras la eliminación de la cuenta, eliminaremos tus datos personales en un plazo de 30 días, salvo que estemos obligados a conservarlos por motivos legales o de interés legítimo. Los datos anonimizados y agregados pueden conservarse indefinidamente." },

      { type: "h2", text: "10. Tus Derechos (RGPD)" },
      { type: "p", text: "Conforme al Reglamento General de Protección de Datos, tienes derecho a:" },
      { type: "ul", items: [
        "**Acceso:** Solicitar una copia de los datos personales que tenemos sobre ti",
        "**Rectificación:** Solicitar la corrección de datos inexactos",
        "**Supresión:** Solicitar la eliminación de tus datos personales (\"derecho al olvido\")",
        "**Portabilidad:** Recibir tus datos en un formato estructurado y legible por máquina",
        "**Limitación:** Solicitar la limitación del tratamiento en determinadas circunstancias",
        "**Oposición:** Oponerte al tratamiento basado en intereses legítimos",
        "**Retirada del consentimiento:** Retirar tu consentimiento en cualquier momento cuando el tratamiento se base en él",
      ]},
      { type: "p", text: "Para ejercer estos derechos, contáctanos en privacy@portai-invest.com. Responderemos en un plazo de 30 días según exige el RGPD." },

      { type: "h2", text: "11. Transferencias Internacionales de Datos" },
      { type: "p", text: "Tus datos pueden ser transferidos y tratados en países distintos al de tu residencia. Garantizamos que se aplican salvaguardas apropiadas, incluidas las Cláusulas Contractuales Tipo (CCT) aprobadas por la Comisión Europea, para proteger tus datos conforme al RGPD." },

      { type: "h2", text: "12. Privacidad de Menores" },
      { type: "p", text: "PortAI no está dirigido a personas menores de 18 años. No recopilamos conscientemente información personal de menores. Si tenemos conocimiento de que hemos recopilado datos de un menor, tomaremos medidas para eliminarlos sin demora." },

      { type: "h2", text: "13. Cambios en esta Política" },
      { type: "p", text: "Podemos actualizar esta Política de Privacidad periódicamente. Notificaremos los cambios sustanciales publicando la política actualizada en esta página y actualizando la fecha de \"Última actualización\". El uso continuado de la plataforma tras los cambios constituye la aceptación de la política actualizada." },

      { type: "h2", text: "14. Contacto" },
      { type: "p", text: "Si tienes preguntas sobre esta Política de Privacidad, por favor contáctanos en:" },
      { type: "ul", items: [
        "Email: privacy@portai-invest.com",
        "Delegado de Protección de Datos: dpo@portai-invest.com",
        "Sitio web: portai-invest.com",
      ]},
      { type: "p", text: "También tienes derecho a presentar una reclamación ante la Agencia Española de Protección de Datos (AEPD) o tu autoridad de control local en la UE." },
    ],
  },

  dataCompliance: {
    title: "Datos y Cumplimiento",
    pageTitleTag: "Datos y Cumplimiento | PortAI",
    lastUpdated: "4 de abril de 2026",
    nodes: [
      { type: "h2", text: "1. Declaración de Cumplimiento del RGPD" },
      { type: "p", text: "PortAI se compromete plenamente a cumplir con el Reglamento General de Protección de Datos (RGPD) (UE) 2016/679. Como plataforma operada bajo la jurisdicción de España y la Unión Europea, asumimos con seriedad nuestras obligaciones bajo el RGPD y hemos implementado medidas integrales para proteger los datos de los usuarios." },
      { type: "p", text: "Actuamos como Responsable del Tratamiento de todos los datos personales recogidos a través de la plataforma PortAI. Tratamos los datos personales de forma lícita, leal y transparente, y solo para los fines específicos descritos en nuestra Política de Privacidad." },

      { type: "h2", text: "2. Cómo se Almacenan y Protegen los Datos del Usuario" },
      { type: "p", text: "Tus datos se almacenan utilizando una infraestructura en la nube líder en el sector con las siguientes protecciones:" },
      { type: "ul", items: [
        "Los datos se alojan en una infraestructura de bases de datos gestionada y segura, con conmutación por error y copias de seguridad automáticas",
        "Todo el acceso a la base de datos se rige por políticas de Seguridad a Nivel de Fila (RLS), garantizando que los usuarios solo puedan acceder a sus propios datos",
        "La autenticación a nivel de aplicación se aplica mediante tokens JWT seguros",
        "El acceso administrativo está restringido y registrado",
        "Se realizan auditorías de seguridad y evaluaciones de vulnerabilidad periódicas",
      ]},

      { type: "h2", text: "3. Estándares de Cifrado de Datos" },
      { type: "ul", items: [
        "**En tránsito:** Todos los datos transmitidos entre tu navegador y nuestros servidores se cifran con TLS 1.2+ (cifrado de 256 bits)",
        "**En reposo:** El almacenamiento de la base de datos utiliza cifrado AES-256 para todos los datos almacenados",
        "**Contraseñas:** Las contraseñas de usuario se cifran con bcrypt y sal — nunca almacenamos contraseñas en texto plano",
        "**Claves de API y secretos:** Todas las claves sensibles se almacenan en una infraestructura de bóveda segura, nunca en el código fuente",
      ]},

      { type: "h2", text: "4. Ubicación de los Datos" },
      { type: "p", text: "PortAI prioriza el alojamiento de datos dentro de la Unión Europea siempre que es posible. Nuestra infraestructura principal está alojada en centros de datos de la UE. Cuando se utilizan servicios de terceros (p. ej., proveedores de modelos de IA), garantizamos que se aplican salvaguardas apropiadas, incluidas Cláusulas Contractuales Tipo (CCT) para los datos transferidos fuera de la UE/EEE." },

      { type: "h2", text: "5. Política de Notificación de Brechas de Datos" },
      { type: "p", text: "En caso de una brecha de datos que suponga un riesgo para tus derechos y libertades, PortAI:" },
      { type: "ul", items: [
        "Notificará a la autoridad de control competente (Agencia Española de Protección de Datos — AEPD) en un plazo de **72 horas** desde el conocimiento de la brecha, conforme exige el Art. 33 del RGPD",
        "Notificará a los usuarios afectados **sin dilación indebida** si la brecha pudiera entrañar un alto riesgo para sus derechos, conforme exige el Art. 34 del RGPD",
        "Documentará la naturaleza de la brecha, las categorías de datos afectados, el número aproximado de usuarios impactados y las medidas correctivas adoptadas",
        "Adoptará medidas técnicas inmediatas para contener y mitigar la brecha",
      ]},

      { type: "h2", text: "6. Política de Compartición de Datos con Terceros" },
      { type: "p", text: "PortAI no vende tus datos personales. Solo compartimos datos con terceros cuando es necesario para operar la plataforma:" },
      { type: "ul", items: [
        "**Procesamiento de pagos:** Stripe procesa los pagos de suscripción — solo recibe datos relacionados con la facturación",
        "**Proveedores de modelos de IA:** Tus consultas al asesor de IA se envían a servicios de IA de terceros. Anonimizamos los datos cuando es posible",
        "**Entrega de correo:** Los correos transaccionales (verificación, notificaciones) se envían a través de un servicio de correo gestionado",
        "**Analítica:** Utilizamos analítica respetuosa con la privacidad para entender el uso de la plataforma. No se comparten datos personales con anunciantes",
      ]},
      { type: "p", text: "Todos los encargados del tratamiento están vinculados por Acuerdos de Tratamiento de Datos (DPA) que garantizan el cumplimiento del RGPD." },

      { type: "h2", text: "7. Proceso de Solicitud de Eliminación de Datos" },
      { type: "p", text: "Conforme al Art. 17 del RGPD (Derecho de Supresión), tienes derecho a solicitar la eliminación de tus datos personales. Para solicitar la eliminación:" },
      { type: "ol", items: [
        "Envía un correo a **privacy@portai-invest.com** desde la dirección asociada a tu cuenta",
        "Incluye en el asunto: \"Solicitud de Eliminación de Datos\"",
        "Verificaremos tu identidad y procesaremos la solicitud en un plazo de **30 días**",
      ]},
      { type: "p", text: "Tras la eliminación, retiraremos:" },
      { type: "ul", items: [
        "La información de tu cuenta y perfil",
        "Historial de chat y datos de conversaciones con la IA",
        "Listas de seguimiento y preferencias de inversión",
        "Publicaciones del foro (anonimizadas en lugar de eliminadas para preservar el contexto de la discusión)",
        "Analítica de uso vinculada a tu cuenta",
      ]},
      { type: "p", text: "Ciertos datos pueden conservarse cuando lo exija la ley (p. ej., registros de transacciones por motivos fiscales/contables) por el período mínimo legalmente requerido." },

      { type: "h2", text: "8. Tus Derechos RGPD" },
      { type: "p", text: "Como interesado, tienes derecho a:" },
      { type: "ul", items: [
        "**Acceso** — Solicitar una copia de todos los datos personales que tenemos sobre ti",
        "**Rectificación** — Solicitar la corrección de datos inexactos o incompletos",
        "**Supresión** — Solicitar la eliminación de tus datos personales",
        "**Limitación** — Solicitar que limitemos el tratamiento de tus datos",
        "**Portabilidad** — Recibir tus datos en un formato estructurado y legible por máquina",
        "**Oposición** — Oponerte al tratamiento basado en intereses legítimos",
        "**Retirada del consentimiento** — Retirar el consentimiento en cualquier momento sin afectar a la licitud del tratamiento previo",
      ]},
      { type: "p", text: "Para ejercer cualquiera de estos derechos, contáctanos en **privacy@portai-invest.com**." },

      { type: "h2", text: "9. Delegado de Protección de Datos" },
      { type: "p", text: "Para cualquier pregunta o inquietud sobre la protección de datos, puedes contactar con nuestro Delegado de Protección de Datos:" },
      { type: "ul", items: [
        "Email: dpo@portai-invest.com",
        "Dirección: PortAI, España (UE)",
      ]},
      { type: "p", text: "También tienes derecho a presentar una reclamación ante la Agencia Española de Protección de Datos (AEPD) o tu autoridad de control local en la UE." },
    ],
  },

  ipPolicy: {
    title: "Política de Propiedad Intelectual",
    pageTitleTag: "Política de Propiedad Intelectual | PortAI",
    lastUpdated: "4 de abril de 2026",
    nodes: [
      { type: "h2", text: "1. Titularidad del Contenido y la Plataforma de PortAI" },
      { type: "p", text: "Todo el contenido, las funcionalidades, la funcionalidad, el diseño, el código fuente, los algoritmos, los modelos de IA, los gráficos, los logotipos, las marcas y la identidad de marca asociados a PortAI son propiedad intelectual exclusiva de PortAI y sus licenciantes. Esto incluye, sin limitación:" },
      { type: "ul", items: [
        "El nombre, el logotipo y la identidad visual de PortAI",
        "El diseño de la interfaz y la experiencia de usuario de la plataforma",
        "Los algoritmos de análisis con IA y los sistemas de puntuación de confianza",
        "La metodología del cuestionario de inversión y el motor de recomendación",
        "Todo el texto, los gráficos y los archivos multimedia originales creados por PortAI",
      ]},
      { type: "p", text: "Estos materiales están protegidos por las leyes de derechos de autor, marcas, patentes, secretos comerciales y otras leyes de propiedad intelectual de España, la Unión Europea y los tratados internacionales." },

      { type: "h2", text: "2. Contenido Generado por el Usuario" },
      { type: "p", text: "Los usuarios conservan la titularidad del contenido original que crean y publican en la Plataforma, incluidas las publicaciones del foro, los comentarios y las configuraciones de listas de seguimiento. Al publicar contenido en PortAI, nos otorgas una licencia no exclusiva, mundial, libre de regalías y sublicenciable para:" },
      { type: "ul", items: [
        "Mostrar, distribuir y reproducir el contenido dentro de la Plataforma",
        "Utilizar el contenido para mejorar nuestros modelos y servicios de IA (en forma anonimizada y agregada)",
        "Moderar, editar o eliminar contenido que infrinja nuestras Condiciones de Servicio",
      ]},
      { type: "p", text: "Esta licencia termina cuando elimines el contenido o tu cuenta, salvo en lo que respecta al contenido que haya sido compartido, citado o incorporado en discusiones del foro por otros usuarios." },

      { type: "h2", text: "3. Notificación de Infracciones de Propiedad Intelectual" },
      { type: "p", text: "Si crees que algún contenido en PortAI infringe tus derechos de propiedad intelectual, por favor contáctanos con la siguiente información:" },
      { type: "ul", items: [
        "Una descripción de la obra protegida o del derecho de PI que se considera infringido",
        "La ubicación (URL o descripción) del material presuntamente infractor en nuestra Plataforma",
        "Tu información de contacto (nombre, email, dirección postal, teléfono)",
        "Una declaración de que tienes la creencia de buena fe de que el uso no está autorizado por el titular de los derechos",
        "Una declaración, bajo pena de perjurio, de que la información en tu notificación es exacta y de que estás autorizado para actuar en nombre del titular de los derechos",
        "Tu firma física o electrónica",
      ]},
      { type: "p", text: "Envía las notificaciones de infracción de PI a: **legal@portai-invest.com**" },

      { type: "h2", text: "4. Procedimiento de Retirada (DMCA)" },
      { type: "p", text: "Aunque PortAI opera bajo el Derecho de la UE y España, cumplimos voluntariamente con el espíritu de la US Digital Millennium Copyright Act (DMCA) para proteger la propiedad intelectual. Nuestro procedimiento de retirada:" },
      { type: "ol", items: [
        "**Notificación:** Envía una notificación de infracción completa a legal@portai-invest.com",
        "**Revisión:** Revisaremos la notificación en un plazo de 5 días hábiles",
        "**Acción:** Si es válida, el contenido infractor será eliminado o deshabilitado sin demora",
        "**Aviso:** Se notificará al usuario que publicó el contenido sobre la retirada",
        "**Contranotificación:** El usuario podrá presentar una contranotificación si considera que la retirada fue un error",
        "**Resolución:** Si no se recibe contranotificación en un plazo de 10 días hábiles, la retirada es definitiva",
      ]},
      { type: "p", text: "Los infractores reincidentes pueden ver sus cuentas suspendidas." },

      { type: "h2", text: "5. Uso Prohibido de la Marca PortAI" },
      { type: "p", text: "Sin permiso previo por escrito de PortAI, no podrás:" },
      { type: "ul", items: [
        "Utilizar el nombre, el logotipo o la marca de PortAI en ningún producto, servicio o material de marketing",
        "Crear obras derivadas basadas en el diseño o la identidad visual de PortAI",
        "Sugerir un respaldo, una asociación o una afiliación con PortAI",
        "Utilizar las marcas de PortAI en nombres de dominio, identificadores de redes sociales o publicidad",
        "Reproducir o distribuir capturas de pantalla de la Plataforma con fines comerciales",
      ]},
      { type: "p", text: "Se permite el uso limitado para reportajes, reseñas y comentarios educativos al amparo de los principios de uso legítimo / cita justa." },

      { type: "h2", text: "6. Aviso sobre Contenido Generado por IA" },
      { type: "p", text: "PortAI utiliza inteligencia artificial para generar análisis, recomendaciones, verificaciones de hechos y respuestas. Información importante sobre el contenido generado por IA:" },
      { type: "ul", items: [
        "El contenido generado por IA no representa las opiniones ni los puntos de vista de PortAI",
        "Las salidas de la IA pueden contener errores, alucinaciones o información desactualizada",
        "Los usuarios deben verificar de forma independiente toda la información generada por IA antes de actuar en consecuencia",
        "El análisis de inversión generado por IA no constituye asesoramiento financiero",
        "PortAI no reclama derechos de autor sobre las respuestas generadas por IA proporcionadas a usuarios individuales",
        "Los modelos de IA, los prompts y los sistemas utilizados para generar las salidas siguen siendo propiedad intelectual de PortAI",
      ]},

      { type: "h2", text: "7. Código Abierto y Licencias de Terceros" },
      { type: "p", text: "PortAI incorpora componentes de software de código abierto. Todas las bibliotecas y herramientas de terceros utilizadas en la Plataforma se utilizan de conformidad con sus respectivas licencias. Una lista de las principales dependencias de código abierto y sus licencias está disponible bajo solicitud en legal@portai-invest.com." },

      { type: "h2", text: "8. Contacto" },
      { type: "p", text: "Para consultas sobre propiedad intelectual, contacta:" },
      { type: "ul", items: [
        "Email: legal@portai-invest.com",
        "Sitio web: portai-invest.com",
      ]},
    ],
  },

  accessibility: {
    title: "Declaración de Accesibilidad",
    pageTitleTag: "Declaración de Accesibilidad | PortAI",
    lastUpdated: "22 de agosto de 2026",
    nodes: [
      { type: "h2", text: "1. Nuestro Compromiso" },
      { type: "p", text: "PortAI está comprometido con hacer que su plataforma de inversión impulsada por IA sea accesible y utilizable para todos, incluidas las personas con discapacidad. Nuestro objetivo es cumplir o superar las Directrices de Accesibilidad para el Contenido Web (WCAG) 2.1 Nivel AA y seguir mejorando la accesibilidad de nuestro producto, contenido y servicios." },

      { type: "h2", text: "2. Medidas de Accesibilidad" },
      { type: "p", text: "Para garantizar una experiencia inclusiva, hemos implementado las siguientes medidas:" },
      { type: "ul", items: [
        "HTML semántico y puntos de referencia ARIA para ayudar a los usuarios de lectores de pantalla a navegar por las páginas",
        "Navegación y controles interactivos accesibles por teclado en toda la plataforma",
        "Etiquetas descriptivas en botones, enlaces y campos de formulario, incluidos los controles que solo muestran un icono",
        "Contraste de color que cumple los umbrales WCAG AA para texto y elementos interactivos",
        "Diseños responsivos que se adaptan al zoom, a la magnificación y a lectores de pantalla móviles",
        "Indicadores de foco que hacen visible el elemento interactivo actual",
        "Un enlace 'Saltar al contenido' para una navegación rápida por teclado más allá de los menús repetidos",
        "Soporte para reducir el movimiento para usuarios que prefieren menos animación",
      ]},

      { type: "h2", text: "3. Funciones Accesibles" },
      { type: "p", text: "Las áreas principales de la plataforma se han diseñado teniendo en cuenta la accesibilidad:" },
      { type: "ul", items: [
        "Todos los gráficos y visualizaciones de datos exponen sus valores subyacentes en texto y tablas cuando es posible",
        "Los resultados del análisis de artículos están estructurados con encabezados y listas para facilitar el escaneado con lectores de pantalla",
        "El menú de navegación, el diálogo de búsqueda y los ajustes son operables con teclado y tecnología de asistencia",
        "Los errores de validación de formularios están asociados a sus campos y se anuncian claramente",
        "Los flujos de autenticación, suscripción y facturación son compatibles con teclado y lectores de pantalla",
      ]},

      { type: "h2", text: "4. Limitaciones Conocidas" },
      { type: "p", text: "Algunos contenidos de terceros y widgets integrados pueden no cumplir plenamente con WCAG 2.1 Nivel AA. Ejemplos:" },
      { type: "ul", items: [
        "Widgets de gráficos y datos de mercado de terceros que gestionan su propio renderizado y foco",
        "Contenido de artículos de noticias externas cargado mediante enlaces o previsualizaciones, sobre el que no tenemos control",
        "Vídeos incrustados o contenido de redes sociales si se añaden a nuestras páginas de marketing en el futuro",
      ]},
      { type: "p", text: "Cuando detectamos problemas de accesibilidad en componentes de terceros, los reportamos al proveedor y proporcionamos alternativas cuando es viable." },

      { type: "h2", text: "5. Comentarios y Asistencia" },
      { type: "p", text: "Agradecemos sus comentarios sobre accesibilidad. Si encuentra barreras, necesita información en un formato diferente o tiene sugerencias de mejora, contacte con nosotros:" },
      { type: "ul", items: [
        "Email: accessibility@portai-invest.com",
        "Sitio web: portai-invest.com",
      ]},
      { type: "p", text: "Nuestro objetivo es responder a las consultas de accesibilidad en un plazo de **5 días hábiles** y resolver los problemas verificables de manera oportuna." },

      { type: "h2", text: "6. Evaluación y Pruebas" },
      { type: "p", text: "La accesibilidad se evalúa mediante una combinación de pruebas automatizadas, navegación manual por teclado y verificaciones con lectores de pantalla. Revisamos las actualizaciones importantes y las nuevas funciones en cuanto a accesibilidad antes de su lanzamiento y resolvemos los problemas a medida que se reportan." },

      { type: "h2", text: "7. Herramientas de Terceros y Tecnología de Asistencia" },
      { type: "p", text: "PortAI está diseñado para funcionar con navegadores modernos y tecnologías de asistencia, incluyendo:" },
      { type: "ul", items: [
        "Lectores de pantalla como NVDA, JAWS, VoiceOver y TalkBack",
        "Navegación solo con teclado y zoom estándar del navegador hasta el 200%",
        "Software de control por voz y dispositivos conmutadores en plataformas compatibles",
      ]},
      { type: "p", text: "Para la mejor experiencia, recomendamos usar la última versión de su navegador y tecnología de asistencia." },

      { type: "h2", text: "8. Cambios en Esta Declaración" },
      { type: "p", text: "Podemos actualizar esta Declaración de Accesibilidad a medida que mejoramos la plataforma. Los cambios se publicarán en esta página con una fecha de 'Última actualización' actualizada." },
    ],
  },

  tosTitle: "Condiciones de Servicio",
  tosPageTitleTag: "Condiciones de Servicio | PortAI",
  tosLastUpdated: "4 de abril de 2026",
  tosIntro: [
    { type: "h2", text: "1. Aceptación de las Condiciones" },
    { type: "p", text: "Al acceder o utilizar PortAI (\"la Plataforma\"), disponible en portai-invest.com, aceptas quedar vinculado por estas Condiciones de Servicio (\"Condiciones\"). Si no estás de acuerdo con estas Condiciones, no utilices la Plataforma. Estas Condiciones constituyen un contrato legalmente vinculante entre tú y PortAI." },

    { type: "h2", text: "2. Descripción del Servicio" },
    { type: "p", text: "PortAI es una plataforma de investigación y análisis de inversiones impulsada por IA que ofrece:" },
    { type: "ul", items: [
      "Análisis generado por IA de artículos financieros y datos de mercado",
      "Evaluaciones personalizadas del perfil de inversión mediante cuestionarios interactivos",
      "Asesor de chat IA para preguntas relacionadas con inversiones",
      "Foro comunitario para debates de inversión con verificación de hechos por IA",
      "Listas de seguimiento personalizadas para acciones, ETFs y criptomonedas",
      "Curación de noticias del mercado con puntuación de confianza por IA",
    ]},

    { type: "h2", text: "3. Aviso Importante — No Constituye Asesoramiento Financiero" },
    { type: "p", text: "**PortAI es exclusivamente una herramienta educativa y de investigación. Nada en esta plataforma constituye asesoramiento financiero, asesoramiento de inversión, asesoramiento de trading ni ninguna otra forma de asesoramiento profesional.**" },
    { type: "p", text: "Todo el contenido, recomendaciones, puntuaciones de confianza, perfiles de inversión y resultados de análisis generados por IA se proporcionan únicamente con fines informativos y educativos. Debes:" },
    { type: "ul", items: [
      "Consultar siempre con un asesor financiero cualificado antes de tomar decisiones de inversión",
      "Realizar tu propia investigación independiente antes de invertir",
      "Comprender que toda inversión conlleva riesgos, incluido el riesgo de perder la totalidad de la inversión",
      "No basarte únicamente en el contenido generado por IA para tomar decisiones de inversión",
    ]},
    { type: "p", text: "PortAI, sus creadores y afiliados no son responsables de pérdidas financieras derivadas de acciones tomadas con base en la información proporcionada en la plataforma." },

    { type: "h2", text: "4. Registro de Cuenta" },
    { type: "p", text: "Para utilizar determinadas funciones, debes crear una cuenta. Aceptas:" },
    { type: "ul", items: [
      "Proporcionar información exacta, actual y completa durante el registro",
      "Mantener la seguridad de tu contraseña y credenciales de cuenta",
      "Aceptar la responsabilidad de todas las actividades realizadas bajo tu cuenta",
      "Notificarnos inmediatamente cualquier uso no autorizado de tu cuenta",
      "No crear múltiples cuentas con fines fraudulentos",
    ]},
    { type: "p", text: "Debes tener al menos 18 años para crear una cuenta y utilizar la Plataforma." },

    { type: "h2", text: "5. Responsabilidades del Usuario y Uso Aceptable" },
    { type: "p", text: "Aceptas no:" },
    { type: "ul", items: [
      "Utilizar la Plataforma para ningún fin ilícito o en violación de las leyes aplicables",
      "Publicar información de inversión falsa, engañosa o fraudulenta en el foro",
      "Intentar manipular, explotar o engañar a los sistemas de IA",
      "Hacer scraping, rastrear o utilizar herramientas automatizadas para extraer datos de la Plataforma",
      "Interferir o alterar la infraestructura de la Plataforma o la experiencia de otros usuarios",
      "Suplantar a otra persona o entidad",
      "Utilizar la Plataforma para promover o facilitar esquemas pump-and-dump, manipulación de mercado o uso de información privilegiada",
      "Compartir tus credenciales de cuenta con terceros",
      "Realizar ingeniería inversa, descompilar o intentar extraer el código fuente de la Plataforma",
    ]},

    { type: "h2", text: "6. Actividades Prohibidas" },
    { type: "p", text: "Además de las restricciones de uso aceptable anteriores, queda estrictamente prohibido:" },
    { type: "ul", items: [
      "Utilizar la Plataforma para distribuir malware, virus o código dañino",
      "Realizar ataques de denegación de servicio o sobrecargar la infraestructura de la plataforma",
      "Recolectar datos de usuarios, direcciones de correo o información personal desde la Plataforma",
      "Utilizar las capacidades de IA de la Plataforma para generar spam, desinformación o contenido dañino",
      "Eludir medidas de seguridad, restricciones de suscripción o controles de acceso",
      "Revender o redistribuir los servicios de PortAI sin autorización",
    ]},

    { type: "h2", text: "7. Contenido del Usuario" },
    { type: "p", text: "Conservas la titularidad del contenido que publicas en la Plataforma (publicaciones del foro, mensajes de chat, listas de seguimiento). No obstante, al publicar contenido, otorgas a PortAI una licencia no exclusiva, mundial y libre de regalías para utilizar, mostrar y distribuir tu contenido dentro de la Plataforma." },
    { type: "p", text: "Nos reservamos el derecho a eliminar contenido que infrinja estas Condiciones, sea marcado por nuestro sistema de moderación con IA o sea de otro modo objetable. La verificación automática de hechos por IA se aplica a las publicaciones del foro, pero no garantizamos la exactitud de los resultados." },

    { type: "h2", text: "8. Contenido Generado por IA" },
    { type: "p", text: "La Plataforma utiliza inteligencia artificial para generar análisis, recomendaciones y respuestas. Reconoces que:" },
    { type: "ul", items: [
      "El contenido generado por IA puede contener errores, inexactitudes o información desactualizada",
      "Los modelos de IA pueden producir respuestas distintas a consultas similares",
      "Las puntuaciones de confianza, la detección de sesgo y los resultados de análisis son evaluaciones de la IA, no verdades objetivas",
      "Los resultados del cuestionario de inversión son sugerencias algorítmicas, no asesoramiento financiero personalizado",
      "No garantizamos la exactitud, completitud o fiabilidad de ninguna salida de la IA",
    ]},
  ],
  tosTail: [
    { type: "h2", text: "10. Cancelación de Cuenta" },
    { type: "p", text: "Podemos suspender o cancelar tu cuenta en cualquier momento por:" },
    { type: "ul", items: [
      "Infracción de estas Condiciones de Servicio",
      "Realización de actividades prohibidas",
      "Publicación reiterada de contenido dañino o engañoso",
      "Abuso de los sistemas de IA o de la infraestructura de la plataforma",
      "Impago de las cuotas de suscripción",
      "Cualquier otra causa a nuestra razonable discreción",
    ]},
    { type: "p", text: "Tras la cancelación, tu derecho a usar la Plataforma cesa inmediatamente. Podrás solicitar la eliminación de datos conforme a nuestra Política de Privacidad. También puedes eliminar tu cuenta voluntariamente en cualquier momento desde la página de ajustes." },

    { type: "h2", text: "11. Limitación de Responsabilidad" },
    { type: "p", text: "En la máxima medida permitida por la legislación aplicable de la UE y España, PortAI y sus directivos, consejeros, empleados y agentes no serán responsables de:" },
    { type: "ul", items: [
      "Cualesquiera daños indirectos, incidentales, especiales, consecuentes o punitivos",
      "Pérdida de beneficios, datos, fondo de comercio u otras pérdidas intangibles",
      "Pérdidas financieras derivadas de decisiones de inversión tomadas utilizando la Plataforma",
      "Errores o inexactitudes en el contenido generado por IA",
      "Interrupciones del servicio, caídas o brechas de datos",
    ]},
    { type: "p", text: "Nuestra responsabilidad total por cualquier reclamación derivada de tu uso de la Plataforma no excederá del importe que nos hayas pagado en los doce (12) meses anteriores a la reclamación." },

    { type: "h2", text: "12. Indemnización" },
    { type: "p", text: "Aceptas indemnizar, defender y mantener indemne a PortAI frente a cualquier reclamación, daño, pérdida, responsabilidad y gasto derivados de tu uso de la Plataforma, del incumplimiento de estas Condiciones o de la infracción de derechos de terceros." },

    { type: "h2", text: "13. Ley Aplicable" },
    { type: "p", text: "Estas Condiciones se rigen e interpretan conforme a las leyes de España y de la Unión Europea, incluido el Reglamento General de Protección de Datos (RGPD). Cualquier controversia derivada de estas Condiciones o de tu uso de la Plataforma se someterá a la jurisdicción exclusiva de los tribunales de España, salvo que la legislación imperativa de protección al consumidor de tu jurisdicción exija lo contrario." },

    { type: "h2", text: "14. Cambios en las Condiciones" },
    { type: "p", text: "Nos reservamos el derecho a modificar estas Condiciones en cualquier momento. Los cambios sustanciales se comunicarán a través de la Plataforma o por correo electrónico. El uso continuado de la Plataforma tras los cambios constituye la aceptación de las Condiciones actualizadas." },

    { type: "h2", text: "15. Contacto" },
    { type: "p", text: "Para preguntas sobre estas Condiciones, contáctanos en:" },
    { type: "ul", items: [
      "Email: legal@portai-invest.com",
      "Sitio web: portai-invest.com",
    ]},
  ],
};

const TABLE: Partial<Record<Language, LegalPagesCopy>> = { en, es };

export const getLegalPagesCopy = (lang: Language): LegalPagesCopy =>
  TABLE[lang] ?? en;
