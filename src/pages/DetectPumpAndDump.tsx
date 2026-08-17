import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const URL = "https://portai-invest.com/blog/how-to-detect-pump-and-dump-schemes";
const TITLE = "How to Detect Pump and Dump Schemes (2026 Guide)";
const DESCRIPTION =
  "A practical guide to detect pump and dump schemes: the tactics promoters use, the red flags in price, volume and filings, and how to verify bullish news before you trade.";

const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: TITLE,
  description: DESCRIPTION,
  mainEntityOfPage: URL,
  author: { "@type": "Organization", name: "PortAI" },
  publisher: {
    "@type": "Organization",
    name: "PortAI",
    logo: { "@type": "ImageObject", url: "https://portai-invest.com/logo.png" },
  },
  datePublished: "2026-08-17",
  dateModified: "2026-08-17",
};

const breadcrumbsJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://portai-invest.com/" },
    { "@type": "ListItem", position: 2, name: "Blog", item: "https://portai-invest.com/blog" },
    { "@type": "ListItem", position: 3, name: "How to Detect Pump and Dump Schemes", item: URL },
  ],
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is a pump and dump scheme?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "A pump and dump is a manipulation scheme where promoters inflate the price of a thinly traded stock with misleading or exaggerated positive claims, then sell their own shares into the buying they created, leaving later buyers with losses.",
      },
    },
    {
      "@type": "Question",
      name: "What are the biggest red flags of a pump and dump?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Micro-cap or shell company, sudden volume spike with no verifiable news, urgency language such as 'before it explodes', paid promotional disclaimers, heavy share dilution or recent reverse splits, and claims that appear on no independent news source.",
      },
    },
    {
      "@type": "Question",
      name: "How can I verify bullish news before trading?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Trace the claim to a primary source such as a regulatory filing or a signed customer contract, check whether independent outlets report the same facts, read the disclosure at the bottom of the article, and compare the claimed impact to the company's actual revenue.",
      },
    },
  ],
};

