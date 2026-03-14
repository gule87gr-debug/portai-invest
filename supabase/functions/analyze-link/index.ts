import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { url } = await req.json();
    if (!url) throw new Error("URL is required");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a financial article credibility analyst. Given a URL, analyze the source and provide a structured assessment. You must respond with valid JSON only, no markdown.

Return this exact JSON structure:
{
  "title": "descriptive title of the analysis",
  "source": "identified source name",
  "trustScore": <number 1-10>,
  "summary": "200 word max summary of what you can infer about the content and source credibility",
  "biases": ["list", "of", "potential", "biases"],
  "strengths": ["list", "of", "credibility", "strengths"]
}

Scoring guide:
- 9-10: Major wire services (Reuters, AP), SEC filings, Fed publications
- 7-8: Established financial media (Bloomberg, CNBC, FT, WSJ)
- 5-6: Contributor platforms (Seeking Alpha, Motley Fool), established blogs
- 3-4: Social media, anonymous forums, unverified sources
- 1-2: Known misinformation sources, pump-and-dump signals

Analyze the URL domain, path structure, and any recognizable patterns to assess credibility even without fetching the page content.`,
          },
          {
            role: "user",
            content: `Analyze this financial article URL for credibility and bias: ${url}`,
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
    
    // Parse the JSON from AI response
    let analysis;
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch {
      analysis = null;
    }

    if (!analysis) {
      analysis = {
        title: "Article Analysis",
        source: new URL(url).hostname,
        trustScore: 5,
        summary: content.slice(0, 500),
        biases: ["Unable to fully parse structured analysis"],
        strengths: ["URL was analyzed by AI"],
      };
    }

    return new Response(JSON.stringify({ success: true, analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-link error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
