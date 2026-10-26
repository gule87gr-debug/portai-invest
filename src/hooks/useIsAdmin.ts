import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useIsAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let generation = 0;
    const check = async () => {
      const current = ++generation;
      setIsAdmin(false);
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const result = session ? await supabase.functions.invoke("admin-check") : null;
        if (!cancelled && current === generation) setIsAdmin(!result?.error && result?.data?.isAdmin === true);
      } finally {
        if (!cancelled && current === generation) setLoading(false);
      }
    };
    void check();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => { setTimeout(() => void check(), 0); });
    return () => { cancelled = true; subscription.unsubscribe(); };
  }, []);

  return { isAdmin, loading };
}
