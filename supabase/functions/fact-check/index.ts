import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { title, body } = await req.json();
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
            content: `You are a financial and geopolitical fact-checker. Today's date is ${new Date().toISOString().split("T")[0]}. Analyze the forum post and fact-check any claims.

CRITICAL RULES:
- Use ONLY information you are confident is accurate as of TODAY (March 2026).
- If you are unsure about a claim's current accuracy, mark it "unverifiable" and say "Unable to verify with current data" — do NOT guess or use outdated information.
- NEVER reference data from years ago as if it's current. If you only know older data, explicitly state "As of [date], ..." and mark the claim "unverifiable" for current accuracy.
- For geopolitical claims, consider the LATEST known developments. Do not default to historical context if the post is about current events.
- For stock/market data, if you don't have real-time prices, say so. Don't invent numbers.

You must respond with valid JSON only, no markdown.

Return this exact JSON structure:
{
  "verdict": "verified" | "partially_true" | "misleading" | "unverifiable" | "opinion",
  "claims": [
    {
      "claim": "the specific claim made",
      "status": "true" | "false" | "misleading" | "unverifiable" | "opinion",
      "explanation": "brief explanation — only cite data you're confident is current"
    }
  ],
  "summary": "A 1-2 sentence overall fact-check summary",
  "confidence": <number 1-10, lower if you lack current data>
}`
          },
          {
            role: "user",
            content: `Fact-check this forum post (posted today, ${new Date().toISOString().split("T")[0]}):\n\nTitle: ${title}\n\nContent: ${body}`,
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
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
