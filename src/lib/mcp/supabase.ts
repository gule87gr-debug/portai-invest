import { createClient } from "@supabase/supabase-js";
import type { ToolContext } from "@lovable.dev/mcp-js";

function env(name: string): string | undefined {
  const runtime = globalThis as typeof globalThis & { Deno?: { env?: { get?: (key: string) => string | undefined } }; process?: { env?: Record<string, string | undefined> } };
  return runtime.Deno?.env?.get?.(name) ?? runtime.process?.env?.[name];
}
export function supabaseForUser(ctx: ToolContext) {
  const token = ctx.getToken();
  if (!token) throw new Error("Authentication required");
  const url = env("SUPABASE_URL") ?? env("VITE_SUPABASE_URL");
  let key = env("SUPABASE_PUBLISHABLE_KEY") ?? env("VITE_SUPABASE_PUBLISHABLE_KEY");
  if (!key) {
    try {
      const keys: unknown = JSON.parse(env("SUPABASE_PUBLISHABLE_KEYS") ?? "{}");
      if (keys && typeof keys === "object") key = Object.values(keys).find((value): value is string => typeof value === "string" && value.startsWith("sb_publishable_"));
    } catch { /* use legacy key */ }
  }
  key ??= env("SUPABASE_ANON_KEY") ?? env("VITE_SUPABASE_ANON_KEY");
  if (!url || !key) throw new Error("Backend configuration unavailable");
  return createClient(url, key, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false, autoRefreshToken: false } });
}