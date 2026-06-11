import { useState, useRef } from "react";
import { Bell, Check, CheckCheck, Trash2, ThumbsUp, MessageCircle, Reply, BellRing } from "lucide-react";
import { useNotifications, Notification } from "@/contexts/NotificationContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const iconMap: Record<string, typeof ThumbsUp> = {
  like: ThumbsUp,
  comment: MessageCircle,
  reply: Reply,
  price_alert: BellRing,
};

const actionMap: Record<string, string> = {
  like: "liked your post",
  comment: "commented on",
  reply: "replied to your comment on",
  price_alert: "",
};

export const NotificationBell = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  let t: (key: string) => string;
  try {
    const lang = useLanguage();
    t = lang.t;
  } catch {
    t = (key: string) => key;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-foreground transition-colors hover:bg-accent"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-loss text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="fixed left-3 right-3 top-20 z-50 sm:absolute sm:right-auto sm:left-0 sm:top-14 sm:w-96 sm:max-h-[calc(100vh-5rem)] rounded-xl border border-border bg-card shadow-xl animate-fade-in overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h3 className="text-sm font-semibold">{t("notifications")}</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button onClick={markAllAsRead} className="text-xs text-primary hover:underline flex items-center gap-1">
                    <CheckCheck className="h-3 w-3" /> {t("markAllRead")}
                  </button>
                )}
                {notifications.length > 0 && (
                  <button onClick={clearAll} className="text-xs text-muted-foreground hover:text-loss flex items-center gap-1">
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto scrollbar-thin">
              {notifications.length === 0 && (
                <div className="py-8 text-center">
                  <Bell className="mx-auto h-8 w-8 text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">{t("noNotifications")}</p>
                </div>
              )}
              {notifications.map((n) => {
                const Icon = iconMap[n.type];
                return (
                  <button
                    key={n.id}
                    onClick={() => { markAsRead(n.id); }}
                    className={cn(
                      "w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/50 border-b border-border/50 last:border-0",
                      !n.read && "bg-primary/5"
                    )}
                  >
                    <div className={cn(
                      "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                      n.type === "price_alert" ? "bg-primary/20 text-primary" :
                      n.type === "like" ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                    )}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      {n.type === "price_alert" ? (
                        <p className="text-xs leading-relaxed font-medium text-foreground">{n.threadTitle}</p>
                      ) : (
                        <p className="text-xs leading-relaxed">
                          <span className="font-semibold text-foreground">{n.fromUser}</span>{" "}
                          <span className="text-muted-foreground">{actionMap[n.type]}</span>{" "}
                          <span className="font-medium text-foreground truncate">"{n.threadTitle}"</span>
                        </p>
                      )}
                      <p className="mt-0.5 text-[10px] text-muted-foreground">{timeAgo(n.createdAt)}</p>
                    </div>
                    {!n.read && <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
