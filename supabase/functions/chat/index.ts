import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { checkRateLimit, getClientIP, rateLimitResponse } from "../_shared/rate-limiter.ts";
import { isAdminUser, logAdminBypass } from "../_shared/admin-bypass.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MAX_MESSAGES = 50;
const MAX_MESSAGE_CONTENT_LENGTH = 8000;

// Free-tier daily limits (counted separately)
const FREE_MSG_LIMIT = 10;
const FREE_IMG_LIMIT = 3;
const WINDOW_HOURS = 24;

import { resolveTier } from "../_shared/tier.ts";
import { reserveDailyUsage, dailyLimitResponse } from "../_shared/daily-usage.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const rawBody = await req.json();
    if (!rawBody || typeof rawBody !== "object") {
      return new Response(JSON.stringify({ error: "Invalid request body" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages, mode } = rawBody;

    const MODE_CONFIG: Record<string, { model: string; imageModel: string; nonFree: boolean; reasoning?: string }> = {
      fast:      { model: "google/gemini-3-flash-preview", imageModel: "google/gemini-2.5-flash", nonFree: false },
      balanced:  { model: "google/gemini-2.5-pro",          imageModel: "google/gemini-2.5-pro",   nonFree: true },
      reasoning: { model: "openai/gpt-5.4",                  imageModel: "openai/gpt-5",            nonFree: true, reasoning: "medium" },
      creative:  { model: "openai/gpt-5",                    imageModel: "openai/gpt-5",            nonFree: true },
    };
    const selectedMode: string = typeof mode === "string" && MODE_CONFIG[mode] ? mode : "fast";

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "\"messages\" must be a non-empty array" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (messages.length > MAX_MESSAGES) {
      return new Response(JSON.stringify({ error: `Too many messages (max ${MAX_MESSAGES})` }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const validRoles = new Set(["user", "assistant"]);
    const sanitizedMessages: any[] = [];
    let hasImages = false;

    for (const msg of messages) {
      if (!msg || typeof msg !== "object") continue;
      if (!validRoles.has(msg.role)) continue;
      if (typeof msg.content === "string") {
        sanitizedMessages.push({ role: msg.role, content: msg.content.slice(0, MAX_MESSAGE_CONTENT_LENGTH) });
      } else if (Array.isArray(msg.content)) {
        const validParts: any[] = [];
        for (const part of msg.content) {
          if (part.type === "text" && typeof part.text === "string") {
            validParts.push({ type: "text", text: part.text.slice(0, MAX_MESSAGE_CONTENT_LENGTH) });
          } else if (part.type === "image_url" && part.image_url?.url && typeof part.image_url.url === "string") {
            const url = part.image_url.url;
            if ((url.startsWith("data:image/") || url.startsWith("https://")) && url.length < 10_000_000) {
              validParts.push({ type: "image_url", image_url: { url } });
              hasImages = true;
            }
          }
        }
        if (validParts.length > 0) sanitizedMessages.push({ role: msg.role, content: validParts });
      }
    }

    if (sanitizedMessages.length === 0) {
      return new Response(JSON.stringify({ error: "No valid messages provided" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData } = await supabaseAdmin.auth.getUser(token);
    if (!userData?.user) {
      return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = userData.user.id;
    const rl = await checkRateLimit(`user:${userId}:chat`, { maxRequests: 15, windowMs: 60_000 });
    if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs, corsHeaders);
    const isAdmin = await isAdminUser(supabaseAdmin, userId);
    const tier = await resolveTier(supabaseAdmin, userId, userData.user.email ?? null);
    const cfg = MODE_CONFIG[selectedMode];
    if (cfg.nonFree && tier === "free") return new Response(JSON.stringify({ error: "This mode requires Pro" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const language = typeof rawBody.language === "string" ? rawBody.language : "en";
    if (!await reserveDailyUsage(supabaseAdmin, userId, tier, isAdmin, "chat", hasImages)) return dailyLimitResponse(tier, language, corsHeaders);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const model = hasImages ? cfg.imageModel : cfg.model;

    const systemPrompt = hasImages
      ? `You are Sentry — the AI market analyst inside PortAI — a friendly, knowledgeable financial advisor with image analysis capabilities.

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
      : `You are Sentry — the AI market analyst inside PortAI — a friendly, knowledgeable financial advisor who talks like a smart friend, not a textbook.

Your identity:
- Your name is Sentry. If asked who you are, say you are Sentry, PortAI's AI market analyst.

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
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [{ role: "system", content: systemPrompt }, ...sanitizedMessages],
        stream: true,
        ...(cfg.reasoning ? { reasoning: { effort: cfg.reasoning } } : {}),
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
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
