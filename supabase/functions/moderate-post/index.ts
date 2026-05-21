import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { checkRateLimit, getClientIP, rateLimitResponse } from "../_shared/rate-limiter.ts";
import { validateInput, validationErrorResponse, type SchemaDefinition } from "../_shared/input-validator.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const inputSchema: SchemaDefinition = {
  title: { type: "string", required: true, minLength: 1, maxLength: 500 },
  body: { type: "string", required: true, minLength: 1, maxLength: 10000 },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Require authenticated user
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Authentication required" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );
  const token = authHeader.replace("Bearer ", "");
  const { data: userData } = await supabaseAdmin.auth.getUser(token);
  if (!userData?.user) {
    return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Rate limit: 30 requests per minute per user
  const rl = checkRateLimit(`moderate:${userData.user.id}`, { maxRequests: 30, windowMs: 60_000 });
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs, corsHeaders);

  try {
    const rawBody = await req.json();

    // Validate & sanitize input
    const { valid, errors, sanitized } = validateInput(rawBody, inputSchema);
    if (!valid) return validationErrorResponse(errors, corsHeaders);

    const { title, body } = sanitized as { title: string; body: string };

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: `You are a multilingual content moderator for a financial investment forum. You MUST detect harmful content in ALL languages, including but not limited to: English, Spanish, French, Portuguese, German, and Italian.

REJECT posts that contain (in ANY language):
- Profanity, slurs, bad words, vulgar insults, or offensive language in ANY language (including masked/leetspeak variants like "f*ck", "sch3iße", "m3rda", "c0ño", etc.)
- Hate speech, racism, sexism, homophobia, or discrimination
- Direct personal insults, name-calling, or harassment targeting anyone
- Explicit/sexual content
- Spam or scam links
- Pump-and-dump schemes or market manipulation
- Promotion of illegal activities
- Threats of violence

ALLOW everything else, including:
- Clean slang and informal language (e.g. "lol", "bruh", "tbh", "ngl", "imo")
- Strong opinions about stocks, markets, companies (without insults)
- Sarcasm, humor, memes (without offensive language)
- Controversial financial takes
- Criticism of companies, CEOs, or market conditions (without personal insults)
- ALL financial discussions regardless of tone, as long as they don't contain insults or bad words

IMPORTANT: You must recognize insults and bad words in ALL languages. Examples to block:
- English: f-word, s-word, slurs
- Spanish: "mierda", "cabrón", "puta", "pendejo", "coño"
- French: "merde", "putain", "connard", "enculé", "salaud"
- Portuguese: "merda", "porra", "caralho", "filho da puta", "viado"
- German: "Scheiße", "Arschloch", "Hurensohn", "Wichser", "Fotze"
- Italian: "cazzo", "stronzo", "vaffanculo", "merda", "puttana"
- Also catch creative misspellings and obfuscations of these words.

Respond with ONLY a JSON object: {"allowed": true} or {"allowed": false, "reason": "brief reason in English"}`
          },
          {
            role: "user",
            content: `Title: ${title}\n\nBody: ${body}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error("moderation gateway error:", response.status);
      return new Response(
        JSON.stringify({ allowed: false, reason: "Moderation temporarily unavailable. Please try again shortly." }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } catch (parseErr) {
      console.error("moderation parse error:", parseErr);
    }

    // Unparseable AI response — fail closed
    return new Response(
      JSON.stringify({ allowed: false, reason: "Moderation temporarily unavailable. Please try again shortly." }),
      { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("moderation error:", e);
    return new Response(
      JSON.stringify({ allowed: false, reason: "Moderation temporarily unavailable. Please try again shortly." }),
      { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
