import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getStockDescription, stockDescriptions } from "@/lib/stockDescriptions";
import { getAsset } from "@/lib/stockDatabase";

const LS_PREFIX = "asset-desc:v1:";

export function useAssetDescription(ticker: string) {
  const upper = (ticker || "").toUpperCase();
  const fallback = getStockDescription(upper);
  const isCurated = !!stockDescriptions[upper];

  const [description, setDescription] = useState<string>(fallback.description);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (isCurated) {
      setDescription(fallback.description);
      return;
    }
    // localStorage cache
    try {
      const cached = localStorage.getItem(LS_PREFIX + upper);
      if (cached) {
        setDescription(cached);
        return;
      }
    } catch { /* ignore */ }

    const entry = assetDatabase.find((a) => a.ticker.toUpperCase() === upper);
    if (!entry) return;

    let cancelled = false;
    setLoading(true);
    supabase.functions
      .invoke("describe-asset", {
        body: { ticker: upper, name: entry.name, sector: entry.sector, type: entry.type },
      })
      .then(({ data, error }) => {
        if (cancelled) return;
        const desc = (data as any)?.description as string | undefined;
        if (!error && desc) {
          setDescription(desc);
          try { localStorage.setItem(LS_PREFIX + upper, desc); } catch { /* ignore */ }
        }
      })
      .finally(() => !cancelled && setLoading(false));

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [upper]);

  return {
    name: fallback.name,
    sector: fallback.sector,
    description,
    loading,
    isCurated,
  };
}