export default function DetectPumpAndDump() {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{TITLE}</title>
        <meta name="description" content={DESCRIPTION} />
        <link rel="canonical" href={URL} />
        <meta property="og:title" content={TITLE} />
        <meta property="og:description" content={DESCRIPTION} />
        <meta property="og:url" content={URL} />
        <meta property="og:type" content="article" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={TITLE} />
        <meta name="twitter:description" content={DESCRIPTION} />
        <script type="application/ld+json">{JSON.stringify(articleJsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbsJsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script>
      </Helmet>

      <nav className="flex items-center justify-between px-6 py-5 max-w-4xl mx-auto">
        <Link to="/" className="flex items-center gap-2.5">
          <img src="/logo.png" alt="PortAI logo" className="h-9 w-9 rounded-lg" />
          <span className="text-lg font-bold text-foreground">PortAI</span>
        </Link>
        <Link to="/" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
      </nav>

      <main className="px-6 py-10 max-w-3xl mx-auto">
        <p className="text-xs uppercase tracking-wider text-primary mb-2">Investor safety guide</p>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3 leading-tight">
          How to Detect Pump and Dump Schemes Before You Buy
        </h1>
        <p className="text-sm text-muted-foreground mb-8">Published August 17, 2026 · ~9 min read</p>

        <div className="prose prose-sm prose-invert max-w-none space-y-6 text-muted-foreground [&_h2]:text-foreground [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-10 [&_h2]:mb-3 [&_h3]:text-foreground [&_h3]:text-base [&_h3]:font-medium [&_h3]:mt-6 [&_h3]:mb-2 [&_p]:leading-relaxed [&_ul]:space-y-1 [&_ol]:space-y-1 [&_li]:leading-relaxed [&_strong]:text-foreground">
          <p>
            A pump and dump works because the story arrives before the evidence. Promoters push a
            <strong> thinly traded stock</strong> with exaggerated or fabricated bullish claims, retail buyers pile in,
            and the promoters sell into that demand. By the time the claims are checked, the price is back where it
            started — or lower.
          </p>
          <p>
            The good news: these schemes leave a consistent fingerprint across <strong>the stock, the story, and the
            source</strong>. This guide walks through each, then gives you a verification checklist you can run in a
            few minutes before any trade.
          </p>

          <h2>1. Red flags in the stock itself</h2>
          <ul>
            <li><strong>Micro-cap, low float, low liquidity.</strong> Manipulation needs a stock small enough to move.
              Sub-$300M market caps, OTC listings and shell companies are the usual targets.</li>
            <li><strong>Volume spike without a filing.</strong> A 10–50x jump in daily volume with nothing new in the
              company's regulatory filings means the buying came from a narrative, not from business news.</li>
            <li><strong>A vertical move with no pullback.</strong> Parabolic candles over a few sessions, then a
              stall — classic distribution shape.</li>
            <li><strong>Recent dilution or a reverse split.</strong> Repeated share issuance, convertible notes, or a
              reverse split shortly before the run means insiders may have cheap stock to sell.</li>
            <li><strong>A brand-new business pivot.</strong> A dormant company suddenly announcing AI, crypto,
              quantum or lithium is a recurring pattern.</li>
          </ul>

          <h2>2. Red flags in the story</h2>
          <p>Manipulative copy has a recognisable register. Watch for:</p>
          <ul>
            <li><strong>Urgency and scarcity.</strong> "Before it explodes", "last chance", "loading up now".</li>
            <li><strong>Certainty without numbers.</strong> Price targets with no model, revenue implications with
              no contract value, "guaranteed" or "can't lose".</li>
            <li><strong>Unnamed sources.</strong> "Sources say a major partnership is imminent" with no counterparty,
              no filing, no press release from the other side.</li>
            <li><strong>Comparison inflation.</strong> "The next NVIDIA", "the Tesla of mining" — analogies doing the
              work that evidence should.</li>
            <li><strong>No counter-argument at all.</strong> Legitimate analysis names the risks. Promotional copy
              never does.</li>
            <li><strong>Total-addressable-market maths.</strong> "A $2 trillion market" attached to a company with
              $1M in revenue and no signed customers.</li>
          </ul>

          <h2>3. Red flags in the source</h2>
          <ul>
            <li><strong>Paid promotion disclaimers.</strong> Scroll to the bottom. Wording like "we have been
              compensated $X by a third party for investor awareness services" is a disclosure of paid promotion,
              and it is the single strongest signal you will find.</li>
            <li><strong>Author is long and undisclosed.</strong> Or long with a disclosure buried below the fold.</li>
            <li><strong>Syndicated everywhere at once.</strong> The identical text on ten low-authority sites within
              an hour is a distribution campaign, not journalism.</li>
            <li><strong>No independent coverage.</strong> If Reuters, Bloomberg, AP, or the exchange itself have
              nothing, the news effectively does not exist.</li>
            <li><strong>Newsletter, DM, or group chat origin.</strong> Cold outreach with a specific ticker is the
              oldest form of this scheme, now running on Telegram, Discord and short-form video.</li>
          </ul>

          <h2>4. The five-minute verification checklist</h2>
          <ol>
            <li><strong>Find the primary source.</strong> Trace every claim to a regulatory filing, a company press
              release, or a named counterparty announcement. No primary source, no trade.</li>
            <li><strong>Check for independent confirmation.</strong> Search the claim itself, not the ticker. At
              least one credible outlet reporting the same facts independently.</li>
            <li><strong>Read the disclosure.</strong> Bottom of the article, always. Paid promotion or an undisclosed
              long position ends the analysis.</li>
            <li><strong>Size the claim against the financials.</strong> Compare the announced deal or market to
              existing revenue and cash. If the claim is 100x the business, it needs 100x the evidence.</li>
            <li><strong>Check who can sell.</strong> Share count trend, recent registrations, insider transactions,
              and any lock-up expiry.</li>
            <li><strong>Wait one session.</strong> Real news survives a day. Manufactured news usually does not.</li>
          </ol>

          <h2>5. How PortAI helps you spot the narrative</h2>
          <p>
            PortAI's <strong>AI bias and misinformation analysis</strong> is built for exactly step 2 and step 3 of
            that checklist. Paste an article or news link into the Fact Check tool and it returns:
          </p>
          <ul>
            <li><strong>Bias direction and strength</strong> — how far the framing leans bullish versus what the
              evidence supports.</li>
            <li><strong>Misinformation risk</strong> — flags claims that no independent source corroborates.</li>
            <li><strong>Cross-source verification</strong> — pulls related coverage so you can see whether the story
              exists outside the promotional channel.</li>
            <li><strong>"Why we're saying this"</strong> — the specific language, framing and omissions that drove
              the score, so you can judge the reasoning yourself rather than trusting a number.</li>
            <li><strong>Missing counter-arguments</strong> — the risks a promotional piece leaves out.</li>
          </ul>
          <p>
            It does not tell you whether to buy. It tells you whether the story you are about to act on is
            evidence-backed or manufactured — which, for a suspected pump, is the whole question.
          </p>

          <h2>If you think you are looking at a pump</h2>
          <ul>
            <li>Do not buy the spike, and do not try to "trade the pump" — the exit is the part that fails.</li>
            <li>Do not short blindly either; low-float squeezes can run far past reason and borrow is expensive.</li>
            <li>Report suspected manipulation to your market regulator (the SEC in the US, the FCA in the UK,
              the CNMV in Spain, or ESMA-linked national authorities in the EU).</li>
          </ul>

          <h2>Bottom line</h2>
          <p>
            Pump and dumps are detectable because they must be loud. A small illiquid stock, a spike no filing
            explains, urgent copy with no counter-argument, and a source with a compensation disclaimer is a complete
            pattern — you rarely need more than that. Run the checklist, and{" "}
            <Link to="/" className="text-primary hover:underline">let PortAI check the article</Link> before your money
            does.
          </p>

          <p>
            See also:{" "}
            <Link to="/compare/best-stock-advisor-services" className="text-primary hover:underline">
              Best stock advisor services compared through a bias lens
            </Link>{" "}
            and{" "}
            <Link to="/compare/seeking-alpha-vs-motley-fool" className="text-primary hover:underline">
              Seeking Alpha vs Motley Fool bias
            </Link>
            .
          </p>

          <p className="text-xs text-muted-foreground border-t border-border pt-6 mt-10">
            Not financial advice. Educational content on identifying market manipulation patterns, not a
            recommendation to buy, sell, or short any security.
          </p>
        </div>
      </main>

      <footer className="border-t border-border px-6 py-6">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} PortAI</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link to="/privacy-policy" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Privacy</Link>
            <Link to="/terms-of-service" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
