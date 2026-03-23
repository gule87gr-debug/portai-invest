import { TrendingUp, Brain, BarChart3, MessageSquare, Eye, ArrowRight, Sparkles, LayoutDashboard, BookOpen, Shield, Globe, ChevronRight, Zap, Target, Users, LineChart, Newspaper, CheckCircle2, Lock, ShieldCheck, Fingerprint } from "lucide-react";
import { useEffect, useRef } from "react";

const features = [
  {
    icon: LayoutDashboard,
    title: "Smart Dashboard",
    tagline: "Your financial command center",
    details: [
      "View curated market news with AI-generated trust scores",
      "Paste any financial article URL for instant AI analysis",
      "See bias detection, credibility ratings, and smart summaries",
      "Stay informed with real-time news from major financial sources",
    ],
  },
  {
    icon: Brain,
    title: "AI Financial Advisor",
    tagline: "Ask anything about investing",
    details: [
      "Chat with an AI trained on financial markets and strategies",
      "Get personalized portfolio recommendations and analysis",
      "Ask about specific stocks, sectors, or investment concepts",
      "Conversation history saved across sessions for continuity",
    ],
  },
  {
    icon: Sparkles,
    title: "Investment Quiz",
    tagline: "Discover your investor profile",
    details: [
      "Complete a guided 5-step questionnaire about your goals",
      "Get matched with an investment style (conservative to aggressive)",
      "Receive tailored stock and ETF recommendations",
      "Learn which sectors and asset classes fit your risk tolerance",
    ],
  },
  {
    icon: MessageSquare,
    title: "Community Forum",
    tagline: "Discuss with real investors",
    details: [
      "Create threads to discuss market trends and trade ideas",
      "AI-powered fact-checking flags unverified claims automatically",
      "Reply, upvote, and engage in meaningful financial discussions",
      "Moderated by AI to keep conversations grounded and respectful",
    ],
  },
  {
    icon: Eye,
    title: "Watchlists",
    tagline: "Track what matters to you",
    details: [
      "Build custom watchlists with 550+ stocks, ETFs, and crypto",
      "View interactive TradingView charts with technical indicators",
      "Organize assets by sector, signal strength, or personal tags",
      "Monitor real-time price movements and market data",
    ],
  },
  {
    icon: Globe,
    title: "Multi-Language Support",
    tagline: "Use PortAI in your language",
    details: [
      "Full interface available in 6 languages",
      "English, Spanish, French, Portuguese, German, and Italian",
      "Switch languages instantly from settings",
      "All AI responses adapt to your chosen language",
    ],
  },
];

