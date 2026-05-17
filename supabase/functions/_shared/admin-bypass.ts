// Shared helpers for DB-backed admin bypass.
// All callers must pass a Supabase client authenticated with the SERVICE_ROLE key.

import type { SupabaseClient } from "npm:@supabase/supabase-js@2.57.2";

export async function isAdminEmail(
  supabaseAdmin: SupabaseClient,
  email: string | null | undefined,
): Promise<boolean> {
  if (!email) return false;
  try {
    const { data, error } = await supabaseAdmin.rpc("is_admin_email", { _email: email });
    if (error) {
      console.warn("[admin-bypass] is_admin_email RPC error:", error.message);
      return false;
    }
    return !!data;
  } catch (e) {
    console.warn("[admin-bypass] is_admin_email threw:", (e as Error).message);
    return false;
  }
}

export async function logAdminBypass(
  supabaseAdmin: SupabaseClient,
  email: string,
  functionName: string,
  userId: string | null,
): Promise<void> {
  try {
    const { error } = await supabaseAdmin.rpc("log_admin_bypass", {
      _email: email,
      _function_name: functionName,
      _user_id: userId,
    });
    if (error) {
      console.error("[admin-bypass] log_admin_bypass error:", error.message);
    }
  } catch (e) {
    console.error("[admin-bypass] log_admin_bypass threw:", (e as Error).message);
  }
}
