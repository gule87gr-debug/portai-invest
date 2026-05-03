import { Brain, BarChart3, MessageSquare, Eye, ArrowRight, Sparkles, LayoutDashboard, Shield, Globe, ChevronRight, Zap, ShieldCheck, Lock, Fingerprint, CheckCircle2, ChevronDown, Search, Activity, Database, CreditCard, Cpu, AlertCircle, FileText, Crown, HelpCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLanguage, type Language } from "@/contexts/LanguageContext";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

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
    document.title = "PortAI | AI Financial News Bias Checker & Professional Portfolio Tracker";
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
          <img src="/logo.png" alt="PortAI logo — AI Stock Bias Analysis Dashboard" width={36} height={36} className="h-9 w-9 rounded-lg" />
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

        {/* SEO H1 — visible, keyword-rich */}
        <h1
          className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight relative z-10"
          style={{ lineHeight: "1.05" }}
        >
          The AI Financial News Bias Checker
          <br />
          <span className="text-primary">&amp; Portfolio Tracker.</span>
        </h1>
        <p className="sr-only">
          The AI Command Center for Smarter Investing — Professional Investment Tracking and AI-Powered Sentiment Analysis.
        </p>

        <p className="mt-5 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed relative z-10" style={{ textWrap: "pretty" as any }}>
          Track your portfolio with institutional-grade data and filter out market manipulation with the world&rsquo;s first AI Financial News Bias Checker.
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

        {/* Dual Dashboard mockup — Watchlist + Bias Report */}
        <div className="mt-12 max-w-5xl mx-auto relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-2xl border border-primary/20 bg-card/60 backdrop-blur-md p-3 shadow-2xl">
            {/* Watchlist panel */}
            <div className="rounded-xl border border-border bg-background/60 p-4 text-left">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Live Watchlist</p>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-primary"><Activity className="h-3 w-3" /> LIVE</span>
              </div>
              <div className="space-y-2">
                {[
                  { sym: "AAPL", name: "Apple Inc.", price: "$232.18", chg: "+1.42%", up: true, pts: "M2,18 L10,14 L18,16 L26,10 L34,12 L42,7 L50,9 L58,5" },
                  { sym: "NVDA", name: "NVIDIA", price: "$184.92", chg: "+3.08%", up: true, pts: "M2,20 L10,17 L18,15 L26,13 L34,11 L42,8 L50,6 L58,3" },
                  { sym: "TSLA", name: "Tesla", price: "$298.40", chg: "-0.86%", up: false, pts: "M2,8 L10,10 L18,9 L26,13 L34,12 L42,15 L50,14 L58,17" },
                  { sym: "BTC", name: "Bitcoin", price: "$108,420", chg: "+2.11%", up: true, pts: "M2,16 L10,14 L18,15 L26,11 L34,12 L42,8 L50,9 L58,5" },
                ].map((r) => (
                  <div key={r.sym} className="flex items-center gap-3 rounded-lg border border-border/60 bg-card/40 px-3 py-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-foreground font-mono">{r.sym}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{r.name}</p>
                    </div>
                    <svg width="60" height="22" viewBox="0 0 60 22" className="shrink-0">
                      <path d={r.pts} fill="none" stroke={r.up ? "hsl(var(--gain))" : "hsl(var(--loss))"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold text-foreground font-mono">{r.price}</p>
                      <p className={`text-[10px] font-bold font-mono ${r.up ? "text-gain" : "text-loss"}`}>{r.chg}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bias report panel */}
            <div className="rounded-xl border border-border bg-background/60 p-4 text-left">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Bias Analysis Report</p>
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 border border-primary/30 px-2 py-0.5 text-[10px] font-bold text-primary"><ShieldCheck className="h-3 w-3" /> Pro</span>
              </div>
              <div className="rounded-lg border border-border/60 bg-card/40 p-3 mb-3">
                <p className="text-[10px] text-muted-foreground mb-1">CNBC · Tesla Q1 Earnings Beat</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold font-mono text-primary">6.4</p>
                  <p className="text-[11px] text-muted-foreground">/ 10 Trust Score</p>
                </div>
                <div className="mt-2 h-1.5 w-full rounded-full bg-border overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-loss via-warning to-primary" style={{ width: "64%" }} />
                </div>
              </div>
              <div className="space-y-2">
                {[
                  { icon: AlertCircle, label: "Cherry-picked EPS data", tone: "warning" as const },
                  { icon: FileText, label: "Omits revenue miss vs consensus", tone: "loss" as const },
                  { icon: CheckCircle2, label: "Cross-checked with 10-Q filing", tone: "primary" as const },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2 rounded-md border border-border/60 bg-card/30 px-2.5 py-1.5">
                    <item.icon className={`h-3.5 w-3.5 shrink-0 ${item.tone === "warning" ? "text-warning" : item.tone === "loss" ? "text-loss" : "text-primary"}`} />
                    <p className="text-[11px] text-foreground/90">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <p className="mt-3 text-center text-[11px] text-muted-foreground">Sample preview — your real data appears once you sign in.</p>
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

      {/* Tiered Pricing Preview */}
      <RevealSection>
        <section
          id="pricing-preview"
          aria-labelledby="pricing-preview-heading"
          className="px-4 sm:px-6 py-14 max-w-5xl mx-auto border-t border-border"
        >
          <p className="text-center text-xs font-bold uppercase tracking-[0.18em] text-primary mb-2">Pricing</p>
          <h2 id="pricing-preview-heading" className="text-center text-2xl sm:text-3xl font-bold text-foreground mb-3">
            Choose Your Edge
          </h2>
          <p className="text-center text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto mb-10">
            Three tiers built for every level of conviction — from observer to active alpha hunter.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Free */}
            <article className="rounded-2xl border border-border bg-card p-6 flex flex-col">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground mb-1">The Observer</p>
              <h3 className="text-2xl font-bold text-foreground mb-1">Free</h3>
              <div className="text-3xl font-bold font-mono text-foreground mb-4">€0<span className="text-sm text-muted-foreground font-normal">/mo</span></div>
              <ul className="space-y-2 text-sm text-muted-foreground mb-6 flex-1">
                <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-primary/70 mt-0.5 shrink-0" /> 1 Watchlist (5 assets)</li>
                <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-primary/70 mt-0.5 shrink-0" /> 3 Basic AI Analyses / day</li>
                <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-primary/70 mt-0.5 shrink-0" /> Community Media Pulse access</li>
              </ul>
              <button onClick={onGetStarted} className="w-full rounded-xl border border-border py-2.5 text-sm font-semibold text-foreground hover:bg-accent transition-colors">Start Free</button>
            </article>

            {/* Plus */}
            <article className="rounded-2xl border border-border bg-card p-6 flex flex-col">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary mb-1">The Shield</p>
              <h3 className="text-2xl font-bold text-foreground mb-1 flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /> Plus</h3>
              <div className="text-3xl font-bold font-mono text-foreground mb-4">€8.99<span className="text-sm text-muted-foreground font-normal">/mo</span></div>
              <ul className="space-y-2 text-sm text-muted-foreground mb-6 flex-1">
                <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" /> 5 Watchlists</li>
                <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" /> Unlimited Basic Analyses</li>
                <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" /> Live Sentiment Heatmaps</li>
              </ul>
              <button onClick={onGetStarted} className="w-full rounded-xl bg-primary/10 border border-primary/40 text-primary py-2.5 text-sm font-semibold hover:bg-primary/15 transition-colors">Upgrade to Plus</button>
            </article>

            {/* Pro */}
            <article className="rounded-2xl border-2 border-primary bg-gradient-to-b from-primary/[0.08] to-card p-6 flex flex-col relative shadow-xl shadow-primary/10">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground shadow-lg shadow-primary/40 whitespace-nowrap">
                <Crown className="h-3 w-3" /> Most Popular
              </span>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary mb-1">The Alpha Suite</p>
              <h3 className="text-2xl font-bold text-foreground mb-1 flex items-center gap-2"><Crown className="h-5 w-5 text-primary" /> Pro</h3>
              <div className="text-3xl font-bold font-mono text-foreground mb-4">€15.99<span className="text-sm text-muted-foreground font-normal">/mo</span></div>
              <ul className="space-y-2 text-sm text-muted-foreground mb-6 flex-1">
                <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" /> Unlimited Watchlists</li>
                <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" /> Deep-Dive Institutional Analysis</li>
                <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" /> Real-time Bias Alerts for your Portfolio</li>
                <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" /> Priority AI Speed</li>
              </ul>
              <button onClick={onGetStarted} className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground btn-glow hover:bg-primary/90 transition-colors">Go Pro</button>
              <p className="mt-2 text-center text-[11px] text-muted-foreground">Cancel anytime</p>
            </article>
          </div>
        </section>
      </RevealSection>

      {/* Data Bridge Interactive Card */}
      <RevealSection>
        <section className="px-4 sm:px-6 py-14 max-w-5xl mx-auto">
          <div className="rounded-3xl border-2 border-primary/30 bg-gradient-to-br from-primary/[0.08] via-card to-card p-6 sm:p-10 relative overflow-hidden">
            <div className="absolute top-4 right-4 inline-flex items-center gap-1 rounded-full bg-primary/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
              <Crown className="h-3 w-3" /> Pro Tier
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary mb-2">The Data Bridge</p>
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3" style={{ textWrap: "balance" as any }}>
                  Watchlist meets Newsroom — automatically.
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
                  When a stock in your watchlist hits a volatility trigger, PortAI Pro instantly scans global media for bias, surfacing the narrative behind the price move before the crowd reacts.
                </p>
                <div className="flex flex-wrap gap-2">
                  {["English", "Español", "Français", "Deutsch", "Italiano", "Português"].map((lang) => (
                    <span key={lang} className="inline-flex items-center gap-1 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                      <Globe className="h-3 w-3" /> {lang}
                    </span>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                {[
                  { icon: Zap, title: "Volatility Trigger", body: "AAPL ▲ 4.2% in 15 min" },
                  { icon: Search, title: "Auto Media Scan", body: "92 articles across 6 languages" },
                  { icon: ShieldCheck, title: "Bias Report Ready", body: "Trust score 6.4 · 3 omitted angles" },
                ].map((step, i) => (
                  <div key={step.title} className="flex items-center gap-3 rounded-xl border border-border bg-card/70 backdrop-blur-sm p-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 border border-primary/25 text-primary font-bold text-xs">
                      {i + 1}
                    </div>
                    <step.icon className="h-4 w-4 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-foreground">{step.title}</p>
                      <p className="text-[11px] text-muted-foreground font-mono truncate">{step.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </RevealSection>

      <RevealSection>
        <section id="why-portai" aria-labelledby="why-portai-heading" className="px-4 sm:px-6 py-14 max-w-3xl mx-auto">
          <h2 id="why-portai-heading" className="text-2xl sm:text-3xl font-bold text-foreground mb-6 text-center" style={{ textWrap: "balance" as any }}>
            Why PortAI?
          </h2>
          <h3 className="text-base sm:text-lg font-semibold text-primary mb-4 text-center">
            Beyond price — the truth behind every move.
          </h3>
          <p className="mb-6 text-sm sm:text-base leading-relaxed text-foreground/90 text-center max-w-2xl mx-auto">
            Traditional portfolio trackers only show you the price. PortAI uses AI sentiment analysis to reveal the truth behind financial news bias. Whether you are tracking the S&amp;P 500 or looking for crypto market insights, our AI ensures you never trade on hype.
          </p>
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

      {/* How it Works — AI-Monitored Watchlist bridge */}
      <RevealSection>
        <section id="how-it-works" aria-labelledby="how-it-works-heading" className="px-4 sm:px-6 py-10 max-w-4xl mx-auto">
          <p className="text-center text-[10px] font-bold uppercase tracking-[0.18em] text-primary mb-2">How it Works</p>
          <h2 id="how-it-works-heading" className="text-center text-xl sm:text-2xl font-bold text-foreground mb-3" style={{ textWrap: "balance" as any }}>
            Your Watchlist isn&rsquo;t static. It&rsquo;s <span className="text-primary">AI-Monitored.</span>
          </h2>
          <p className="text-center text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto mb-8">
            We monitor your assets 24/7. If the media starts pushing a biased narrative on a stock you own, you&rsquo;ll be the first to know.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { icon: Eye, step: "01", title: "You Track", body: "Add stocks, ETFs and crypto to your watchlist." },
              { icon: Cpu, step: "02", title: "AI Watches", body: "Our models scan global news and price action 24/7." },
              { icon: AlertCircle, step: "03", title: "You Get Alerted", body: "Bias spikes or volatility triggers ping you instantly." },
            ].map((s) => (
              <div key={s.step} className="glass-card rounded-xl p-4 text-center card-hover">
                <p className="text-[10px] font-bold font-mono text-primary/70 mb-2">{s.step}</p>
                <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 border border-primary/25">
                  <s.icon className="h-4 w-4 text-primary" />
                </div>
                <h3 className="text-sm font-bold text-foreground mb-1">{s.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </section>
      </RevealSection>


      <footer className="border-t border-border px-6 py-10">
        <div className="max-w-5xl mx-auto flex flex-col gap-8">
          {/* Stock Market News by Sector — internal linking for SEO */}
          <nav aria-label="Stock market news by sector" className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-left">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-foreground mb-3">Stock Market News by Sector</p>
              <ul className="space-y-1.5">
                <li><a href="/dashboard?sector=technology" className="text-xs text-muted-foreground hover:text-primary transition-colors">Technology Stock News</a></li>
                <li><a href="/dashboard?sector=finance" className="text-xs text-muted-foreground hover:text-primary transition-colors">Finance &amp; Banking News</a></li>
                <li><a href="/dashboard?sector=crypto" className="text-xs text-muted-foreground hover:text-primary transition-colors">Crypto Market News</a></li>
                <li><a href="/dashboard?sector=energy" className="text-xs text-muted-foreground hover:text-primary transition-colors">Energy &amp; Commodities</a></li>
                <li><a href="/dashboard?sector=healthcare" className="text-xs text-muted-foreground hover:text-primary transition-colors">Healthcare &amp; Biotech</a></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-foreground mb-3">AI Tools</p>
              <ul className="space-y-1.5">
                <li><a href="/dashboard#analyzer" className="text-xs text-muted-foreground hover:text-primary transition-colors">AI News Bias Checker</a></li>
                <li><a href="/chat" className="text-xs text-muted-foreground hover:text-primary transition-colors">AI Financial Advisor</a></li>
                <li><a href="/quiz" className="text-xs text-muted-foreground hover:text-primary transition-colors">Investor Profile Quiz</a></li>
                <li><a href="/forum" className="text-xs text-muted-foreground hover:text-primary transition-colors">Media Bias Pulse</a></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-foreground mb-3">Tracking</p>
              <ul className="space-y-1.5">
                <li><a href="/watchlists" className="text-xs text-muted-foreground hover:text-primary transition-colors">Multi-Asset Watchlist</a></li>
                <li><a href="/dashboard#heatmap" className="text-xs text-muted-foreground hover:text-primary transition-colors">S&amp;P 500 Heatmap</a></li>
                <li><a href="/watchlists#alerts" className="text-xs text-muted-foreground hover:text-primary transition-colors">Stock Price Alerts</a></li>
                <li><a href="/watchlists?asset=crypto" className="text-xs text-muted-foreground hover:text-primary transition-colors">Crypto Portfolio Tracker</a></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-foreground mb-3">Legal</p>
              <ul className="space-y-1.5">
                <li><a href="/privacy-policy" className="text-xs text-muted-foreground hover:text-primary transition-colors">Privacy Policy</a></li>
                <li><a href="/terms-of-service" className="text-xs text-muted-foreground hover:text-primary transition-colors">Terms of Service</a></li>
                <li><a href="/data-compliance" className="text-xs text-muted-foreground hover:text-primary transition-colors">Data &amp; Compliance</a></li>
                <li><a href="/ip-policy" className="text-xs text-muted-foreground hover:text-primary transition-colors">IP Policy</a></li>
              </ul>
            </div>
          </nav>

          <div className="border-t border-border pt-6 flex flex-col items-center gap-3">
            <p className="inline-flex items-center gap-2 text-[11px] font-semibold text-foreground/80 text-center">
              <Globe className="h-3.5 w-3.5 text-primary" />
              Available in 6 Languages: English, Spanish, Portuguese, German, French, and Italian.
            </p>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/80 text-center">
              Powered by OpenAI · Secured by Supabase · Real-time Data via Financial APIs
            </p>
            <p className="text-xs text-muted-foreground text-center max-w-lg"><span className="font-semibold text-warning">Not Financial Advice.</span> PortAI is not a financial advisor. All content is for informational purposes only. Always consult a qualified financial professional before making investment decisions.</p>
            <p className="text-xs text-muted-foreground">© 2026 PortAI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
