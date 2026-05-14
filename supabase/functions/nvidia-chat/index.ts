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
    const { action = 'chat', messages, model, input } = await req.json()

    const apiKey1 = Deno.env.get('NVIDIA_API_KEY_1')
    const apiKey2 = Deno.env.get('NVIDIA_API_KEY_2')

    if (!apiKey1 && !apiKey2) {
      throw new Error('NVIDIA API keys not configured in Supabase Secrets')
    }

    const key = apiKey1 || apiKey2!

    if (action === 'embedding') {
      const baseUrl = 'https://integrate.api.nvidia.com/v1/retrieval/nvidia/nv-embedqa-e5-v5/embeddings'
      const res = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: [input],
          input_type: 'query',
          encoding_format: 'float',
          truncate: 'NONE'
        }),
      })

      if (!res.ok) {
        const err = await res.text()
        throw new Error(`NVIDIA Embedding Error: ${res.status} - ${err}`)
      }

      const data = await res.json()
      return new Response(JSON.stringify({ embedding: data.data[0].embedding }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Default: Chat Completions
    const chatUrl = 'https://integrate.api.nvidia.com/v1/chat/completions'
    const res = await fetch(chatUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model || 'meta/llama-3.1-8b-instruct',
        messages,
        temperature: 0.7,
        max_tokens: 2048,
        top_p: 0.9,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`NVIDIA Chat Error: ${res.status} - ${err}`)
    }

    const data = await res.json()
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
