import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const CACHE_KEY = "portai-is-admin";

let cached: boolean | null = (() => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw === null ? null : raw === "1";
  } catch { return null; }
})();

let inFlight: Promise<boolean> | null = null;

const checkAdmin = (): Promise<boolean> => {
  if (inFlight) return inFlight;
  inFlight = (async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return false;
      const { data, error } = await supabase.functions.invoke("admin-check");
      if (error) return false;
      return !!(data as any)?.isAdmin;
    } catch {
      return false;
    }
  })()
    .then((result) => {
      cached = result;
      try { localStorage.setItem(CACHE_KEY, result ? "1" : "0"); } catch { /* ignore */ }
      return result;
    })
    .finally(() => { inFlight = null; });
  return inFlight;
};

export function useIsAdmin() {
  const [isAdmin, setIsAdmin] = useState<boolean>(cached ?? false);
  const [loading, setLoading] = useState(cached === null);

  useEffect(() => {
    let cancelled = false;
    checkAdmin().then((result) => {
      if (cancelled) return;
      setIsAdmin(result);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  return { isAdmin, loading };
}
