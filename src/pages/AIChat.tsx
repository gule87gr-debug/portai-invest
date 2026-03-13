import { useState, useRef, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { DisclaimerBanner } from "@/components/DisclaimerBanner";
import { Send, Sparkles, RefreshCw, TrendingUp, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const suggestions = [
  "What's the difference between ETFs and mutual funds?",
  "How should I diversify my portfolio?",
  "Explain P/E ratio and how to use it",
  "What is dollar-cost averaging?",
  "How do interest rates affect the stock market?",
  "What are the safest investments for beginners?",
];

type Message = { role: "user" | "assistant"; content: string };

const aiResponses: Record<string, string> = {
  "etf": `**ETFs vs. Mutual Funds — Key Differences:**

📊 **Trading:** ETFs trade throughout the day like stocks. Mutual funds only trade at end-of-day NAV.

💰 **Fees:** ETFs typically have lower expense ratios (0.03%-0.20%) vs mutual funds (0.50%-1.50%).

📈 **Minimum Investment:** ETFs can be bought for the price of one share. Mutual funds often require $1,000-$3,000 minimum.

🏦 **Tax Efficiency:** ETFs are generally more tax-efficient due to their unique creation/redemption mechanism.

**Bottom line:** For most investors, ETFs offer lower costs, more flexibility, and better tax efficiency. Consider index ETFs like VOO or VTI as core holdings.`,

  "diversif": `**Portfolio Diversification Strategy:**

🎯 **The Core Principle:** Don't put all your eggs in one basket. Diversification reduces risk without necessarily reducing returns.

📋 **Recommended Allocation by Risk Level:**
- **Conservative:** 40% Bonds (BND), 30% Large-Cap (VOO), 15% International (VXUS), 15% Gold (GLD)
- **Moderate:** 50% US Stocks (VTI), 20% International (VXUS), 20% Bonds (BND), 10% REITs (VNQ)
- **Aggressive:** 60% Growth (QQQ), 20% International, 10% Small-Cap (IWM), 10% Crypto

⚠️ **Key Rules:**
1. No single stock > 5% of portfolio
2. No single sector > 25%
3. Rebalance quarterly
4. Include uncorrelated assets (bonds, gold, real estate)`,

  "p/e": `**Price-to-Earnings (P/E) Ratio Explained:**

📊 **Formula:** P/E = Stock Price ÷ Earnings Per Share (EPS)

**Example:** If AAPL trades at $180 and EPS is $6, P/E = 30x

🔍 **How to Interpret:**
- **< 15x:** Potentially undervalued (value stocks)
- **15-25x:** Fair value range for most stocks
- **25-40x:** Growth premium — market expects high future earnings
- **> 40x:** Very expensive — needs exceptional growth to justify

📈 **Types:**
- **Trailing P/E:** Uses last 12 months earnings (backward-looking)
- **Forward P/E:** Uses estimated future earnings (more useful)

⚠️ **Pitfalls:** Don't compare P/E across sectors. Tech stocks (avg ~30x) naturally trade higher than utilities (~15x). Always compare within the same industry.`,

  "dollar-cost": `**Dollar-Cost Averaging (DCA) Strategy:**

💡 **What is it?** Investing a fixed amount at regular intervals regardless of market price.

**Example:** Instead of investing $12,000 at once, invest $1,000/month for 12 months.

✅ **Benefits:**
- Removes emotion from investing
- Reduces impact of volatility
- No need to time the market
- Builds disciplined investing habits

📊 **Real-world example with $500/month into SPY:**
- Month 1: $450/share → 1.11 shares
- Month 2: $420/share → 1.19 shares (market dip = more shares!)
- Month 3: $460/share → 1.09 shares
- Average cost: $443/share vs $460 if bought all at month 3

🎯 **Best for:** Long-term investors (5+ year horizon), retirement accounts (401k, IRA), and anyone who wants to invest without stress.`,

  "interest": `**How Interest Rates Affect the Stock Market:**

📈 **Rate Hikes (Bad for stocks, usually):**
- Higher borrowing costs → lower corporate profits
- Bonds become more attractive vs stocks
- Growth stocks hit hardest (future earnings worth less)
- Banks & financials can benefit (wider net interest margins)

📉 **Rate Cuts (Good for stocks, usually):**
- Cheaper borrowing → business expansion
- Lower discount rate → higher stock valuations
- Growth stocks rally (NASDAQ/QQQ)
- Real estate & utilities benefit most

🔍 **Sector Impact:**
| Sector | Rate Hike | Rate Cut |
|--------|-----------|----------|
| Tech | ❌ Negative | ✅ Positive |
| Banks | ✅ Positive | ❌ Mixed |
| Utilities | ❌ Negative | ✅ Positive |
| Real Estate | ❌ Negative | ✅ Positive |

**Current situation:** Watch the Fed's dot plot and inflation data for rate direction signals.`,

  "safest": `**Safest Investments for Beginners:**

🥇 **Tier 1 — Lowest Risk:**
- **High-Yield Savings Account** (4.5-5.0% APY currently)
- **Treasury Bills (T-Bills)** — US government backed
- **I-Bonds** — Inflation-protected, government guaranteed

🥈 **Tier 2 — Low Risk ETFs:**
- **BND** (Vanguard Total Bond Market) — Broad bond exposure
- **SCHD** (Schwab Dividend ETF) — Quality dividend stocks
- **VOO** (Vanguard S&P 500) — 500 largest US companies

🥉 **Tier 3 — Moderate Risk:**
- **VTI** (Total Stock Market) — Entire US market
- **VXUS** (International Stocks) — Global diversification

💡 **Beginner Portfolio Suggestion:**
- 50% VOO (S&P 500)
- 30% BND (Bonds)
- 20% High-yield savings

Start with what you're comfortable with and gradually increase stock allocation as you learn more. The best investment is one you'll actually stick with!`,
};

function getAIResponse(input: string): string {
  const lower = input.toLowerCase();
  for (const [key, response] of Object.entries(aiResponses)) {
    if (lower.includes(key)) return response;
  }
  return `Great question about "${input.slice(0, 60)}..."

📊 **Analysis:** This is an interesting topic in today's market environment. Here are the key points to consider:

1. **Market Context:** Current macroeconomic conditions including inflation trends, Fed policy, and global growth dynamics all play a role.

2. **Historical Perspective:** Looking at past market cycles, similar conditions have typically led to sector rotation and increased volatility.

3. **Actionable Insights:**
   - Review your portfolio allocation quarterly
   - Consider both fundamental and technical analysis
   - Stay diversified across sectors and asset classes
   - Set clear entry/exit criteria before trading

4. **Risk Management:** Always use position sizing (max 5% per trade) and stop-losses to protect capital.

⚠️ *This is educational content, not financial advice. Consult a licensed financial advisor for personalized recommendations.*`;
}

const AIChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const welcomeShown = messages.length === 0;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (text: string) => {
    if (!text.trim() || isTyping) return;
    const userMsg: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    // Simulate typing delay
    await new Promise((r) => setTimeout(r, 800 + Math.random() * 1200));

    const response = getAIResponse(text);
    setMessages((prev) => [...prev, { role: "assistant", content: response }]);
    setIsTyping(false);
  };

  return (
    <AppLayout>
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
        <button onClick={() => setMessages([])} className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium transition-colors hover:bg-accent">
          <RefreshCw className="h-3.5 w-3.5" /> New Chat
        </button>
      </div>

      <DisclaimerBanner />

      <div className="mt-4 flex flex-col" style={{ minHeight: "calc(100vh - 280px)" }}>
        <div className="flex-1 space-y-4 overflow-y-auto scrollbar-thin">
          {welcomeShown && (
            <>
              <div className="flex gap-3 animate-fade-in">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary">
                  <Sparkles className="h-4 w-4 text-primary-foreground" />
                </div>
                <div className="rounded-xl rounded-tl-none bg-card p-4 text-sm leading-relaxed text-foreground">
                  Hello! I'm your AI financial advisor. I can help you understand investments, market concepts, portfolio strategies, and more. What would you like to know?
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                {suggestions.map((s, i) => (
                  <button key={s} onClick={() => send(s)} className="rounded-xl border border-border bg-card px-4 py-3 text-left text-sm text-muted-foreground transition-all hover:border-primary/40 hover:text-foreground hover:bg-accent/30 animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
                    {s}
                  </button>
                ))}
              </div>
            </>
          )}

          {messages.map((m, i) => (
            <div key={i} className={cn("flex gap-3 animate-fade-in", m.role === "user" ? "justify-end" : "")}>
              {m.role === "assistant" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary">
                  <Sparkles className="h-4 w-4 text-primary-foreground" />
                </div>
              )}
              <div className={cn("max-w-[70%] rounded-xl p-4 text-sm leading-relaxed whitespace-pre-line", m.role === "user" ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-card text-foreground rounded-tl-none")}>
                {m.content}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3 animate-fade-in">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary">
                <Sparkles className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="rounded-xl rounded-tl-none bg-card px-4 py-3">
                <div className="flex gap-1">
                  <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="mt-4 flex items-center gap-3">
          <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send(input)} placeholder="Ask anything about finance, investing, markets..." className="h-12 flex-1 rounded-xl border border-border bg-card px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          <button onClick={() => send(input)} disabled={isTyping} className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50">
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </AppLayout>
  );
};

export default AIChat;
