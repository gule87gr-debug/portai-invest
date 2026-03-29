import { useState, useRef, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { DisclaimerBanner } from "@/components/DisclaimerBanner";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Send, Sparkles, Plus, Trash2, MessageCircle, Image, X, Crown } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { UpgradeModal } from "@/components/UpgradeModal";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";

type MessageContent = string | Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }>;
type Message = { role: "user" | "assistant"; content: string; imageUrl?: string };
type ChatSession = { id: string; title: string; created_at: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

function buildMessages(msgs: Message[]): Array<{ role: string; content: MessageContent }> {
  return msgs.map((m) => {
    if (m.imageUrl && m.role === "user") {
      return {
        role: m.role,
        content: [
          { type: "text" as const, text: m.content || "Analyze this image" },
          { type: "image_url" as const, image_url: { url: m.imageUrl } },
        ],
      };
    }
    return { role: m.role, content: m.content };
  });
}

async function streamChat({ messages, onDelta, onDone, onError }: {
  messages: Array<{ role: string; content: MessageContent }>; onDelta: (text: string) => void; onDone: () => void; onError: (msg: string) => void;
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

const MarkdownContent = ({ content }: { content: string }) => (
  <ReactMarkdown
    components={{
      h1: ({ children }) => <h1 className="text-lg font-bold mb-2 mt-3">{children}</h1>,
      h2: ({ children }) => <h2 className="text-base font-bold mb-1.5 mt-2.5">{children}</h2>,
      h3: ({ children }) => <h3 className="text-sm font-bold mb-1 mt-2">{children}</h3>,
      p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
      ul: ({ children }) => <ul className="mb-2 ml-4 list-disc space-y-0.5">{children}</ul>,
      ol: ({ children }) => <ol className="mb-2 ml-4 list-decimal space-y-0.5">{children}</ol>,
      li: ({ children }) => <li className="text-sm leading-relaxed">{children}</li>,
      strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
      em: ({ children }) => <em className="italic">{children}</em>,
      code: ({ children }) => <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-primary">{children}</code>,
      pre: ({ children }) => <pre className="rounded-lg bg-muted p-3 text-xs overflow-x-auto mb-2 font-mono">{children}</pre>,
      blockquote: ({ children }) => <blockquote className="border-l-2 border-primary/50 pl-3 italic text-muted-foreground mb-2">{children}</blockquote>,
    }}
  >
    {content}
  </ReactMarkdown>
);

const FREE_MSG_LIMIT = 10;
const FREE_MSG_WINDOW_HOURS = 12;
const FREE_IMG_LIMIT = 3;
const FREE_IMG_WINDOW_HOURS = 24;

const AIChat = () => {
  const { t } = useLanguage();
  usePageTitle("AI Financial Advisor | PortAI");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [showSessions, setShowSessions] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [msgUsage, setMsgUsage] = useState(0);
  const [imgUsage, setImgUsage] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { isPro } = useSubscription();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState("");
  const welcomeShown = messages.length === 0;
  const suggestions = [t("suggestETF"), t("suggestDiversify"), t("suggestPE"), t("suggestDCA")];

  const msgLimitReached = !isPro && msgUsage >= FREE_MSG_LIMIT;
  const imgLimitReached = !isPro && imgUsage >= FREE_IMG_LIMIT;

  const loadUsage = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const msgCutoff = new Date(Date.now() - FREE_MSG_WINDOW_HOURS * 3600000).toISOString();
    const imgCutoff = new Date(Date.now() - FREE_IMG_WINDOW_HOURS * 3600000).toISOString();
    const [{ count: mc }, { count: ic }] = await Promise.all([
      supabase.from("chat_usage").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("usage_type", "message").gte("created_at", msgCutoff),
      supabase.from("chat_usage").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("usage_type", "image_analysis").gte("created_at", imgCutoff),
    ]);
    setMsgUsage(mc ?? 0);
    setImgUsage(ic ?? 0);
  };

  // Usage is now tracked server-side in the chat edge function

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { loadSessions(); loadUsage(); }, []);

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

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const send = async (text: string) => {
    if ((!text.trim() && !imagePreview) || isTyping) return;
    const hasImage = !!imagePreview;

    if (!isPro) {
      if (msgLimitReached) {
        setUpgradeReason(`You've used all ${FREE_MSG_LIMIT} free messages (resets every ${FREE_MSG_WINDOW_HOURS}h). Upgrade to Pro for unlimited messages.`);
        setShowUpgrade(true);
        return;
      }
      if (hasImage && imgLimitReached) {
        setUpgradeReason(`You've used all ${FREE_IMG_LIMIT} free image analyses (resets every ${FREE_IMG_WINDOW_HOURS}h). Upgrade to Pro for unlimited image analyses.`);
        setShowUpgrade(true);
        return;
      }
    }

    const userMsg: Message = { role: "user", content: text || "Analyze this image", imageUrl: imagePreview || undefined };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setInput("");
    setImagePreview(null);
    setIsTyping(true);

    // Usage is tracked server-side in the chat edge function

    let sessionId = activeSessionId;
    if (!sessionId) {
      try { sessionId = await createSession(text || "Image analysis"); setActiveSessionId(sessionId); }
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
    const apiMessages = buildMessages(allMessages);
    await streamChat({
      messages: apiMessages,
      onDelta: upsert,
      onDone: () => {
        setIsTyping(false);
        const finalMsgs = [...allMessages, { role: "assistant" as const, content: assistantSoFar }];
        setMessages(finalMsgs);
        saveMessages(finalSessionId, finalMsgs);
        // Reload usage counts since they're tracked server-side now
        loadUsage();
      },
      onError: (msg) => { setMessages((prev) => [...prev, { role: "assistant", content: `❌ ${msg}` }]); setIsTyping(false); },
    });
  };

  return (
    <AppLayout>
      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} title="Limit Reached" description={upgradeReason} />
      <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold">{t("aiFinancialAdvisor")}</h1>
            <p className="text-xs text-muted-foreground">{t("poweredByAI")}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isPro && (
            <span className="flex items-center gap-1 rounded-full bg-primary/20 px-2.5 py-1 text-xs font-semibold text-primary">
              <Crown className="h-3 w-3" /> Priority
            </span>
          )}
          <button onClick={() => setShowSessions(!showSessions)} className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs sm:text-sm font-medium transition-colors hover:bg-accent">
            <MessageCircle className="h-3.5 w-3.5" /> <span className="hidden sm:inline">{t("history")}</span>
          </button>
          <button onClick={startNewChat} className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs sm:text-sm font-medium transition-colors hover:bg-accent">
            <Plus className="h-3.5 w-3.5" /> <span className="hidden sm:inline">{t("newChat")}</span>
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

      {!isPro && (
        <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span className={cn(msgLimitReached && "text-destructive font-semibold")}>
            Messages: {msgUsage}/{FREE_MSG_LIMIT} (resets every {FREE_MSG_WINDOW_HOURS}h)
          </span>
          <span className={cn(imgLimitReached && "text-destructive font-semibold")}>
            Image analyses: {imgUsage}/{FREE_IMG_LIMIT} (resets every {FREE_IMG_WINDOW_HOURS}h)
          </span>
        </div>
      )}

      {msgLimitReached && (
        <div className="mt-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 flex items-center gap-2 text-sm">
          <Crown className="h-4 w-4 text-primary shrink-0" />
          <span>You've reached your free message limit ({FREE_MSG_LIMIT} every {FREE_MSG_WINDOW_HOURS}h). <a href="/pricing" className="text-primary font-semibold hover:underline">Upgrade to Pro</a> for unlimited messages.</span>
        </div>
      )}

      {imgLimitReached && !msgLimitReached && (
        <div className="mt-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 flex items-center gap-2 text-sm">
          <Crown className="h-4 w-4 text-primary shrink-0" />
          <span>You've used all {FREE_IMG_LIMIT} free image analyses today. <a href="/pricing" className="text-primary font-semibold hover:underline">Upgrade to Pro</a> for unlimited analyses.</span>
        </div>
      )}

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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
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
              <div className={cn("max-w-[85%] sm:max-w-[70%] rounded-xl p-4 text-sm leading-relaxed", m.role === "user" ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-card text-foreground rounded-tl-none")}>
                {m.imageUrl && (
                  <img src={m.imageUrl} alt="Uploaded" className="mb-2 max-h-48 rounded-lg object-cover" />
                )}
                {m.role === "assistant" ? <MarkdownContent content={m.content} /> : <span className="whitespace-pre-line">{m.content}</span>}
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

        {imagePreview && (
          <div className="mt-2 flex items-center gap-2 rounded-lg border border-border bg-card p-2">
            <img src={imagePreview} alt="Preview" className="h-16 w-16 rounded-lg object-cover" />
            <p className="flex-1 text-xs text-muted-foreground">{t("imageAttached")}</p>
            <button onClick={() => setImagePreview(null)} className="text-muted-foreground hover:text-loss">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="mt-4 flex items-center gap-2">
          <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handleImageSelect} />
          <button onClick={() => {
            if (imgLimitReached) { setUpgradeReason(`You've used all ${FREE_IMG_LIMIT} free image analyses (resets every ${FREE_IMG_WINDOW_HOURS}h). Upgrade to Pro for unlimited image analyses.`); setShowUpgrade(true); return; }
            fileInputRef.current?.click();
          }} className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:text-foreground hover:bg-accent", imgLimitReached && "opacity-50")} title={imgLimitReached ? "Image analysis limit reached" : t("uploadImage")}>
            <Image className="h-5 w-5" />
          </button>
          <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !msgLimitReached && send(input)} placeholder={msgLimitReached ? "Message limit reached — upgrade to Pro" : t("askAnything")} disabled={msgLimitReached} className={cn("h-12 flex-1 rounded-xl border border-border bg-card px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring", msgLimitReached && "opacity-50 cursor-not-allowed")} />
          <button onClick={() => send(input)} disabled={isTyping || msgLimitReached} className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50">
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </AppLayout>
  );
};

export default AIChat;
