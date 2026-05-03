import { Brain, BarChart3, MessageSquare, Eye, ArrowRight, Sparkles, LayoutDashboard, Shield, Globe, ChevronRight, Zap, ShieldCheck, Lock, Fingerprint, CheckCircle2, ChevronDown, Search, Activity, Database, CreditCard, Cpu } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLanguage, type Language } from "@/contexts/LanguageContext";

const supportingFeatures = [
  { icon: LayoutDashboard, key: "marketIntelligence", desc: "Live S&P 500 heatmap and curated news feed." },
  { icon: Brain, key: "aiChat", desc: "Personal AI advisor for stocks, ETFs and strategy." },
  { icon: Sparkles, key: "quiz", desc: "Personalized portfolio quiz in 5 questions." },
  { icon: Eye, key: "watchlists", desc: "Track 10,000+ assets across 20+ countries." },
  { icon: MessageSquare, key: "forum", desc: "Community media-bias dashboard, live." },
  { icon: Globe, key: "settings", desc: "Available in 6 languages, instantly switchable." },
];

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("animate-in");
          observer.unobserve(el);
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
}

const RevealSection = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
  const ref = useScrollReveal();
  return (
    <div ref={ref} className={`scroll-reveal ${className}`}>
      {children}
    </div>
  );
};

const LandingPage = ({ onGetStarted }: { onGetStarted: () => void }) => {
  const { t, language, setLanguage, languageNames } = useLanguage();
  const [url, setUrl] = useState("");
  const [langOpen, setLangOpen] = useState(false);

  useEffect(() => {
    document.title = "PortAI | AI Financial News Bias Checker & Portfolio Tracker";
  }, []);

  const handleAnalyze = () => {
    const trimmed = url.trim();
    if (trimmed) {
      try {
        sessionStorage.setItem("pendingAnalyzeUrl", trimmed);
      } catch { /* ignore */ }
    }
    onGetStarted();
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden noise-overlay">
      <style>{`
        .scroll-reveal {
          opacity: 0;
          transform: translateY(18px);
          filter: blur(4px);
          transition: opacity 650ms cubic-bezier(0.16, 1, 0.3, 1),
                      transform 650ms cubic-bezier(0.16, 1, 0.3, 1),
                      filter 650ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        .scroll-reveal.animate-in {
          opacity: 1;
          transform: translateY(0);
          filter: blur(0);
        }
        @keyframes hero-pulse {
          0%, 100% { box-shadow: 0 0 0 0 hsl(var(--primary) / 0.5), 0 0 0 0 hsl(var(--primary) / 0.25); }
          50% { box-shadow: 0 0 0 10px hsl(var(--primary) / 0), 0 0 0 22px hsl(var(--primary) / 0); }
        }
        .hero-input-pulse {
          animation: hero-pulse 2.4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>

      {/* Top promo banner */}
      <div className="bg-primary text-primary-foreground px-4 py-2 text-center text-xs sm:text-sm font-semibold tracking-wide">
        <span className="inline-flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5" />
          {t("landingBanner")}
        </span>
      </div>

      {/* Nav */}
      <nav className="flex items-center justify-between px-4 sm:px-6 py-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-2.5">
          <img src="/logo.png" alt="PortAI" className="h-9 w-9 rounded-lg" />
          <span className="text-lg font-bold text-foreground">PortAI</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Language switcher */}
          <div className="relative">
            <button
              onClick={() => setLangOpen((o) => !o)}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-card/60 px-3 py-2 text-xs font-medium text-foreground hover:bg-accent transition-colors"
              aria-label="Change language"
            >
              <Globe className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{languageNames[language]}</span>
              <span className="sm:hidden uppercase">{language}</span>
              <ChevronDown className="h-3 w-3 opacity-60" />
            </button>
            {langOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setLangOpen(false)} />
                <div className="absolute right-0 mt-1.5 w-44 rounded-lg border border-border bg-card shadow-xl z-40 p-1 animate-fade-in">
                  {(Object.keys(languageNames) as Language[]).map((lng) => (
                    <button
                      key={lng}
                      onClick={() => { setLanguage(lng); setLangOpen(false); }}
                      className={`w-full text-left rounded-md px-3 py-2 text-sm font-medium transition-colors ${language === lng ? "bg-primary/15 text-primary" : "text-foreground hover:bg-accent"}`}
                    >
                      {languageNames[lng]}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <button
            onClick={onGetStarted}
            className="rounded-lg bg-primary px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary/90 btn-glow active:scale-[0.97]"
          >
            {t("heroCreate")}
          </button>
        </div>
      </nav>

      {/* Hero — Dual value proposition */}
      <header className="px-4 sm:px-6 pt-12 sm:pt-16 pb-10 max-w-4xl mx-auto text-center relative gold-glow">
        <div className="inline-flex items-center gap-2 rounded-full border border-loss/30 bg-loss/10 px-4 py-1.5 text-xs font-bold text-loss mb-6 tracking-label uppercase">
          <ShieldCheck className="h-3.5 w-3.5" /> Stop Trading on Hype. Start Trading on Truth.
        </div>

        {/* SEO-optimized H1 — visually de-emphasized but crawlable */}
        <h1 className="sr-only">
          Master the Markets with AI-Powered Financial News Analysis and Professional Portfolio Tracking.
        </h1>

        {/* Visual headline */}
        <p
          className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight relative z-10"
          style={{ lineHeight: "1.05" }}
          aria-hidden="true"
        >
          Stop Trading on Hype.
          <br />
          <span className="text-primary">Start Trading on Truth.</span>
        </p>

        <p className="mt-5 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed relative z-10" style={{ textWrap: "pretty" as any }}>
          PortAI is the only retail investor platform that combines real-time stock market tracking with a sophisticated AI news bias checker. Shield your portfolio from media manipulation and track your assets in 6 languages.
        </p>

        {/* Prominent input box with pulse */}
        <div className="mt-9 max-w-2xl mx-auto relative z-10">
          <div className="hero-input-pulse rounded-2xl">
            <div className="flex flex-col sm:flex-row items-stretch gap-2 rounded-2xl border-2 border-primary/40 bg-card p-2 shadow-2xl">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
                  placeholder={t("heroPlaceholder")}
                  className="h-12 w-full rounded-xl bg-transparent pl-11 pr-4 text-sm sm:text-base text-foreground placeholder:text-muted-foreground focus:outline-none"
                  aria-label="Article URL to analyze for financial news bias"
                />
              </div>
              <button
                onClick={handleAnalyze}
                className="flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm sm:text-base font-bold text-primary-foreground transition-all duration-200 hover:bg-primary/90 btn-glow active:scale-[0.97] shrink-0"
              >
                Analyze News Bias <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Dual CTA */}
          <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onGetStarted}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-5 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/15 w-full sm:w-auto"
            >
              <Eye className="h-4 w-4" /> Build Your Watchlist
            </button>
            <p className="text-xs text-muted-foreground">
              {t("heroOr")}{" "}
              <button onClick={onGetStarted} className="font-semibold text-primary hover:underline">
                {t("heroCreate")}
              </button>
            </p>
          </div>
        </div>
      </header>

      {/* Three value cards — the "Wait, I need this" moment */}
      <section className="px-4 sm:px-6 pt-8 pb-16 max-w-5xl mx-auto">
        <RevealSection>
          <h2 className="text-center text-xl sm:text-2xl font-bold text-foreground mb-10" style={{ textWrap: "balance" as any }}>
            {t("valueCardsTitle")}
          </h2>
        </RevealSection>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: ShieldCheck, title: t("valueBiasTitle"), desc: t("valueBiasDesc"), tone: "primary" },
            { icon: CheckCircle2, title: t("valueFactTitle"), desc: t("valueFactDesc"), tone: "primary" },
            { icon: Globe, title: t("valueGlobalTitle"), desc: t("valueGlobalDesc"), tone: "primary" },
          ].map((c, i) => (
            <RevealSection key={c.title}>
              <div
                className="glass-card rounded-2xl p-6 h-full text-center card-hover"
                style={{ transitionDelay: `${i * 60}ms` }}
              >
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 border border-primary/25">
                  <c.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-base font-bold text-foreground mb-1.5">{c.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{c.desc}</p>
              </div>
            </RevealSection>
          ))}
        </div>
      </section>

      {/* Tech stack — social proof */}
      <RevealSection>
        <section className="px-4 sm:px-6 py-8 border-y border-border bg-card/30">
          <div className="max-w-5xl mx-auto">
            <p className="text-center text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground mb-5">
              {t("techStackLabel")}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
              {[
                { icon: Cpu, label: "Powered by OpenAI" },
                { icon: Database, label: "Secured by Supabase" },
                { icon: CreditCard, label: "Payments by Stripe" },
              ].map((t) => (
                <div key={t.label} className="flex items-center gap-2 text-sm font-semibold text-foreground/70">
                  <t.icon className="h-4 w-4 text-primary/70" />
                  {t.label}
                </div>
              ))}
            </div>
          </div>
        </section>
      </RevealSection>

      {/* Stats bar — moved below tech stack */}
      <RevealSection>
        <div className="py-10 px-6">
          <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            {[
              { value: "10,000+", label: "Global Stocks, ETFs & Crypto", icon: BarChart3 },
              { value: "6", label: "Languages Supported", icon: Globe },
              { value: "AI", label: "Bias & Fact Checking", icon: ShieldCheck },
              { value: "24/7", label: "AI Financial Advisor", icon: Brain },
            ].map((s) => (
              <div key={s.label} className="flex flex-col items-center gap-1.5">
                <s.icon className="h-5 w-5 text-primary mb-0.5" />
                <p className="text-2xl font-bold text-foreground font-mono tracking-tight">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </RevealSection>

      {/* Section A — AI Media Intelligence (keyword-rich) */}
      <RevealSection>
        <section
          id="ai-media-intelligence"
          aria-labelledby="ai-media-intelligence-heading"
          className="px-4 sm:px-6 py-14 max-w-5xl mx-auto"
        >
          <p className="text-center text-xs font-bold uppercase tracking-[0.18em] text-primary mb-2">Section A</p>
          <h2 id="ai-media-intelligence-heading" className="text-center text-2xl sm:text-3xl font-bold text-foreground mb-3">
            AI Media Intelligence
          </h2>
          <p className="text-center text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto mb-10">
            Turn every headline into a quantified signal. Our financial news trust score and bias detection report help you detect market manipulation before your portfolio reacts.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { icon: ShieldCheck, title: "Financial News Trust Score", body: "A 0-10 trust score for every article you paste, computed from source reputation, framing, and citation density." },
              { icon: AlertCircle, title: "Detect Market Manipulation", body: "Spot pump-and-dump narratives, coordinated coverage, and sponsored takes that masquerade as journalism." },
              { icon: CheckCircle2, title: "AI Fact-Checking for Stocks", body: "Cross-reference claims against filings, earnings transcripts, and price action so you never trade on a false premise." },
              { icon: FileText, title: "Bias Detection Report", body: "Per-article report covering hidden angles, omitted data points, and sentiment divergence — readable in seconds." },
            ].map((f, i) => (
              <article key={f.title} className="glass-card rounded-2xl p-5 h-full card-hover" style={{ transitionDelay: `${i * 60}ms` }}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 border border-primary/25">
                    <f.icon className="h-5 w-5 text-primary" aria-hidden="true" />
                  </div>
                  <h3 className="text-base font-bold text-foreground">{f.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.body}</p>
              </article>
            ))}
          </div>
        </section>
      </RevealSection>

      {/* Section B — Institutional-Grade Tracking (keyword-rich) */}
      <RevealSection>
        <section
          id="institutional-tracking"
          aria-labelledby="institutional-tracking-heading"
          className="px-4 sm:px-6 py-14 max-w-5xl mx-auto border-t border-border"
        >
          <p className="text-center text-xs font-bold uppercase tracking-[0.18em] text-primary mb-2">Section B</p>
          <h2 id="institutional-tracking-heading" className="text-center text-2xl sm:text-3xl font-bold text-foreground mb-3">
            Institutional-Grade Tracking
          </h2>
          <p className="text-center text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto mb-10">
            A real-time S&amp;P 500 heatmap, multi-asset watchlist, custom stock price alerts, and a unified crypto portfolio tracker — engineered for retail investors who want institutional clarity.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { icon: BarChart3, title: "Real-Time S&P 500 Heatmap", body: "Live sector and constituent heatmap powered by TradingView, refreshed throughout the trading session." },
              { icon: Eye, title: "Multi-Asset Watchlist", body: "Track 10,000+ stocks, ETFs and crypto across 20+ countries in a single, sortable watchlist." },
              { icon: Zap, title: "Stock Price Alerts", body: "Set custom price thresholds and get notified the moment your target is breached." },
              { icon: Activity, title: "Crypto Portfolio Tracker", body: "Aggregate BTC, ETH, and altcoin positions alongside equities for a true total-portfolio view." },
            ].map((f, i) => (
              <article key={f.title} className="glass-card rounded-2xl p-5 h-full card-hover" style={{ transitionDelay: `${i * 60}ms` }}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 border border-primary/25">
                    <f.icon className="h-5 w-5 text-primary" aria-hidden="true" />
                  </div>
                  <h3 className="text-base font-bold text-foreground">{f.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.body}</p>
              </article>
            ))}
          </div>
        </section>
      </RevealSection>

      {/* Why Modern Investors Need AI News Analysis — SEO text block */}
      <RevealSection>
        <section id="why-portai" aria-labelledby="why-portai-heading" className="px-4 sm:px-6 py-14 max-w-3xl mx-auto">
          <h2 id="why-portai-heading" className="text-2xl sm:text-3xl font-bold text-foreground mb-6 text-center" style={{ textWrap: "balance" as any }}>
            Why Modern Investors Need AI News Analysis
          </h2>
          <div className="space-y-5 text-sm sm:text-base leading-relaxed text-muted-foreground">
            <p>
              Today&apos;s retail investor is drowning in financial reporting. Outlets like The Motley Fool, CNBC, Yahoo Finance, and Seeking Alpha publish thousands of articles every week — many of them written to chase clicks, push affiliate stocks, or amplify positions taken by sell-side desks. Without an objective filter, even disciplined investors end up rotating capital based on narrative rather than evidence, and biased financial reporting quietly becomes the largest hidden risk in their portfolio.
            </p>
            <p>
              Traditional portfolio trackers were never designed to solve this. They show you what your assets are doing, but they cannot tell you <em>why</em> a stock just ran 8% on a Monday morning, whether the catalyst is durable, or whether the bullish coverage you are reading omits a regulatory filing, an insider sale, or a contradicting earnings transcript. That gap — between price action and the narrative driving it — is exactly where retail investors get hurt.
            </p>
            <p>
              PortAI closes that gap. We use Large Language Models to read each article you paste, score its trust and bias, surface omitted data points, and compare its sentiment against social, options-flow, and peer-coverage signals. The result is an objective sentiment analysis layered on top of a real-time stock and crypto portfolio tracker — so you can verify the story before you trade the chart, in plain English, in 6 languages, every single day.
            </p>
          </div>
        </section>
      </RevealSection>

      {/* Demoted Supporting Features — heatmap, watchlist, etc. */}
      <section id="features" className="px-4 sm:px-6 pt-12 pb-16 max-w-5xl mx-auto">
        <RevealSection>
          <p className="text-center text-xs font-semibold uppercase tracking-label text-muted-foreground mb-2">{t("supportingFeatures")}</p>
          <h2 className="text-center text-xl sm:text-2xl font-bold text-foreground mb-3" style={{ textWrap: "balance" as any }}>
            {t("supportingFeaturesSub")}
          </h2>
        </RevealSection>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {supportingFeatures.map((f, i) => (
            <RevealSection key={f.key}>
              <div
                className="glass-card rounded-xl p-5 h-full transition-all card-hover"
                style={{ transitionDelay: `${i * 40}ms` }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <f.icon className="h-4.5 w-4.5 text-primary/80" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">{t(f.key)}</h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            </RevealSection>
          ))}
        </div>

        <RevealSection className="mt-12 text-center">
          <button
            onClick={onGetStarted}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary/90 btn-glow active:scale-[0.97]"
          >
            {t("heroCreate")} <ArrowRight className="h-4 w-4" />
          </button>
        </RevealSection>
      </section>

      {/* Trust & Compliance badges */}
      <RevealSection>
        <section className="px-6 py-10 max-w-4xl mx-auto">
          <div className="flex flex-wrap items-center justify-center gap-3">
            {[
              { icon: ShieldCheck, label: "GDPR Compliant" },
              { icon: Lock, label: "SSL Encrypted" },
              { icon: Fingerprint, label: "Data Protected" },
              { icon: Shield, label: "Not Financial Advice" },
            ].map((badge) => (
              <div key={badge.label} className="flex items-center gap-2 rounded-full border border-border bg-card/60 backdrop-blur-sm px-4 py-2" style={{ borderColor: "rgba(46, 204, 143, 0.08)" }}>
                <badge.icon className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium text-foreground">{badge.label}</span>
              </div>
            ))}
          </div>
        </section>
      </RevealSection>

      {/* Trusted-by — outlets we analyze */}
      <RevealSection>
        <section className="px-6 py-10 border-t border-border bg-card/20">
          <div className="max-w-5xl mx-auto text-center">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground mb-2">
              Trusted by retail investors from 6+ countries
            </p>
            <p className="text-[11px] text-muted-foreground/80 mb-6">
              We analyze bias across these outlets and more.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 opacity-60">
              {["CNBC", "Yahoo Finance", "Bloomberg", "Reuters", "WSJ", "Financial Times", "MarketWatch"].map((src) => (
                <span
                  key={src}
                  className="text-sm sm:text-base font-bold tracking-tight text-foreground/70 grayscale hover:opacity-100 hover:text-foreground transition-all"
                  style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
                >
                  {src}
                </span>
              ))}
            </div>
          </div>
        </section>
      </RevealSection>


      <footer className="border-t border-border px-6 py-8">
        <div className="max-w-4xl mx-auto flex flex-col items-center gap-4">
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            <a href="/privacy-policy" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</a>
            <a href="/terms-of-service" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Terms of Service</a>
            <a href="/data-compliance" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Data & Compliance</a>
            <a href="/ip-policy" className="text-xs text-muted-foreground hover:text-foreground transition-colors">IP Policy</a>
          </div>
          <p className="text-xs text-muted-foreground text-center max-w-lg">PortAI is not a financial advisor. All content is for informational purposes only. Always consult a qualified financial professional before making investment decisions.</p>
          <p className="text-xs text-muted-foreground">© 2026 PortAI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
