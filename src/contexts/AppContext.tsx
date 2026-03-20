import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Stock = { ticker: string; sector: string; name: string; signal: string };
export type WatchlistData = { id: string; name: string; stocks: Stock[]; desc: string };

export type ForumComment = { id: string; author: string; avatar: string; avatarUrl?: string | null; body: string; time: string; likes: number; userId?: string };
export type ForumThread = {
  id: string; author: string; avatar: string; avatarUrl?: string | null; time: string;
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
  watchlistsLoaded: boolean;
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

const g = "bg-muted text-muted-foreground";
const p = "bg-primary/20 text-primary";

const defaultThreads: ForumThread[] = [
  { id: "t-1", author: "guich", avatar: "G", time: "about 1 month ago", tags: [{ label: "general", color: g }], title: "What do you think about Trump's threats on Greenland?", body: "Does he actually have intents to invade or is it just a strategy for something else", likes: 3, comments: [{ id: "c-1", author: "MarketWatcher", avatar: "M", body: "Probably just negotiation leverage for rare earth minerals access.", time: "3 weeks ago", likes: 2 }], likedByUser: false, userId: "system" },
  { id: "t-2", author: "TechInvestor2025", avatar: "T", time: "about 1 month ago", tags: [{ label: "portfolios", color: p }], title: "My AI/Tech Heavy Portfolio - Thoughts?", body: "Just restructured: 35% NVDA, 20% MSFT, 15% GOOGL, 15% AMZN, 10% META, 5% cash. I know it's tech heavy but I believe in the AI thesis.", likes: 42, comments: [{ id: "c-2", author: "DiversifyGuy", avatar: "D", body: "Way too concentrated in tech. Add XLP or XLU for defense.", time: "3 weeks ago", likes: 8 }, { id: "c-3", author: "AIBull", avatar: "A", body: "I'm similarly positioned. AI is the biggest wealth creation opportunity of our generation.", time: "2 weeks ago", likes: 5 }], likedByUser: false, userId: "system" },
  { id: "t-3", author: "MacroTrader", avatar: "M", time: "about 1 month ago", tags: [{ label: "markets", color: p }], title: "Fed Rate Decision Impact Analysis", body: "The Fed is expected to hold rates steady. How are you positioning? I'm looking at TLT and utilities.", likes: 28, comments: [{ id: "c-4", author: "BondKing", avatar: "B", body: "TLT is solid if rates are at peak. Also looking at XLU.", time: "3 weeks ago", likes: 4 }], likedByUser: false, userId: "system" },
  { id: "t-4", author: "DividendKing", avatar: "D", time: "3 weeks ago", tags: [{ label: "portfolios", color: p }], title: "Best dividend ETFs for passive income in 2026?", body: "Looking to build a dividend-focused portfolio. Considering SCHD, VYM, and JEPI. What are your top picks?", likes: 35, comments: [{ id: "c-5", author: "IncomeInvestor", avatar: "I", body: "SCHD is the gold standard. Low expense ratio and solid track record.", time: "2 weeks ago", likes: 12 }], likedByUser: false, userId: "system" },
  { id: "t-5", author: "CryptoWhale", avatar: "C", time: "3 weeks ago", tags: [{ label: "markets", color: p }], title: "Bitcoin ETFs vs holding actual BTC", body: "With IBIT and FBTC now available, is there any reason to hold BTC directly anymore?", likes: 55, comments: [{ id: "c-6", author: "NotYourKeys", avatar: "N", body: "Not your keys, not your coins. ETFs have counterparty risk.", time: "2 weeks ago", likes: 18 }], likedByUser: false, userId: "system" },
  { id: "t-6", author: "ValueHunter", avatar: "V", time: "3 weeks ago", tags: [{ label: "sectors", color: p }], title: "Healthcare sector looks undervalued right now", body: "XLV is trading at a P/E of 17x vs the S&P at 22x. With aging demographics and AI in drug discovery, this seems like a no-brainer.", likes: 31, comments: [], likedByUser: false, userId: "system" },
  { id: "t-7", author: "RetireEarly", avatar: "R", time: "2 weeks ago", tags: [{ label: "portfolios", color: p }], title: "FIRE portfolio review - am I on track?", body: "32M, $450K invested. 60% VTI, 20% VXUS, 15% BND, 5% REIT. Goal is $1.5M by 45.", likes: 48, comments: [{ id: "c-7", author: "FIREmentor", avatar: "F", body: "At 32, you can afford more equity exposure. Consider 80/20.", time: "1 week ago", likes: 15 }], likedByUser: false, userId: "system" },
  { id: "t-8", author: "OptionsTrader", avatar: "O", time: "2 weeks ago", tags: [{ label: "markets", color: p }], title: "Selling covered calls on SPY - my strategy", body: "Selling weekly covered calls 5% OTM on SPY. Averaging about 1.2% monthly premium.", likes: 22, comments: [{ id: "c-9", author: "ThetaGang", avatar: "T", body: "I do the same on QQQ. The premiums are even juicier.", time: "1 week ago", likes: 9 }], likedByUser: false, userId: "system" },
  { id: "t-9", author: "GreenInvestor", avatar: "G", time: "2 weeks ago", tags: [{ label: "sectors", color: p }], title: "Clean energy ETFs - ICLN vs QCLN vs TAN", body: "Want to add clean energy exposure. Which ETF has the best risk/reward?", likes: 19, comments: [], likedByUser: false, userId: "system" },
  { id: "t-10", author: "EmergingBull", avatar: "E", time: "2 weeks ago", tags: [{ label: "markets", color: p }], title: "India ETFs - the next big growth story?", body: "INDA and INDY have been crushing it. India's GDP growth is outpacing China.", likes: 37, comments: [{ id: "c-10", author: "GlobalMacro", avatar: "G", body: "India is great but valuations are stretched. Wait for a pullback.", time: "1 week ago", likes: 11 }], likedByUser: false, userId: "system" },
  { id: "t-11", author: "BondTrader", avatar: "B", time: "2 weeks ago", tags: [{ label: "sectors", color: p }], title: "Is now the time to load up on bonds?", body: "With rates potentially peaking, long-duration bonds could see significant appreciation. TLT, EDV, or individual treasuries?", likes: 24, comments: [], likedByUser: false, userId: "system" },
  { id: "t-12", author: "SmallCapFan", avatar: "S", time: "2 weeks ago", tags: [{ label: "markets", color: p }], title: "Small caps are coiled for a breakout", body: "IWM has been lagging large caps for years. Historical mean reversion suggests small caps could outperform.", likes: 16, comments: [{ id: "c-11", author: "LargeCapLover", avatar: "L", body: "People have been saying this for 3 years. Large caps have structural advantages.", time: "1 week ago", likes: 6 }], likedByUser: false, userId: "system" },
  { id: "t-13", author: "NewbieInvestor", avatar: "N", time: "10 days ago", tags: [{ label: "general", color: g }], title: "Just started investing at 22 - any advice?", body: "I have $5K to invest. Should I go all-in on S&P 500 or diversify across multiple ETFs?", likes: 67, comments: [{ id: "c-12", author: "WiseOwl", avatar: "W", body: "At 22, just buy VTI and don't look at it for 10 years.", time: "1 week ago", likes: 28 }], likedByUser: false, userId: "system" },
  { id: "t-14", author: "TaxOptimizer", avatar: "T", time: "10 days ago", tags: [{ label: "general", color: g }], title: "Tax-loss harvesting strategies for 2026", body: "With market volatility, there are good opportunities for tax-loss harvesting. I've been swapping between VTI/ITOT and VOO/IVV.", likes: 21, comments: [], likedByUser: false, userId: "system" },
  { id: "t-15", author: "SectorRotator", avatar: "S", time: "10 days ago", tags: [{ label: "sectors", color: p }], title: "Energy vs Tech - where to allocate now?", body: "XLE has been outperforming while tech consolidates. Are we seeing a sustained rotation?", likes: 29, comments: [{ id: "c-14", author: "EnergyTrader", avatar: "E", body: "Energy is in a secular bull market. Oil majors printing cash.", time: "1 week ago", likes: 8 }], likedByUser: false, userId: "system" },
  { id: "t-16", author: "GoldBug", avatar: "G", time: "9 days ago", tags: [{ label: "markets", color: p }], title: "Gold hitting all-time highs - GLD or physical?", body: "Gold just broke $2,800. Central banks buying like crazy. GLD, IAU, or physical bars?", likes: 33, comments: [{ id: "c-15", author: "PreciousMetals", avatar: "P", body: "For large positions use GLD. For worst-case scenarios, keep some physical.", time: "6 days ago", likes: 14 }], likedByUser: false, userId: "system" },
  { id: "t-17", author: "REITKing", avatar: "R", time: "9 days ago", tags: [{ label: "sectors", color: p }], title: "Best REIT ETFs for income in a rising rate environment", body: "VNQ has been struggling. Are there REIT subsectors that do well even with higher rates?", likes: 18, comments: [], likedByUser: false, userId: "system" },
  { id: "t-18", author: "QuantTrader", avatar: "Q", time: "8 days ago", tags: [{ label: "markets", color: p }], title: "Anyone using factor investing? Value vs Momentum", body: "Tilting portfolio towards VLUE and MTUM factors. The academic research is compelling.", likes: 14, comments: [{ id: "c-16", author: "AcademicInvestor", avatar: "A", body: "Factor premiums have compressed. Be careful.", time: "5 days ago", likes: 7 }], likedByUser: false, userId: "system" },
  { id: "t-19", author: "IntlDiversifier", avatar: "I", time: "8 days ago", tags: [{ label: "portfolios", color: p }], title: "Why I'm going 40% international", body: "VXUS is trading at significant discount to VTI. Non-US stocks haven't been this cheap in decades.", likes: 26, comments: [{ id: "c-17", author: "USAFirst", avatar: "U", body: "International has underperformed for 15 years. There's a reason US commands a premium.", time: "5 days ago", likes: 10 }], likedByUser: false, userId: "system" },
  { id: "t-20", author: "MomentumTrader", avatar: "M", time: "1 week ago", tags: [{ label: "markets", color: p }], title: "Semiconductor stocks - still a buy?", body: "SOXX is up 80% in the last year. NVDA, AVGO, AMD all at or near highs. Top or more room?", likes: 41, comments: [{ id: "c-18", author: "ChipBull", avatar: "C", body: "AI capex cycle is just getting started. NVDA's data center revenue will double.", time: "5 days ago", likes: 16 }], likedByUser: false, userId: "system" },
  { id: "t-21", author: "RiskManager", avatar: "R", time: "1 week ago", tags: [{ label: "general", color: g }], title: "How much cash should you hold?", body: "With money market funds yielding 5%+, what's everyone's cash allocation? I'm at 15%.", likes: 30, comments: [{ id: "c-19", author: "FullyInvested", avatar: "F", body: "Time in the market beats timing the market. I keep only 3 months expenses.", time: "4 days ago", likes: 13 }], likedByUser: false, userId: "system" },
  { id: "t-22", author: "ESGInvestor", avatar: "E", time: "1 week ago", tags: [{ label: "sectors", color: p }], title: "ESG investing - greenwashing or real impact?", body: "ESGU and SUSA have similar returns to SPY. Are ESG funds actually making a difference?", likes: 23, comments: [], likedByUser: false, userId: "system" },
  { id: "t-23", author: "LeveragedTrader", avatar: "L", time: "6 days ago", tags: [{ label: "markets", color: p }], title: "TQQQ for long-term holding - crazy or genius?", body: "TQQQ has returned 5000%+ over 10 years. If you can stomach the drawdowns, isn't it the ultimate growth play?", likes: 38, comments: [{ id: "c-20", author: "RiskAware", avatar: "R", body: "TQQQ dropped 79% in 2022. Most people can't handle that.", time: "4 days ago", likes: 21 }], likedByUser: false, userId: "system" },
  { id: "t-24", author: "BuffettFan", avatar: "B", time: "6 days ago", tags: [{ label: "general", color: g }], title: "Berkshire sitting on $200B+ cash", body: "Buffett keeps selling and building cash. Is he seeing something we're not?", likes: 52, comments: [{ id: "c-22", author: "ContrarianView", avatar: "C", body: "Buffett has been early before. Market can stay irrational.", time: "3 days ago", likes: 17 }], likedByUser: false, userId: "system" },
  { id: "t-25", author: "DCAStrategy", avatar: "D", time: "5 days ago", tags: [{ label: "portfolios", color: p }], title: "DCA vs lump sum - the eternal debate", body: "Just received $50K inheritance. All at once or DCA over 6-12 months? Stats say lump sum wins 2/3 of the time.", likes: 44, comments: [{ id: "c-23", author: "DataDriven", avatar: "D", body: "Lump sum is mathematically optimal. DCA is psychologically optimal.", time: "3 days ago", likes: 25 }], likedByUser: false, userId: "system" },
  { id: "t-26", author: "DefensivePlayer", avatar: "D", time: "5 days ago", tags: [{ label: "sectors", color: p }], title: "Utilities ETFs as portfolio insurance", body: "XLU yields 3.5% and acts as a bond proxy. In a downturn, utilities tend to hold up well.", likes: 15, comments: [], likedByUser: false, userId: "system" },
  { id: "t-27", author: "SpaceInvestor", avatar: "S", time: "4 days ago", tags: [{ label: "sectors", color: p }], title: "Space industry ETFs - UFO vs ARKX", body: "Space economy projected to reach $1.8T by 2035. Which has better risk/reward?", likes: 20, comments: [{ id: "c-24", author: "FutureInvestor", avatar: "F", body: "ARKX is too diluted with non-space holdings. UFO is the real play.", time: "2 days ago", likes: 8 }], likedByUser: false, userId: "system" },
  { id: "t-28", author: "InflationHedger", avatar: "I", time: "3 days ago", tags: [{ label: "markets", color: p }], title: "TIPS vs I-Bonds vs commodities for inflation protection", body: "Inflation seems sticky above 3%. What's the best hedge?", likes: 27, comments: [{ id: "c-25", author: "RealAssets", avatar: "R", body: "I like a combo: 50% TIPS + 30% commodities + 20% gold.", time: "2 days ago", likes: 12 }], likedByUser: false, userId: "system" },
  { id: "t-29", author: "ChinaWatcher", avatar: "C", time: "2 days ago", tags: [{ label: "markets", color: p }], title: "Chinese stocks at decade lows - contrarian buy?", body: "FXI and KWEB are down 60%+ from highs. Valuations are dirt cheap. Value trap or opportunity?", likes: 34, comments: [{ id: "c-26", author: "GeopoliticsFirst", avatar: "G", body: "Political risk makes Chinese stocks uninvestable for me.", time: "1 day ago", likes: 15 }], likedByUser: false, userId: "system" },
  { id: "t-30", author: "AISkeptic", avatar: "A", time: "1 day ago", tags: [{ label: "general", color: g }], title: "Are we in an AI bubble?", body: "NVDA at $3T market cap, every company adding 'AI' to their name... This feels like 1999.", likes: 73, comments: [{ id: "c-28", author: "AIRealist", avatar: "A", body: "Unlike 1999, these companies have real revenue and profits.", time: "12 hours ago", likes: 29 }], likedByUser: false, userId: "system" },
  // 20 additional posts to reach 50+
  { id: "t-31", author: "RecessionWatch", avatar: "R", time: "18 hours ago", tags: [{ label: "markets", color: p }], title: "Yield curve inverted for 18 months - red flag?", body: "The longest inversion in history. Every previous one led to recession. Are we ignoring this?", likes: 39, comments: [{ id: "c-30", author: "PermaBull", avatar: "P", body: "Economy has been resilient. Maybe this time IS different.", time: "8 hours ago", likes: 14 }], likedByUser: false, userId: "system" },
  { id: "t-32", author: "StartupInvestor", avatar: "S", time: "10 hours ago", tags: [{ label: "general", color: g }], title: "IPO market heating up - any picks?", body: "Reddit (RDDT) has been great. What upcoming IPOs are you watching?", likes: 25, comments: [], likedByUser: false, userId: "system" },
  { id: "t-33", author: "PortfolioDoc", avatar: "P", time: "5 hours ago", tags: [{ label: "portfolios", color: p }], title: "My 'All Weather' portfolio for 2026", body: "Based on Dalio's All Weather: 30% VTI, 40% TLT, 15% IEI, 7.5% GLD, 7.5% DBC. Added 10% IBIT reducing bonds.", likes: 18, comments: [{ id: "c-31", author: "RayDalioFan", avatar: "R", body: "Adding crypto defeats the purpose. The point is low correlation assets.", time: "2 hours ago", likes: 6 }], likedByUser: false, userId: "system" },
  { id: "t-34", author: "SwingTrader99", avatar: "S", time: "3 days ago", tags: [{ label: "markets", color: p }], title: "Best technical indicators for swing trading?", body: "I use RSI + MACD + 200 EMA. What indicators do you all swear by for 1-2 week trades?", likes: 32, comments: [{ id: "c-32", author: "ChartMaster", avatar: "C", body: "Volume profile is underrated. Shows where real support and resistance lies.", time: "2 days ago", likes: 11 }], likedByUser: false, userId: "system" },
  { id: "t-35", author: "PensionPlanner", avatar: "P", time: "4 days ago", tags: [{ label: "general", color: g }], title: "401k vs Roth IRA - where to max first?", body: "I can only max one this year. Should I prioritize tax-deferred 401k or tax-free Roth growth?", likes: 41, comments: [{ id: "c-33", author: "TaxWiz", avatar: "T", body: "Match first, then Roth, then back to 401k. Standard order of operations.", time: "3 days ago", likes: 22 }], likedByUser: false, userId: "system" },
  { id: "t-36", author: "EuroInvestor", avatar: "E", time: "5 days ago", tags: [{ label: "markets", color: p }], title: "European stocks outperforming US this quarter", body: "STOXX 600 up 8% vs S&P 500 up 3% YTD. Defense spending + cheap valuations driving flows to Europe.", likes: 28, comments: [{ id: "c-34", author: "TransAtlantic", avatar: "T", body: "European banks especially. They've been crushed for a decade and are now recovering.", time: "4 days ago", likes: 9 }], likedByUser: false, userId: "system" },
  { id: "t-37", author: "CopperBull", avatar: "C", time: "6 days ago", tags: [{ label: "sectors", color: p }], title: "Copper is the new oil - electrification play", body: "EVs, solar, grid upgrades all need copper. COPX and FCX look compelling. Is Dr. Copper signaling something?", likes: 19, comments: [], likedByUser: false, userId: "system" },
  { id: "t-38", author: "AIPortfolio", avatar: "A", time: "2 days ago", tags: [{ label: "portfolios", color: p }], title: "I let ChatGPT build my portfolio - 6 month update", body: "Asked GPT to allocate $100K. It went 40% VTI, 20% VXUS, 15% BND, 15% QQQ, 10% GLD. Up 11.2% so far.", likes: 56, comments: [{ id: "c-35", author: "SkepticalSam", avatar: "S", body: "That's literally just a standard Boglehead portfolio. GPT didn't discover anything new.", time: "1 day ago", likes: 18 }, { id: "c-36", author: "AIEnthusiast", avatar: "A", body: "The interesting part is the rebalancing triggers it suggested, not the allocation itself.", time: "1 day ago", likes: 12 }], likedByUser: false, userId: "system" },
  { id: "t-39", author: "MarginCall", avatar: "M", time: "1 day ago", tags: [{ label: "general", color: g }], title: "Biggest investing mistake you've ever made?", body: "I'll go first: sold all my AAPL in 2016 to buy a car. Those shares would be worth $180K today. Share yours.", likes: 89, comments: [{ id: "c-37", author: "RegretfulTrader", avatar: "R", body: "Panic sold everything in March 2020. Bought back 40% higher. Never again.", time: "18 hours ago", likes: 34 }, { id: "c-38", author: "DiamondHands", avatar: "D", body: "Not buying Bitcoin when my friend told me about it at $200. Pain.", time: "12 hours ago", likes: 27 }], likedByUser: false, userId: "system" },
  { id: "t-40", author: "DividendGrowth", avatar: "D", time: "3 days ago", tags: [{ label: "portfolios", color: p }], title: "My dividend snowball - $2,400/year and growing", body: "After 4 years of DRIP investing in SCHD, VYM, and individual dividend aristocrats, I'm at $2,400/year in dividends.", likes: 47, comments: [{ id: "c-39", author: "CompoundKing", avatar: "C", body: "This is the way. Time + consistency = wealth. Keep going.", time: "2 days ago", likes: 19 }], likedByUser: false, userId: "system" },
  { id: "t-41", author: "VolTrader", avatar: "V", time: "1 day ago", tags: [{ label: "markets", color: p }], title: "VIX below 13 - time to buy protection?", body: "Cheap options premiums right now. Historical average VIX is ~19. Seems like good risk/reward to buy puts.", likes: 22, comments: [{ id: "c-40", author: "OptionsGuru", avatar: "O", body: "I buy VIX calls when it's this low. Cost of insurance is minimal.", time: "16 hours ago", likes: 10 }], likedByUser: false, userId: "system" },
  { id: "t-42", author: "JapanBull", avatar: "J", time: "4 days ago", tags: [{ label: "markets", color: p }], title: "Nikkei 225 at all-time highs after 34 years", body: "Japan finally breaking out. DXJ (hedged) or EWJ (unhedged)? The yen weakness makes this tricky.", likes: 31, comments: [{ id: "c-41", author: "FXTrader", avatar: "F", body: "Definitely hedge. BoJ policy divergence from Fed means yen could stay weak.", time: "3 days ago", likes: 8 }], likedByUser: false, userId: "system" },
  { id: "t-43", author: "MicroCapHunter", avatar: "M", time: "2 days ago", tags: [{ label: "sectors", color: p }], title: "Micro-cap biotech - high risk high reward?", body: "I allocate 5% of portfolio to speculative biotech plays. One FDA approval can 10x your money.", likes: 16, comments: [], likedByUser: false, userId: "system" },
  { id: "t-44", author: "IndexFundBro", avatar: "I", time: "5 days ago", tags: [{ label: "general", color: g }], title: "Why I stopped stock picking after 5 years", body: "Tracked my returns vs SPY for 5 years. I underperformed by 3.2% annually. Now I'm 100% VTI and sleeping better.", likes: 61, comments: [{ id: "c-42", author: "ActiveManager", avatar: "A", body: "Stock picking requires full-time dedication. Part-timers should absolutely index.", time: "4 days ago", likes: 23 }, { id: "c-43", author: "PickerForLife", avatar: "P", body: "It depends on your strategy. My concentrated value approach has beaten SPY by 4% CAGR.", time: "3 days ago", likes: 11 }], likedByUser: false, userId: "system" },
  { id: "t-45", author: "CyberSecInvestor", avatar: "C", time: "3 days ago", tags: [{ label: "sectors", color: p }], title: "Cybersecurity ETFs - HACK vs CIBR vs BUG", body: "Cybersecurity spending is growing 15%+ annually. Which ETF captures the trend best?", likes: 24, comments: [{ id: "c-44", author: "TechAnalyst", avatar: "T", body: "CIBR has the best methodology imo. More focused on pure-play cyber companies.", time: "2 days ago", likes: 7 }], likedByUser: false, userId: "system" },
  { id: "t-46", author: "WaterInvestor", avatar: "W", time: "6 days ago", tags: [{ label: "sectors", color: p }], title: "Water scarcity - the overlooked megatrend", body: "PHO and FIW give exposure to water infrastructure. With climate change, water utilities could be the next big thing.", likes: 17, comments: [], likedByUser: false, userId: "system" },
  { id: "t-47", author: "PrivateCreditFan", avatar: "P", time: "2 days ago", tags: [{ label: "markets", color: p }], title: "Private credit ETFs emerging - SRLN, BKLN thoughts?", body: "Floating rate loans yield 8-9% and adjust with rates. Better than high yield bonds right now?", likes: 20, comments: [{ id: "c-45", author: "CreditAnalyst", avatar: "C", body: "Default risk is real in private credit. Stick with the highest quality tranches.", time: "1 day ago", likes: 9 }], likedByUser: false, userId: "system" },
  { id: "t-48", author: "RetailTrader2026", avatar: "R", time: "1 day ago", tags: [{ label: "general", color: g }], title: "Best investing books that actually changed your strategy?", body: "Just finished 'The Intelligent Investor' and it blew my mind. What other books do you recommend?", likes: 54, comments: [{ id: "c-46", author: "BookWorm", avatar: "B", body: "'One Up on Wall Street' by Peter Lynch. Practical and entertaining.", time: "20 hours ago", likes: 17 }, { id: "c-47", author: "QuantReader", avatar: "Q", body: "'A Random Walk Down Wall Street' convinced me to index.", time: "14 hours ago", likes: 14 }], likedByUser: false, userId: "system" },
  { id: "t-49", author: "NuclearBull", avatar: "N", time: "3 days ago", tags: [{ label: "sectors", color: p }], title: "Nuclear energy renaissance - URA ETF up 120%", body: "AI data centers need massive power. Nuclear is the cleanest baseload option. Uranium miners printing money.", likes: 36, comments: [{ id: "c-48", author: "EnergySceptic", avatar: "E", body: "SMRs are still years away from commercial scale. This is speculation, not investing.", time: "2 days ago", likes: 8 }], likedByUser: false, userId: "system" },
  { id: "t-50", author: "LatAmInvestor", avatar: "L", time: "4 days ago", tags: [{ label: "markets", color: p }], title: "Brazil ETF (EWZ) at 52-week low - opportunity?", body: "Brazilian real is weak, but the Bovespa trades at 7x earnings. That's absurdly cheap by any metric.", likes: 22, comments: [{ id: "c-49", author: "EMExpert", avatar: "E", body: "Currency risk is the killer with Brazilian equities. Always hedge or size small.", time: "3 days ago", likes: 11 }], likedByUser: false, userId: "system" },
  { id: "t-51", author: "FinTechFan", avatar: "F", time: "2 days ago", tags: [{ label: "sectors", color: p }], title: "Fintech vs traditional banks - who wins?", body: "SQ, SOFI, and NU are disrupting banking. But JPM and GS are fighting back with their own digital platforms.", likes: 29, comments: [{ id: "c-50", author: "BankAnalyst", avatar: "B", body: "Big banks have distribution + capital advantages. Fintech has UX + speed. It'll be a hybrid world.", time: "1 day ago", likes: 13 }], likedByUser: false, userId: "system" },
  { id: "t-52", author: "AgriInvestor", avatar: "A", time: "5 days ago", tags: [{ label: "sectors", color: p }], title: "Agriculture ETFs - food security play", body: "MOO and DBA give exposure to agriculture. With growing population and climate stress, food commodities could surge.", likes: 14, comments: [], likedByUser: false, userId: "system" },
  { id: "t-53", author: "ThematicTrader", avatar: "T", time: "1 day ago", tags: [{ label: "portfolios", color: p }], title: "My thematic portfolio: AI + Nuclear + Space + Cyber", body: "25% each in BOTZ, URA, UFO, and CIBR. Pure megatrend plays for the next decade. Thoughts?", likes: 33, comments: [{ id: "c-51", author: "CoreSatellite", avatar: "C", body: "I'd keep this as a 20% satellite. Core should still be VTI/VXUS for stability.", time: "18 hours ago", likes: 15 }], likedByUser: false, userId: "system" },
];

const AppContext = createContext<AppState | null>(null);

function loadFromLS<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch { return fallback; }
}

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [watchlists, setWatchlists] = useState<WatchlistData[]>([]);
  const [watchlistsLoaded, setWatchlistsLoaded] = useState(false);
  const [threads, setThreads] = useState<ForumThread[]>(() => loadFromLS("portai-threads", defaultThreads));
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile>(() => loadFromLS("portai-profile", { name: "Guest User", email: "", avatar: null, anonymous: false }));
  const [initialLanguage, setInitialLanguage] = useState("en");
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [savedDisplayName, setSavedDisplayName] = useState("");

  const loadWatchlists = async (userId: string) => {
    const { data: wlData } = await supabase
      .from("watchlists")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (wlData && wlData.length > 0) {
      const { data: stocksData } = await supabase
        .from("watchlist_stocks")
        .select("*")
        .in("watchlist_id", wlData.map((w: any) => w.id));

      const mapped: WatchlistData[] = wlData.map((w: any) => ({
        id: w.id,
        name: w.name,
        desc: w.description || "",
        stocks: (stocksData || [])
          .filter((s: any) => s.watchlist_id === w.id)
          .map((s: any) => ({ ticker: s.ticker, name: s.name, sector: s.sector, signal: s.signal })),
      }));
      setWatchlists(mapped);
    } else {
      setWatchlists([]);
    }
    setWatchlistsLoaded(true);
  };

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUserId(user.id);

      // Load watchlists from DB
      await loadWatchlists(user.id);

      const { data: settings } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (settings) {
        const loadedName = settings.display_name || user.email?.split("@")[0] || "User";
        setSavedDisplayName(loadedName);
        setProfile({
          name: loadedName,
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
        setSavedDisplayName(defaultName);
        setProfile({
          name: defaultName,
          email: user.email || "",
          avatar: null,
          anonymous: false,
        });
      }
      // Mark profile as loaded AFTER DB data is applied
      setProfileLoaded(true);
    };
    init();
  }, []);

  // Only sync profile to DB after the initial load is complete
  useEffect(() => {
    if (!currentUserId || !profileLoaded) return;

    const timeout = setTimeout(async () => {
      const trimmedName = profile.name.trim();
      const normalizedCurrent = trimmedName.toLowerCase();
      const normalizedSaved = savedDisplayName.trim().toLowerCase();
      const nameChanged = normalizedCurrent !== normalizedSaved;

      let canSaveName = true;
      if (nameChanged) {
        const { data: isAvailable, error } = await supabase.rpc("check_username_available", {
          desired_username: trimmedName,
        });
        canSaveName = !error && Boolean(isAvailable);
      }

      const updatePayload: any = {
        avatar_url: profile.avatar,
        anonymous_mode: profile.anonymous,
        updated_at: new Date().toISOString(),
      };

      if (!nameChanged || canSaveName) {
        updatePayload.display_name = trimmedName;
      }

      await supabase.from("user_settings").update(updatePayload).eq("user_id", currentUserId);

      if (nameChanged && !canSaveName) {
        if (savedDisplayName && profile.name !== savedDisplayName) {
          setProfile((prev) => ({ ...prev, name: savedDisplayName }));
          localStorage.setItem("portai-profile", JSON.stringify({ ...profile, name: savedDisplayName }));
        }
      } else {
        if (trimmedName !== savedDisplayName) setSavedDisplayName(trimmedName);
        localStorage.setItem("portai-profile", JSON.stringify(profile));
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [profile, currentUserId, profileLoaded, savedDisplayName]);

  useEffect(() => { localStorage.setItem("portai-threads", JSON.stringify(threads)); }, [threads]);

  const addWatchlist = async (w: WatchlistData) => {
    if (!currentUserId) return;
    const { data } = await supabase.from("watchlists").insert({
      user_id: currentUserId,
      name: w.name,
      description: w.desc,
    } as any).select().single();
    if (data) {
      const newId = (data as any).id;
      if (w.stocks && w.stocks.length > 0) {
        await supabase.from("watchlist_stocks").insert(
          w.stocks.map((s) => ({
            watchlist_id: newId,
            ticker: s.ticker,
            name: s.name,
            sector: s.sector,
            signal: s.signal,
          })) as any
        );
      }
      setWatchlists((prev) => [{ id: newId, name: w.name, desc: w.desc, stocks: w.stocks || [] }, ...prev]);
    }
  };

  const deleteWatchlist = async (id: string) => {
    await supabase.from("watchlists").delete().eq("id", id);
    setWatchlists((prev) => prev.filter((w) => w.id !== id));
  };

  const addStockToWatchlist = async (listId: string, stock: Stock) => {
    const list = watchlists.find((w) => w.id === listId);
    if (!list || list.stocks.find((s) => s.ticker === stock.ticker)) return;
    await supabase.from("watchlist_stocks").insert({
      watchlist_id: listId,
      ticker: stock.ticker,
      name: stock.name,
      sector: stock.sector,
      signal: stock.signal,
    } as any);
    setWatchlists((prev) => prev.map((w) => w.id === listId ? { ...w, stocks: [...w.stocks, stock] } : w));
  };

  const removeStockFromWatchlist = async (listId: string, ticker: string) => {
    await supabase.from("watchlist_stocks").delete().eq("watchlist_id", listId).eq("ticker", ticker);
    setWatchlists((prev) => prev.map((w) => w.id === listId ? { ...w, stocks: w.stocks.filter((s) => s.ticker !== ticker) } : w));
  };

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
    <AppContext.Provider value={{ watchlists, setWatchlists, addWatchlist, addStockToWatchlist, removeStockFromWatchlist, deleteWatchlist, watchlistsLoaded, threads, setThreads, addThread, likeThread, addComment, setFactCheck, deleteThread, deleteComment, profile, setProfile, currentUserId, initialLanguage }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
};
