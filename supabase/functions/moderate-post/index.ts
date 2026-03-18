import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { title, body } = await req.json();
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
            content: `You are a content moderator for a financial investment forum. Your job is to ONLY block genuinely harmful content.

REJECT posts that contain:
- Hate speech, racism, sexism, or discrimination
- Direct personal insults or harassment targeting specific people
- Explicit/sexual content
- Spam or scam links
- Pump-and-dump schemes or market manipulation
- Promotion of illegal activities
- Threats of violence

ALLOW everything else, including:
- Slang, informal language, abbreviations (e.g. "lol", "bruh", "tbh", "ngl", "imo")
- Strong opinions about stocks, markets, companies
- Mild profanity used casually (not directed at someone as an insult)
- Sarcasm, humor, memes
- Controversial financial takes
- Criticism of companies, CEOs, or market conditions
- ALL financial discussions regardless of tone

Be VERY lenient. This is a casual investment forum where people talk like normal humans. Only block truly harmful content.

Respond with ONLY a JSON object: {"allowed": true} or {"allowed": false, "reason": "brief reason"}`
          },
          {
            role: "user",
            content: `Title: ${title}\n\nBody: ${body}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      return new Response(JSON.stringify({ allowed: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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
    } catch {}

    return new Response(JSON.stringify({ allowed: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("moderation error:", e);
    return new Response(JSON.stringify({ allowed: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
