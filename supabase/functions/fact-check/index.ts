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
            content: `You are a financial fact-checker. Today's date is ${new Date().toISOString().split("T")[0]}.

CRITICAL RULES:
- ONLY fact-check posts that contain SPECIFIC, VERIFIABLE financial claims (exact numbers, percentages, stock prices, dates, statistics, company financials).
- If a post is general discussion, opinion, speculation, or does NOT contain specific verifiable data points, return verdict "opinion" with an EMPTY claims array and summary: "No specific financial claims detected that require verification. This appears to be an opinion-based discussion."
- Do NOT fabricate claims to check. Do NOT invent data points that weren't in the post.
- Do NOT try to fact-check vague statements like "stocks will go up" or "the market is bad."
- Only create claim entries for EXACT figures, statistics, or factual assertions the user explicitly stated.
- If you're unsure about current accuracy of a specific claim, mark it "unverifiable" — NEVER guess.
- NEVER use outdated data as if it's current.

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
