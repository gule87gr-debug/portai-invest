import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL") ?? Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY =
  Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!;

const url = `${SUPABASE_URL}/functions/v1/customer-portal`;

Deno.test("customer-portal: rejects unauthenticated", async () => {
  const res = await fetch(url, {
    method: "POST",
    headers: { apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json" },
    body: "{}",
  });
  const body = await res.json();
  assertExists(body.error);
  assertEquals([401, 500].includes(res.status), true);
});

Deno.test("customer-portal: CORS preflight succeeds", async () => {
  const res = await fetch(url, {
    method: "OPTIONS",
    headers: { apikey: SUPABASE_ANON_KEY },
  });
  await res.text();
  assertEquals(res.status, 200);
});
