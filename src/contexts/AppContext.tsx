import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Stock = { ticker: string; sector: string; name: string; signal: string };
export type WatchlistData = { id: string; name: string; stocks: Stock[]; desc: string };

export type ForumComment = { id: string; author: string; avatar: string; body: string; time: string; likes: number; userId?: string };
export type ForumThread = {
  id: string; author: string; avatar: string; time: string;
  tags: { label: string; color: string }[];
  title: string; body: string; likes: number;
  comments: ForumComment[];
  likedByUser: boolean;
  factCheck?: string;
  userId?: string;
};

export type UserProfile = {
  name: string; email: string; avatar: string | null; anonymous: boolean;
};

type AppState = {
  watchlists: WatchlistData[];
  setWatchlists: React.Dispatch<React.SetStateAction<WatchlistData[]>>;
  addWatchlist: (w: WatchlistData) => void;
  addStockToWatchlist: (listId: string, stock: Stock) => void;
  removeStockFromWatchlist: (listId: string, ticker: string) => void;
  deleteWatchlist: (listId: string) => void;
  threads: ForumThread[];
  setThreads: React.Dispatch<React.SetStateAction<ForumThread[]>>;
  addThread: (t: ForumThread) => void;
  likeThread: (id: string) => void;
  addComment: (threadId: string, comment: ForumComment) => void;
  setFactCheck: (threadId: string, text: string) => void;
  deleteThread: (id: string) => void;
  deleteComment: (threadId: string, commentId: string) => void;
  profile: UserProfile;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  currentUserId: string | null;
  initialLanguage: string;
};

const defaultWatchlists: WatchlistData[] = [
  {
    id: "wl-1", name: "Custom Portfolio 2",
    desc: "Conservative portfolio emphasizing stability with selected sector exposure.",
    stocks: [
      { ticker: "XLP", sector: "Consumer", name: "Consumer Staples Select Sector SPDR Fund", signal: "neutral" },
      { ticker: "VDE", sector: "Energy", name: "Vanguard Energy ETF", signal: "neutral" },
      { ticker: "XLI", sector: "Industrial", name: "Industrial Select Sector SPDR Fund", signal: "neutral" },
      { ticker: "BND", sector: "Fixed Income", name: "Vanguard Total Bond Market ETF", signal: "neutral" },
    ],
  },
  {
    id: "wl-2", name: "Custom Portfolio",
    desc: "A balanced growth portfolio targeting tech and healthcare sectors with moderate risk.",
    stocks: [
      { ticker: "QQQ", sector: "Tech", name: "Invesco QQQ Trust", signal: "neutral" },
      { ticker: "XLV", sector: "Healthcare", name: "Health Care Select Sector SPDR", signal: "neutral" },
      { ticker: "SPY", sector: "Index", name: "SPDR S&P 500 ETF Trust", signal: "neutral" },
      { ticker: "ARKK", sector: "Innovation", name: "ARK Innovation ETF", signal: "neutral" },
    ],
  },
];

