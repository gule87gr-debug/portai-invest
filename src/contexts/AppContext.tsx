import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

// Types
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
};

const defaultWatchlists: WatchlistData[] = [
  {
    id: "wl-1",
    name: "Custom Portfolio 2",
    desc: "Conservative portfolio emphasizing stability with selected sector exposure.",
    stocks: [
      { ticker: "XLP", sector: "Consumer", name: "Consumer Staples Select Sector SPDR Fund", signal: "neutral" },
      { ticker: "VDE", sector: "Energy", name: "Vanguard Energy ETF", signal: "neutral" },
      { ticker: "XLI", sector: "Industrial", name: "Industrial Select Sector SPDR Fund", signal: "neutral" },
      { ticker: "BND", sector: "Fixed Income", name: "Vanguard Total Bond Market ETF", signal: "neutral" },
    ],
  },
  {
    id: "wl-2",
    name: "Custom Portfolio",
    desc: "A balanced growth portfolio targeting tech and healthcare sectors with moderate risk.",
    stocks: [
      { ticker: "QQQ", sector: "Tech", name: "Invesco QQQ Trust", signal: "buy" },
      { ticker: "XLV", sector: "Healthcare", name: "Health Care Select Sector SPDR", signal: "neutral" },
      { ticker: "SPY", sector: "Index", name: "SPDR S&P 500 ETF Trust", signal: "buy" },
      { ticker: "ARKK", sector: "Innovation", name: "ARK Innovation ETF", signal: "sell" },
    ],
  },
];

const defaultThreads: ForumThread[] = [
  {
    id: "t-1", author: "guich", avatar: "G", time: "about 1 month ago",
    tags: [{ label: "general", color: "bg-muted text-muted-foreground" }],
    title: "What do you think about Trump's threats on Greenland?",
    body: "Does he actually have intents to invade or is it just a strategy for something else",
    likes: 3, comments: [
      { id: "c-1", author: "MarketWatcher", avatar: "M", body: "Probably just negotiation leverage for rare earth minerals access.", time: "3 weeks ago", likes: 2 },
    ], likedByUser: false, userId: "system",
  },
  {
    id: "t-2", author: "TechInvestor2025", avatar: "T", time: "about 1 month ago",
    tags: [{ label: "portfolios", color: "bg-primary/20 text-primary" }],
    title: "My AI/Tech Heavy Portfolio - Thoughts?",
    body: "Just restructured my portfolio: 35% NVDA, 20% MSFT, 15% GOOGL, 15% AMZN, 10% META, 5% cash. I know it's tech heavy but I believe in the AI thesis for the next decade.",
    likes: 42, comments: [
      { id: "c-2", author: "DiversifyGuy", avatar: "D", body: "Way too concentrated in tech. Add XLP or XLU for defense.", time: "3 weeks ago", likes: 8 },
      { id: "c-3", author: "AIBull", avatar: "A", body: "I'm similarly positioned. AI is the biggest wealth creation opportunity of our generation.", time: "2 weeks ago", likes: 5 },
    ], likedByUser: false, userId: "system",
  },
  {
    id: "t-3", author: "MacroTrader", avatar: "M", time: "about 1 month ago",
    tags: [{ label: "markets", color: "bg-primary/20 text-primary" }],
    title: "Fed Rate Decision Impact Analysis",
    body: "The Fed is expected to hold rates steady. How are you all positioning for this? I'm looking at TLT and utilities.",
    likes: 28, comments: [
      { id: "c-4", author: "BondKing", avatar: "B", body: "TLT is a solid play if rates are at peak. I'm also looking at XLU.", time: "3 weeks ago", likes: 4 },
    ], likedByUser: false, userId: "system",
  },
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

  // Get current user and load settings from DB
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUserId(user.id);

      // Load settings from DB
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
      } else {
        // Create default settings
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

  // Auto-save settings to DB whenever profile changes
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
    <AppContext.Provider value={{ watchlists, setWatchlists, addWatchlist, addStockToWatchlist, removeStockFromWatchlist, deleteWatchlist, threads, setThreads, addThread, likeThread, addComment, setFactCheck, deleteThread, deleteComment, profile, setProfile, currentUserId }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
};
