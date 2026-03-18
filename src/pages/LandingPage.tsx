import { TrendingUp, Brain, BarChart3, MessageSquare, Eye, ArrowRight, Sparkles } from "lucide-react";

const features = [
  { icon: Brain, title: "AI Financial Advisor", desc: "Get personalized investment insights powered by advanced AI. Ask any question about markets, portfolios, or strategies." },
  { icon: BarChart3, title: "Market Intelligence", desc: "Analyze any financial article with AI-powered trust scores, bias detection, and smart summaries." },
  { icon: MessageSquare, title: "Smart Forum", desc: "Discuss investments with a community of traders. AI fact-checking keeps conversations grounded." },
  { icon: Eye, title: "Watchlists", desc: "Track your favorite stocks, ETFs, and crypto with real-time charts and technical analysis." },
];

const LandingPage = ({ onGetStarted }: { onGetStarted: () => void }) => {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <TrendingUp className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold text-foreground">PortAI</span>
        </div>
        <button onClick={onGetStarted} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
          Get Started
        </button>
      </nav>

      {/* Hero */}
      <section className="px-6 pt-16 pb-20 max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary mb-6">
          <Sparkles className="h-3.5 w-3.5" /> AI-Powered Platform
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
          AI-Powered Investing,{" "}
          <span className="text-primary">Simplified</span>
        </h1>
        <p className="mt-5 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          PortAI combines artificial intelligence with market data to help you make smarter investment decisions. Analyze articles, build portfolios, and learn — all in one place.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button onClick={onGetStarted} className="flex items-center gap-2 rounded-xl bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:scale-[1.02]">
            Get Started Free <ArrowRight className="h-4 w-4" />
          </button>
          <span className="text-xs text-muted-foreground">No credit card required</span>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 pb-24 max-w-5xl mx-auto">
        <h2 className="text-center text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-10">
          Everything you need
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {features.map((f) => (
            <div key={f.title} className="rounded-2xl border border-border bg-card p-6 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 mb-4">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-base font-semibold mb-1.5">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-6 text-center">
        <p className="text-xs text-muted-foreground">© 2026 PortAI. For educational purposes only. Not financial advice.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
