import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Stock = { ticker: string; sector: string; name: string; signal: string; createdAt?: string };
export type WatchlistData = { id: string; name: string; stocks: Stock[]; desc: string };

export type UserProfile = {
  name: string; email: string;
};

type AppState = {
  watchlists: WatchlistData[];
  setWatchlists: React.Dispatch<React.SetStateAction<WatchlistData[]>>;
  addWatchlist: (w: WatchlistData) => void;
  addStockToWatchlist: (listId: string, stock: Stock) => void;
  removeStockFromWatchlist: (listId: string, ticker: string) => void;
  moveStock: (listId: string, ticker: string, direction: "up" | "down") => void;
  reorderStocks: (listId: string, fromIndex: number, toIndex: number) => Promise<void>;
  deleteWatchlist: (listId: string) => void;
  renameWatchlist: (listId: string, name: string) => Promise<void>;
  watchlistsLoaded: boolean;
  profile: UserProfile;
  currentUserId: string | null;
  initialLanguage: string;
  showTutorial: boolean;
  setShowTutorial: React.Dispatch<React.SetStateAction<boolean>>;
};

const AppContext = createContext<AppState | null>(null);

const WL_CACHE_KEY = "portai-watchlists-cache";

const readWatchlistCache = (userId: string): WatchlistData[] | null => {
  try {
    const raw = localStorage.getItem(`${WL_CACHE_KEY}-${userId}`);
    return raw ? (JSON.parse(raw) as WatchlistData[]) : null;
  } catch { return null; }
};

const writeWatchlistCache = (userId: string, data: WatchlistData[]) => {
  try { localStorage.setItem(`${WL_CACHE_KEY}-${userId}`, JSON.stringify(data)); } catch { /* ignore */ }
};

const PROFILE_CACHE_KEY = "portai-profile-cache";
const LANG_CACHE_KEY = "portai-language-cache";

