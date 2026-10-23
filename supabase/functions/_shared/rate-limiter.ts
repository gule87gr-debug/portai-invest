import { createClient } from "npm:@supabase/supabase-js@2.57.2";

// Lazy service-only client: importing this module does not read runtime secrets.
let client: ReturnType<typeof createClient> | undefined;

export interface RateLimitConfig {
  maxRequests: number;   // Max requests per window
  windowMs: number;      // Window in milliseconds
}

const DEFAULT_CONFIG: RateLimitConfig = {
  maxRequests: 20,
  windowMs: 60_000, // 1 minute
};

export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = DEFAULT_CONFIG
): Promise<{ allowed: boolean; remaining: number; retryAfterMs: number }> {
  try {
    client ??= createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const seconds = Math.max(1, Math.ceil(config.windowMs / 1000));
    const { data, error } = await client.rpc("check_rate_limit", {
      p_key: identifier,
      p_limit: config.maxRequests,
      p_window_seconds: seconds,
    });
    if (error || typeof data !== "boolean") throw error ?? new Error("Invalid limiter response");
    const windowMs = seconds * 1000;
    return {
      allowed: data,
      // The boolean RPC intentionally does not expose the exact remaining count.
      remaining: 0,
      retryAfterMs: data ? 0 : windowMs - (Date.now() % windowMs),
    };
  } catch (error) {
    console.error("[rate-limiter] check failed; allowing request:", error instanceof Error ? error.message : "RPC error");
    return { allowed: true, remaining: config.maxRequests, retryAfterMs: 0 };
  }
}

export function getClientIP(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

export function rateLimitResponse(retryAfterMs: number, corsHeaders: Record<string, string>): Response {
  const retryAfterSec = Math.ceil(retryAfterMs / 1000);
  return new Response(
    JSON.stringify({ error: "Too many requests. Please try again later." }),
    {
      status: 429,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Retry-After": String(retryAfterSec),
      },
    }
  );
}
