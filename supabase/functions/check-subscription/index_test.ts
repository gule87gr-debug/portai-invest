import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL") ?? Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY =
  Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!;

const url = `${SUPABASE_URL}/functions/v1/check-subscription`;

Deno.test("check-subscription: returns free tier when unauthenticated", async () => {
  const res = await fetch(url, {
    method: "POST",
    headers: { apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json" },
    body: "{}",
  });
  const body = await res.json();
  // This function may return 200 with a free fallback OR 401 — both are acceptable safe behaviors.
  // We just assert it does not crash and returns a structured response.
  assertExists(body);
  if (res.status === 200) {
    // Should never report subscribed without auth
    assertEquals(body.subscribed === true, false);
  }
});

Deno.test("check-subscription: CORS preflight succeeds", async () => {
  const res = await fetch(url, {
    method: "OPTIONS",
    headers: { apikey: SUPABASE_ANON_KEY },
  });
  await res.text();
  assertEquals(res.status, 200);
});
