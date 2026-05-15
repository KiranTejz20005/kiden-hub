import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { code, redirect_uri } = await req.json()

    if (!code) {
      throw new Error('No code provided')
    }

    const client_id = Deno.env.get('GOOGLE_CLIENT_ID')
    const client_secret = Deno.env.get('GOOGLE_CLIENT_SECRET')

    if (!client_id || !client_secret) {
      throw new Error('Google credentials not configured in Edge Function')
    }

    // 1. Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id,
        client_secret,
        redirect_uri,
        grant_type: 'authorization_code',
      }),
    })

    const tokens = await tokenResponse.json()

    if (tokens.error) {
      throw new Error(`Google token exchange error: ${tokens.error_description || tokens.error}`)
    }

    // 2. Get user info from Google to get email
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })
    const googleUser = await userRes.json()

    // 3. Initialize Supabase Client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the user ID from the authorization header
    const authHeader = req.headers.get('Authorization')
    const token = authHeader?.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)

    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    // 4. Store tokens in database
    const expiresAt = new Date()
    expiresAt.setSeconds(expiresAt.getSeconds() + tokens.expires_in)

    const { error: dbError } = await supabaseClient
      .from('user_google_connections')
      .upsert({
        user_id: user.id,
        email: googleUser.email,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token, // Only provided on first consent
        expires_at: expiresAt.toISOString(),
        scopes: tokens.scope.split(' '),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id, email'
      })

    if (dbError) throw dbError

    return new Response(
      JSON.stringify({ success: true, email: googleUser.email }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in google-calendar-auth:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
