import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3.23.8';

const BodySchema = z.object({
  query: z.string().min(1).max(500),
  maxResults: z.number().int().min(1).max(20).optional(),
  searchDepth: z.enum(['basic', 'advanced']).optional(),
});

const TAVILY_ENDPOINT = 'https://api.tavily.com/search';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Require an authenticated user — block anonymous abuse of the key.
  const authHeader = req.headers.get('Authorization') ?? '';
  if (!authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const apiKey = Deno.env.get('TAVILY_API_KEY');
  if (!apiKey) {
    console.error('TAVILY_API_KEY is not configured');
    return new Response(
      JSON.stringify({ error: 'Search service is not configured' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: parsed.error.flatten().fieldErrors }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  const { query, maxResults = 5, searchDepth = 'basic' } = parsed.data;

  try {
    const upstream = await fetch(TAVILY_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        max_results: maxResults,
        search_depth: searchDepth,
      }),
    });

    if (!upstream.ok) {
      const detail = await upstream.text().catch(() => '');
      console.error('Tavily upstream error', upstream.status, detail.slice(0, 200));
      return new Response(
        JSON.stringify({ error: 'Upstream search failed', status: upstream.status }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const data = await upstream.json();
    // Only forward sanitised fields — never echo the API key or raw upstream blob.
    const results = Array.isArray(data?.results)
      ? data.results.map((r: Record<string, unknown>) => ({
          title: r.title,
          url: r.url,
          content: r.content,
          score: r.score,
        }))
      : [];

    return new Response(JSON.stringify({ query, results }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('web-search failed', err);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
