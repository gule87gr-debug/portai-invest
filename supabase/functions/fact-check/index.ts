import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { checkRateLimit, getClientIP, rateLimitResponse } from "../_shared/rate-limiter.ts";
import { validateInput, validationErrorResponse, type SchemaDefinition } from "../_shared/input-validator.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const inputSchema: SchemaDefinition = {
  title: { type: "string", required: false, maxLength: 500 },
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

  // Rate limit: 10 requests per minute per user
  const rl = checkRateLimit(`factcheck:${userData.user.id}`, { maxRequests: 10, windowMs: 60_000 });
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs, corsHeaders);

  try {
    const rawBody = await req.json();

    const { valid, errors, sanitized } = validateInput(rawBody, inputSchema);
    if (!valid) return validationErrorResponse(errors, corsHeaders);

    const { title, body } = sanitized as { title?: string; body: string };
    if (!title && !body) throw new Error("Post content is required");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a thorough financial fact-checker and analyst. Today's date is ${new Date().toISOString().split("T")[0]}.

YOUR JOB: Analyze ALL statements in the post — not just exact numbers. This includes:
- Specific claims with numbers, percentages, prices, dates, statistics
- General financial assertions (e.g., "Tesla is overvalued", "crypto is a scam", "the Fed will raise rates")
- Market predictions and forecasts
- Comparisons between assets, sectors, or strategies
- Claims about company performance, industry trends, or economic conditions
- Investment advice or strategy recommendations

RULES:
- For each meaningful statement or claim, create a claim entry and evaluate it.
- For factual claims with specific data, verify accuracy and mark as "true", "false", or "misleading".
- For general assertions or opinions that have some basis in data, analyze the merit and mark as "true", "misleading", or "opinion" with an explanation of what the data actually shows.
- For predictions or speculation, mark as "opinion" but still provide useful context about why it may or may not be reasonable.
- If you genuinely cannot evaluate a claim, mark it "unverifiable".
- Do NOT fabricate data. If unsure of exact current figures, say so.
- NEVER return an empty claims array unless the post is completely non-financial (e.g., "hello everyone").
- Always provide substantive, educational explanations that help users understand the topic better.
- Aim for at least 2-3 claims per post. Break down compound statements into individual claims.

You must respond with valid JSON only, no markdown.

Return this exact JSON structure:
{
  "verdict": "verified" | "partially_true" | "misleading" | "unverifiable" | "opinion",
  "claims": [
    {
      "claim": "the specific claim made",
      "status": "true" | "false" | "misleading" | "unverifiable" | "opinion",
      "explanation": "brief explanation"
    }
  ],
  "summary": "A 1-2 sentence overall fact-check summary",
  "confidence": <number 1-10>
}`
          },
          {
            role: "user",
            content: `Fact-check this forum post (posted today, ${new Date().toISOString().split("T")[0]}):\n\nTitle: ${title || ""}\n\nContent: ${body}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    let factCheck;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      factCheck = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch {
      factCheck = null;
    }

    if (!factCheck) {
      factCheck = {
        verdict: "unverifiable",
        claims: [],
        summary: content.slice(0, 300) || "Unable to parse fact-check results.",
        confidence: 3,
      };
    }

    return new Response(JSON.stringify({ success: true, factCheck }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("fact-check error:", e);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