const defaultThreads: ForumThread[] = [
  { id: "t-1", author: "guich", avatar: "G", time: "about 1 month ago", tags: [{ label: "general", color: "bg-muted text-muted-foreground" }], title: "What do you think about Trump's threats on Greenland?", body: "Does he actually have intents to invade or is it just a strategy for something else", likes: 3, comments: [{ id: "c-1", author: "MarketWatcher", avatar: "M", body: "Probably just negotiation leverage for rare earth minerals access.", time: "3 weeks ago", likes: 2 }], likedByUser: false, userId: "system" },
  { id: "t-2", author: "TechInvestor2025", avatar: "T", time: "about 1 month ago", tags: [{ label: "portfolios", color: "bg-primary/20 text-primary" }], title: "My AI/Tech Heavy Portfolio - Thoughts?", body: "Just restructured my portfolio: 35% NVDA, 20% MSFT, 15% GOOGL, 15% AMZN, 10% META, 5% cash. I know it's tech heavy but I believe in the AI thesis for the next decade.", likes: 42, comments: [{ id: "c-2", author: "DiversifyGuy", avatar: "D", body: "Way too concentrated in tech. Add XLP or XLU for defense.", time: "3 weeks ago", likes: 8 }, { id: "c-3", author: "AIBull", avatar: "A", body: "I'm similarly positioned. AI is the biggest wealth creation opportunity of our generation.", time: "2 weeks ago", likes: 5 }], likedByUser: false, userId: "system" },
  { id: "t-3", author: "MacroTrader", avatar: "M", time: "about 1 month ago", tags: [{ label: "markets", color: "bg-primary/20 text-primary" }], title: "Fed Rate Decision Impact Analysis", body: "The Fed is expected to hold rates steady. How are you all positioning for this? I'm looking at TLT and utilities.", likes: 28, comments: [{ id: "c-4", author: "BondKing", avatar: "B", body: "TLT is a solid play if rates are at peak. I'm also looking at XLU.", time: "3 weeks ago", likes: 4 }], likedByUser: false, userId: "system" },
  { id: "t-4", author: "DividendKing", avatar: "D", time: "3 weeks ago", tags: [{ label: "portfolios", color: "bg-primary/20 text-primary" }], title: "Best dividend ETFs for passive income in 2026?", body: "I'm looking to build a dividend-focused portfolio. Currently considering SCHD, VYM, and JEPI. What are your top picks?", likes: 35, comments: [{ id: "c-5", author: "IncomeInvestor", avatar: "I", body: "SCHD is the gold standard. Low expense ratio and solid track record.", time: "2 weeks ago", likes: 12 }], likedByUser: false, userId: "system" },
  { id: "t-5", author: "CryptoWhale", avatar: "C", time: "3 weeks ago", tags: [{ label: "markets", color: "bg-primary/20 text-primary" }], title: "Bitcoin ETFs vs holding actual BTC", body: "With IBIT and FBTC now available, is there any reason to hold BTC directly anymore? The ETFs seem more convenient for tax purposes.", likes: 55, comments: [{ id: "c-6", author: "NotYourKeys", avatar: "N", body: "Not your keys, not your coins. ETFs have counterparty risk.", time: "2 weeks ago", likes: 18 }], likedByUser: false, userId: "system" },
  { id: "t-6", author: "ValueHunter", avatar: "V", time: "3 weeks ago", tags: [{ label: "sectors", color: "bg-primary/20 text-primary" }], title: "Healthcare sector looks undervalued right now", body: "XLV is trading at a P/E of 17x vs the S&P at 22x. With aging demographics and AI in drug discovery, this seems like a no-brainer long-term play.", likes: 31, comments: [], likedByUser: false, userId: "system" },
  { id: "t-7", author: "RetireEarly", avatar: "R", time: "2 weeks ago", tags: [{ label: "portfolios", color: "bg-primary/20 text-primary" }], title: "FIRE portfolio review - am I on track?", body: "32M, $450K invested. 60% VTI, 20% VXUS, 15% BND, 5% REIT. Goal is $1.5M by 45. Am I being too conservative?", likes: 48, comments: [{ id: "c-7", author: "FIREmentor", avatar: "F", body: "At 32, you can afford more equity exposure. Consider 80/20 stocks/bonds.", time: "1 week ago", likes: 15 }, { id: "c-8", author: "RealEstateGuy", avatar: "R", body: "5% REIT seems low. Real estate can be a great inflation hedge.", time: "1 week ago", likes: 7 }], likedByUser: false, userId: "system" },
  { id: "t-8", author: "OptionsTrader", avatar: "O", time: "2 weeks ago", tags: [{ label: "markets", color: "bg-primary/20 text-primary" }], title: "Selling covered calls on SPY - my strategy", body: "I've been selling weekly covered calls 5% OTM on my SPY position. Averaging about 1.2% monthly premium. Anyone else doing this?", likes: 22, comments: [{ id: "c-9", author: "ThetaGang", avatar: "T", body: "I do the same on QQQ. The premiums are even juicier due to higher IV.", time: "1 week ago", likes: 9 }], likedByUser: false, userId: "system" },
  { id: "t-9", author: "GreenInvestor", avatar: "G", time: "2 weeks ago", tags: [{ label: "sectors", color: "bg-primary/20 text-primary" }], title: "Clean energy ETFs - ICLN vs QCLN vs TAN", body: "Want to add clean energy exposure. Which ETF has the best risk/reward? ICLN seems most diversified but TAN has outperformed.", likes: 19, comments: [], likedByUser: false, userId: "system" },
  { id: "t-10", author: "EmergingBull", avatar: "E", time: "2 weeks ago", tags: [{ label: "markets", color: "bg-primary/20 text-primary" }], title: "India ETFs - the next big growth story?", body: "INDA and INDY have been crushing it. India's GDP growth is outpacing China. Is this the decade of Indian equities?", likes: 37, comments: [{ id: "c-10", author: "GlobalMacro", avatar: "G", body: "India is great but valuations are stretched. Wait for a pullback.", time: "1 week ago", likes: 11 }], likedByUser: false, userId: "system" },
  { id: "t-11", author: "BondTrader", avatar: "B", time: "2 weeks ago", tags: [{ label: "sectors", color: "bg-primary/20 text-primary" }], title: "Is now the time to load up on bonds?", body: "With rates potentially peaking, long-duration bonds could see significant price appreciation. TLT, EDV, or individual treasuries?", likes: 24, comments: [], likedByUser: false, userId: "system" },
  { id: "t-12", author: "SmallCapFan", avatar: "S", time: "2 weeks ago", tags: [{ label: "markets", color: "bg-primary/20 text-primary" }], title: "Small caps are coiled for a breakout", body: "IWM has been lagging large caps for years. Historical mean reversion suggests small caps could outperform significantly when the cycle turns.", likes: 16, comments: [{ id: "c-11", author: "LargeCapLover", avatar: "L", body: "People have been saying this for 3 years. Large caps have structural advantages now.", time: "1 week ago", likes: 6 }], likedByUser: false, userId: "system" },
  { id: "t-13", author: "NewbieInvestor", avatar: "N", time: "10 days ago", tags: [{ label: "general", color: "bg-muted text-muted-foreground" }], title: "Just started investing at 22 - any advice?", body: "I have $5K to invest. Should I go all-in on an S&P 500 index fund or diversify across multiple ETFs? Feeling overwhelmed by all the options.", likes: 67, comments: [{ id: "c-12", author: "WiseOwl", avatar: "W", body: "At 22, just buy VTI and don't look at it for 10 years. Simplicity wins.", time: "1 week ago", likes: 28 }, { id: "c-13", author: "BogleHead", avatar: "B", body: "Three-fund portfolio: VTI + VXUS + BND. Set it and forget it.", time: "1 week ago", likes: 19 }], likedByUser: false, userId: "system" },
  { id: "t-14", author: "TaxOptimizer", avatar: "T", time: "10 days ago", tags: [{ label: "general", color: "bg-muted text-muted-foreground" }], title: "Tax-loss harvesting strategies for 2026", body: "With market volatility, there are good opportunities for tax-loss harvesting. I've been swapping between VTI/ITOT and VOO/IVV. What pairs do you use?", likes: 21, comments: [], likedByUser: false, userId: "system" },
  { id: "t-15", author: "SectorRotator", avatar: "S", time: "10 days ago", tags: [{ label: "sectors", color: "bg-primary/20 text-primary" }], title: "Energy vs Tech - where to allocate now?", body: "XLE has been outperforming while tech consolidates. Are we seeing a sustained rotation or just a temporary blip?", likes: 29, comments: [{ id: "c-14", author: "EnergyTrader", avatar: "E", body: "Energy is in a secular bull market. Oil majors printing cash and doing buybacks.", time: "1 week ago", likes: 8 }], likedByUser: false, userId: "system" },
  { id: "t-16", author: "GoldBug", avatar: "G", time: "9 days ago", tags: [{ label: "markets", color: "bg-primary/20 text-primary" }], title: "Gold hitting all-time highs - GLD or physical?", body: "Gold just broke $2,800. Central banks are buying like crazy. GLD, IAU, or physical gold bars? What's the best way to get exposure?", likes: 33, comments: [{ id: "c-15", author: "PreciousMetals", avatar: "P", body: "For large positions use GLD. For SHTF scenarios, keep some physical.", time: "6 days ago", likes: 14 }], likedByUser: false, userId: "system" },
  { id: "t-17", author: "REITKing", avatar: "R", time: "9 days ago", tags: [{ label: "sectors", color: "bg-primary/20 text-primary" }], title: "Best REIT ETFs for income in a rising rate environment", body: "VNQ has been struggling. Are there REIT subsectors that do well even with higher rates? Looking at data centers and cell towers.", likes: 18, comments: [], likedByUser: false, userId: "system" },
  { id: "t-18", author: "QuantTrader", avatar: "Q", time: "8 days ago", tags: [{ label: "markets", color: "bg-primary/20 text-primary" }], title: "Anyone using factor investing? Value vs Momentum", body: "I've been tilting my portfolio towards value (VLUE) and momentum (MTUM) factors. The academic research is compelling but implementation can be tricky.", likes: 14, comments: [{ id: "c-16", author: "AcademicInvestor", avatar: "A", body: "Factor premiums have compressed in recent years as more money chases them. Be careful.", time: "5 days ago", likes: 7 }], likedByUser: false, userId: "system" },
  { id: "t-19", author: "IntlDiversifier", avatar: "I", time: "8 days ago", tags: [{ label: "portfolios", color: "bg-primary/20 text-primary" }], title: "Why I'm going 40% international", body: "VXUS is trading at significant discount to VTI. Non-US stocks haven't been this cheap relative to US stocks in decades. I'm overweighting international.", likes: 26, comments: [{ id: "c-17", author: "USAFirst", avatar: "U", body: "International has underperformed for 15 years. There's a reason US commands a premium.", time: "5 days ago", likes: 10 }], likedByUser: false, userId: "system" },
  { id: "t-20", author: "MomentumTrader", avatar: "M", time: "1 week ago", tags: [{ label: "markets", color: "bg-primary/20 text-primary" }], title: "Semiconductor stocks - still a buy?", body: "SOXX is up 80% in the last year. NVDA, AVGO, AMD all at or near highs. Is this the top or is there more room to run?", likes: 41, comments: [{ id: "c-18", author: "ChipBull", avatar: "C", body: "AI capex cycle is just getting started. NVDA's data center revenue will double again.", time: "5 days ago", likes: 16 }], likedByUser: false, userId: "system" },
  { id: "t-21", author: "RiskManager", avatar: "R", time: "1 week ago", tags: [{ label: "general", color: "bg-muted text-muted-foreground" }], title: "How much cash should you hold?", body: "With money market funds yielding 5%+, what's everyone's cash allocation? I'm at 15% but wondering if that's too much.", likes: 30, comments: [{ id: "c-19", author: "FullyInvested", avatar: "F", body: "Time in the market beats timing the market. I keep only 3 months expenses in cash.", time: "4 days ago", likes: 13 }], likedByUser: false, userId: "system" },
  { id: "t-22", author: "ESGInvestor", avatar: "E", time: "1 week ago", tags: [{ label: "sectors", color: "bg-primary/20 text-primary" }], title: "ESG investing - greenwashing or real impact?", body: "ESGU and SUSA have similar returns to SPY. Are ESG funds actually making a difference or is it just marketing? The SEC has been cracking down on greenwashing.", likes: 23, comments: [], likedByUser: false, userId: "system" },
  { id: "t-23", author: "LeveragedTrader", avatar: "L", time: "6 days ago", tags: [{ label: "markets", color: "bg-primary/20 text-primary" }], title: "TQQQ for long-term holding - crazy or genius?", body: "I know leveraged ETFs are meant for day trading, but TQQQ has returned 5000%+ over 10 years. If you can stomach the drawdowns, isn't it the ultimate growth play?", likes: 38, comments: [{ id: "c-20", author: "RiskAware", avatar: "R", body: "TQQQ dropped 79% in 2022. Most people can't handle that. Stick with QQQ.", time: "4 days ago", likes: 21 }, { id: "c-21", author: "LeverageFan", avatar: "L", body: "I do 20% TQQQ + 80% TMF rebalanced quarterly. The returns are insane.", time: "3 days ago", likes: 9 }], likedByUser: false, userId: "system" },
  { id: "t-24", author: "BuffettFan", avatar: "B", time: "6 days ago", tags: [{ label: "general", color: "bg-muted text-muted-foreground" }], title: "Berkshire Hathaway sitting on $200B+ cash", body: "Buffett keeps selling and building cash. Is he seeing something we're not? Should we follow his lead and de-risk?", likes: 52, comments: [{ id: "c-22", author: "ContrarianView", avatar: "C", body: "Buffett has been early before. The market can stay irrational longer than you think.", time: "3 days ago", likes: 17 }], likedByUser: false, userId: "system" },
  { id: "t-25", author: "DCAStrategy", avatar: "D", time: "5 days ago", tags: [{ label: "portfolios", color: "bg-primary/20 text-primary" }], title: "DCA vs lump sum - the eternal debate", body: "Just received a $50K inheritance. Should I invest it all at once or dollar-cost average over 6-12 months? Statistics say lump sum wins 2/3 of the time.", likes: 44, comments: [{ id: "c-23", author: "DataDriven", avatar: "D", body: "Lump sum is mathematically optimal. DCA is psychologically optimal. Pick what lets you sleep.", time: "3 days ago", likes: 25 }], likedByUser: false, userId: "system" },
  { id: "t-26", author: "DefensivePlayer", avatar: "D", time: "5 days ago", tags: [{ label: "sectors", color: "bg-primary/20 text-primary" }], title: "Utilities ETFs as portfolio insurance", body: "XLU yields 3.5% and acts as a bond proxy. In a downturn, utilities tend to hold up well. Anyone using them as a defensive allocation?", likes: 15, comments: [], likedByUser: false, userId: "system" },
  { id: "t-27", author: "SpaceInvestor", avatar: "S", time: "4 days ago", tags: [{ label: "sectors", color: "bg-primary/20 text-primary" }], title: "Space industry ETFs - UFO vs ARKX", body: "The space economy is projected to reach $1.8T by 2035. UFO is pure-play space while ARKX includes adjacent tech. Which has better risk/reward?", likes: 20, comments: [{ id: "c-24", author: "FutureInvestor", avatar: "F", body: "ARKX is too diluted with non-space holdings. UFO is the real play if you want space exposure.", time: "2 days ago", likes: 8 }], likedByUser: false, userId: "system" },
  { id: "t-28", author: "InflationHedger", avatar: "I", time: "3 days ago", tags: [{ label: "markets", color: "bg-primary/20 text-primary" }], title: "TIPS vs I-Bonds vs commodities for inflation protection", body: "Inflation seems sticky above 3%. What's the best hedge? TIPS give you real yield, I-Bonds are tax-advantaged, commodities (DBC) give broad exposure. Thoughts?", likes: 27, comments: [{ id: "c-25", author: "RealAssets", avatar: "R", body: "I like a combo: 50% TIPS + 30% commodities + 20% gold. Covers all inflation scenarios.", time: "2 days ago", likes: 12 }], likedByUser: false, userId: "system" },
  { id: "t-29", author: "ChinaWatcher", avatar: "C", time: "2 days ago", tags: [{ label: "markets", color: "bg-primary/20 text-primary" }], title: "Chinese stocks at decade lows - contrarian buy?", body: "FXI and KWEB are down 60%+ from highs. Valuations are dirt cheap by any metric. Is the regulatory risk overstated or is this a value trap?", likes: 34, comments: [{ id: "c-26", author: "GeopoliticsFirst", avatar: "G", body: "Political risk makes Chinese stocks uninvestable for me. Too many unknowns.", time: "1 day ago", likes: 15 }, { id: "c-27", author: "BargainHunter", avatar: "B", body: "This is exactly when you should buy. Maximum pessimism = maximum opportunity.", time: "1 day ago", likes: 11 }], likedByUser: false, userId: "system" },
  { id: "t-30", author: "AISkeptic", avatar: "A", time: "1 day ago", tags: [{ label: "general", color: "bg-muted text-muted-foreground" }], title: "Are we in an AI bubble?", body: "NVDA at $3T market cap, every company adding 'AI' to their name, massive capex spending... This feels like 1999 all over again. Change my mind.", likes: 73, comments: [{ id: "c-28", author: "AIRealist", avatar: "A", body: "Unlike 1999, these companies have real revenue and profits. NVDA is printing $20B+ per quarter.", time: "12 hours ago", likes: 29 }, { id: "c-29", author: "DotComSurvivor", avatar: "D", body: "I was there in 1999. This feels different because the technology actually works. But valuations ARE stretched.", time: "6 hours ago", likes: 22 }], likedByUser: false, userId: "system" },
  { id: "t-31", author: "RecessionWatch", avatar: "R", time: "18 hours ago", tags: [{ label: "markets", color: "bg-primary/20 text-primary" }], title: "Yield curve has been inverted for 18 months", body: "The longest yield curve inversion in history. Every previous inversion led to a recession. Are we ignoring a massive red flag?", likes: 39, comments: [{ id: "c-30", author: "PermaBull", avatar: "P", body: "The economy has been resilient. Maybe this time IS different with unprecedented fiscal stimulus.", time: "8 hours ago", likes: 14 }], likedByUser: false, userId: "system" },
  { id: "t-32", author: "StartupInvestor", avatar: "S", time: "10 hours ago", tags: [{ label: "general", color: "bg-muted text-muted-foreground" }], title: "IPO market heating up - any picks?", body: "With markets at highs, we're seeing more IPOs and direct listings. Reddit (RDDT) has been great. What upcoming IPOs are you watching?", likes: 25, comments: [], likedByUser: false, userId: "system" },
  { id: "t-33", author: "PortfolioDoc", avatar: "P", time: "5 hours ago", tags: [{ label: "portfolios", color: "bg-primary/20 text-primary" }], title: "My 'All Weather' portfolio adaptation for 2026", body: "Based on Ray Dalio's All Weather: 30% VTI, 40% TLT, 15% IEI, 7.5% GLD, 7.5% DBC. Modified to add 10% crypto (IBIT) reducing bonds. Backtested returns look promising.", likes: 18, comments: [{ id: "c-31", author: "RayDalioFan", avatar: "R", body: "Adding crypto to All Weather defeats the purpose. The point is low correlation assets.", time: "2 hours ago", likes: 6 }], likedByUser: false, userId: "system" },
];

