import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { isAdminEmail } from "../_shared/admin-bypass.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Authentication required" }, 401);

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: userData } = await supabaseAdmin.auth.getUser(token);
    const caller = userData?.user;
    if (!caller?.email) return json({ error: "Invalid token" }, 401);

    const callerIsAdmin = await isAdminEmail(supabaseAdmin, caller.email);
    if (!callerIsAdmin) return json({ error: "Forbidden" }, 403);

    const body = await req.json().catch(() => ({}));
    const action = String(body?.action ?? "");

    if (action === "list") {
      const { data, error } = await supabaseAdmin
        .from("admin_emails")
        .select("id, email, note, created_at, created_by")
        .order("created_at", { ascending: false });
      if (error) { console.error("admin-manage-bypass db error:", error); return json({ error: "Internal server error" }, 500); }
      return json({ admins: data ?? [] });
    }

    if (action === "add") {
      const email = String(body?.email ?? "").trim().toLowerCase();
      const note = String(body?.note ?? "").slice(0, 200);
      if (!EMAIL_RE.test(email)) return json({ error: "Invalid email" }, 400);
      const { error } = await supabaseAdmin
        .from("admin_emails")
        .insert({ email, note, created_by: caller.id });
      if (error) { console.error("admin-manage-bypass db error:", error); return json({ error: "Internal server error" }, 500); }
      return json({ ok: true });
    }

    if (action === "remove") {
      const id = String(body?.id ?? "");
      if (!id) return json({ error: "Missing id" }, 400);
      // Prevent admin from removing their own access (avoid lockout).
      const { data: row } = await supabaseAdmin
        .from("admin_emails")
        .select("email")
        .eq("id", id)
        .maybeSingle();
      if (row && (row as any).email?.toLowerCase() === caller.email.toLowerCase()) {
        return json({ error: "You cannot remove your own admin access" }, 400);
      }
      const { error } = await supabaseAdmin.from("admin_emails").delete().eq("id", id);
      if (error) { console.error("admin-manage-bypass db error:", error); return json({ error: "Internal server error" }, 500); }
      return json({ ok: true });
    }

    if (action === "list_audit") {
      const { data, error } = await supabaseAdmin
        .from("admin_bypass_audit")
        .select("id, email, function_name, user_id, created_at")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) { console.error("admin-manage-bypass db error:", error); return json({ error: "Internal server error" }, 500); }
      return json({ audit: data ?? [] });
    }

    if (action === "list_users") {
      // Paginate through ALL users (cap to avoid runaway loops).
      const perPage = 1000;
      const MAX_PAGES = 50; // up to 50,000 users
      const all: any[] = [];
      for (let page = 1; page <= MAX_PAGES; page++) {
        const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
        if (error) { console.error("admin-manage-bypass list_users error:", error); return json({ error: "Internal server error" }, 500); }
        const batch = data?.users ?? [];
        all.push(...batch);
        if (batch.length < perPage) break;
      }
      const users = all.map((u: any) => ({
        id: u.id,
        email: u.email,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
        email_confirmed_at: u.email_confirmed_at,
        provider: u.app_metadata?.provider ?? null,
      }));
      return json({ users, total: users.length });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    console.error("admin-manage-bypass error:", e);
    return json({ error: "Internal server error" }, 500);
  }
});
