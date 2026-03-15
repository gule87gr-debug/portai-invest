import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { useApp, Stock } from "@/contexts/AppContext";
import { searchAssets, AssetEntry } from "@/lib/stockDatabase";
import { Plus, Trash2, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

const Watchlists = () => {
  const { watchlists, addWatchlist, addStockToWatchlist, removeStockFromWatchlist, deleteWatchlist } = useApp();
  const [activeIdx, setActiveIdx] = useState(0);
  const [showNewList, setShowNewList] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [showAddStock, setShowAddStock] = useState(false);
  const [stockSearch, setStockSearch] = useState("");
  const navigate = useNavigate();

  const active = watchlists[activeIdx] || watchlists[0];
  const searchResults = searchAssets(stockSearch);

  const handleCreateList = () => {
    if (!newListName.trim()) return;
    addWatchlist({ id: `wl-${Date.now()}`, name: newListName.trim(), stocks: [], desc: "Custom watchlist" });
    setNewListName("");
    setShowNewList(false);
    setActiveIdx(0);
  };

  const handleAddStock = (asset: AssetEntry) => {
    if (!active) return;
    const stock: Stock = { ticker: asset.ticker, name: asset.name, sector: asset.sector, signal: "neutral" };
    addStockToWatchlist(active.id, stock);
    setStockSearch("");
    setShowAddStock(false);
  };

  if (watchlists.length === 0) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <h1 className="text-2xl font-bold mb-2">No Watchlists Yet</h1>
          <p className="text-muted-foreground mb-4">Create your first watchlist to start tracking stocks.</p>
          <button onClick={() => setShowNewList(true)} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground">
            <Plus className="h-4 w-4" /> Create Watchlist
          </button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Watchlists</h1>
          <p className="mt-1 text-muted-foreground">Track your favorite stocks and ETFs</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowNewList(true)} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
            <Plus className="h-4 w-4" /> New List
          </button>
        </div>
      </div>

      {/* New List Modal */}
      {showNewList && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Create New Watchlist</h2>
              <button onClick={() => setShowNewList(false)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <input value={newListName} onChange={(e) => setNewListName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleCreateList()} placeholder="Watchlist name..." className="h-10 w-full rounded-lg border border-border bg-accent/30 px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setShowNewList(false)} className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-accent">Cancel</button>
              <button onClick={handleCreateList} disabled={!newListName.trim()} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-30">Create</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Stock Modal */}
      {showAddStock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Add to {active?.name}</h2>
              <button onClick={() => { setShowAddStock(false); setStockSearch(""); }} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input value={stockSearch} onChange={(e) => setStockSearch(e.target.value)} placeholder="Search stocks, ETFs, crypto..." autoFocus className="h-10 w-full rounded-lg border border-border bg-accent/30 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="mt-3 max-h-60 overflow-y-auto scrollbar-thin space-y-1">
              {stockSearch.trim() === "" && <p className="py-4 text-center text-xs text-muted-foreground">Start typing to search...</p>}
              {searchResults.map((a) => {
                const alreadyAdded = active?.stocks.some((s) => s.ticker === a.ticker);
                return (
                  <button key={a.ticker} onClick={() => !alreadyAdded && handleAddStock(a)} disabled={alreadyAdded} className={cn("w-full flex items-center justify-between rounded-lg px-3 py-2.5 text-left transition-colors", alreadyAdded ? "opacity-40" : "hover:bg-accent/50")}>
                    <div>
                      <span className="text-sm font-semibold">{a.ticker}</span>
                      <span className="ml-2 text-xs text-muted-foreground">{a.name}</span>
                    </div>
                    <span className={cn("rounded-md px-2 py-0.5 text-[10px] font-medium", a.type === "crypto" ? "bg-chart-3/20 text-chart-3" : a.type === "etf" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground")}>{a.type.toUpperCase()}</span>
                  </button>
                );
              })}
              {stockSearch.trim() && searchResults.length === 0 && <p className="py-4 text-center text-xs text-muted-foreground">No results found</p>}
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-6">
        {/* List panel */}
        <div className="w-60 shrink-0 space-y-3">
          {watchlists.map((list, i) => (
            <div key={list.id} className="relative group">
              <button onClick={() => setActiveIdx(i)} className={cn("w-full rounded-xl border p-4 text-left transition-all", activeIdx === i ? "border-primary bg-primary/10" : "border-border bg-card hover:bg-accent/50")}>
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-sm">{list.name}</p>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">{list.stocks.length} items</p>
              </button>
              <button onClick={() => { deleteWatchlist(list.id); if (activeIdx >= watchlists.length - 1) setActiveIdx(Math.max(0, activeIdx - 1)); }} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-loss transition-all">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Detail panel */}
        {active && (
          <div className="flex-1 rounded-xl border border-border bg-card p-6 animate-fade-in">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold">{active.name}</h2>
                <p className="mt-1 max-w-md text-sm leading-relaxed text-muted-foreground">{active.desc}</p>
              </div>
              <button onClick={() => setShowAddStock(true)} className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
                <Plus className="h-3.5 w-3.5" /> Add Stock
              </button>
            </div>

            {active.stocks.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-muted-foreground text-sm">No stocks yet. Add some!</p>
              </div>
            )}

            <div className="space-y-3">
              {active.stocks.map((s) => (
                <div key={s.ticker} onClick={() => navigate(`/stock/${s.ticker}`)} className="flex items-center justify-between rounded-xl border border-border bg-accent/20 px-4 py-3 cursor-pointer transition-colors hover:bg-accent/40">
                  <div className="flex items-center gap-3">
                    <div>
                      <span className="font-semibold">{s.ticker}</span>
                      <span className="ml-2 rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">{s.sector}</span>
                    </div>
                  </div>
                  <p className="hidden text-sm text-muted-foreground sm:block">{s.name}</p>
                  <button onClick={(e) => { e.stopPropagation(); removeStockFromWatchlist(active.id, s.ticker); }} className="text-muted-foreground hover:text-loss transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Watchlists;
