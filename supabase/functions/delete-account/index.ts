// Self-serve account & data deletion (GDPR Art. 17 "Right to Erasure").
// Verifies the caller's JWT, wipes all rows owned by that user across every
// table that stores user data, then deletes the auth user.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify the caller using their JWT
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;
    const userEmail = userData.user.email ?? null;

    // Admin client bypasses RLS for the wipe
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Delete child rows that reference user-owned parents first
    const { data: watchlistIds } = await admin
      .from("watchlists")
      .select("id")
      .eq("user_id", userId);
    if (watchlistIds && watchlistIds.length > 0) {
      const ids = watchlistIds.map((w: { id: string }) => w.id);
      await admin.from("watchlist_stocks").delete().in("watchlist_id", ids);
    }

    const { data: sessionIds } = await admin
      .from("chat_sessions")
      .select("id")
      .eq("user_id", userId);
    if (sessionIds && sessionIds.length > 0) {
      const ids = sessionIds.map((s: { id: string }) => s.id);
      await admin.from("chat_messages").delete().in("session_id", ids);
    }

    // Tables keyed directly by user_id
    const userScopedTables = [
      "watchlists",
      "chat_sessions",
      "price_alerts",
      "notifications",
      "user_settings",
      "article_likes",
      "featured_article_likes",
      "analysis_usage",
      "chat_usage",
      "payment_consents",
      "trial_audit_log",
    ];
    for (const table of userScopedTables) {
      const { error } = await admin.from(table).delete().eq("user_id", userId);
      if (error) console.error(`delete-account: ${table}`, error.message);
    }

    // Add the email to the suppression list so we don't email a deleted user
    if (userEmail) {
      await admin.from("suppressed_emails").insert({
        email: userEmail,
        reason: "account_deleted",
        metadata: { deleted_at: new Date().toISOString() },
      });
    }

    // Finally, delete the auth user
    const { error: delErr } = await admin.auth.admin.deleteUser(userId);
    if (delErr) {
      console.error("delete-account: auth.admin.deleteUser failed", delErr.message);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("delete-account: unhandled exception", message);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
