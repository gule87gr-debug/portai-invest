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

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [watchlists, setWatchlists] = useState<WatchlistData[]>([]);
  const [watchlistsLoaded, setWatchlistsLoaded] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile>({ name: "Guest User", email: "" });
  const [initialLanguage, setInitialLanguage] = useState("en");
  const [showTutorial, setShowTutorial] = useState(false);

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
    } else {
      setWatchlists([]);
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
      // Optimistically show a name immediately so the UI doesn't wait on the DB.
      setProfile({ name: fallbackName, email: user.email || "" });

      // Fire watchlist + settings queries in parallel — they are independent.
      const [, settingsRes] = await Promise.all([
        loadWatchlists(user.id),
        supabase.from("user_settings").select("display_name,language,tutorial_completed").eq("user_id", user.id).maybeSingle(),
      ]);

      const settings = settingsRes.data as any;
      if (settings) {
        setProfile({
          name: settings.display_name || fallbackName,
          email: user.email || "",
        });
        if (settings.language) setInitialLanguage(settings.language);
        if (!settings.tutorial_completed) setShowTutorial(true);
      } else {
        // Insert default row without blocking the UI.
        supabase.from("user_settings").insert({ user_id: user.id, display_name: fallbackName }).then(() => {});
      }
    };
    init();
  }, []);

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
    <AppContext.Provider value={{ watchlists, setWatchlists, addWatchlist, addStockToWatchlist, removeStockFromWatchlist, moveStock, reorderStocks, deleteWatchlist, watchlistsLoaded, profile, currentUserId, initialLanguage, showTutorial, setShowTutorial }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
};
