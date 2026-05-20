import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders })
  }

  try {
    const { code, redirect_uri, action } = await req.json()
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')
    const token = authHeader?.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)

    if (userError || !user) throw new Error('Unauthorized')

    // ACTION: SYNC
    if (action === 'sync') {
      const { data: connection } = await supabaseClient
        .from('user_google_connections')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (!connection) throw new Error('No Google connection')

      let accessToken = connection.access_token
      const isExpired = new Date(connection.expires_at) <= new Date()

      if (isExpired && connection.refresh_token) {
        console.log('Google access token expired. Refreshing...')
        const client_id = Deno.env.get('VITE_GOOGLE_CLIENT_ID') || Deno.env.get('GOOGLE_CLIENT_ID')
        const client_secret = Deno.env.get('VITE_GOOGLE_CLIENT_SECRET') || Deno.env.get('GOOGLE_CLIENT_SECRET')

        const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: client_id!,
            client_secret: client_secret!,
            refresh_token: connection.refresh_token,
            grant_type: 'refresh_token',
          }),
        })

        const refreshTokens = await refreshResponse.json()
        if (refreshTokens.error) {
          throw new Error(`Failed to refresh Google token: ${refreshTokens.error_description || refreshTokens.error}`)
        }

        accessToken = refreshTokens.access_token
        const expiresAt = new Date()
        expiresAt.setSeconds(expiresAt.getSeconds() + refreshTokens.expires_in)

        const { error: updateError } = await supabaseClient
          .from('user_google_connections')
          .update({
            access_token: accessToken,
            expires_at: expiresAt.toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', connection.id)

        if (updateError) throw updateError
        console.log('Google access token refreshed successfully.')
      }

      const eventsRes = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      
      if (!eventsRes.ok) {
        const errorText = await eventsRes.text();
        throw new Error(`Google API returned error: ${eventsRes.status} ${errorText}`);
      }

      const { items } = await eventsRes.json()
      if (!items) throw new Error('Failed to fetch events')

      // Get or create primary calendar in database
      let { data: calendar } = await supabaseClient
        .from('calendars')
        .select('*')
        .eq('user_id', user.id)
        .eq('google_calendar_id', 'primary')
        .maybeSingle()

      if (!calendar) {
        const { data: newCalendar, error: calError } = await supabaseClient
          .from('calendars')
          .insert({
            user_id: user.id,
            google_calendar_id: 'primary',
            name: 'Primary Calendar',
            is_primary: true
          })
          .select()
          .single()
        
        if (calError) throw calError
        calendar = newCalendar
      }

      const eventsToUpsert = items.map((item: any) => {
        const start = item.start.dateTime || item.start.date;
        const end = item.end.dateTime || item.end.date;
        return {
          user_id: user.id,
          calendar_id: calendar.id,
          google_event_id: item.id,
          title: item.summary || 'Untitled',
          description: item.description || '',
          location: item.location || '',
          start_time: start,
          end_time: end,
          is_all_day: !!item.start.date,
          status: item.status || 'confirmed',
          meeting_url: item.hangoutLink || '',
          source: 'google'
        };
      })

      if (eventsToUpsert.length > 0) {
        const { error: upsertError } = await supabaseClient
          .from('calendar_events')
          .upsert(eventsToUpsert, { onConflict: 'calendar_id, google_event_id' })

        if (upsertError) throw upsertError
      }

      return new Response(JSON.stringify({ success: true, count: items.length }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // ACTION: OAUTH EXCHANGE
    if (!code) throw new Error('No code provided')

    const client_id = Deno.env.get('VITE_GOOGLE_CLIENT_ID') || Deno.env.get('GOOGLE_CLIENT_ID')
    const client_secret = Deno.env.get('VITE_GOOGLE_CLIENT_SECRET') || Deno.env.get('GOOGLE_CLIENT_SECRET')

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code, client_id: client_id!, client_secret: client_secret!,
        redirect_uri, grant_type: 'authorization_code',
      }),
    })

    const tokens = await tokenResponse.json()
    if (tokens.error) throw new Error(tokens.error_description)

    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })
    const googleUser = await userRes.json()

    const expiresAt = new Date()
    expiresAt.setSeconds(expiresAt.getSeconds() + tokens.expires_in)

    const { error: dbError } = await supabaseClient
      .from('user_google_connections')
      .upsert({
        user_id: user.id,
        email: googleUser.email,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: expiresAt.toISOString(),
        scopes: tokens.scope.split(' '),
        updated_at: new Date().toISOString(),
      })

    if (dbError) throw dbError
    return new Response(JSON.stringify({ success: true, email: googleUser.email }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
