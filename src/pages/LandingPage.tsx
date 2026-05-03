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
    document.title = "PortAI — Stop Trading on Biased News | AI Article Analyzer";
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

      {/* Hero */}
      <section className="px-4 sm:px-6 pt-12 sm:pt-16 pb-10 max-w-4xl mx-auto text-center relative gold-glow">
        <div className="inline-flex items-center gap-2 rounded-full border border-loss/30 bg-loss/10 px-4 py-1.5 text-xs font-bold text-loss mb-6 tracking-label uppercase">
          <ShieldCheck className="h-3.5 w-3.5" /> {t("heroBadge")}
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight relative z-10" style={{ lineHeight: "1.05" }}>
          {t("heroTitleA")}
          <br />
          <span className="text-primary">{t("heroTitleB")}</span>
        </h1>
        <p className="mt-5 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed relative z-10" style={{ textWrap: "pretty" as any }}>
          {t("heroSubtitle")}
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
                  aria-label="Article URL to analyze"
                />
              </div>
              <button
                onClick={handleAnalyze}
                className="flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm sm:text-base font-bold text-primary-foreground transition-all duration-200 hover:bg-primary/90 btn-glow active:scale-[0.97] shrink-0"
              >
                {t("heroAnalyze")} <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            {t("heroOr")}{" "}
            <button onClick={onGetStarted} className="font-semibold text-primary hover:underline">
              {t("heroCreate")}
            </button>
          </p>
        </div>
      </section>

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
