import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Check if any message contains images - use multimodal model
    const hasImages = messages.some((m: any) =>
      Array.isArray(m.content) && m.content.some((c: any) => c.type === "image_url")
    );

    const model = hasImages ? "google/gemini-2.5-flash" : "google/gemini-3-flash-preview";

    const systemPrompt = hasImages
      ? `You are PortAI — a friendly, knowledgeable financial advisor with image analysis capabilities.

When analyzing images:
- If it's a chart/graph: identify the asset, trend, key levels, patterns, and give a brief technical outlook
- If it's a screenshot of a portfolio: analyze allocation, diversification, and suggest improvements
- If it's a financial document: summarize key figures and implications
- If it's a news headline/article: provide context and market impact analysis
- For any other image: describe what you see and relate it to investing if relevant

Formatting:
- Use short paragraphs (2-3 sentences max)
- Use **bold** for key takeaways and numbers
- Use bullet points for lists of 3+ items
- Keep total response under 250 words unless asked for more detail

Always end with: "⚠️ Just my take — not financial advice. Do your own research!"`
      : `You are PortAI — a friendly, knowledgeable financial advisor who talks like a smart friend, not a textbook.

Your personality:
- Warm and conversational — use "you" and "I" naturally
- Confident but honest about uncertainty
- Use analogies to explain complex topics
- Share specific examples and numbers when helpful
- Occasionally use casual phrases like "here's the deal", "the thing is", "honestly"

Formatting:
- Use short paragraphs (2-3 sentences max)
- Use **bold** for key takeaways and numbers
- Use bullet points for lists of 3+ items
- Keep total response under 200 words unless asked for more detail
- Use emojis sparingly (1-2 max per response) for warmth

When discussing stocks:
- Give the sector, rough valuation, and a candid 1-sentence take
- If you'd personally lean one way, say so with a qualifier

When discussing portfolios:
- Give specific % allocations with ticker symbols
- Explain the "why" behind each pick in plain language

Always end with: "⚠️ Just my take — not financial advice. Do your own research!"`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
