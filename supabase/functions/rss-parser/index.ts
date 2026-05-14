import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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
    if (!url) throw new Error('URL is required')

    const response = await fetch(url)
    const xml = await response.text()

    // Basic XML to JSON for RSS/Atom
    // In a real production app, you'd use a more robust parser library
    // but here we can do simple regex extraction for speed and zero-deps
    
    const items = []
    const itemMatches = xml.matchAll(/<item>([\s\S]*?)<\/item>/g)
    
    for (const match of itemMatches) {
      const content = match[1]
      items.push({
        title: content.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/)?.[1] || 
               content.match(/<title>([\s\S]*?)<\/title>/)?.[1],
        link: content.match(/<link>([\s\S]*?)<\/link>/)?.[1],
        description: content.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/)?.[1] || 
                     content.match(/<description>([\s\S]*?)<\/description>/)?.[1],
        pubDate: content.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1],
      })
    }

    return new Response(JSON.stringify({ items: items.slice(0, 20) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
