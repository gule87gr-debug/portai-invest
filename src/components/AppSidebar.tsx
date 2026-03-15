import { LayoutDashboard, MessageCircle, Sparkles, MessageSquare, Eye, Settings, TrendingUp, Menu, X } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/chat", icon: MessageCircle, label: "AI Chat" },
  { to: "/quiz", icon: Sparkles, label: "Quiz" },
  { to: "/forum", icon: MessageSquare, label: "Forum" },
  { to: "/watchlists", icon: Eye, label: "Watchlists" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

export const AppSidebar = () => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(!isMobile);

  // Close sidebar on any route change
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  return (
    <>
      {/* Hamburger trigger - always visible when sidebar is closed */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-foreground transition-colors hover:bg-accent"
        >
          <Menu className="h-5 w-5" />
        </button>
      )}

      {/* Backdrop */}
      {open && (
        <div className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 flex h-screen w-56 flex-col border-r border-sidebar-border bg-sidebar transition-transform duration-200",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo + close */}
        <div className="flex items-center justify-between px-5 py-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <TrendingUp className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">PortAI</span>
          </div>
          <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="mt-2 flex flex-1 flex-col gap-1 px-3">
          {navItems.map(({ to, icon: Icon, label }) => {
            const active = location.pathname === to;
            return (
              <NavLink
                key={to}
                to={to}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                  active
                    ? "bg-primary/15 text-primary"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <Icon className="h-4.5 w-4.5" />
                {label}
              </NavLink>
            );
          })}
        </nav>

        {/* User */}
        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
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
