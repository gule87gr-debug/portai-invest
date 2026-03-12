import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { TradingViewHeatmap } from "@/components/TradingViewWidgets";
import { Link as LinkIcon, Search, Globe, ShieldCheck, FileText, AlertCircle } from "lucide-react";

const Dashboard = () => {
  const [url, setUrl] = useState("");

  return (
    <AppLayout>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Market Intelligence</h1>
        <p className="mt-1 text-muted-foreground">AI-curated analysis with trust scores and live market data</p>
      </div>

      {/* Analyze Link Section */}
      <div className="mb-8 rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-2">
          <LinkIcon className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Analyze Link</h2>
        </div>
        <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
          Paste any financial news article, blog post, or research report URL below. Our AI will read the content and provide a <span className="text-foreground font-medium">trust/bias score (1-10)</span>, a concise 200-word summary, source credibility assessment, and highlight potential biases or conflicts of interest — so you can make more informed decisions.
        </p>

        <div className="flex gap-3">
          <div className="relative flex-1">
            <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste article URL here (e.g. https://cnbc.com/article/...)"
              className="h-11 w-full rounded-lg border border-border bg-accent/30 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <button className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
            <Search className="h-4 w-4" /> Analyze
          </button>
        </div>

        {/* How it works */}
        <div className="mt-5 grid grid-cols-3 gap-4">
          {[
            { icon: ShieldCheck, title: "Trust Score", desc: "AI rates source credibility, author expertise, and citation quality on a 1-10 scale" },
            { icon: FileText, title: "Smart Summary", desc: "Get a concise 200-word summary highlighting key claims, data points, and conclusions" },
            { icon: AlertCircle, title: "Bias Detection", desc: "Flags promotional language, missing disclosures, and potential conflicts of interest" },
          ].map((item) => (
            <div key={item.title} className="rounded-lg border border-border bg-accent/20 p-4">
              <item.icon className="mb-2 h-5 w-5 text-primary" />
              <p className="text-sm font-semibold">{item.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Heatmap */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h2 className="mb-3 text-lg font-semibold">S&P 500 Stock Heatmap</h2>
        <TradingViewHeatmap height={550} />
      </div>
    </AppLayout>
  );
};

export default Dashboard;
