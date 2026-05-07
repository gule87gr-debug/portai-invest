import { Brain, BarChart3, MessageSquare, Eye, ArrowRight, Sparkles, LayoutDashboard, Shield, Globe, ChevronRight, Zap, ShieldCheck, Lock, Fingerprint, CheckCircle2, ChevronDown, Search, Activity, Database, CreditCard, Cpu, AlertCircle, FileText, Crown, HelpCircle, Quote, Users, Info } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLanguage, type Language } from "@/contexts/LanguageContext";
import { useLandingT } from "@/lib/landingI18n";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const supportingFeatures = [
  { icon: LayoutDashboard, key: "marketIntelligence", descKey: "supF1Desc" as const },
  { icon: Brain, key: "aiChat", descKey: "supF2Desc" as const },
  { icon: Sparkles, key: "quiz", descKey: "supF3Desc" as const },
  { icon: Eye, key: "watchlists", descKey: "supF4Desc" as const },
  { icon: MessageSquare, key: "forum", descKey: "supF5Desc" as const },
  { icon: Globe, key: "settings", descKey: "supF6Desc" as const },
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
  const lt = useLandingT(language);
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
    <TooltipProvider delayDuration={150}>
    <div className="min-h-screen bg-background overflow-x-hidden noise-overlay pb-16 sm:pb-0">
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
          0%, 100% { box-shadow: 0 0 0 0 hsl(var(--primary) / 0); }
          50% { box-shadow: 0 0 0 0 hsl(var(--primary) / 0); }
        }
        .hero-input-pulse {
          animation: none;
        }
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .marquee-track {
          animation: marquee 38s linear infinite;
        }
        .marquee-track:hover { animation-play-state: paused; }
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
              aria-label={lt("changeLanguage")}
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
          <ShieldCheck className="h-3.5 w-3.5" /> {lt("heroTagline")}
        </div>

        {/* SEO H1 — visible, keyword-rich */}
        <h1
          className="editorial-heading text-5xl sm:text-6xl lg:text-7xl relative z-10"
          style={{ lineHeight: "1.02" }}
        >
          {lt("heroH1part1")}
          <br />
          <span className="text-foreground">{lt("heroH1part2")} <span className="ink-underline text-primary">{lt("heroH1part3")}</span></span>
        </h1>
        <p className="sr-only">
          {lt("heroSrDesc")}
        </p>

        <p className="mt-5 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed relative z-10" style={{ textWrap: "pretty" as any }}>
          {lt("heroDesc")}
        </p>

        {/* Prominent input box with pulse */}
        <div id="hero-analyzer" className="mt-9 max-w-2xl mx-auto relative z-10 scroll-mt-24">
          <div className="rounded-2xl">
            <div className="flex flex-col sm:flex-row items-stretch gap-2 rounded-xl border border-border bg-card p-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
                  placeholder={t("heroPlaceholder")}
                  className="h-12 w-full rounded-xl bg-transparent pl-11 pr-4 text-sm sm:text-base text-foreground placeholder:text-muted-foreground focus:outline-none"
                  aria-label={lt("heroUrlAria")}
                />
              </div>
              <button
                onClick={handleAnalyze}
                className={`flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm sm:text-base font-bold text-primary-foreground transition-all duration-200 hover:bg-primary/90 btn-glow active:scale-[0.97] shrink-0 ${url.trim().length > 8 ? "hero-input-pulse" : ""}`}
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
              <Eye className="h-4 w-4" /> See Live Bias Detection
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-md border border-border bg-card p-3 shadow-brutal-lg">
            {/* Watchlist panel */}
            <div className="rounded-md border border-border bg-background/60 p-4 text-left">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Live Watchlist</p>
                <span className="inline-flex items-center gap-2 text-[10px] font-mono text-primary">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                  LIVE · UPDATED 2 MIN AGO
                </span>
              </div>
              <div className="space-y-2">
                {[
                  { sym: "AAPL", name: "Apple Inc.", price: "$232.18", chg: "+1.42%", up: true, pts: "M2,18 L10,14 L18,16 L26,10 L34,12 L42,7 L50,9 L58,5" },
                  { sym: "NVDA", name: "NVIDIA", price: "$184.92", chg: "+3.08%", up: true, pts: "M2,20 L10,17 L18,15 L26,13 L34,11 L42,8 L50,6 L58,3" },
                  { sym: "TSLA", name: "Tesla", price: "$298.40", chg: "-0.86%", up: false, pts: "M2,8 L10,10 L18,9 L26,13 L34,12 L42,15 L50,14 L58,17" },
                  { sym: "BTC", name: "Bitcoin", price: "$108,420", chg: "+2.11%", up: true, pts: "M2,16 L10,14 L18,15 L26,11 L34,12 L42,8 L50,9 L58,5" },
                ].map((r) => (
                  <div key={r.sym} className="flex items-center gap-3 border-b border-border/50 px-1 py-2">
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
            <div className="rounded-md border border-border bg-background/60 p-4 text-left">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Bias Analysis Report</p>
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 border border-primary/30 px-2 py-0.5 text-[10px] font-bold text-primary"><ShieldCheck className="h-3 w-3" /> Pro</span>
              </div>
              <div className="rounded-lg border border-border bg-card/40 p-3 mb-3">
                <p className="text-[10px] text-muted-foreground mb-1 font-mono uppercase tracking-wider">CNBC · Tesla Q1 Earnings Beat</p>
                <div className="flex items-baseline gap-2">
                  <span className="ink-circle"><span className="text-3xl font-bold font-mono text-primary">6.4</span></span>
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
          <h2 className="text-center editorial-heading text-2xl sm:text-3xl text-foreground mb-10" style={{ textWrap: "balance" as any }}>
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

      {/* Community & Trust — testimonials marquee + market reach */}
      <RevealSection>
        <section aria-labelledby="community-trust-heading" className="px-4 sm:px-6 py-12 border-b border-border">
          <div className="max-w-6xl mx-auto">
            <p className="text-center text-[10px] font-bold uppercase tracking-[0.18em] text-primary mb-2">Community &amp; Trust</p>
            <h2 id="community-trust-heading" className="text-center editorial-heading text-2xl sm:text-3xl text-foreground mb-8" style={{ textWrap: "balance" as any }}>
              Built with — and for — a global community of investors.
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
              {/* Testimonials marquee */}
              <div className="lg:col-span-2 rounded-2xl border border-border bg-card/40 backdrop-blur-md overflow-hidden relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-background to-transparent z-10" />
                <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-background to-transparent z-10" />
                <div className="flex marquee-track py-5" style={{ width: "max-content" }}>
                  {[...Array(2)].flatMap((_, dup) => ([
                    { quote: "PortAI caught a pump-and-dump narrative before I lost a cent.", who: "Lukas M. · Munich, DE" },
                    { quote: "Finally a tool that tells me when CNBC is just chasing clicks.", who: "Sofía R. · Madrid, ES" },
                    { quote: "The bias score is now part of my pre-market routine.", who: "Marcus T. · Chicago, US" },
                    { quote: "Saved me from buying into a hyped earnings beat that omitted a revenue miss.", who: "James W. · London, UK" },
                    { quote: "Tracking my crypto and stocks in one watchlist with bias alerts is a game changer.", who: "Tiago F. · Lisbon, PT" },
                    { quote: "I use the trust score before any position over €5k. Period.", who: "Giulia C. · Milan, IT" },
                  ].map((tst, i) => (
                    <div key={`${dup}-${i}`} className="w-[320px] shrink-0 mx-3 rounded-xl border border-border/70 bg-background/40 p-4">
                      <Quote className="h-4 w-4 text-primary/70 mb-2" />
                      <p className="text-sm text-foreground/90 leading-relaxed mb-3">&ldquo;{tst.quote}&rdquo;</p>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{tst.who}</p>
                    </div>
                  ))))}
                </div>
              </div>

              {/* Market Reach card */}
              <div className="rounded-xl border border-border bg-card p-6 flex flex-col justify-center">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary mb-3">Market Reach</p>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 border border-primary/25">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold font-mono text-foreground tracking-tight">1M+</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">Headlines analyzed for bias</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 border border-primary/25">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold font-mono text-foreground tracking-tight">12+</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">Active countries worldwide</p>
                    </div>
                  </div>
                </div>
              </div>
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
          <h2 id="ai-media-intelligence-heading" className="text-center editorial-heading text-3xl sm:text-4xl text-foreground mb-3">
            Detect Market Manipulation
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
          <h2 id="institutional-tracking-heading" className="text-center editorial-heading text-3xl sm:text-4xl text-foreground mb-3">
            Professional Investment Tracking
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
          <h2 id="pricing-preview-heading" className="text-center editorial-heading text-3xl sm:text-4xl text-foreground mb-3">
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
              <div className="mb-1"><span className="inline-block rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary">40% OFF</span></div>
              <div className="text-3xl font-bold font-mono text-foreground mb-4">€8.99<span className="text-base text-muted-foreground font-normal line-through ml-2">€14.99</span><span className="text-sm text-muted-foreground font-normal">/mo</span></div>
              <ul className="space-y-2 text-sm text-muted-foreground mb-6 flex-1">
                <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" /> 5 Watchlists</li>
                <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" /> Unlimited Basic Analyses</li>
                <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" /> Live Sentiment Heatmaps</li>
              </ul>
              <button onClick={onGetStarted} className="w-full rounded-xl bg-primary/10 border border-primary/40 text-primary py-2.5 text-sm font-semibold hover:bg-primary/15 transition-colors">Upgrade to Plus</button>
            </article>

            {/* Pro */}
            <article className="rounded-xl border border-primary/60 bg-card p-6 flex flex-col relative">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground whitespace-nowrap">
                <Crown className="h-3 w-3" /> Most Popular
              </span>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary mb-1">The Alpha Suite</p>
              <h3 className="text-2xl font-bold text-foreground mb-1 flex items-center gap-2"><Crown className="h-5 w-5 text-primary" /> Pro</h3>
              <div className="mb-1"><span className="inline-block rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary">36% OFF</span></div>
              <div className="text-3xl font-bold font-mono text-foreground mb-4">€15.99<span className="text-base text-muted-foreground font-normal line-through ml-2">€24.99</span><span className="text-sm text-muted-foreground font-normal">/mo</span></div>
              <ul className="space-y-2 text-sm text-muted-foreground mb-6 flex-1">
                <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" /> Unlimited Watchlists</li>
                <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" /> Deep-Dive Institutional Analysis</li>
                <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" /> Real-time Bias Alerts for your Portfolio</li>
               <li className="flex gap-2 items-center"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" /> <span className="inline-flex items-center gap-1">Priority AI Speed
                 <Tooltip>
                   <TooltipTrigger asChild>
                     <button type="button" aria-label="What is Priority AI Speed?" className="inline-flex items-center text-primary/80 hover:text-primary transition-colors">
                       <Info className="h-3.5 w-3.5" />
                     </button>
                   </TooltipTrigger>
                   <TooltipContent side="top" className="max-w-[240px] text-xs leading-relaxed">
                     Uses high-compute models for deeper pattern recognition and zero-wait analysis.
                   </TooltipContent>
                 </Tooltip>
               </span></li>
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
                <h2 className="editorial-heading text-3xl sm:text-4xl text-foreground mb-3" style={{ textWrap: "balance" as any }}>
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
          <h2 id="why-portai-heading" className="editorial-heading text-3xl sm:text-4xl text-foreground mb-6 text-center" style={{ textWrap: "balance" as any }}>
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
          <h2 className="text-center editorial-heading text-2xl sm:text-3xl text-foreground mb-3" style={{ textWrap: "balance" as any }}>
            AI-Powered Sentiment Analysis
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
                <p className="text-xs text-muted-foreground leading-relaxed">{lt(f.descKey)}</p>
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
          <h2 id="how-it-works-heading" className="text-center editorial-heading text-2xl sm:text-3xl text-foreground mb-3" style={{ textWrap: "balance" as any }}>
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

      {/* FAQ — SEO crawlable */}
      <RevealSection>
        <section id="faq" aria-labelledby="faq-heading" className="px-4 sm:px-6 py-14 max-w-3xl mx-auto border-t border-border">
          <p className="text-center text-[10px] font-bold uppercase tracking-[0.18em] text-primary mb-2">FAQ</p>
          <h2 id="faq-heading" className="text-center editorial-heading text-3xl sm:text-4xl text-foreground mb-8" style={{ textWrap: "balance" as any }}>
            Frequently Asked Questions
          </h2>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="q1" className="border-border">
              <AccordionTrigger className="text-left text-sm sm:text-base font-semibold text-foreground hover:no-underline">
                <span className="flex items-center gap-2"><HelpCircle className="h-4 w-4 text-primary shrink-0" /> How does PortAI detect bias in financial news?</span>
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                PortAI combines Natural Language Processing (NLP) and Machine Learning models trained on millions of financial articles to score every story for Objectivity, framing, and source reliability. Our AI compares the article&rsquo;s claims against SEC filings, earnings transcripts, and peer coverage, then produces a 0-10 trust score with a transparent breakdown of any detected bias, omitted data points, or sentiment divergence.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q2" className="border-border">
              <AccordionTrigger className="text-left text-sm sm:text-base font-semibold text-foreground hover:no-underline">
                <span className="flex items-center gap-2"><HelpCircle className="h-4 w-4 text-primary shrink-0" /> Is PortAI a replacement for a Bloomberg Terminal?</span>
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                No — PortAI is purpose-built for the Retail Investor, not the institutional trading desk. Bloomberg Terminals cost over €20,000/year and are tuned for sell-side professionals. PortAI delivers the signals retail investors actually need — a Bias Shield, AI sentiment analysis, multi-asset watchlists and real-time alerts — at a fraction of the cost (from €8.99/month).
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q3" className="border-border">
              <AccordionTrigger className="text-left text-sm sm:text-base font-semibold text-foreground hover:no-underline">
                <span className="flex items-center gap-2"><HelpCircle className="h-4 w-4 text-primary shrink-0" /> What assets and markets can I track?</span>
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                You can track 10,000+ stocks, ETFs and cryptocurrencies across 20+ countries, including the S&amp;P 500, NASDAQ, FTSE, DAX, Nikkei and major crypto pairs — all from a single multi-asset watchlist with custom price alerts.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q4" className="border-border">
              <AccordionTrigger className="text-left text-sm sm:text-base font-semibold text-foreground hover:no-underline">
                <span className="flex items-center gap-2"><HelpCircle className="h-4 w-4 text-primary shrink-0" /> Is PortAI financial advice?</span>
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                No. PortAI is an analytical and informational tool. We do not provide personalized financial advice. Always consult a qualified financial professional before making investment decisions.
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* JSON-LD: SoftwareApplication + FAQPage */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@graph": [
                  {
                    "@type": "SoftwareApplication",
                    "name": "PortAI",
                    "url": "https://portai-invest.com",
                    "applicationCategory": "FinanceApplication",
                    "operatingSystem": "Web",
                    "description": "AI Financial News Bias Checker and Professional Portfolio Tracker for retail investors. Detect market manipulation with AI-powered sentiment analysis.",
                    "offers": [
                      { "@type": "Offer", "name": "Free", "price": "0", "priceCurrency": "EUR" },
                      { "@type": "Offer", "name": "Plus", "price": "8.99", "priceCurrency": "EUR" },
                      { "@type": "Offer", "name": "Pro", "price": "15.99", "priceCurrency": "EUR" }
                    ],
                    "aggregateRating": {
                      "@type": "AggregateRating",
                      "ratingValue": "4.8",
                      "ratingCount": "327",
                      "bestRating": "5",
                      "worstRating": "1"
                    }
                  },
                  {
                    "@type": "FAQPage",
                    "mainEntity": [
                      {
                        "@type": "Question",
                        "name": "How does PortAI detect bias in financial news?",
                        "acceptedAnswer": {
                          "@type": "Answer",
                          "text": "PortAI combines Natural Language Processing (NLP) and Machine Learning models trained on millions of financial articles to score every story for Objectivity, framing, and source reliability. Our AI compares claims against SEC filings, earnings transcripts, and peer coverage, then produces a 0-10 trust score with a breakdown of detected bias, omitted data points, and sentiment divergence."
                        }
                      },
                      {
                        "@type": "Question",
                        "name": "Is PortAI a replacement for a Bloomberg Terminal?",
                        "acceptedAnswer": {
                          "@type": "Answer",
                          "text": "No — PortAI is built for the Retail Investor, not institutional desks. Bloomberg Terminals cost over €20,000/year. PortAI delivers a Bias Shield, AI sentiment analysis, multi-asset watchlists and real-time alerts at a fraction of the cost, from €8.99/month."
                        }
                      },
                      {
                        "@type": "Question",
                        "name": "What assets and markets can I track?",
                        "acceptedAnswer": {
                          "@type": "Answer",
                          "text": "You can track 10,000+ stocks, ETFs and cryptocurrencies across 20+ countries, including the S&P 500, NASDAQ, FTSE, DAX, Nikkei and major crypto pairs."
                        }
                      },
                      {
                        "@type": "Question",
                        "name": "Is PortAI financial advice?",
                        "acceptedAnswer": {
                          "@type": "Answer",
                          "text": "No. PortAI is an analytical and informational tool. We do not provide personalized financial advice. Always consult a qualified financial professional before making investment decisions."
                        }
                      }
                    ]
                  }
                ]
              })
            }}
          />
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

      {/* Mobile sticky analyzer anchor */}
      <a
        href="#hero-analyzer"
        className="sm:hidden fixed bottom-4 right-4 z-40 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-xs font-bold text-primary-foreground shadow-2xl shadow-primary/40 btn-glow active:scale-95"
        aria-label="Jump to bias analyzer"
      >
        <Search className="h-4 w-4" /> Analyze
      </a>
    </div>
    </TooltipProvider>
  );
};

export default LandingPage;
