import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL") ?? Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY =
  Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!;

const url = `${SUPABASE_URL}/functions/v1/reactivate-subscription`;

Deno.test("reactivate-subscription: rejects unauthenticated request", async () => {
  const res = await fetch(url, {
    method: "POST",
    headers: { apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json" },
    body: "{}",
  });
  const body = await res.json();
  assertEquals(res.status, 401);
  assertEquals(body.error, "Authentication required");
});

Deno.test("reactivate-subscription: CORS preflight succeeds", async () => {
  const res = await fetch(url, {
    method: "OPTIONS",
    headers: { apikey: SUPABASE_ANON_KEY },
  });
  await res.text();
  assertEquals(res.status, 200);
});

Deno.test("reactivate-subscription: rejects invalid bearer with 401", async () => {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: "Bearer invalid.jwt.here",
      "Content-Type": "application/json",
    },
    body: "{}",
  });
  const body = await res.json();
  assertEquals(res.status, 401);
  assertEquals(body.error, "Authentication required");
});
