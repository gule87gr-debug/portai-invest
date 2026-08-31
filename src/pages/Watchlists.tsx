import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { useApp, Stock } from "@/contexts/AppContext";
import { SEO } from "@/components/SEO";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSubscription } from "@/hooks/useSubscription";
import { UpgradeModal } from "@/components/UpgradeModal";
import { searchAssets, AssetEntry, getAsset, AssetRegion, REGION_LABELS, REGION_FLAGS, REGION_LABEL_KEYS } from "@/lib/stockDatabase";
import { getTradingViewSymbol } from "@/lib/tradingViewSymbol";
import { TradingViewMiniChart } from "@/components/TradingViewWidgets";
import { generateSparklineData } from "@/components/Sparkline";
import { DailySparkline } from "@/components/DailySparkline";
import { useQuotes } from "@/hooks/useQuotes";
import { Plus, Trash2, Search, X, ChevronDown, Eye, Filter, GripVertical, Pencil, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DraggableStockList } from "@/components/DraggableStockList";

const FREE_MAX_WATCHLISTS = 1;
const FREE_MAX_STOCKS = 5;

const Watchlists = () => {
  const { watchlists, addWatchlist, addStockToWatchlist, removeStockFromWatchlist, reorderStocks, deleteWatchlist, renameWatchlist, watchlistsLoaded } = useApp();
  const { t } = useLanguage();
  const { hasUnlimitedWatchlists } = useSubscription();
  usePageTitle("Stock Watchlists | PortAI");
  const [activeIdx, setActiveIdx] = useState(0);
  const [showNewList, setShowNewList] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [showAddStock, setShowAddStock] = useState(false);
  const [stockSearch, setStockSearch] = useState("");
  const [assetFilter, setAssetFilter] = useState<"all" | "stock" | "etf" | "crypto" | "index">("all");
  const [regionFilter, setRegionFilter] = useState<AssetRegion>("all");
  const [showListPicker, setShowListPicker] = useState(false);
  const [showRegionPicker, setShowRegionPicker] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [upgradeMsg, setUpgradeMsg] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const navigate = useNavigate();

  const active = watchlists[activeIdx] || watchlists[0];
  const activeTickers = useMemo(() => active?.stocks?.map((s) => s.ticker) || [], [active]);
  const activeTypes = useMemo(() => {
    const map: Record<string, string> = {};
    active?.stocks?.forEach((s) => {
      const entry = getAsset(s.ticker);
      if (entry) map[s.ticker.toUpperCase()] = entry.type;
    });
    return map;
  }, [active]);
  const { quotes, loading: quotesLoading } = useQuotes(activeTickers, activeTypes);
  const searchResults = searchAssets(stockSearch, regionFilter).filter(
    (a) => assetFilter === "all" || a.type === assetFilter
  );

  const canCreateWatchlist = hasUnlimitedWatchlists || watchlists.length < FREE_MAX_WATCHLISTS;
  const canAddStock = hasUnlimitedWatchlists || (active?.stocks.length ?? 0) < FREE_MAX_STOCKS;

  const handleNewListClick = () => {
    if (!canCreateWatchlist) {
      setUpgradeMsg("Free users can create 1 watchlist. Upgrade to Plus or Pro for unlimited watchlists.");
      setShowUpgrade(true);
      return;
    }
    setShowNewList(true);
  };

  const handleAddStockClick = () => {
    if (!canAddStock) {
      setUpgradeMsg("Free users can add up to 5 stocks per watchlist. Upgrade to Plus or Pro for unlimited stocks.");
      setShowUpgrade(true);
      return;
    }
    setShowAddStock(true);
  };

  const handleCreateList = () => {
    if (!newListName.trim()) return;
    addWatchlist({ id: `wl-${Date.now()}`, name: newListName.trim(), stocks: [], desc: "Custom watchlist" });
    setNewListName(""); setShowNewList(false); setActiveIdx(0);
  };

  const startRename = (id: string, current: string) => { setRenamingId(id); setRenameValue(current); };
  const commitRename = async () => {
    if (renamingId && renameValue.trim()) await renameWatchlist(renamingId, renameValue);
    setRenamingId(null); setRenameValue("");
  };

  const handleAddStock = (asset: AssetEntry) => {
    if (!active) return;
    if (!canAddStock) {
      setUpgradeMsg("Free users can add up to 5 stocks per watchlist. Upgrade to Pro for unlimited stocks.");
      setShowUpgrade(true);
      return;
    }
    const stock: Stock = { ticker: asset.ticker, name: asset.name, sector: asset.sector, signal: "neutral" };
    addStockToWatchlist(active.id, stock);
    setStockSearch(""); setShowAddStock(false);
  };

  const createModal = showNewList && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">{t("createNewWatchlist")}</h2>
          <button onClick={() => setShowNewList(false)} aria-label="Close create watchlist dialog" className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>
        <input value={newListName} onChange={(e) => setNewListName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleCreateList()} placeholder={t("watchlistName")} autoFocus className="h-10 w-full rounded-lg border border-border bg-accent/30 px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={() => setShowNewList(false)} className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-accent">{t("cancel")}</button>
          <button onClick={handleCreateList} disabled={!newListName.trim()} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-30">{t("create")}</button>
        </div>
      </div>
    </div>
  );

  if (!watchlistsLoaded) {
    return (
      <AppLayout>
        <div className="mb-4">
          <div className="h-8 w-48 rounded bg-muted animate-pulse mb-2" />
          <div className="h-4 w-32 rounded bg-muted animate-pulse" />
        </div>
        <div className="flex gap-6">
          <div className="hidden sm:block w-60 shrink-0 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-xl border border-border bg-card animate-pulse" />
            ))}
          </div>
          <div className="flex-1 rounded-xl border border-border bg-card p-6 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 rounded-xl border border-border animate-pulse bg-muted/30" />
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  if (watchlists.length === 0) {
    return (
      <AppLayout>
        {createModal}
        <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} description={upgradeMsg} />
        <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
          <div className="relative mb-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 border-2 border-dashed border-primary/30">
              <Eye className="h-9 w-9 text-primary/60" />
            </div>
            <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary shadow-lg">
              <Plus className="h-4 w-4 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-2">{t("noWatchlistsYet")}</h1>
          <p className="text-muted-foreground mb-6 text-center max-w-sm text-sm leading-relaxed">
            Create your first watchlist to start tracking stocks, ETFs, and crypto with live charts and price data.
          </p>
          <button onClick={handleNewListClick} className="flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
            <Plus className="h-4 w-4" /> {t("createWatchlist")}
          </button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <SEO
        title="Stock Watchlists — PortAI"
        description="Build multi-asset watchlists for stocks, ETFs and crypto. Live quotes, sparklines and price alerts from PortAI."
        path="/watchlists"
      />
      {createModal}
      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} description={upgradeMsg} />

      {showAddStock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">{t("addStock")}</h2>
              <button onClick={() => { setShowAddStock(false); setStockSearch(""); setAssetFilter("all"); setRegionFilter("all"); setShowRegionPicker(false); }} aria-label="Close add stock dialog" className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            {!hasUnlimitedWatchlists && (
              <p className="text-xs text-muted-foreground mb-2">{active?.stocks.length ?? 0}/{FREE_MAX_STOCKS} stocks used</p>
            )}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {(["all", "stock", "etf", "index", "crypto"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setAssetFilter(f)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors border",
                    assetFilter === f
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-accent/30 text-muted-foreground border-border hover:bg-accent/60"
                  )}
                >
                  {f === "all" ? t("filterAllAssets") : f === "stock" ? t("filterStocks") : f === "etf" ? t("filterETFs") : f === "index" ? t("filterIndexFunds") : t("filterCrypto")}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 mb-3">
              <div className="relative">
                <button
                  onClick={() => setShowRegionPicker(!showRegionPicker)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors border",
                    regionFilter !== "all"
                      ? "bg-chart-4 text-white border-chart-4"
                      : "bg-accent/30 text-muted-foreground border-border hover:bg-accent/60"
                  )}
                >
                  <Filter className="h-3 w-3" />
                  {`${REGION_FLAGS[regionFilter]} ${t(REGION_LABEL_KEYS[regionFilter])}`.trim()}
                  <ChevronDown className={cn("h-3 w-3 transition-transform", showRegionPicker && "rotate-180")} />
                </button>
                {showRegionPicker && (
                  <div className="absolute top-full left-0 mt-1 z-10 w-48 rounded-xl border border-border bg-card shadow-xl animate-fade-in py-1">
                    {(Object.keys(REGION_LABELS) as AssetRegion[]).map((key) => (
                      <button
                        key={key}
                        onClick={() => { setRegionFilter(key); setShowRegionPicker(false); }}
                        className={cn(
                          "w-full text-left px-3 py-2 text-xs font-medium transition-colors hover:bg-accent/50",
                          regionFilter === key && "text-primary bg-primary/10"
                        )}
                      >
                        {`${REGION_FLAGS[key]} ${t(REGION_LABEL_KEYS[key])}`.trim()}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input value={stockSearch} onChange={(e) => setStockSearch(e.target.value)} placeholder={t("searchStocksEtfs")} autoFocus className="h-10 w-full rounded-lg border border-border bg-accent/30 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="mt-3 max-h-60 overflow-y-auto scrollbar-thin space-y-1">
              {stockSearch.trim() === "" && <p className="py-4 text-center text-xs text-muted-foreground">{t("startTypingSearch")}</p>}
              {searchResults.map((a) => {
                const alreadyAdded = active?.stocks.some((s) => s.ticker === a.ticker);
                return (
                  <button key={a.ticker} onClick={() => !alreadyAdded && handleAddStock(a)} disabled={alreadyAdded} className={cn("w-full flex items-center justify-between rounded-lg px-3 py-2.5 text-left transition-colors", alreadyAdded ? "opacity-40" : "hover:bg-accent/50")}>
                    <div>
                      <span className="text-sm font-semibold">{a.ticker}</span>
                      <span className="ml-2 text-xs text-muted-foreground">{a.name}</span>
                    </div>
                    <span className={cn("rounded-md px-2 py-0.5 text-[10px] font-medium", a.type === "crypto" ? "bg-chart-3/20 text-chart-3" : a.type === "etf" ? "bg-primary/20 text-primary" : a.type === "index" ? "bg-chart-4/20 text-chart-4" : "bg-muted text-muted-foreground")}>{a.type === "index" ? "INDEX" : a.type.toUpperCase()}</span>
                  </button>
                );
              })}
              {stockSearch.trim() && searchResults.length === 0 && <p className="py-4 text-center text-xs text-muted-foreground">{t("noResults")}</p>}
            </div>
          </div>
        </div>
      )}

      <div className="mb-4 flex items-start justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">{t("watchlists")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("trackStocks")}</p>
        </div>
        <button onClick={handleNewListClick} aria-label={t("newList")} className="flex items-center gap-2 rounded-lg bg-primary px-3 sm:px-4 py-2 sm:py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
          <Plus className="h-4 w-4" /> <span className="hidden sm:inline">{t("newList")}</span>
        </button>
      </div>

      {/* Mobile dropdown */}
      <div className="sm:hidden mb-4">
        <button onClick={() => setShowListPicker(!showListPicker)} className="w-full flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
          <div>
            <p className="font-semibold text-sm">{active?.name}</p>
            <p className="text-xs text-muted-foreground">{active?.stocks.length} {t("items")}</p>
          </div>
          <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", showListPicker && "rotate-180")} />
        </button>
        {showListPicker && (
          <div className="mt-2 rounded-xl border border-border bg-card p-2 space-y-1 animate-fade-in">
            {watchlists.map((list, i) => (
              <div key={list.id} className="flex items-center justify-between">
                {renamingId === list.id ? (
                  <input
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") commitRename(); if (e.key === "Escape") setRenamingId(null); }}
                    onBlur={commitRename}
                    autoFocus
                    aria-label="Watchlist name"
                    className="flex-1 h-9 rounded-lg border border-border bg-accent/30 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                ) : (
                  <button onClick={() => { setActiveIdx(i); setShowListPicker(false); }} className={cn("flex-1 rounded-lg px-3 py-2 text-left text-sm transition-colors", activeIdx === i ? "bg-primary/15 text-primary font-semibold" : "hover:bg-accent/50")}>
                    {list.name} <span className="text-xs text-muted-foreground ml-1">({list.stocks.length})</span>
                  </button>
                )}
                <button onClick={() => (renamingId === list.id ? commitRename() : startRename(list.id, list.name))} aria-label={`Rename watchlist: ${list.name}`} className="p-1 text-muted-foreground hover:text-primary">
                  {renamingId === list.id ? <Check className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
                </button>
                <button onClick={() => { deleteWatchlist(list.id); if (activeIdx >= watchlists.length - 1) setActiveIdx(Math.max(0, activeIdx - 1)); }} aria-label={`Delete watchlist: ${list.name}`} className="p-1 text-muted-foreground hover:text-loss">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-6">
        <div className="hidden sm:block w-60 shrink-0 space-y-3">
          {watchlists.map((list, i) => (
            <div key={list.id} className="relative">
              <button onClick={() => setActiveIdx(i)} className={cn("w-full rounded-xl border p-4 pr-16 text-left transition-all", activeIdx === i ? "border-primary bg-primary/10" : "border-border bg-card hover:bg-accent/50")}>
                {renamingId === list.id ? (
                  <input
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => { if (e.key === "Enter") commitRename(); if (e.key === "Escape") setRenamingId(null); }}
                    onBlur={commitRename}
                    autoFocus
                    aria-label="Watchlist name"
                    className="w-full h-8 rounded-md border border-border bg-background px-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                ) : (
                  <p className="font-semibold text-sm truncate">{list.name}</p>
                )}
                <p className="mt-0.5 text-xs text-muted-foreground">{list.stocks.length} {t("items")}</p>
              </button>
              <button onClick={() => (renamingId === list.id ? commitRename() : startRename(list.id, list.name))} aria-label={`Rename watchlist: ${list.name}`} className="absolute top-2 right-8 text-muted-foreground hover:text-primary transition-colors">
                {renamingId === list.id ? <Check className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
              </button>
              <button onClick={() => { deleteWatchlist(list.id); if (activeIdx >= watchlists.length - 1) setActiveIdx(Math.max(0, activeIdx - 1)); }} aria-label={`Delete watchlist: ${list.name}`} className="absolute top-2 right-2 text-muted-foreground hover:text-loss transition-colors">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>

        {active && (
          <div className="flex-1 bento-card spring-in p-5 sm:p-8">
            <div className="mb-4 flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h2 className="text-lg sm:text-xl font-bold truncate">{active.name}</h2>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground line-clamp-2">{active.desc}</p>
              </div>
              <button onClick={handleAddStockClick} aria-label={t("addStock")} className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 shrink-0">
                <Plus className="h-3.5 w-3.5" /> <span className="hidden sm:inline">{t("addStock")}</span>
              </button>
            </div>

            {active.stocks.length === 0 && (
              <div className="py-10 text-center">
                <p className="text-muted-foreground text-sm">{t("noStocksYet")}</p>
              </div>
            )}

            <DraggableStockList
              stocks={active.stocks}
              onReorder={(from, to) => reorderStocks(active.id, from, to)}
              onRemove={(ticker) => removeStockFromWatchlist(active.id, ticker)}
              onOpen={(ticker) => navigate(`/stock/${ticker}`)}
              quotes={quotes}
              quotesLoading={quotesLoading}
              activeTypes={activeTypes}
            />
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Watchlists;