// Synchronous reads so the very first render already shows the user's data.
const cachedProfile = (): UserProfile | null => {
  try {
    const raw = localStorage.getItem(PROFILE_CACHE_KEY);
    return raw ? (JSON.parse(raw) as UserProfile) : null;
  } catch { return null; }
};
const cachedWatchlists = (): WatchlistData[] | null => {
  try {
    const key = Object.keys(localStorage).find((k) => k.startsWith(WL_CACHE_KEY));
    return key ? (JSON.parse(localStorage.getItem(key) as string) as WatchlistData[]) : null;
  } catch { return null; }
};

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const initialWatchlists = cachedWatchlists();
  const initialProfile = cachedProfile();
  const [watchlists, setWatchlists] = useState<WatchlistData[]>(initialWatchlists ?? []);
  const [watchlistsLoaded, setWatchlistsLoaded] = useState(!!initialWatchlists);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile>(initialProfile ?? { name: "Guest User", email: "" });
  const [initialLanguage, setInitialLanguage] = useState(() => {
    try { return localStorage.getItem(LANG_CACHE_KEY) || "en"; } catch { return "en"; }
  });
  const [showTutorial, setShowTutorial] = useState(false);


  const loadWatchlists = async (userId: string) => {
    const { data: wlData } = await supabase
      .from("watchlists")
      .select("id,name,description,created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (wlData && wlData.length > 0) {
      const { data: stocksData } = await supabase
        .from("watchlist_stocks")
        .select("watchlist_id,ticker,name,sector,signal,created_at")
        .in("watchlist_id", wlData.map((w: any) => w.id))
        .order("created_at", { ascending: false });

      const mapped: WatchlistData[] = wlData.map((w: any) => ({
        id: w.id,
        name: w.name,
        desc: w.description || "",
        stocks: (stocksData || [])
          .filter((s: any) => s.watchlist_id === w.id)
          .map((s: any) => ({ ticker: s.ticker, name: s.name, sector: s.sector, signal: s.signal, createdAt: s.created_at })),
      }));
      setWatchlists(mapped);
      writeWatchlistCache(userId, mapped);
    } else {
      setWatchlists([]);
      writeWatchlistCache(userId, []);
    }
    setWatchlistsLoaded(true);
  };

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) return;
      setCurrentUserId(user.id);

      const fallbackName = user.email?.split("@")[0] || "User";
      // Only overwrite the cached name if we don't have one yet.
      setProfile((prev) => (prev.email ? { ...prev, email: user.email || prev.email } : { name: fallbackName, email: user.email || "" }));

      // Paint cached watchlists instantly, then refresh in the background.
      const cached = readWatchlistCache(user.id);
      if (cached) {
        setWatchlists(cached);
        setWatchlistsLoaded(true);
      }

      // Fire watchlist + settings queries in parallel — they are independent.
      const [, settingsRes] = await Promise.all([
        loadWatchlists(user.id),
        supabase.from("user_settings").select("display_name,language,tutorial_completed").eq("user_id", user.id).maybeSingle(),
      ]);

      const settings = settingsRes.data as any;
      if (settings) {
        const nextProfile = { name: settings.display_name || fallbackName, email: user.email || "" };
        setProfile(nextProfile);
        try { localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(nextProfile)); } catch { /* ignore */ }
        if (settings.language) {
          setInitialLanguage(settings.language);
          try { localStorage.setItem(LANG_CACHE_KEY, settings.language); } catch { /* ignore */ }
        }

        if (!settings.tutorial_completed) setShowTutorial(true);
      } else {
        // Insert default row without blocking the UI.
        supabase.from("user_settings").insert({ user_id: user.id, display_name: fallbackName }).then(() => {});
      }
    };
    init();
  }, []);

  // Keep the instant-paint cache in sync with local mutations.
  useEffect(() => {
    if (!currentUserId || !watchlistsLoaded) return;
    writeWatchlistCache(currentUserId, watchlists);
  }, [watchlists, currentUserId, watchlistsLoaded]);




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

  const renameWatchlist = async (id: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setWatchlists((prev) => prev.map((w) => (w.id === id ? { ...w, name: trimmed } : w)));
    await supabase.from("watchlists").update({ name: trimmed } as any).eq("id", id);
  };

  const addStockToWatchlist = async (listId: string, stock: Stock) => {
    const list = watchlists.find((w) => w.id === listId);
    if (!list || list.stocks.find((s) => s.ticker === stock.ticker)) return;
    const { data: inserted } = await supabase.from("watchlist_stocks").insert({
      watchlist_id: listId,
      ticker: stock.ticker,
      name: stock.name,
      sector: stock.sector,
      signal: stock.signal,
    } as any).select("created_at").single();
    const newStock = { ...stock, createdAt: (inserted as any)?.created_at ?? new Date().toISOString() };
    setWatchlists((prev) => prev.map((w) => w.id === listId ? { ...w, stocks: [newStock, ...w.stocks] } : w));
  };

  const removeStockFromWatchlist = async (listId: string, ticker: string) => {
    await supabase.from("watchlist_stocks").delete().eq("watchlist_id", listId).eq("ticker", ticker);
    setWatchlists((prev) => prev.map((w) => w.id === listId ? { ...w, stocks: w.stocks.filter((s) => s.ticker !== ticker) } : w));
  };

  const moveStock = async (listId: string, ticker: string, direction: "up" | "down") => {
    const list = watchlists.find((w) => w.id === listId);
    if (!list) return;
    const idx = list.stocks.findIndex((s) => s.ticker === ticker);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (idx < 0 || swapIdx < 0 || swapIdx >= list.stocks.length) return;
    const a = list.stocks[idx];
    const b = list.stocks[swapIdx];
    const aCreated = a.createdAt;
    const bCreated = b.createdAt;
    const next = [...list.stocks];
    next[idx] = { ...b, createdAt: aCreated };
    next[swapIdx] = { ...a, createdAt: bCreated };
    setWatchlists((prev) => prev.map((w) => w.id === listId ? { ...w, stocks: next } : w));
    if (aCreated && bCreated) {
      await supabase.from("watchlist_stocks").update({ created_at: bCreated } as any).eq("watchlist_id", listId).eq("ticker", a.ticker);
      await supabase.from("watchlist_stocks").update({ created_at: aCreated } as any).eq("watchlist_id", listId).eq("ticker", b.ticker);
    }
  };

  const reorderStocks = async (listId: string, fromIndex: number, toIndex: number) => {
    const list = watchlists.find((w) => w.id === listId);
    if (!list) return;
    if (fromIndex === toIndex) return;
    if (fromIndex < 0 || toIndex < 0 || fromIndex >= list.stocks.length || toIndex >= list.stocks.length) return;
    const current = [...list.stocks];
    const [moved] = current.splice(fromIndex, 1);
    current.splice(toIndex, 0, moved);
    const timestamps = list.stocks.map((s) => s.createdAt);
    const next = current.map((s, i) => ({ ...s, createdAt: timestamps[i] ?? s.createdAt }));
    setWatchlists((prev) => prev.map((w) => w.id === listId ? { ...w, stocks: next } : w));
    const updates: Promise<unknown>[] = [];
    next.forEach((s, i) => {
      const originalIdx = list.stocks.findIndex((x) => x.ticker === s.ticker);
      const newTs = timestamps[i];
      if (originalIdx !== i && newTs) {
        updates.push(
          Promise.resolve(
            supabase.from("watchlist_stocks").update({ created_at: newTs } as any).eq("watchlist_id", listId).eq("ticker", s.ticker)
          )
        );
      }
    });
    await Promise.all(updates);
  };

  return (
    <AppContext.Provider value={{ watchlists, setWatchlists, addWatchlist, addStockToWatchlist, removeStockFromWatchlist, moveStock, reorderStocks, deleteWatchlist, renameWatchlist, watchlistsLoaded, profile, currentUserId, initialLanguage, showTutorial, setShowTutorial }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
};
