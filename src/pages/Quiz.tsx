import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { DisclaimerBanner } from "@/components/DisclaimerBanner";
import { SEO } from "@/components/SEO";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useApp } from "@/contexts/AppContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSubscription } from "@/hooks/useSubscription";
import { UpgradeModal } from "@/components/UpgradeModal";
import { generatePortfolio, portfolioToStocks } from "@/lib/quizRecommendations";
import { ChevronLeft, ChevronRight, Sparkles, Clock, Target, TrendingUp, BarChart3, CheckCircle2, Crown, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

const Quiz = () => {
  const { t } = useLanguage();
  usePageTitle("Investor Profile Quiz | PortAI");
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string[]>>({});
  const [showResults, setShowResults] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const { watchlists, addWatchlist } = useApp();
  const { hasFullQuiz } = useSubscription();
  const navigate = useNavigate();

  const steps = [
    {
      icon: BarChart3, title: t("riskTolerance"), subtitle: t("riskToleranceSub"),
      options: [{ label: t("conservative"), desc: t("conservativeDesc") }, { label: t("moderate"), desc: t("moderateDesc") }, { label: t("aggressive"), desc: t("aggressiveDesc") }],
    },
    {
      icon: Clock, title: t("investmentTimeframe"), subtitle: t("investmentTimeframeSub"),
      options: [{ label: t("shortTerm"), desc: t("shortTermDesc") }, { label: t("mediumTerm"), desc: t("mediumTermDesc") }, { label: t("longTerm"), desc: t("longTermDesc") }],
    },
    {
      icon: Target, title: t("profitGoals"), subtitle: t("profitGoalsSub"),
      options: [{ label: t("steadyIncome"), desc: t("steadyIncomeDesc") }, { label: t("growthOriented"), desc: t("growthOrientedDesc") }, { label: t("aggressiveGrowth"), desc: t("aggressiveGrowthDesc") }],
    },
    {
      icon: TrendingUp, title: t("investmentExperience"), subtitle: t("investmentExperienceSub"),
      options: [{ label: t("beginner"), desc: t("beginnerDesc") }, { label: t("intermediate"), desc: t("intermediateDesc") }, { label: t("advanced"), desc: t("advancedDesc") }],
    },
    {
      icon: Sparkles, title: t("sectorInterests"), subtitle: t("sectorInterestsSub"),
      options: [{ label: t("technology"), desc: "" }, { label: t("healthcare"), desc: "" }, { label: t("finance"), desc: "" }, { label: t("energy"), desc: "" }, { label: t("consumer"), desc: "" }, { label: t("industrial"), desc: "" }],
      multi: true,
    },
  ];

  const current = steps[step];
  const progress = ((step + 1) / steps.length) * 100;
  const portfolio = generatePortfolio(answers);

  const toggle = (label: string) => {
    if (current.multi) {
      const prev = answers[step] || [];
      setAnswers({ ...answers, [step]: prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label] });
    } else {
      setAnswers({ ...answers, [step]: [label] });
    }
  };

  const selected = answers[step] || [];

  const handleBuildPortfolio = () => {
    const baseName = "Custom Portfolio";
    const existingNames = watchlists.map((w) => w.name);
    let name = baseName;
    let counter = 1;
    while (existingNames.includes(name)) { counter++; name = `${baseName} ${counter}`; }
    const stocks = portfolioToStocks(portfolio.allocations);
    addWatchlist({ id: `wl-${Date.now()}`, name, stocks, desc: portfolio.rationale });
    navigate("/watchlists");
  };

  if (showResults) {
    return (
      <AppLayout>
        <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} title="Unlock Your Results" description="Upgrade to Pro to see your personalized portfolio, allocations, and projections." />
        <DisclaimerBanner />
        <div className="mx-auto mt-6 max-w-3xl animate-fade-in">
          <div className="rounded-2xl border border-border bg-card p-8">
            <div className="mb-6 flex justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/20 animate-[pulse_2s_ease-in-out_1]">
                <CheckCircle2 className="h-7 w-7 text-primary" />
              </div>
            </div>
            <h2 className="text-center text-2xl font-bold">{t("yourPersonalizedPortfolio")}</h2>
            <p className="mx-auto mt-3 max-w-lg text-center text-sm leading-relaxed text-muted-foreground">
              {hasFullQuiz
                ? t("rationaleTpl")
                    .replace("{risk}", t(`risk_${portfolio.riskKey}`))
                    .replace("{profit}", t(`profit_${portfolio.profitKey}`))
                    .replace("{time}", t(`time_${portfolio.timeKey}`))
                    .replace("{exp}", t(portfolio.experienceKey))
                    .replace("{ret}", portfolio.expectedReturn)
                : t("resultsLockedDesc")}
            </p>

            <div className="relative">
              {!hasFullQuiz && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-xl bg-background/80 backdrop-blur-sm">
                  <Lock className="h-8 w-8 text-primary mb-3" />
                  <h3 className="text-lg font-bold mb-1">{t("resultsLocked")}</h3>
                  <p className="text-sm text-muted-foreground mb-4 text-center max-w-xs">{t("resultsLockedDesc")}</p>
                  <button onClick={() => setShowUpgrade(true)} className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                    <Crown className="h-4 w-4" /> {t("unlockResultsBtn")}
                  </button>
                </div>
              )}

              <div className={cn(!hasFullQuiz && "blur-md select-none pointer-events-none")}>
                <h3 className="mb-4 mt-8 text-lg font-semibold">{t("recommendedAllocations")}</h3>
                <div className="space-y-4">
                  {portfolio.allocations.map((a, i) => {
                    const localized = a.descKey ? t(a.descKey) : a.desc;
                    const desc = localized && localized !== a.descKey ? localized : a.desc;
                    return (
                      <div key={a.ticker} className="flex gap-4 rounded-xl border border-border bg-accent/30 p-4 animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
                        <span className="flex h-10 min-w-[3rem] items-center justify-center rounded-lg bg-primary/20 text-sm font-bold text-primary font-mono">{a.pct}%</span>
                        <div>
                          <p className="font-semibold">{a.ticker} <span className="font-normal text-muted-foreground">· {a.name}</span></p>
                          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-8 grid grid-cols-3 gap-4">
                  {[
                    { label: t("bearCase"), value: portfolio.bearCase, sub: t("fiveYearReturn"), border: "border-loss/40", text: "text-loss" },
                    { label: t("baseCase"), value: portfolio.baseCase, sub: t("fiveYearReturn"), border: "border-border", text: "text-foreground" },
                    { label: t("bullCase"), value: portfolio.bullCase, sub: t("fiveYearReturn"), border: "border-primary/40", text: "text-primary" },
                  ].map((s) => (
                    <div key={s.label} className={cn("rounded-xl border p-4 text-center", s.border)}>
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                      <p className={cn("text-2xl font-bold font-mono", s.text)}>{s.value}</p>
                      <p className="text-xs text-muted-foreground">{s.sub}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex justify-center gap-6 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground">{t("expectedReturn")}</p>
                    <p className="text-lg font-bold text-primary">{portfolio.expectedReturn}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t("riskLevel")}</p>
                    <p className="text-lg font-bold">{t(portfolio.riskLevelKey)}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 flex gap-4">
              <button onClick={() => { setShowResults(false); setStep(0); setAnswers({}); }} className="flex-1 rounded-xl border border-border bg-card py-3 text-sm font-medium transition-colors hover:bg-accent">
                {t("retakeQuiz")}
              </button>
              {hasFullQuiz && (
                <button onClick={handleBuildPortfolio} className="flex-1 rounded-xl bg-primary py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
                  {t("buildThisPortfolio")}
                </button>
              )}
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <SEO
        title="Investor Profile Quiz — PortAI"
        description="Take the PortAI investor profile quiz to get a personalized portfolio of stocks, ETFs and crypto matched to your risk and goals."
        path="/quiz"
      />
      <h1 className="sr-only">Investor Profile Quiz</h1>
      <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>{t("step")} {step + 1} {t("of")} {steps.length}</span>
        <span className="text-primary font-semibold">{Math.round(progress)}%</span>
      </div>
      <div className="mb-8 h-1.5 rounded-full bg-secondary">
        <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      <div className="mx-auto max-w-2xl animate-fade-in" key={step}>
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
              <button key={opt.label} onClick={() => toggle(opt.label)} className={cn("rounded-xl border px-5 py-4 text-left transition-all", selected.includes(opt.label) ? "border-primary bg-primary/10" : "border-border bg-accent/30 hover:border-muted-foreground/30")}>
                <p className="font-semibold">{opt.label}</p>
                {opt.desc && <p className="mt-0.5 text-xs text-muted-foreground">{opt.desc}</p>}
              </button>
            ))}
          </div>

          <div className="mt-8 flex justify-between">
            <button onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0} className="flex items-center gap-2 rounded-xl border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-30">
              <ChevronLeft className="h-4 w-4" /> {t("back")}
            </button>
            {step < steps.length - 1 ? (
              <button onClick={() => setStep((s) => s + 1)} disabled={selected.length === 0} className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-30">
                {t("continue")} <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button onClick={() => setShowResults(true)} className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
                <Sparkles className="h-4 w-4" /> {t("generatePortfolio")}
              </button>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Quiz;
