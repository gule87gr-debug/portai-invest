import { supabase } from '@/integrations/supabase/client';

export interface WebSearchResult {
  title: string;
  url: string;
  content: string;
  score?: number;
}

export interface WebSearchResponse {
  query: string;
  results: WebSearchResult[];
}

/**
 * Call the `web-search` Edge Function. The Tavily API key never reaches the
 * browser — the function proxies the request server-side.
 */
export async function webSearch(
  query: string,
  options: { maxResults?: number; searchDepth?: 'basic' | 'advanced' } = {},
): Promise<WebSearchResponse> {
  const { data, error } = await supabase.functions.invoke<WebSearchResponse>(
    'web-search',
    {
      body: {
        query,
        maxResults: options.maxResults,
        searchDepth: options.searchDepth,
      },
    },
  );

  if (error) throw error;
  if (!data) throw new Error('Empty response from web-search');
  return data;
}
