import { useCallback, useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { SEO } from "@/components/SEO";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Shield, Trash2, Plus, CheckCircle2, AlertTriangle, RefreshCw, Users, ScrollText } from "lucide-react";
import { toast } from "sonner";
import { Navigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";

type AdminRow = { id: string; email: string; note: string; created_at: string };
type AuditRow = { id: string; email: string; function_name: string; user_id: string | null; created_at: string };
type UserRow = { id: string; email: string | null; username: string | null; created_at: string; last_sign_in_at: string | null; email_confirmed_at: string | null; provider: string | null };

const AdminPage = () => {
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [audit, setAudit] = useState<AuditRow[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(false);
  const [auditLoading, setAuditLoading] = useState(false);
  const [usersLoaded, setUsersLoaded] = useState(false);
  const [auditLoaded, setAuditLoaded] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newNote, setNewNote] = useState("");
  const [adding, setAdding] = useState(false);
  const [stripeReport, setStripeReport] = useState<{ ok: boolean; issues: string[] } | null>(null);
  const [stripeLoading, setStripeLoading] = useState(false);

  // Load only admin list on mount (fast). Users + audit are lazy-loaded when dialogs open.
  const loadAdmins = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("admin-manage-bypass", { body: { action: "list" } });
    if (error) toast.error(error.message);
    else setAdmins(((data as any)?.admins ?? []) as AdminRow[]);
    setLoading(false);
  }, []);

  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    const { data, error } = await supabase.functions.invoke("admin-manage-bypass", { body: { action: "list_users" } });
    if (error) toast.error(error.message);
    else setUsers(((data as any)?.users ?? []) as UserRow[]);
    setUsersLoading(false);
    setUsersLoaded(true);
  }, []);

  const loadAudit = useCallback(async () => {
    setAuditLoading(true);
    const { data, error } = await supabase.functions.invoke("admin-manage-bypass", { body: { action: "list_audit" } });
    if (error) toast.error(error.message);
    else setAudit(((data as any)?.audit ?? []) as AuditRow[]);
    setAuditLoading(false);
    setAuditLoaded(true);
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadAdmins();
      loadUsers();
    }
  }, [isAdmin, loadAdmins, loadUsers]);


  const handleAdd = async () => {
    const email = newEmail.trim().toLowerCase();
    if (!email) return;
    setAdding(true);
    const { error } = await supabase.functions.invoke("admin-manage-bypass", {
      body: { action: "add", email, note: newNote.trim() },
    });
    setAdding(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setNewEmail("");
    setNewNote("");
    toast.success("Admin added");
    await loadAdmins();
  };

  const handleRemove = async (id: string, email: string) => {
    if (!confirm(`Remove admin bypass for ${email}?`)) return;
    const { error } = await supabase.functions.invoke("admin-manage-bypass", {
      body: { action: "remove", id },
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Admin removed");
    await loadAdmins();
  };

  const runStripeAudit = async () => {
    setStripeLoading(true);
    setStripeReport(null);
    const { data, error } = await supabase.functions.invoke("verify-stripe-pricing");
    setStripeLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setStripeReport(data as any);
  };

  if (adminLoading) {
    return (
      <AppLayout>
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  return (
    <AppLayout>
      <SEO
        title="Admin | PortAI"
        description="PortAI admin panel for managing bypass access and subscription audits."
        path="/admin"
      />
      <div className="mx-auto max-w-5xl px-4 py-8 space-y-8">
        <header className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Admin panel</h1>
        </header>

        {/* Stripe audit */}
        <section className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-base font-semibold">Stripe pricing audit</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Verifies only €8.99 Plus and €15.99 Pro are active; everything else inactive.
              </p>
            </div>
            <button
              onClick={runStripeAudit}
              disabled={stripeLoading}
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent disabled:opacity-50"
            >
              {stripeLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
              Run audit
            </button>
          </div>
          {stripeReport && (
            <div className={`rounded-md border p-3 text-sm ${stripeReport.ok ? "border-success/40 bg-success/5" : "border-loss/40 bg-loss/5"}`}>
              <div className="flex items-center gap-2 font-semibold mb-1">
                {stripeReport.ok ? (
                  <><CheckCircle2 className="h-4 w-4 text-success" /> All pricing checks passed</>
                ) : (
                  <><AlertTriangle className="h-4 w-4 text-loss" /> {stripeReport.issues.length} issue(s) found</>
                )}
              </div>
              {!stripeReport.ok && (
                <ul className="list-disc pl-5 text-xs text-foreground/90 space-y-1">
                  {stripeReport.issues.map((i, idx) => <li key={idx}>{i}</li>)}
                </ul>
              )}
            </div>
          )}
        </section>

        {/* Admin bypass list */}
        <section className="rounded-lg border border-border bg-card p-5">
          <h2 className="text-base font-semibold mb-1">Admin bypass emails</h2>
          <p className="text-xs text-muted-foreground mb-4">
            Users with these emails get permanent Pro access. Every use is logged below.
          </p>

          <div className="flex flex-col sm:flex-row gap-2 mb-5">
            <input
              type="email"
              placeholder="email@example.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
            <input
              type="text"
              placeholder="Note (optional)"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
            <button
              onClick={handleAdd}
              disabled={adding || !newEmail.trim()}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/85 disabled:opacity-50"
            >
              {adding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              Add
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : admins.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No admin emails configured.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground border-b border-border">
                  <tr><th className="text-left py-2 px-2">Email</th><th className="text-left py-2 px-2">Note</th><th className="text-left py-2 px-2">Added</th><th></th></tr>
                </thead>
                <tbody>
                  {admins.map((a) => (
                    <tr key={a.id} className="border-b border-border/40">
                      <td className="py-2 px-2 font-medium">{a.email}</td>
                      <td className="py-2 px-2 text-muted-foreground">{a.note || "—"}</td>
                      <td className="py-2 px-2 text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</td>
                      <td className="py-2 px-2 text-right">
                        <button
                          onClick={() => handleRemove(a.id, a.email)}
                          className="rounded-md p-1.5 text-loss hover:bg-loss/10"
                          aria-label="Remove admin"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>



        {/* Popups: Registered users + Bypass audit log */}
        <section className="grid gap-3 sm:grid-cols-2">
          <Dialog onOpenChange={(open) => { if (open && !usersLoaded && !usersLoading) loadUsers(); }}>
            <DialogTrigger asChild>
              <button className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-4 text-left hover:bg-accent transition-colors">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-semibold">Registered users</p>
                    <p className="text-xs text-muted-foreground">{usersLoaded ? `${users.length} total` : "Click to load"}</p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">Open →</span>
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Registered users{usersLoaded ? ` (${users.length})` : ""}</DialogTitle>
                <DialogDescription>All accounts that have signed up.</DialogDescription>
              </DialogHeader>
              <div className="flex items-center justify-between gap-2 mb-2">
                <input
                  type="search"
                  placeholder="Search email or username…"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full sm:w-64 rounded-md border border-border bg-background px-3 py-1.5 text-xs"
                />
                <button onClick={loadUsers} disabled={usersLoading} className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs hover:bg-accent shrink-0 disabled:opacity-50">
                  <RefreshCw className={`h-3 w-3 ${usersLoading ? "animate-spin" : ""}`} /> Refresh
                </button>
              </div>
              {usersLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
              ) : users.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No users yet.</p>
              ) : (
                <div className="overflow-auto max-h-[60vh]">
                  <table className="w-full text-sm">
                    <thead className="text-xs text-muted-foreground border-b border-border sticky top-0 bg-card">
                      <tr>
                        <th className="text-left py-2 px-2">Username</th>
                        <th className="text-left py-2 px-2">Email</th>
                        <th className="text-left py-2 px-2">Provider</th>
                        <th className="text-left py-2 px-2">Joined</th>
                        <th className="text-left py-2 px-2">Last sign-in</th>
                        <th className="text-left py-2 px-2">Verified</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users
                        .filter((u) => {
                          if (!userSearch) return true;
                          const q = userSearch.toLowerCase();
                          return (u.email ?? "").toLowerCase().includes(q) || (u.username ?? "").toLowerCase().includes(q);
                        })
                        .map((u) => (
                          <tr key={u.id} className="border-b border-border/40">
                            <td className="py-1.5 px-2 font-medium truncate max-w-[180px]">
                              {u.username ?? <span className="text-muted-foreground italic">—</span>}
                            </td>
                            <td className="py-1.5 px-2 text-muted-foreground truncate max-w-[240px]">{u.email ?? "—"}</td>
                            <td className="py-1.5 px-2 text-muted-foreground">{u.provider ?? "email"}</td>
                            <td className="py-1.5 px-2 text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</td>
                            <td className="py-1.5 px-2 text-muted-foreground">{u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString() : "—"}</td>
                            <td className="py-1.5 px-2">
                              {u.email_confirmed_at ? (
                                <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                              ) : (
                                <span className="text-[10px] uppercase text-muted-foreground">Pending</span>
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </DialogContent>
          </Dialog>

          <Dialog onOpenChange={(open) => { if (open && !auditLoaded && !auditLoading) loadAudit(); }}>
            <DialogTrigger asChild>
              <button className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-4 text-left hover:bg-accent transition-colors">
                <div className="flex items-center gap-3">
                  <ScrollText className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-semibold">Bypass audit log</p>
                    <p className="text-xs text-muted-foreground">{auditLoaded ? `${audit.length} events` : "Click to load"}</p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">Open →</span>
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Bypass audit log</DialogTitle>
                <DialogDescription>Last 100 admin-bypass events.</DialogDescription>
              </DialogHeader>
              <div className="flex justify-end mb-2">
                <button onClick={loadAudit} disabled={auditLoading} className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs hover:bg-accent disabled:opacity-50">
                  <RefreshCw className={`h-3 w-3 ${auditLoading ? "animate-spin" : ""}`} /> Refresh
                </button>
              </div>
              {auditLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
              ) : audit.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No bypass events recorded yet.</p>
              ) : (
                <div className="overflow-auto max-h-[60vh]">
                  <table className="w-full text-sm">
                    <thead className="text-xs text-muted-foreground border-b border-border sticky top-0 bg-card">
                      <tr><th className="text-left py-2 px-2">When</th><th className="text-left py-2 px-2">Email</th><th className="text-left py-2 px-2">Function</th></tr>
                    </thead>
                    <tbody>
                      {audit.map((r) => (
                        <tr key={r.id} className="border-b border-border/40">
                          <td className="py-1.5 px-2 text-muted-foreground font-mono text-xs">{new Date(r.created_at).toLocaleString()}</td>
                          <td className="py-1.5 px-2">{r.email}</td>
                          <td className="py-1.5 px-2 text-muted-foreground">{r.function_name}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </section>
      </div>
    </AppLayout>
  );
};

export default AdminPage;
