import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const ALLOWED_HOSTNAMES = [
  'rss.nytimes.com',
  'feeds.bbci.co.uk',
  'feeds.feedburner.com',
  'medium.com',
  'medium.feed',
  'blog.google',
  'news.ycombinator.com',
  'hnrss.org',
  'reddit.com',
  'www.reddit.com',
  'feeds.arstechnica.com',
  'feeds.wired.com',
  'feeds.macrumors.com',
  'techcrunch.com',
  'feeds.feedblitz.com',
  'wordpress.com',
  'blogspot.com',
  'substack.com',
  'substackcdn.com',
  'api.feedburner.com',
];

const BLOCKED_IP_RANGES = [
  '10.',
  '172.16.',
  '172.17.',
  '172.18.',
  '172.19.',
  '172.20.',
  '172.21.',
  '172.22.',
  '172.23.',
  '172.24.',
  '172.25.',
  '172.26.',
  '172.27.',
  '172.28.',
  '172.29.',
  '172.30.',
  '172.31.',
  '192.168.',
  '127.',
  '0.',
  '169.254.',
  '::1',
  'fc00:',
  'fe80:',
];

function isUrlAllowed(urlString: string): boolean {
  try {
    const url = new URL(urlString);

    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
      return false;
    }

    const hostname = url.hostname.toLowerCase();

    for (const blocked of BLOCKED_IP_RANGES) {
      if (hostname.startsWith(blocked)) {
        return false;
      }
    }

    if (ALLOWED_HOSTNAMES.length > 0) {
      return ALLOWED_HOSTNAMES.some((allowed) =>
        hostname === allowed || hostname.endsWith('.' + allowed)
      );
    }

    return true;
  } catch {
    return false;
  }
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { url } = await req.json()

    if (!url || typeof url !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Valid URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!isUrlAllowed(url)) {
      return new Response(
        JSON.stringify({ error: 'URL not allowed' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: `Failed to fetch RSS feed: ${response.status}` }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const xml = await response.text()

    if (xml.length > 5_000_000) {
      return new Response(
        JSON.stringify({ error: 'Response too large' }),
        { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const items: Array<{ title: string; link: string; description: string; pubDate: string }> = []
    const itemMatches = xml.matchAll(/<item>([\s\S]*?)<\/item>/g)

    for (const match of itemMatches) {
      const content = match[1]
      items.push({
        title: content.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/)?.[1] ||
               content.match(/<title>([\s\S]*?)<\/title>/)?.[1] || '',
        link: content.match(/<link>([\s\S]*?)<\/link>/)?.[1] || '',
        description: content.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/)?.[1] ||
                     content.match(/<description>([\s\S]*?)<\/description>/)?.[1] || '',
        pubDate: content.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] || '',
      })
    }

    return new Response(JSON.stringify({ items: items.slice(0, 20) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
