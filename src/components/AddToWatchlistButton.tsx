import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useApp, Stock } from "@/contexts/AppContext";
import { useSubscription } from "@/hooks/useSubscription";
import { UpgradeModal } from "@/components/UpgradeModal";

const FREE_MAX_WATCHLISTS = 1;
const FREE_MAX_STOCKS = 5;

interface Props {
  ticker: string;
  name: string;
  sector?: string;
}

export const AddToWatchlistButton = ({ ticker, name, sector }: Props) => {
  const { watchlists, addWatchlist, addStockToWatchlist, removeStockFromWatchlist } = useApp();
  const { hasUnlimitedWatchlists } = useSubscription();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [upgradeMsg, setUpgradeMsg] = useState("");

  const symbol = ticker.toUpperCase();

  const toggle = (listId: string) => {
    const list = watchlists.find((w) => w.id === listId);
    if (!list) return;
    const already = list.stocks.some((s) => s.ticker.toUpperCase() === symbol);
    if (already) {
      removeStockFromWatchlist(list.id, symbol);
      toast.success(`${symbol} removed from ${list.name}`);
      return;
    }
    if (!hasUnlimitedWatchlists && list.stocks.length >= FREE_MAX_STOCKS) {
      setUpgradeMsg("Free users can add up to 5 stocks per watchlist. Upgrade to Plus or Pro for unlimited stocks.");
      setShowUpgrade(true);
      return;
    }
    const stock: Stock = { ticker: symbol, name, sector, signal: "neutral" };
    addStockToWatchlist(list.id, stock);
    toast.success(`${symbol} added to ${list.name}`);
  };

  const createAndAdd = () => {
    if (!hasUnlimitedWatchlists && watchlists.length >= FREE_MAX_WATCHLISTS) {
      setUpgradeMsg("Free users can create 1 watchlist. Upgrade to Plus or Pro for unlimited watchlists.");
      setShowUpgrade(true);
      return;
    }
    const id = `wl-${Date.now()}`;
    addWatchlist({ id, name: "My Watchlist", stocks: [], desc: "Custom watchlist" });
    addStockToWatchlist(id, { ticker: symbol, name, sector, signal: "neutral" });
    toast.success(`${symbol} added to My Watchlist`);
  };

  const inCount = watchlists.filter((l) => l.stocks.some((s) => s.ticker.toUpperCase() === symbol)).length;

  return (
    <>
      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} description={upgradeMsg} />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Plus className="h-4 w-4" /> {inCount > 0 ? `In ${inCount} watchlist${inCount > 1 ? "s" : ""}` : "Add to watchlist"}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 bg-popover z-50">
          <DropdownMenuLabel>Select watchlists</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {watchlists.map((list) => {
            const already = list.stocks.some((s) => s.ticker.toUpperCase() === symbol);
            return (
              <DropdownMenuCheckboxItem
                key={list.id}
                checked={already}
                onSelect={(e) => {
                  e.preventDefault();
                  toggle(list.id);
                }}
              >
                <span className="truncate">{list.name}</span>
              </DropdownMenuCheckboxItem>
            );
          })}
          {watchlists.length > 0 && <DropdownMenuSeparator />}
          <DropdownMenuItem onSelect={createAndAdd} className="gap-2">
            <Plus className="h-3.5 w-3.5" /> New watchlist
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};

