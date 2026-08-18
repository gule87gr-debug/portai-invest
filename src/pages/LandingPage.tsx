import { SEO } from "@/components/SEO";
import { Brain, BarChart3, MessageSquare, Eye, ArrowRight, Sparkles, LayoutDashboard, Shield, Globe, Zap, ShieldCheck, Lock, Fingerprint, CheckCircle2, ChevronDown, Search, Activity, Database, CreditCard, Cpu, AlertCircle, FileText, Crown, HelpCircle, Info } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLanguage, type Language } from "@/contexts/LanguageContext";
import { useLandingT } from "@/lib/landingI18n";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import LiveAnalysisDemo from "@/components/landing/LiveAnalysisDemo";
import ExtensionShowcase from "@/components/landing/ExtensionShowcase";
import TransparencyTrust from "@/components/landing/TransparencyTrust";

const supportingFeatures = [
  { icon: LayoutDashboard, key: "marketIntelligence", descKey: "supF1Desc" as const },
  { icon: Brain, key: "aiChat", descKey: "supF2Desc" as const },
  { icon: Sparkles, key: "quiz", descKey: "supF3Desc" as const },
  { icon: Eye, key: "watchlists", descKey: "supF4Desc" as const },
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

const LandingPage = ({ onGetStarted, onLogIn }: { onGetStarted: () => void; onLogIn?: () => void }) => {
  const { t, language, setLanguage, languageNames } = useLanguage();
  const lt = useLandingT(language);
  const [url, setUrl] = useState("");
  const [langOpen, setLangOpen] = useState(false);


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
    <SEO
      title="PortAI"
      description="Track stocks, ETFs and crypto with AI-powered bias detection on financial news. Real-time portfolio tracking and trust scores for retail investors."
      path="/"
    />
    <div className="min-h-screen bg-background overflow-x-hidden noise-overlay pb-16 sm:pb-0">
      <style>{`
        .scroll-reveal {
          opacity: 0;
          transform: translateY(12px);
          transition: opacity 500ms cubic-bezier(0.16, 1, 0.3, 1),
                      transform 500ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        .scroll-reveal.animate-in {
          opacity: 1;
          transform: translateY(0);
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
      <nav className="flex flex-wrap items-center justify-between gap-y-2 px-4 sm:px-6 py-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-2.5 shrink-0">
          <img src="/logo.png" alt="PortAI logo" width={36} height={36} fetchPriority="high" decoding="async" className="h-9 w-9 rounded-lg" />
          <span className="text-lg font-bold text-foreground">PortAI</span>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-x-2 gap-y-1.5">
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
            onClick={onLogIn ?? onGetStarted}
            className="rounded-lg border border-border bg-card px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-foreground transition-all duration-200 hover:bg-accent hover:border-primary/30 active:scale-[0.97]"
          >
            {t("logIn")}
          </button>
          <button
            onClick={onGetStarted}
            className="rounded-lg bg-primary px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary/90 btn-glow active:scale-[0.97]"
          >
            {t("heroCreate")}
          </button>
        </div>
      </nav>

      {/* Hero — editorial, single voice */}
      <header className="px-4 sm:px-6 pt-20 sm:pt-28 pb-16 max-w-4xl mx-auto">
        <div className="flex items-center justify-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-8">
          <span className="h-px w-8 bg-border" />
          <ShieldCheck className="h-3.5 w-3.5 text-foreground/70" />
          <span>The Bloomberg Terminal for retail investors</span>
          <span className="h-px w-8 bg-border" />
        </div>

        <h1
          className="editorial-heading text-center text-foreground text-[2.75rem] sm:text-6xl lg:text-[5rem]"
          style={{ lineHeight: "1.04" }}
        >
          Never trade on manipulated headlines again.
        </h1>

        <p className="sr-only">{lt("heroSrDesc")}</p>

        <p className="mt-8 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto text-center leading-relaxed">
          Institutional-grade bias detection, trust scores and real-time tracking for 7,000+ stocks, ETFs and crypto — without the €20,000 terminal.
        </p>

        {/* Analyzer input */}
        <div id="hero-analyzer" className="mt-10 max-w-3xl scroll-mt-24">
          <div className="focus-spring flex flex-col sm:flex-row items-stretch gap-2 rounded-xl border border-border bg-card p-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
                placeholder={t("heroPlaceholder")}
                className="h-14 w-full rounded-lg bg-transparent pl-11 pr-4 text-base text-foreground placeholder:text-muted-foreground focus:outline-none"
                aria-label={lt("heroUrlAria")}
              />
            </div>
            <button
              onClick={handleAnalyze}
              className="flex items-center justify-center gap-2 rounded-lg bg-primary px-7 h-14 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 shrink-0"
            >
              {lt("heroAnalyzeBtn")} <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
            <button
              onClick={onGetStarted}
              className="inline-flex items-center gap-1.5 font-semibold text-foreground hover:text-primary transition-colors"
            >
              <Eye className="h-3.5 w-3.5" /> {lt("heroSeeLive")}
            </button>
            <span className="h-3 w-px bg-border" />
            <button onClick={onGetStarted} className="font-semibold text-foreground hover:text-primary transition-colors">
              {t("heroCreate")}
            </button>
          </div>
        </div>
      </header>


      <main>
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


      {/* Stats bar — moved below tech stack */}
      <RevealSection>
        <div className="py-10 px-6">
          <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            {[
              { value: "7,000+", label: lt("statGlobalAssets"), icon: BarChart3 },
              { value: "6", label: lt("statLanguages"), icon: Globe },
              { value: "AI", label: lt("statBiasFact"), icon: ShieldCheck },
              { value: "24/7", label: lt("statAdvisor247"), icon: Brain },
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
          <p className="text-center text-xs font-bold uppercase tracking-[0.18em] text-primary mb-2">{lt("sectionA")}</p>
          <h2 id="ai-media-intelligence-heading" className="text-center editorial-heading text-3xl sm:text-4xl text-foreground mb-3">
            {lt("detectManipulation")}
          </h2>
          <p className="text-center text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto mb-10">
            {lt("detectManipulationDesc")}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { icon: ShieldCheck, title: lt("featA1Title"), body: lt("featA1Body") },
              { icon: AlertCircle, title: lt("featA2Title"), body: lt("featA2Body") },
              { icon: CheckCircle2, title: lt("featA3Title"), body: lt("featA3Body") },
              { icon: FileText, title: lt("featA4Title"), body: lt("featA4Body") },
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
          <p className="text-center text-xs font-bold uppercase tracking-[0.18em] text-primary mb-2">{lt("sectionB")}</p>
          <h2 id="institutional-tracking-heading" className="text-center editorial-heading text-3xl sm:text-4xl text-foreground mb-3">
            {lt("proTracking")}
          </h2>
          <p className="text-center text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto mb-10">
            {lt("proTrackingDesc")}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { icon: BarChart3, title: lt("featB1Title"), body: lt("featB1Body") },
              { icon: Eye, title: lt("featB2Title"), body: lt("featB2Body") },
              { icon: Zap, title: lt("featB3Title"), body: lt("featB3Body") },
              { icon: Activity, title: lt("featB4Title"), body: lt("featB4Body") },
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
          <p className="text-center text-xs font-bold uppercase tracking-[0.18em] text-primary mb-2">{lt("pricingLabel")}</p>
          <h2 id="pricing-preview-heading" className="text-center editorial-heading text-3xl sm:text-4xl text-foreground mb-3">
            {lt("chooseEdge")}
          </h2>
          <p className="text-center text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto mb-10">
            {lt("pricingDesc")}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                icon: Eye,
                kicker: lt("observer"),
                name: lt("freeName"),
                price: "€0",
                was: null as string | null,
                badge: null as string | null,
                highlight: false,
                features: [lt("free1"), lt("free2"), lt("free3"), lt("free4"), lt("free5")],
                cta: lt("startFree"),
              },
              {
                icon: Sparkles,
                kicker: lt("shield"),
                name: lt("plusName"),
                price: "€8.99",
                was: "€14.99",
                badge: lt("off40"),
                highlight: false,
                features: [lt("plus1"), lt("plus2"), lt("plus3"), lt("plus4"), lt("plus5")],
                cta: lt("upgradePlus"),
              },
              {
                icon: Crown,
                kicker: lt("alphaSuite"),
                name: lt("proName"),
                price: "€15.99",
                was: "€24.99",
                badge: lt("off36"),
                highlight: true,
                features: [lt("pro1"), lt("pro2"), lt("pro3"), lt("pro5")],
                cta: lt("goPro"),
              },
            ].map((tier) => (
              <article
                key={tier.name}
                className={`relative rounded-2xl border bg-card p-6 flex flex-col card-hover ${
                  tier.highlight ? "border-foreground/40 shadow-2xl" : "border-border"
                }`}
              >
                {tier.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground whitespace-nowrap">
                    <Crown className="h-3 w-3" /> {lt("mostPopular")}
                  </span>
                )}

                <div className="flex items-center gap-2.5 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-muted/40">
                    <tier.icon className="h-5 w-5 text-foreground/80" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">{tier.kicker}</p>
                    <h3 className="text-xl font-bold text-foreground leading-tight">{tier.name}</h3>
                  </div>
                  {tier.badge && (
                    <span className="ml-auto rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[10px] font-bold text-foreground">
                      {tier.badge}
                    </span>
                  )}
                </div>

                <div className="flex items-baseline gap-2 mb-5">
                  <span className="text-3xl font-bold font-mono text-foreground">{tier.price}</span>
                  {tier.was && <span className="text-sm text-muted-foreground line-through">{tier.was}</span>}
                  <span className="text-sm text-muted-foreground">/mo</span>
                </div>

                <ul className="space-y-2.5 text-sm text-muted-foreground mb-6 flex-1">
                  {tier.features.map((f) => (
                    <li key={f} className="flex gap-2.5 items-start">
                      <CheckCircle2 className="h-4 w-4 text-foreground/70 mt-0.5 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                  {tier.highlight && (
                    <li className="flex gap-2.5 items-start">
                      <CheckCircle2 className="h-4 w-4 text-foreground/70 mt-0.5 shrink-0" />
                      <span className="inline-flex items-center gap-1">
                        {lt("pro4Label")}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button type="button" aria-label={lt("pro4AriaLabel")} className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors">
                              <Info className="h-3.5 w-3.5" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-[240px] text-xs leading-relaxed">
                            {lt("pro4Tooltip")}
                          </TooltipContent>
                        </Tooltip>
                      </span>
                    </li>
                  )}
                </ul>

                <button
                  onClick={onGetStarted}
                  className={`w-full rounded-xl py-2.5 text-sm font-semibold transition-colors ${
                    tier.highlight
                      ? "bg-primary text-primary-foreground hover:bg-primary/90 btn-glow"
                      : "border border-border text-foreground hover:bg-accent"
                  }`}
                >
                  {tier.cta}
                </button>
                {tier.highlight && (
                  <p className="mt-2 text-center text-[11px] text-muted-foreground">{lt("cancelAnytime")}</p>
                )}
              </article>
            ))}
          </div>
        </section>
      </RevealSection>


      <RevealSection>
        <LiveAnalysisDemo onGetStarted={onGetStarted} />
      </RevealSection>

      <RevealSection>
        <ExtensionShowcase />
      </RevealSection>

      <RevealSection>
        <section id="why-portai" aria-labelledby="why-portai-heading" className="px-4 sm:px-6 py-14 max-w-5xl mx-auto border-t border-border">
          <h2 id="why-portai-heading" className="editorial-heading text-3xl sm:text-4xl text-foreground mb-3 text-center" style={{ textWrap: "balance" as any }}>
            Why PortAI?
          </h2>
          <p className="text-center text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto mb-10">
            Traditional trackers show the price. PortAI shows the narrative moving it.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-border bg-card p-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground mb-4">Ordinary tracker</p>
              <ul className="space-y-3">
                {[
                  "Shows what moved, never why",
                  "Headlines arrive unfiltered",
                  "Omitted filings stay omitted",
                  "You verify everything by hand",
                ].map((x) => (
                  <li key={x} className="flex gap-2.5 text-sm text-muted-foreground">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-loss" /> {x}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-foreground/25 bg-card p-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-foreground mb-4">With PortAI</p>
              <ul className="space-y-3">
                {[
                  "Trust and bias score on every article",
                  "Speculative framing flagged instantly",
                  "Missing context surfaced automatically",
                  "Claims cross-checked against other sources",
                ].map((x) => (
                  <li key={x} className="flex gap-2.5 text-sm text-foreground/90">
                    <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-gain" /> {x}
                  </li>
                ))}
              </ul>
            </div>
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
              { icon: ShieldCheck, label: lt("badgeGdpr") },
              { icon: Lock, label: lt("badgeSsl") },
              { icon: Fingerprint, label: lt("badgeData") },
              { icon: Shield, label: lt("badgeNFA") },
            ].map((badge) => (
              <div key={badge.label} className="flex items-center gap-2 rounded-full border border-border bg-card/60 backdrop-blur-sm px-4 py-2" style={{ borderColor: "rgba(46, 204, 143, 0.08)" }}>
                <badge.icon className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium text-foreground">{badge.label}</span>
              </div>
            ))}
          </div>
        </section>
      </RevealSection>


      {/* How it Works — AI-Monitored Watchlist bridge */}
      <RevealSection>
        <section id="how-it-works" aria-labelledby="how-it-works-heading" className="px-4 sm:px-6 py-10 max-w-4xl mx-auto">
          <p className="text-center text-[10px] font-bold uppercase tracking-[0.18em] text-primary mb-2">{lt("howItWorks")}</p>
          <h2 id="how-it-works-heading" className="text-center editorial-heading text-2xl sm:text-3xl text-foreground mb-3" style={{ textWrap: "balance" as any }}>
            {lt("howHeadingA")} <span className="text-primary">{lt("howHeadingB")}</span>
          </h2>
          <p className="text-center text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto mb-8">
            {lt("howSub")}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { icon: Eye, step: "01", title: lt("how1Title"), body: lt("how1Body") },
              { icon: Cpu, step: "02", title: lt("how2Title"), body: lt("how2Body") },
              { icon: AlertCircle, step: "03", title: lt("how3Title"), body: lt("how3Body") },
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

      <RevealSection>
        <TransparencyTrust />
      </RevealSection>

      {/* FAQ — SEO crawlable */}
      <RevealSection>
        <section id="faq" aria-labelledby="faq-heading" className="px-4 sm:px-6 py-14 max-w-3xl mx-auto border-t border-border">
          <p className="text-center text-[10px] font-bold uppercase tracking-[0.18em] text-primary mb-2">{lt("faqLabel")}</p>
          <h2 id="faq-heading" className="text-center editorial-heading text-3xl sm:text-4xl text-foreground mb-8" style={{ textWrap: "balance" as any }}>
            {lt("faqHeading")}
          </h2>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="q1" className="border-border">
              <AccordionTrigger className="text-left text-sm sm:text-base font-semibold text-foreground hover:no-underline">
                <span className="flex items-center gap-2"><HelpCircle className="h-4 w-4 text-primary shrink-0" /> {lt("faq1Q")}</span>
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                {lt("faq1A")}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q2" className="border-border">
              <AccordionTrigger className="text-left text-sm sm:text-base font-semibold text-foreground hover:no-underline">
                <span className="flex items-center gap-2"><HelpCircle className="h-4 w-4 text-primary shrink-0" /> {lt("faq2Q")}</span>
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                {lt("faq2A")}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q3" className="border-border">
              <AccordionTrigger className="text-left text-sm sm:text-base font-semibold text-foreground hover:no-underline">
                <span className="flex items-center gap-2"><HelpCircle className="h-4 w-4 text-primary shrink-0" /> {lt("faq3Q")}</span>
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                {lt("faq3A")}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q4" className="border-border">
              <AccordionTrigger className="text-left text-sm sm:text-base font-semibold text-foreground hover:no-underline">
                <span className="flex items-center gap-2"><HelpCircle className="h-4 w-4 text-primary shrink-0" /> {lt("faq4Q")}</span>
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                {lt("faq4A")}
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
                    "@type": "Organization",
                    "name": "PortAI",
                    "url": "https://portai-invest.com",
                    "logo": "https://portai-invest.com/og-image.jpg",
                    "sameAs": ["https://portai-invest.lovable.app"]
                  },
                  {
                    "@type": "WebSite",
                    "name": "PortAI",
                    "url": "https://portai-invest.com",
                    "potentialAction": {
                      "@type": "SearchAction",
                      "target": "https://portai-invest.com/watchlists?q={search_term_string}",
                      "query-input": "required name=search_term_string"
                    }
                  },
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
                          "text": "You can track 7,000+ stocks, ETFs and cryptocurrencies across 20+ countries, including the S&P 500, NASDAQ, FTSE, DAX, Nikkei and major crypto pairs."
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
      </main>

      <footer className="border-t border-border px-6 py-10">
        <div className="max-w-5xl mx-auto flex flex-col gap-8">
          {/* Stock Market News by Sector — internal linking for SEO */}
          <nav aria-label="Stock market news by sector" className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-left">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-foreground mb-3">{lt("footSector")}</p>
              <ul className="space-y-1.5">
                <li><a href="/dashboard?sector=technology" className="text-xs text-muted-foreground hover:text-primary transition-colors">{lt("footSec1")}</a></li>
                <li><a href="/dashboard?sector=finance" className="text-xs text-muted-foreground hover:text-primary transition-colors">{lt("footSec2")}</a></li>
                <li><a href="/dashboard?sector=crypto" className="text-xs text-muted-foreground hover:text-primary transition-colors">{lt("footSec3")}</a></li>
                <li><a href="/dashboard?sector=energy" className="text-xs text-muted-foreground hover:text-primary transition-colors">{lt("footSec4")}</a></li>
                <li><a href="/dashboard?sector=healthcare" className="text-xs text-muted-foreground hover:text-primary transition-colors">{lt("footSec5")}</a></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-foreground mb-3">{lt("footAi")}</p>
              <ul className="space-y-1.5">
                <li><a href="/dashboard#analyzer" className="text-xs text-muted-foreground hover:text-primary transition-colors">{lt("footAi1")}</a></li>
                <li><a href="/chat" className="text-xs text-muted-foreground hover:text-primary transition-colors">{lt("footAi2")}</a></li>
                <li><a href="/quiz" className="text-xs text-muted-foreground hover:text-primary transition-colors">{lt("footAi3")}</a></li>
                <li><a href="/forum" className="text-xs text-muted-foreground hover:text-primary transition-colors">{lt("footAi4")}</a></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-foreground mb-3">{lt("footTrack")}</p>
              <ul className="space-y-1.5">
                <li><a href="/watchlists" className="text-xs text-muted-foreground hover:text-primary transition-colors">{lt("footTr1")}</a></li>
                <li><a href="/dashboard#heatmap" className="text-xs text-muted-foreground hover:text-primary transition-colors">{lt("footTr2")}</a></li>
                <li><a href="/watchlists#alerts" className="text-xs text-muted-foreground hover:text-primary transition-colors">{lt("footTr3")}</a></li>
                <li><a href="/watchlists?asset=crypto" className="text-xs text-muted-foreground hover:text-primary transition-colors">{lt("footTr4")}</a></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-foreground mb-3">{lt("footLegal")}</p>
              <ul className="space-y-1.5">
                <li><a href="/privacy-policy" className="text-xs text-muted-foreground hover:text-primary transition-colors">{lt("footL1")}</a></li>
                <li><a href="/terms-of-service" className="text-xs text-muted-foreground hover:text-primary transition-colors">{lt("footL2")}</a></li>
                <li><a href="/data-compliance" className="text-xs text-muted-foreground hover:text-primary transition-colors">{lt("footL3")}</a></li>
                <li><a href="/ip-policy" className="text-xs text-muted-foreground hover:text-primary transition-colors">{lt("footL4")}</a></li>
              </ul>
            </div>
          </nav>

          <div className="border-t border-border pt-6 flex flex-col items-center gap-3">
            <p className="inline-flex items-center gap-2 text-[11px] font-semibold text-foreground/80 text-center">
              <Globe className="h-3.5 w-3.5 text-primary" />
              {lt("footAvailable")}
            </p>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground text-center">
              {lt("footPowered")}
            </p>
            <p className="text-xs text-muted-foreground text-center max-w-lg"><span className="font-semibold text-warning">{lt("badgeNFA")}.</span> {lt("footNFA")}</p>
            <p className="text-xs text-muted-foreground">{lt("footCopyright")}</p>
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
