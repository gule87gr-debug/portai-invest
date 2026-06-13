import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type NotificationType = "like" | "comment" | "reply" | "price_alert";

export type Notification = {
  id: string;
  type: NotificationType;
  fromUser: string;
  threadId: string;
  threadTitle: string;
  read: boolean;
  createdAt: string;
};

type NotificationInput = {
  type: NotificationType;
  fromUser: string;
  threadId: string;
  threadTitle: string;
  targetUserId: string;
};

type NotificationState = {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (n: NotificationInput) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
};

const NotificationContext = createContext<NotificationState | null>(null);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  // Listen for auth changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id || null);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id || null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Load notifications from DB when user changes
  useEffect(() => {
    if (!userId) { setNotifications([]); return; }

    const fetchNotifications = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (data) {
        setNotifications(data.map((n: any) => ({
          id: n.id,
          type: n.type,
          fromUser: n.from_user,
          threadId: n.thread_id,
          threadTitle: n.thread_title,
          read: n.read,
          createdAt: n.created_at,
        })));
      }
    };

    fetchNotifications();

    // Realtime subscription for new notifications
    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (payload) => {
          const n = payload.new as any;
          const mapped: Notification = {
            id: n.id,
            type: n.type,
            fromUser: n.from_user,
            threadId: n.thread_id,
            threadTitle: n.thread_title,
            read: n.read,
            createdAt: n.created_at,
          };
          setNotifications((prev) => [mapped, ...prev].slice(0, 50));

          // Fire browser push notification if user granted permission
          if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
            try {
              const title = n.type === "price_alert" ? "📈 Price Alert" : `${n.from_user || "PortAI"}`;
              const body = n.thread_title || "";
              const notif = new Notification(title, { body, icon: "/icon-192.png", tag: n.id });
              notif.onclick = () => {
                window.focus();
                if (n.type === "price_alert") window.location.href = "/alerts";
                notif.close();
              };
            } catch { /* ignore */ }
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const addNotification = useCallback(async (n: NotificationInput) => {
    // Use secure RPC to insert notification (validates sender server-side)
    await supabase.rpc("send_notification" as any, {
      _target_user_id: n.targetUserId,
      _type: n.type,
      _from_user: n.fromUser,
      _thread_id: n.threadId,
      _thread_title: n.threadTitle,
    });
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
    await supabase.from("notifications").update({ read: true }).eq("id", id);
  }, []);

  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    if (userId) {
      await supabase.from("notifications").update({ read: true }).eq("user_id", userId).eq("read", false);
    }
  }, [userId]);

  const clearAll = useCallback(async () => {
    setNotifications([]);
    if (userId) {
      await supabase.from("notifications").delete().eq("user_id", userId);
    }
  }, [userId]);

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, addNotification, markAsRead, markAllAsRead, clearAll }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
};
