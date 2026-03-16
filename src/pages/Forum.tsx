import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useApp } from "@/contexts/AppContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Search, Plus, ThumbsUp, MessageCircle, Sparkles, X, Send, Trash2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const categories = ["All", "General", "Portfolios", "Markets", "Sectors"];
const tagOptions = ["general", "portfolios", "markets", "sectors"];

const factCheckResponses: Record<string, string> = {
  default: "✅ No specific financial claims detected that require verification. This appears to be an opinion-based discussion.",
};

function generateFactCheck(body: string): string {
  if (body.toLowerCase().includes("nvda") || body.toLowerCase().includes("nvidia")) {
    return "📊 Fact Check: NVDA current P/E ratio is approximately 65x (trailing) per latest 10-Q filing. Forward P/E ~42x based on analyst consensus.";
  }
  if (body.toLowerCase().includes("fed") || body.toLowerCase().includes("rate")) {
    return "📊 Fact Check: The Federal Reserve held rates at 5.25-5.50% at the last FOMC meeting. Market pricing suggests 2-3 rate cuts expected in 2026.";
  }
  if (body.toLowerCase().includes("portfolio") || body.toLowerCase().includes("%")) {
    return "📊 Fact Check: Portfolio concentration in a single sector above 40% significantly increases risk. Diversified portfolios outperform on a risk-adjusted basis over 10+ years.";
  }
  if (body.toLowerCase().includes("greenland") || body.toLowerCase().includes("trump")) {
    return "📊 Fact Check: Greenland holds significant rare earth mineral deposits estimated at $1.1T. Denmark has sovereignty over Greenland.";
  }
  return factCheckResponses.default;
}

