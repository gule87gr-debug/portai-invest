import { useState } from "react";
import { Plus, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
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
  const { watchlists, addWatchlist, addStockToWatchlist } = useApp();
  const { hasUnlimitedWatchlists } = useSubscription();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [upgradeMsg, setUpgradeMsg] = useState("");

  const symbol = ticker.toUpperCase();

  const add = (listId: string) => {
    const list = watchlists.find((w) => w.id === listId);
    if (!list) return;
    if (list.stocks.some((s) => s.ticker.toUpperCase() === symbol)) return;
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

  return (
    <>
      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} description={upgradeMsg} />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Plus className="h-4 w-4" /> Add to watchlist
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 bg-popover z-50">
          <DropdownMenuLabel>Select a watchlist</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {watchlists.map((list) => {
            const already = list.stocks.some((s) => s.ticker.toUpperCase() === symbol);
            return (
              <DropdownMenuItem
                key={list.id}
                disabled={already}
                onSelect={() => add(list.id)}
                className="flex items-center justify-between gap-2"
              >
                <span className="truncate">{list.name}</span>
                {already ? (
                  <Check className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                ) : (
                  <span className="text-[10px] text-muted-foreground shrink-0">{list.stocks.length}</span>
                )}
              </DropdownMenuItem>
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
