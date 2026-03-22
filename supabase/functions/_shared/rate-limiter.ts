/**
 * In-memory rate limiter for edge functions.
 * Tracks requests per IP with a sliding window.
 * Note: Each edge function instance has its own memory, so this is per-instance.
 * For production-grade limiting, use Redis or a database-backed solution.
 */

const store = new Map<string, { count: number; resetAt: number }>();

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of store) {
    if (now > value.resetAt) store.delete(key);
  }
}, 60_000);

export interface RateLimitConfig {
  maxRequests: number;   // Max requests per window
  windowMs: number;      // Window in milliseconds
}

const DEFAULT_CONFIG: RateLimitConfig = {
  maxRequests: 20,
  windowMs: 60_000, // 1 minute
};

export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = DEFAULT_CONFIG
): { allowed: boolean; remaining: number; retryAfterMs: number } {
  const now = Date.now();
  const entry = store.get(identifier);

  if (!entry || now > entry.resetAt) {
    store.set(identifier, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true, remaining: config.maxRequests - 1, retryAfterMs: 0 };
  }

  if (entry.count >= config.maxRequests) {
    const retryAfterMs = entry.resetAt - now;
    return { allowed: false, remaining: 0, retryAfterMs };
  }

  entry.count++;
  return { allowed: true, remaining: config.maxRequests - entry.count, retryAfterMs: 0 };
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