const AppContext = createContext<AppState | null>(null);

function loadFromLS<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch { return fallback; }
}

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [watchlists, setWatchlists] = useState<WatchlistData[]>(() => loadFromLS("portai-watchlists", defaultWatchlists));
  const [threads, setThreads] = useState<ForumThread[]>(() => loadFromLS("portai-threads", defaultThreads));
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile>(() => loadFromLS("portai-profile", { name: "Guest User", email: "", avatar: null, anonymous: false }));
  const [initialLanguage, setInitialLanguage] = useState("en");

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUserId(user.id);

      const { data: settings } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (settings) {
        setProfile({
          name: settings.display_name || user.email?.split("@")[0] || "User",
          email: user.email || "",
          avatar: settings.avatar_url,
          anonymous: settings.anonymous_mode,
        });
        if ((settings as any).language) {
          setInitialLanguage((settings as any).language);
        }
      } else {
        const defaultName = user.email?.split("@")[0] || "User";
        await supabase.from("user_settings").insert({
          user_id: user.id,
          display_name: defaultName,
        });
        setProfile({
          name: defaultName,
          email: user.email || "",
          avatar: null,
          anonymous: false,
        });
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (!currentUserId) return;
    const timeout = setTimeout(async () => {
      await supabase.from("user_settings").update({
        display_name: profile.name,
        avatar_url: profile.avatar,
        anonymous_mode: profile.anonymous,
        updated_at: new Date().toISOString(),
      }).eq("user_id", currentUserId);
      localStorage.setItem("portai-profile", JSON.stringify(profile));
    }, 500);
    return () => clearTimeout(timeout);
  }, [profile, currentUserId]);

  useEffect(() => { localStorage.setItem("portai-watchlists", JSON.stringify(watchlists)); }, [watchlists]);
  useEffect(() => { localStorage.setItem("portai-threads", JSON.stringify(threads)); }, [threads]);

  const addWatchlist = (w: WatchlistData) => setWatchlists((prev) => [w, ...prev]);
  const deleteWatchlist = (id: string) => setWatchlists((prev) => prev.filter((w) => w.id !== id));
  const addStockToWatchlist = (listId: string, stock: Stock) =>
    setWatchlists((prev) => prev.map((w) => w.id === listId && !w.stocks.find((s) => s.ticker === stock.ticker) ? { ...w, stocks: [...w.stocks, stock] } : w));
  const removeStockFromWatchlist = (listId: string, ticker: string) =>
    setWatchlists((prev) => prev.map((w) => w.id === listId ? { ...w, stocks: w.stocks.filter((s) => s.ticker !== ticker) } : w));

  const addThread = (t: ForumThread) => setThreads((prev) => [t, ...prev]);
  const likeThread = (id: string) => setThreads((prev) => prev.map((t) => t.id === id ? { ...t, likes: t.likedByUser ? t.likes - 1 : t.likes + 1, likedByUser: !t.likedByUser } : t));
  const addComment = (threadId: string, comment: ForumComment) =>
    setThreads((prev) => prev.map((t) => t.id === threadId ? { ...t, comments: [...t.comments, comment] } : t));
  const setFactCheck = (threadId: string, text: string) =>
    setThreads((prev) => prev.map((t) => t.id === threadId ? { ...t, factCheck: text } : t));
  const deleteThread = (id: string) => setThreads((prev) => prev.filter((t) => t.id !== id));
  const deleteComment = (threadId: string, commentId: string) =>
    setThreads((prev) => prev.map((t) => t.id === threadId ? { ...t, comments: t.comments.filter((c) => c.id !== commentId) } : t));

  return (
    <AppContext.Provider value={{ watchlists, setWatchlists, addWatchlist, addStockToWatchlist, removeStockFromWatchlist, deleteWatchlist, threads, setThreads, addThread, likeThread, addComment, setFactCheck, deleteThread, deleteComment, profile, setProfile, currentUserId, initialLanguage }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
};
