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
import type { AssetEntry } from "@/lib/stockDatabase/types";
import { cn } from "@/lib/utils";

// The asset catalog is a large chunk; load it only when the search dialog is
// first opened so it never blocks initial page load.
type SearchModule = typeof import("@/lib/stockDatabase/search");
let searchModule: SearchModule | null = null;
let searchModulePromise: Promise<SearchModule> | null = null;
const loadSearchModule = () => {
  if (searchModule) return Promise.resolve(searchModule);
  if (!searchModulePromise) {
    searchModulePromise = import("@/lib/stockDatabase/search").then((m) => {
      searchModule = m;
      return m;
    });
  }
  return searchModulePromise;
};

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
  const [ready, setReady] = useState(() => searchModule !== null);

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

  useEffect(() => {
    if (!open || ready) return;
    let cancelled = false;
    loadSearchModule().then(() => { if (!cancelled) setReady(true); });
    return () => { cancelled = true; };
  }, [open, ready]);

  const list: AssetEntry[] = useMemo(() => {
    if (!ready || !searchModule) return [];
    return query.trim()
      ? searchModule.searchAssetsRanked(query, { limit: 20 })
      : searchModule.getPopularAssets();
  }, [query, ready]);

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
        onMouseEnter={() => { void loadSearchModule(); }}
        onFocus={() => { void loadSearchModule(); }}
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
          <CommandEmpty>{ready ? "No matching assets." : "Loading assets…"}</CommandEmpty>
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
