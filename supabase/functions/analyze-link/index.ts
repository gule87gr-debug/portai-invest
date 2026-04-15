import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { checkRateLimit, getClientIP, rateLimitResponse } from "../_shared/rate-limiter.ts";
import { validateInput, validationErrorResponse, type SchemaDefinition } from "../_shared/input-validator.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const inputSchema: SchemaDefinition = {
  url: { type: "string", required: true, minLength: 5, maxLength: 2048, pattern: /^https?:\/\/.+/ },
};

const FREE_DAILY_ANALYSES = 3;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Rate limit: 10 requests per minute per IP
  const ip = getClientIP(req);
  const rl = checkRateLimit(`analyze:${ip}`, { maxRequests: 10, windowMs: 60_000 });
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs, corsHeaders);

  try {
    const rawBody = await req.json();

    const { valid, errors, sanitized } = validateInput(rawBody, inputSchema);
    if (!valid) return validationErrorResponse(errors, corsHeaders);

    const { url } = sanitized as { url: string };

    // --- Server-side auth & usage enforcement ---
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
    let isPro = false;

    // Admin override
    const ADMIN_EMAILS = ["gule.87.gr@gmail.com"];
    if (userData.user.email && ADMIN_EMAILS.includes(userData.user.email.toLowerCase())) {
      isPro = true;
    } else {
      const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
      if (stripeKey && userData.user.email) {
        try {
          const Stripe = (await import("https://esm.sh/stripe@18.5.0")).default;
          const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
          const customers = await stripe.customers.list({ email: userData.user.email, limit: 1 });
          if (customers.data.length > 0) {
            const subs = await stripe.subscriptions.list({ customer: customers.data[0].id, status: "active", limit: 1 });
            isPro = subs.data.length > 0;
          }
        } catch {
          // Default to free tier
        }
      }
    }

    // Enforce daily analysis limit for free users
    if (!isPro) {
      const today = new Date().toISOString().split("T")[0];
      const { count } = await supabaseAdmin
        .from("analysis_usage")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("used_date", today);

      if ((count ?? 0) >= FREE_DAILY_ANALYSES) {
        return new Response(JSON.stringify({ error: "Daily analysis limit reached. Upgrade to Pro for unlimited analyses." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

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
    
    let analysis;
    try {
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

    // Record usage server-side AFTER successful analysis
    if (userId && !isPro) {
      await supabaseAdmin.from("analysis_usage").insert({ user_id: userId });
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
