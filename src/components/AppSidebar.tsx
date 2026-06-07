import { MessageCircle, Sparkles, Eye, Settings, TrendingUp, Menu, X, LogOut, Search, Shield, Newspaper } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLanguage } from "@/contexts/LanguageContext";
import { NotificationBell } from "@/components/NotificationBell";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useIsAdmin";

const navKeys = [
  { to: "/dashboard", icon: Search, key: "articleAnalyzer", tour: "" },
  { to: "/news", icon: Newspaper, key: "news", tour: "nav-news" },
  { to: "/chat", icon: MessageCircle, key: "aiChat", tour: "nav-chat" },
  { to: "/quiz", icon: Sparkles, key: "quiz", tour: "nav-quiz" },
  { to: "/watchlists", icon: Eye, key: "watchlists", tour: "nav-watchlists" },
  { to: "/settings", icon: Settings, key: "settings", tour: "" },
];

export const AppSidebar = () => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [tourLocked, setTourLocked] = useState(false);
  const { isAdmin } = useIsAdmin();
  let t: (key: string) => string;
  try {
    const lang = useLanguage();
    t = lang.t;
  } catch {
    t = (key: string) => key;
  }

  useEffect(() => {
    if (!tourLocked) setOpen(false);
  }, [location.pathname, tourLocked]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.open) {
        setOpen(true);
        setTourLocked(true);
      } else {
        setTourLocked(false);
      }
    };
    window.addEventListener("tour-sidebar", handler);
    return () => window.removeEventListener("tour-sidebar", handler);
  }, []);

  return (
    <>
      {!open && (
        <div className="fixed left-4 top-4 z-50 flex items-center gap-2">
          <button
            onClick={() => setOpen(true)}
            aria-label="Open navigation menu"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-foreground transition-colors hover:bg-accent hover:border-primary/30"
          >
            <Menu className="h-5 w-5" />
          </button>
          <NotificationBell />
        </div>
      )}

      {open && !tourLocked && (
        <div className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-40 flex h-screen w-56 flex-col border-r border-sidebar-border glass transition-transform duration-200",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="PortAI" className="h-9 w-9 rounded-lg" />
            <span className="text-lg font-bold text-foreground">PortAI</span>
          </div>
          {!tourLocked && (
            <button onClick={() => setOpen(false)} aria-label="Close navigation menu" className="text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        <nav className="mt-2 flex flex-1 flex-col gap-1 px-3">
          {navKeys.map(({ to, icon: Icon, key, tour }) => {
            const [path, hash] = to.split("#");
            const active = location.pathname === path && (!hash || location.hash === `#${hash}`);
            const isPulse = key === "forum";
            return (
              <NavLink
                key={to}
                to={to}
                data-tour={tour || undefined}
                onClick={(e) => { if (tourLocked) e.preventDefault(); }}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                  active
                    ? "bg-primary/15 text-primary"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <span className="relative">
                  <Icon className="h-4.5 w-4.5" />
                  {isPulse && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-loss opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-loss" />
                    </span>
                  )}
                </span>
                <span className="flex-1">{t(key)}</span>
                {isPulse && (
                  <span className="text-[9px] font-bold uppercase tracking-wider text-loss">Live</span>
                )}
              </NavLink>
            );
          })}

          {isAdmin && (
            <NavLink
              to="/admin"
              onClick={(e) => { if (tourLocked) e.preventDefault(); }}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                location.pathname === "/admin"
                  ? "bg-primary/15 text-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Shield className="h-4.5 w-4.5" />
              <span className="flex-1">Admin</span>
            </NavLink>
          )}

          <div className="mt-auto pt-2 border-t border-sidebar-border">
            <button
              onClick={() => { if (!tourLocked) supabase.auth.signOut(); }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-loss transition-all hover:bg-loss/10"
            >
              <LogOut className="h-4.5 w-4.5" />
              {t("logOut")}
            </button>
          </div>
        </nav>

        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">PortAI</p>
              <p className="truncate text-xs text-muted-foreground">AI Investor Helper</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
