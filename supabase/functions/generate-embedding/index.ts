import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { record, table } = await req.json()
    
    // We only embed if title or content exists
    const textToEmbed = record.content || record.title || record.description;
    if (!textToEmbed) return new Response(JSON.stringify({ skipped: 'No content' }), { headers: corsHeaders });

    const nvidiaKey = Deno.env.get('NVIDIA_API_KEY_1') || Deno.env.get('NVIDIA_API_KEY_2')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!nvidiaKey || !supabaseUrl || !supabaseKey) {
      throw new Error('Missing environment variables')
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // 1. Generate Embedding
    const res = await fetch('https://integrate.api.nvidia.com/v1/retrieval/nvidia/nv-embedqa-e5-v5/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${nvidiaKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: [textToEmbed.substring(0, 2000)], // Truncate for safety
        input_type: 'query',
        encoding_format: 'float',
        truncate: 'NONE'
      }),
    })

    if (!res.ok) throw new Error(`NVIDIA Error: ${res.status}`)
    const { data } = await res.json()
    const embedding = data[0].embedding

    // 2. Update Database
    const { error } = await supabase
      .from(table)
      .update({ embedding })
      .eq('id', record.id)

    if (error) throw error

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
