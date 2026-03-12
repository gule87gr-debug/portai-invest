import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { DisclaimerBanner } from "@/components/DisclaimerBanner";
import { ChevronLeft, ChevronRight, Sparkles, Clock, Target, TrendingUp, BarChart3, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Step = {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  options: { label: string; desc: string }[];
  multi?: boolean;
};

const steps: Step[] = [
  {
    icon: BarChart3,
    title: "Risk Tolerance",
    subtitle: "How comfortable are you with market volatility?",
    options: [
      { label: "Conservative", desc: "Prefer stability" },
      { label: "Moderate", desc: "Balanced approach" },
      { label: "Aggressive", desc: "High growth focus" },
    ],
  },
  {
    icon: Clock,
    title: "Investment Timeframe",
    subtitle: "When do you plan to use these funds?",
    options: [
      { label: "1-3 Years", desc: "Short-term goals" },
      { label: "3-7 Years", desc: "Medium-term planning" },
      { label: "7+ Years", desc: "Long-term wealth building" },
    ],
  },
  {
    icon: Target,
    title: "Profit Goals",
    subtitle: "What annual return are you targeting?",
    options: [
      { label: "5% / year", desc: "Steady income" },
      { label: "10% / year", desc: "Growth-oriented" },
      { label: "20%+ / year", desc: "Aggressive growth" },
    ],
  },
  {
    icon: TrendingUp,
    title: "Investment Experience",
    subtitle: "How would you describe your investing background?",
    options: [
      { label: "Beginner", desc: "New to investing" },
      { label: "Intermediate", desc: "Some experience" },
      { label: "Advanced", desc: "Experienced investor" },
    ],
  },
  {
    icon: Sparkles,
    title: "Sector Interests",
    subtitle: "Select sectors you're interested in (optional)",
    options: [
      { label: "Technology", desc: "" },
      { label: "Healthcare", desc: "" },
      { label: "Finance", desc: "" },
      { label: "Energy", desc: "" },
      { label: "Consumer", desc: "" },
      { label: "Industrial", desc: "" },
    ],
    multi: true,
  },
];

const allocations = [
  { ticker: "QQQ", name: "Invesco QQQ Trust", pct: 30, desc: "QQQ tracks the NASDAQ-100 Index, heavily weighted towards technology and growth stocks. Well-suited for targeting substantial returns." },
  { ticker: "ARKK", name: "ARK Innovation ETF", pct: 25, desc: "This actively managed ETF focuses on disruptive innovation across genomics, automation, and digital finance." },
  { ticker: "VTI", name: "Vanguard Total Stock Market ETF", pct: 20, desc: "VTI provides broad exposure to the U.S. equity market, capturing growth in small, mid, and large-cap stocks." },
  { ticker: "GDX", name: "VanEck Vectors Gold Miners ETF", pct: 15, desc: "Gold mining stocks tend to perform well during economic uncertainty and inflationary pressures." },
  { ticker: "TLT", name: "iShares 20+ Year Treasury Bond ETF", pct: 10, desc: "Although bonds typically have lower returns, TLT adds diversification and a hedge against stock market downturns." },
];

const Quiz = () => {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string[]>>({});
  const [showResults, setShowResults] = useState(false);

  const current = steps[step];
  const progress = ((step + 1) / steps.length) * 100;

  const toggle = (label: string) => {
    if (current.multi) {
      const prev = answers[step] || [];
      setAnswers({ ...answers, [step]: prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label] });
    } else {
      setAnswers({ ...answers, [step]: [label] });
    }
  };

  const selected = answers[step] || [];

  if (showResults) {
    return (
      <AppLayout>
        <DisclaimerBanner />
        <div className="mx-auto mt-6 max-w-3xl animate-fade-in">
          <div className="rounded-2xl border border-border bg-card p-8">
            <div className="mb-6 flex justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/20">
                <CheckCircle2 className="h-7 w-7 text-primary" />
              </div>
            </div>
            <h2 className="text-center text-2xl font-bold">Your Personalized Portfolio</h2>
            <p className="mx-auto mt-3 max-w-lg text-center text-sm leading-relaxed text-muted-foreground">
              This portfolio is tailored to an aggressive investor with advanced experience, targeting high-growth stocks and sectors while also including some diversification and risk management through commodities and bonds.
            </p>

            <h3 className="mb-4 mt-8 text-lg font-semibold">Recommended Allocations</h3>
            <div className="space-y-4">
              {allocations.map((a) => (
                <div key={a.ticker} className="flex gap-4 rounded-xl border border-border bg-accent/30 p-4">
                  <span className="flex h-10 min-w-[3rem] items-center justify-center rounded-lg bg-primary/20 text-sm font-bold text-primary">
                    {a.pct}%
                  </span>
                  <div>
                    <p className="font-semibold">{a.ticker} <span className="font-normal text-muted-foreground">· {a.name}</span></p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{a.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Scenarios */}
            <div className="mt-8 grid grid-cols-3 gap-4">
              {[
                { label: "Bear Case", value: "-5%", sub: "5-year return", border: "border-loss/40", text: "text-loss" },
                { label: "Base Case", value: "20%", sub: "5-year return", border: "border-border", text: "text-foreground" },
                { label: "Bull Case", value: "35%", sub: "5-year return", border: "border-primary/40", text: "text-primary" },
              ].map((s) => (
                <div key={s.label} className={cn("rounded-xl border p-4 text-center", s.border)}>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className={cn("text-2xl font-bold", s.text)}>{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.sub}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-center gap-6 text-center">
              <div>
                <p className="text-xs text-muted-foreground">Expected Return</p>
                <p className="text-lg font-bold text-primary">20%-30% annually</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Risk Level</p>
                <p className="text-lg font-bold">High</p>
              </div>
            </div>

            <div className="mt-8 flex gap-4">
              <button onClick={() => { setShowResults(false); setStep(0); setAnswers({}); }} className="flex-1 rounded-xl border border-border bg-card py-3 text-sm font-medium transition-colors hover:bg-accent">
                Retake Quiz
              </button>
              <button className="flex-1 rounded-xl bg-primary py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
                Build This Portfolio
              </button>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {/* Progress */}
      <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>Step {step + 1} of {steps.length}</span>
        <span className="text-primary font-semibold">{Math.round(progress)}%</span>
      </div>
      <div className="mb-8 h-1.5 rounded-full bg-secondary">
        <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      <div className="mx-auto max-w-2xl animate-fade-in">
        <div className="rounded-2xl border border-border bg-card p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15">
              <current.icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{current.title}</h2>
              <p className="text-sm text-muted-foreground">{current.subtitle}</p>
            </div>
          </div>

          <div className={cn("gap-3", current.multi ? "grid grid-cols-2" : "flex flex-col")}>
            {current.options.map((opt) => (
              <button
                key={opt.label}
                onClick={() => toggle(opt.label)}
                className={cn(
                  "rounded-xl border px-5 py-4 text-left transition-all",
                  selected.includes(opt.label)
                    ? "border-primary bg-primary/10"
                    : "border-border bg-accent/30 hover:border-muted-foreground/30"
                )}
              >
                <p className="font-semibold">{opt.label}</p>
                {opt.desc && <p className="mt-0.5 text-xs text-muted-foreground">{opt.desc}</p>}
              </button>
            ))}
          </div>

          <div className="mt-8 flex justify-between">
            <button
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="flex items-center gap-2 rounded-xl border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" /> Back
            </button>
            {step < steps.length - 1 ? (
              <button
                onClick={() => setStep((s) => s + 1)}
                disabled={selected.length === 0}
                className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-30"
              >
                Continue <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={() => setShowResults(true)}
                className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <Sparkles className="h-4 w-4" /> Generate Portfolio
              </button>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Quiz;
