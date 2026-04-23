import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL") ?? Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY =
  Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!;

const url = `${SUPABASE_URL}/functions/v1/cancel-subscription`;

Deno.test("cancel-subscription: rejects unauthenticated request", async () => {
  const res = await fetch(url, {
    method: "POST",
    headers: { apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ acknowledged_no_refund: true }),
  });
  const body = await res.json();
  assertEquals(res.status, 401);
  assertEquals(body.error, "Authentication required");
});

Deno.test("cancel-subscription: CORS preflight succeeds", async () => {
  const res = await fetch(url, {
    method: "OPTIONS",
    headers: { apikey: SUPABASE_ANON_KEY },
  });
  await res.text();
  assertEquals(res.status, 200);
  assertEquals(res.headers.get("access-control-allow-origin"), "*");
});

Deno.test("cancel-subscription: rejects invalid bearer token with 401", async () => {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: "Bearer invalid.jwt.here",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ acknowledged_no_refund: true }),
  });
  const body = await res.json();
  assertEquals(res.status, 401);
  assertEquals(body.error, "Authentication required");
});
