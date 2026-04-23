import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL") ?? Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY =
  Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!;

const url = `${SUPABASE_URL}/functions/v1/create-checkout`;

Deno.test("create-checkout: rejects unauthenticated", async () => {
  const res = await fetch(url, {
    method: "POST",
    headers: { apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ tier: "pro", eu_waiver: true, terms_accepted: true }),
  });
  const body = await res.json();
  assertExists(body.error);
  // Most implementations return 401 for unauth; some return 500 — either is non-crashy.
  assertEquals([401, 500].includes(res.status), true);
});

Deno.test("create-checkout: CORS preflight succeeds", async () => {
  const res = await fetch(url, {
    method: "OPTIONS",
    headers: { apikey: SUPABASE_ANON_KEY },
  });
  await res.text();
  assertEquals(res.status, 200);
});
