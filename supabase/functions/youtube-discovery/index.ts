import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * YouTube API Proxy with Failover
 */
async function ytRequest(url: string, params: any, keys: string[]): Promise<any> {
  let lastError = null;
  
  for (const key of keys) {
    try {
      const queryParams = new URLSearchParams({ ...params, key });
      const response = await fetch(`${url}?${queryParams.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        const isQuotaError = response.status === 403 && 
          (errorData.error?.message?.includes('quota') || 
           errorData.error?.errors?.[0]?.reason === 'quotaExceeded');
        
        if (isQuotaError) {
          console.warn('YouTube Key exhausted, trying next key...');
          continue;
        }
        throw new Error(errorData.error?.message || 'YouTube API Error');
      }
      
      return await response.json();
    } catch (err) {
      lastError = err;
      console.error('YT Request Error:', err.message);
    }
  }
  throw lastError || new Error('All YouTube keys failed');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { action, params } = await req.json();
    
    // Get keys from Secrets
    const keys = [
      Deno.env.get('YOUTUBE_API_KEY'),
      Deno.env.get('YOUTUBE_API_KEY_2')
    ].filter(Boolean) as string[];

    if (keys.length === 0) throw new Error('YOUTUBE_API_KEY not configured in Secrets');

    let result;

    if (action === 'search') {
      result = await ytRequest('https://www.googleapis.com/youtube/v3/search', params, keys);
    } else if (action === 'channels') {
      result = await ytRequest('https://www.googleapis.com/youtube/v3/channels', params, keys);
    } else if (action === 'playlistItems') {
      result = await ytRequest('https://www.googleapis.com/youtube/v3/playlistItems', params, keys);
    } else if (action === 'videos') {
      result = await ytRequest('https://www.googleapis.com/youtube/v3/videos', params, keys);
    } else {
      throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
