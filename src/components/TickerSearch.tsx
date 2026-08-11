import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, TrendingUp } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { searchAssetsRanked, getPopularAssets } from "@/lib/stockDatabase/search";
import { cn } from "@/lib/utils";

const TYPE_LABEL: Record<string, string> = {
  stock: "Stock",
  etf: "ETF",
  crypto: "Crypto",
  index: "Index",
};

export const TickerSearch = ({ className }: { className?: string }) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const popular = useMemo(() => getPopularAssets(), []);
  const results = useMemo(() => searchAssetsRanked(query, { limit: 20 }), [query]);
  const list = query.trim() ? results : popular;

  const select = (ticker: string) => {
    setOpen(false);
    setQuery("");
    navigate(`/stock/${encodeURIComponent(ticker)}`);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search stocks, ETFs and crypto"
        className={cn(
          "flex w-full items-center gap-2 rounded-xl border border-border bg-card/60 px-3 py-2.5 text-left text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:bg-accent/40",
          className,
        )}
      >
        <Search className="h-4 w-4 shrink-0" />
        <span className="truncate">Search tickers, funds or crypto…</span>
        <kbd className="ml-auto hidden shrink-0 rounded border border-border px-1.5 py-0.5 font-mono text-[10px] sm:inline-block">
          ⌘K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen} shouldFilter={false}>
        <CommandInput
          value={query}
          onValueChange={setQuery}
          placeholder="Search by ticker or company name…"
        />
        <CommandList>
          <CommandEmpty>No matching assets.</CommandEmpty>
          <CommandGroup heading={query.trim() ? "Results" : "Popular"}>
            {list.map((a) => (
              <CommandItem
                key={a.ticker}
                value={`${a.ticker} ${a.name}`}
                onSelect={() => select(a.ticker)}
                className="flex items-center gap-3"
              >
                <TrendingUp className="h-4 w-4 text-primary shrink-0" />
                <span className="font-mono text-sm font-semibold">{a.ticker}</span>
                <span className="truncate text-sm text-muted-foreground">{a.name}</span>
                <span className="ml-auto shrink-0 rounded border border-border px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                  {TYPE_LABEL[a.type] ?? a.type}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
};
