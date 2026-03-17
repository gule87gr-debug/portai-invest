import { useState, useRef, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { DisclaimerBanner } from "@/components/DisclaimerBanner";
import { useLanguage } from "@/contexts/LanguageContext";
import { Send, Sparkles, Plus, Trash2, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

type Message = { role: "user" | "assistant"; content: string };
type ChatSession = { id: string; title: string; created_at: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

async function streamChat({ messages, onDelta, onDone, onError }: {
  messages: Message[]; onDelta: (text: string) => void; onDone: () => void; onError: (msg: string) => void;
}) {
  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
    body: JSON.stringify({ messages }),
  });
  if (!resp.ok) { const err = await resp.json().catch(() => ({ error: "Request failed" })); onError(err.error || `Error ${resp.status}`); return; }
  if (!resp.body) { onError("No response body"); return; }
  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let idx: number;
    while ((idx = buf.indexOf("\n")) !== -1) {
      let line = buf.slice(0, idx); buf = buf.slice(idx + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (!line.startsWith("data: ")) continue;
      const json = line.slice(6).trim();
      if (json === "[DONE]") { onDone(); return; }
      try {
        const parsed = JSON.parse(json);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) onDelta(content);
      } catch { /* partial */ }
    }
  }
  onDone();
}

const AIChat = () => {
  const { t } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [showSessions, setShowSessions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const welcomeShown = messages.length === 0;
  const suggestions = [t("suggestETF"), t("suggestDiversify"), t("suggestPE"), t("suggestDCA")];

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { loadSessions(); }, []);

  const loadSessions = async () => {
    const { data } = await supabase.from("chat_sessions").select("id, title, created_at").order("updated_at", { ascending: false });
    if (data) setSessions(data);
  };

  const loadSession = async (sessionId: string) => {
    setActiveSessionId(sessionId);
    const { data } = await supabase.from("chat_messages").select("role, content").eq("session_id", sessionId).order("created_at", { ascending: true });
    if (data) setMessages(data as Message[]);
    setShowSessions(false);
  };

  const saveMessages = async (sessionId: string, msgs: Message[]) => {
    const lastTwo = msgs.slice(-2);
    const inserts = lastTwo.map((m) => ({ session_id: sessionId, role: m.role, content: m.content }));
    await supabase.from("chat_messages").insert(inserts);
    await supabase.from("chat_sessions").update({ updated_at: new Date().toISOString() }).eq("id", sessionId);
  };

  const createSession = async (firstMessage: string): Promise<string> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");
    const title = firstMessage.slice(0, 50) + (firstMessage.length > 50 ? "..." : "");
    const { data, error } = await supabase.from("chat_sessions").insert({ user_id: user.id, title }).select("id").single();
    if (error || !data) throw new Error("Failed to create session");
    loadSessions();
    return data.id;
  };

  const deleteSession = async (sessionId: string) => {
    await supabase.from("chat_sessions").delete().eq("id", sessionId);
    if (activeSessionId === sessionId) { setActiveSessionId(null); setMessages([]); }
    loadSessions();
  };

  const startNewChat = () => { setActiveSessionId(null); setMessages([]); setShowSessions(false); };

  const send = async (text: string) => {
    if (!text.trim() || isTyping) return;
    const userMsg: Message = { role: "user", content: text };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setInput("");
    setIsTyping(true);

    let sessionId = activeSessionId;
    if (!sessionId) {
      try { sessionId = await createSession(text); setActiveSessionId(sessionId); }
      catch { setIsTyping(false); return; }
    }

    let assistantSoFar = "";
    const upsert = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    const finalSessionId = sessionId;
    await streamChat({
      messages: allMessages,
      onDelta: upsert,
      onDone: () => {
        setIsTyping(false);
        const finalMsgs = [...allMessages, { role: "assistant" as const, content: assistantSoFar }];
        setMessages(finalMsgs);
        saveMessages(finalSessionId, finalMsgs);
      },
      onError: (msg) => { setMessages((prev) => [...prev, { role: "assistant", content: `❌ ${msg}` }]); setIsTyping(false); },
    });
  };

  return (
    <AppLayout>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold">{t("aiFinancialAdvisor")}</h1>
            <p className="text-xs text-muted-foreground">{t("poweredByAI")}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowSessions(!showSessions)} className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium transition-colors hover:bg-accent">
            <MessageCircle className="h-3.5 w-3.5" /> {t("history")}
          </button>
          <button onClick={startNewChat} className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium transition-colors hover:bg-accent">
            <Plus className="h-3.5 w-3.5" /> {t("newChat")}
          </button>
        </div>
      </div>

      {showSessions && (
        <div className="mb-4 rounded-xl border border-border bg-card p-4 animate-fade-in">
          <h3 className="text-sm font-semibold mb-3">{t("chatHistory")}</h3>
          {sessions.length === 0 && <p className="text-xs text-muted-foreground">{t("noSavedChats")}</p>}
          <div className="space-y-1 max-h-48 overflow-y-auto scrollbar-thin">
            {sessions.map((s) => (
              <div key={s.id} className={cn("flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors cursor-pointer group", activeSessionId === s.id ? "bg-primary/15 text-primary" : "hover:bg-accent/50")}>
                <span onClick={() => loadSession(s.id)} className="flex-1 truncate">{s.title}</span>
                <button onClick={(e) => { e.stopPropagation(); deleteSession(s.id); }} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-loss transition-all ml-2">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <DisclaimerBanner />

      <div className="mt-4 flex flex-col" style={{ minHeight: "calc(100vh - 320px)" }}>
        <div className="flex-1 space-y-4 overflow-y-auto scrollbar-thin">
          {welcomeShown && (
            <>
              <div className="flex gap-3 animate-fade-in">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary">
                  <Sparkles className="h-4 w-4 text-primary-foreground" />
                </div>
                <div className="rounded-xl rounded-tl-none bg-card p-4 text-sm leading-relaxed text-foreground">
                  {t("welcomeMessage")}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                {suggestions.map((s, i) => (
                  <button key={i} onClick={() => send(s)} className="rounded-xl border border-border bg-card px-4 py-3 text-left text-sm text-muted-foreground transition-all hover:border-primary/40 hover:text-foreground hover:bg-accent/30 animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
                    {s}
                  </button>
                ))}
              </div>
            </>
          )}

          {messages.map((m, i) => (
            <div key={i} className={cn("flex gap-3 animate-fade-in", m.role === "user" ? "justify-end" : "")}>
              {m.role === "assistant" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary">
                  <Sparkles className="h-4 w-4 text-primary-foreground" />
                </div>
              )}
              <div className={cn("max-w-[70%] rounded-xl p-4 text-sm leading-relaxed whitespace-pre-line", m.role === "user" ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-card text-foreground rounded-tl-none")}>
                {m.content}
              </div>
            </div>
          ))}

          {isTyping && messages[messages.length - 1]?.role !== "assistant" && (
            <div className="flex gap-3 animate-fade-in">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary">
                <Sparkles className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="rounded-xl rounded-tl-none bg-card px-4 py-3">
                <div className="flex gap-1">
                  <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="mt-4 flex items-center gap-3">
          <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send(input)} placeholder={t("askAnything")} className="h-12 flex-1 rounded-xl border border-border bg-card px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          <button onClick={() => send(input)} disabled={isTyping} className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50">
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </AppLayout>
  );
};

export default AIChat;
