import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { DisclaimerBanner } from "@/components/DisclaimerBanner";
import { Send, Sparkles, RefreshCw, TrendingUp } from "lucide-react";

const suggestions = [
  "What's the difference between ETFs and mutual funds?",
  "How should I diversify my portfolio?",
  "Explain P/E ratio and how to use it",
  "What is dollar-cost averaging?",
  "How do interest rates affect the stock market?",
  "What are the safest investments for beginners?",
];

type Message = { role: "user" | "assistant"; content: string };

const AIChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");

  const welcomeShown = messages.length === 0;

  const send = (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { role: "user", content: text };
    const assistantMsg: Message = {
      role: "assistant",
      content: `That's a great question about "${text.slice(0, 50)}..." — As an AI financial advisor, I can help explain this concept. This feature will be powered by AI when connected to Lovable Cloud. For now, here's a brief overview: Financial markets are complex systems influenced by many factors including monetary policy, earnings, and investor sentiment. Always do your own research and consult with qualified financial professionals.`,
    };
    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput("");
  };

  return (
    <AppLayout>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <TrendingUp className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold">AI Financial Advisor</h1>
            <p className="text-xs text-muted-foreground">Powered by advanced AI · Educational use only</p>
          </div>
        </div>
        <button className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium transition-colors hover:bg-accent">
          <RefreshCw className="h-3.5 w-3.5" /> New Chat
        </button>
      </div>

      <DisclaimerBanner />

      {/* Chat area */}
      <div className="mt-4 flex flex-col" style={{ minHeight: "calc(100vh - 280px)" }}>
        <div className="flex-1 space-y-4 overflow-y-auto scrollbar-thin">
          {welcomeShown && (
            <>
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary">
                  <Sparkles className="h-4 w-4 text-primary-foreground" />
                </div>
                <div className="rounded-xl rounded-tl-none bg-card p-4 text-sm leading-relaxed text-foreground">
                  Hello! I'm your AI financial advisor. I can help you understand investments, market concepts, portfolio strategies, and more. What would you like to know?
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="rounded-xl border border-border bg-card px-4 py-3 text-left text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}>
              {m.role === "assistant" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary">
                  <Sparkles className="h-4 w-4 text-primary-foreground" />
                </div>
              )}
              <div
                className={`max-w-[70%] rounded-xl p-4 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-primary text-primary-foreground rounded-tr-none"
                    : "bg-card text-foreground rounded-tl-none"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="mt-4 flex items-center gap-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send(input)}
            placeholder="Ask anything about finance, investing, markets..."
            className="h-12 flex-1 rounded-xl border border-border bg-card px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            onClick={() => send(input)}
            className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </AppLayout>
  );
};

export default AIChat;
