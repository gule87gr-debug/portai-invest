import { AppLayout } from "@/components/AppLayout";
import { Brain, BarChart3, MessageSquare, Eye, Sparkles, LayoutDashboard, Globe, ArrowRight, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";

const features = [
  {
    icon: LayoutDashboard,
    title: "Dashboard",
    desc: "Your main feed — browse curated financial news and paste any article URL to get an AI trust score, bias analysis, and summary.",
    to: "/dashboard",
    color: "text-primary",
    bg: "bg-primary/15",
  },
  {
    icon: Brain,
    title: "AI Chat",
    desc: "Chat with an AI financial advisor. Ask about stocks, strategies, portfolio allocation, or any investment concept — your history is saved.",
    to: "/chat",
    color: "text-[hsl(var(--success))]",
    bg: "bg-[hsl(var(--success))]/15",
  },
  {
    icon: Sparkles,
    title: "Investment Quiz",
    desc: "Answer 5 quick questions about your goals and risk tolerance. Get matched with a personalized investor profile and stock recommendations.",
    to: "/quiz",
    color: "text-[hsl(var(--warning))]",
    bg: "bg-[hsl(var(--warning))]/15",
  },
  {
    icon: MessageSquare,
    title: "Forum",
    desc: "Discuss market trends and trade ideas with other investors. AI fact-checking automatically flags unverified claims in conversations.",
    to: "/forum",
    color: "text-purple-400",
    bg: "bg-purple-400/15",
  },
  {
    icon: Eye,
    title: "Watchlists",
    desc: "Build custom watchlists from 2400+ stocks, ETFs, index funds, and crypto. View interactive charts with technical indicators and track price movements.",
    to: "/watchlists",
    color: "text-sky-400",
    bg: "bg-sky-400/15",
  },
  {
    icon: Settings,
    title: "Settings",
    desc: "Set your display name, choose from 6 languages, manage your account, and customize your PortAI experience.",
    to: "/settings",
    color: "text-muted-foreground",
    bg: "bg-secondary",
  },
];

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { el.style.opacity = "1"; el.style.transform = "translateY(0)"; el.style.filter = "blur(0)"; obs.unobserve(el); } },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

const HomePage = () => {
  usePageTitle("Home | PortAI");
  const navigate = useNavigate();
  let t: (k: string) => string;
  try {
    t = useLanguage().t;
  } catch {
    t = (k: string) => k;
  }

  return (
    <AppLayout>
      <div className="py-4 sm:py-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2" style={{ lineHeight: "1.15" }}>
            Welcome to PortAI
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
            Your AI-powered investment companion. Here's everything you can do — tap any card to jump straight in.
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {features.map((f, i) => {
            const ref = useReveal();
            return (
              <div
                key={f.to}
                ref={ref}
                onClick={() => navigate(f.to)}
                className="group cursor-pointer rounded-2xl border border-border bg-card/60 backdrop-blur-md p-5 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 active:scale-[0.98]"
                style={{
                  opacity: 0,
                  transform: "translateY(14px)",
                  filter: "blur(3px)",
                  transition: `opacity 550ms cubic-bezier(0.16,1,0.3,1) ${i * 70}ms, transform 550ms cubic-bezier(0.16,1,0.3,1) ${i * 70}ms, filter 550ms cubic-bezier(0.16,1,0.3,1) ${i * 70}ms, border-color 200ms, box-shadow 200ms`,
                }}
              >
                <div className="flex items-start gap-3.5">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${f.bg}`}>
                    <f.icon className={`h-5 w-5 ${f.color}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-sm font-semibold text-foreground">{f.title}</h3>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>


        {/* Tip */}
        <div
          onClick={() => navigate("/settings")}
          className="mt-6 rounded-xl border border-border bg-card/60 px-5 py-4 flex items-start gap-3 cursor-pointer transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 active:scale-[0.98]"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 mt-0.5">
            <Globe className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-xs font-medium text-foreground mb-0.5">Available in 6 languages</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              English, Español, Français, Português, Deutsch, and Italiano. Switch anytime in Settings.
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default HomePage;