const howItWorks = [
  { step: "1", title: "Create your account", desc: "Sign up in seconds with email. No credit card required." },
  { step: "2", title: "Explore the dashboard", desc: "Browse curated news, paste article links for AI analysis, and get trust scores." },
  { step: "3", title: "Take the quiz", desc: "Answer 5 questions to discover your investor profile and get personalized picks." },
  { step: "4", title: "Build watchlists", desc: "Add stocks, ETFs, and crypto to custom lists. Track charts and signals." },
  { step: "5", title: "Ask the AI", desc: "Chat with your AI advisor about any investment question, anytime." },
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
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
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
      `}</style>

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <TrendingUp className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold text-foreground">PortAI</span>
        </div>
        <button
          onClick={onGetStarted}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.97]"
        >
          Get Started
        </button>
      </nav>

      {/* Hero */}
      <section className="px-6 pt-16 pb-24 max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary mb-6">
          <Sparkles className="h-3.5 w-3.5" /> AI-Powered Investment Platform
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight" style={{ lineHeight: "1.08" }}>
          Invest smarter with
          <br />
          <span className="text-primary">artificial intelligence</span>
        </h1>
        <p className="mt-5 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed" style={{ textWrap: "pretty" as any }}>
          PortAI combines AI analysis, real-time market data, and community insights to help you make informed investment decisions — whether you're just starting out or managing a portfolio.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={onGetStarted}
            className="flex items-center gap-2 rounded-xl bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 active:scale-[0.97]"
          >
            Create Free Account <ArrowRight className="h-4 w-4" />
          </button>
          <a
            href="#features"
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            See what's inside <ChevronRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </section>

      {/* Stats bar */}
      <RevealSection>
        <div className="border-y border-border bg-card/50 py-8 px-6">
          <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            {[
              { value: "550+", label: "Stocks & assets" },
              { value: "6", label: "Languages" },
              { value: "AI", label: "Fact-checking" },
              { value: "24/7", label: "AI advisor" },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-2xl font-bold text-foreground font-mono tracking-tight">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </RevealSection>

      {/* Features — detailed */}
      <section id="features" className="px-6 pt-20 pb-16 max-w-5xl mx-auto">
        <RevealSection>
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-primary mb-3">Platform Features</p>
          <h2 className="text-center text-2xl sm:text-3xl font-bold text-foreground mb-4" style={{ textWrap: "balance" as any }}>
            Everything you need to invest with confidence
          </h2>
          <p className="text-center text-muted-foreground max-w-xl mx-auto mb-14 text-sm leading-relaxed">
            From AI-powered analysis to community discussions, PortAI gives you the tools professional investors use — in a simple, unified interface.
          </p>
        </RevealSection>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {features.map((f, i) => (
            <RevealSection key={f.title}>
              <div
                className="rounded-2xl border border-border bg-card/60 backdrop-blur-md p-6 h-full transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
                style={{ transitionDelay: `${i * 60}ms` }}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15">
                    <f.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-foreground">{f.title}</h3>
                    <p className="text-sm text-muted-foreground">{f.tagline}</p>
                  </div>
                </div>
                <ul className="space-y-2.5 ml-1">
                  {f.details.map((d) => (
                    <li key={d} className="flex items-start gap-2.5 text-sm text-muted-foreground leading-relaxed">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-success mt-0.5" />
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            </RevealSection>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-20 bg-card/40 border-y border-border">
        <div className="max-w-3xl mx-auto">
          <RevealSection>
            <p className="text-center text-xs font-semibold uppercase tracking-widest text-primary mb-3">Getting Started</p>
            <h2 className="text-center text-2xl sm:text-3xl font-bold text-foreground mb-12" style={{ textWrap: "balance" as any }}>
              Up and running in minutes
            </h2>
          </RevealSection>

          <div className="space-y-6">
            {howItWorks.map((h, i) => (
              <RevealSection key={h.step}>
                <div className="flex items-start gap-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary font-mono">
                    {h.step}
                  </div>
                  <div className="pt-1">
                    <h3 className="text-sm font-semibold text-foreground mb-0.5">{h.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{h.desc}</p>
                  </div>
                </div>
              </RevealSection>
            ))}
          </div>

          <RevealSection className="mt-10 text-center">
            <button
              onClick={onGetStarted}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 active:scale-[0.97]"
            >
              Start Now — It's Free <ArrowRight className="h-4 w-4" />
            </button>
          </RevealSection>
        </div>
      </section>

      {/* Trust badges */}
      <RevealSection>
        <section className="px-6 py-10 max-w-4xl mx-auto">
          <div className="flex flex-wrap items-center justify-center gap-4">
            {[
              { icon: Lock, label: "256-bit Encryption" },
              { icon: ShieldCheck, label: "Bank-level Security" },
              { icon: Fingerprint, label: "SOC 2 Compliant" },
            ].map((badge) => (
              <div key={badge.label} className="flex items-center gap-2 rounded-full border border-border bg-card/60 backdrop-blur-sm px-4 py-2">
                <badge.icon className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium text-foreground">{badge.label}</span>
              </div>
            ))}
          </div>
        </section>
      </RevealSection>

      {/* Trust signals */}
      <RevealSection>
        <section className="px-6 py-16 max-w-4xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            {[
              { icon: Shield, title: "Secure by default", desc: "Email verification, encrypted data, and privacy-first design." },
              { icon: Zap, title: "No setup required", desc: "No API keys, no downloads. Sign up and start using every feature instantly." },
              { icon: Lock, title: "Not financial advice", desc: "PortAI is for education and research. Always consult a licensed advisor." },
            ].map((t) => (
              <div key={t.title} className="flex flex-col items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary">
                  <t.icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">{t.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-[220px]">{t.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </RevealSection>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-8">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">© 2026 PortAI. For educational purposes only. Not financial advice.</p>
          <div className="flex items-center gap-4">
            <a href="/privacy-policy" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</a>
            <a href="/terms-of-service" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