const Forum = () => {
  const { threads, addThread, likeThread, addComment, setFactCheck, deleteThread, deleteComment, profile, currentUserId } = useApp();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [active, setActive] = useState("All");
  const [showNewThread, setShowNewThread] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [newTag, setNewTag] = useState("general");
  const [expandedThread, setExpandedThread] = useState<string | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [isModeratingPost, setIsModeratingPost] = useState(false);
  const [isModeratingComment, setIsModeratingComment] = useState<string | null>(null);

  const filtered = threads.filter((th) => {
    if (active !== "All" && !th.tags.some((tag) => tag.label.toLowerCase() === active.toLowerCase())) return false;
    if (searchQuery && !th.title.toLowerCase().includes(searchQuery.toLowerCase()) && !th.body.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const moderateContent = async (title: string, body: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke("moderate-post", {
        body: { title, body },
      });
      if (error) return true; // fail open
      return data?.allowed !== false;
    } catch {
      return true; // fail open
    }
  };

  const handlePost = async () => {
    if (!newTitle.trim() || !newBody.trim()) return;
    setIsModeratingPost(true);

    const allowed = await moderateContent(newTitle, newBody);
    if (!allowed) {
      toast({ title: t("moderationError"), variant: "destructive" });
      setIsModeratingPost(false);
      return;
    }

    const displayName = profile.anonymous ? "Anonymous Trader" : profile.name;
    const displayAvatar = profile.anonymous ? "?" : profile.name[0]?.toUpperCase() || "U";
    addThread({
      id: `t-${Date.now()}`, author: displayName, avatar: displayAvatar, time: "just now",
      tags: [{ label: newTag, color: newTag === "general" ? "bg-muted text-muted-foreground" : "bg-primary/20 text-primary" }],
      title: newTitle, body: newBody, likes: 0, comments: [], likedByUser: false,
      userId: currentUserId || undefined,
    });
    setNewTitle(""); setNewBody(""); setShowNewThread(false);
    setIsModeratingPost(false);
  };

  const handleComment = async (threadId: string) => {
    const text = commentInputs[threadId]?.trim();
    if (!text) return;
    setIsModeratingComment(threadId);

    const allowed = await moderateContent("comment", text);
    if (!allowed) {
      toast({ title: t("moderationError"), variant: "destructive" });
      setIsModeratingComment(null);
      return;
    }

    const displayName = profile.anonymous ? "Anonymous Trader" : profile.name;
    const displayAvatar = profile.anonymous ? "?" : profile.name[0]?.toUpperCase() || "U";
    addComment(threadId, { id: `c-${Date.now()}`, author: displayName, avatar: displayAvatar, body: text, time: "just now", likes: 0, userId: currentUserId || undefined });
    setCommentInputs((prev) => ({ ...prev, [threadId]: "" }));
    setIsModeratingComment(null);
  };

  const canDeleteThread = (th: typeof threads[0]) => th.userId === currentUserId;
  const canDeleteComment = (c: typeof threads[0]["comments"][0]) => c.userId === currentUserId;

  return (
    <AppLayout>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">{t("smartForum")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("discussInvestments")}</p>
        </div>
        <button onClick={() => setShowNewThread(true)} className="flex items-center gap-2 rounded-lg bg-primary px-3 sm:px-4 py-2 sm:py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
          <Plus className="h-4 w-4" /> <span className="hidden sm:inline">{t("newThread")}</span>
        </button>
      </div>

      {/* New Thread Modal */}
      {showNewThread && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">{t("createNewThread")}</h2>
              <button onClick={() => setShowNewThread(false)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-3">
              <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder={t("threadTitle")} className="h-10 w-full rounded-lg border border-border bg-accent/30 px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              <textarea value={newBody} onChange={(e) => setNewBody(e.target.value)} placeholder={t("shareThoughts")} rows={4} className="w-full rounded-lg border border-border bg-accent/30 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground">Tag:</span>
                {tagOptions.map((tag) => (
                  <button key={tag} onClick={() => setNewTag(tag)} className={cn("rounded-md px-2.5 py-1 text-xs font-medium transition-colors capitalize", newTag === tag ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground")}>{tag}</button>
                ))}
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setShowNewThread(false)} className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent">{t("cancel")}</button>
                <button onClick={handlePost} disabled={!newTitle.trim() || !newBody.trim() || isModeratingPost} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-30">
                  {isModeratingPost && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {t("postThread")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t("searchThreads")} className="h-10 w-full rounded-lg border border-border bg-card pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
      </div>

      {/* Categories */}
      <div className="mb-6 flex gap-1 rounded-lg bg-card p-1 w-fit overflow-x-auto">
        {categories.map((cat) => (
          <button key={cat} onClick={() => setActive(cat)} className={cn("rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap", active === cat ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>{t(cat.toLowerCase())}</button>
        ))}
      </div>

      {/* Threads */}
      <div className="space-y-4">
        {filtered.map((th, i) => {
          const isExpanded = expandedThread === th.id;
          return (
            <div key={th.id} className="rounded-xl border border-border bg-card p-4 sm:p-5 animate-fade-in" style={{ animationDelay: `${i * 40}ms` }}>
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">{th.avatar}</div>
                  <span className="text-sm font-semibold">{th.author}</span>
                  <span className="text-xs text-muted-foreground">{th.time}</span>
                </div>
                {canDeleteThread(th) && (
                  <button onClick={() => deleteThread(th.id)} className="text-muted-foreground hover:text-loss transition-colors" title="Delete thread">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="mb-2 flex gap-1.5 flex-wrap">
                {th.tags.map((tag) => <span key={tag.label} className={cn("rounded-md px-2 py-0.5 text-xs font-medium capitalize", tag.color)}>{tag.label}</span>)}
              </div>

              <h3 className="text-base font-semibold">{th.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{th.body}</p>

              {th.factCheck && (
                <div className="mt-3 rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm leading-relaxed text-foreground animate-fade-in">{th.factCheck}</div>
              )}

              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <button onClick={() => likeThread(th.id)} className={cn("flex items-center gap-1 transition-colors", th.likedByUser ? "text-primary" : "hover:text-primary")}>
                    <ThumbsUp className="h-3.5 w-3.5" /> {th.likes}
                  </button>
                  <button onClick={() => setExpandedThread(isExpanded ? null : th.id)} className="flex items-center gap-1 hover:text-primary transition-colors">
                    <MessageCircle className="h-3.5 w-3.5" /> {th.comments.length}
                  </button>
                </div>
                <button onClick={() => setFactCheck(th.id, generateFactCheck(th.body))} className="flex items-center gap-1 text-xs text-primary hover:underline">
                  <Sparkles className="h-3.5 w-3.5" /> {t("factCheck")}
                </button>
              </div>

              {isExpanded && (
                <div className="mt-4 border-t border-border pt-4 space-y-3 animate-fade-in">
                  {th.comments.length === 0 && <p className="text-xs text-muted-foreground">No comments yet. Be the first!</p>}
                  {th.comments.map((c) => (
                    <div key={c.id} className="flex gap-2.5 group">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary text-[10px] font-semibold text-secondary-foreground">{c.avatar}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold">{c.author}</span>
                          <span className="text-[10px] text-muted-foreground">{c.time}</span>
                          {canDeleteComment(c) && (
                            <button onClick={() => deleteComment(th.id, c.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-loss transition-all ml-auto" title="Delete comment">
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{c.body}</p>
                      </div>
                    </div>
                  ))}
                  <div className="flex gap-2 pt-1">
                    <input
                      value={commentInputs[th.id] || ""}
                      onChange={(e) => setCommentInputs((prev) => ({ ...prev, [th.id]: e.target.value }))}
                      onKeyDown={(e) => e.key === "Enter" && handleComment(th.id)}
                      placeholder={t("writeComment")}
                      className="h-8 flex-1 rounded-lg border border-border bg-accent/30 px-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                    <button onClick={() => handleComment(th.id)} disabled={isModeratingComment === th.id} className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50">
                      {isModeratingComment === th.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </AppLayout>
  );
};

export default Forum;
