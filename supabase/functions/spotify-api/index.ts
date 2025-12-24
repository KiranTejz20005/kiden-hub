import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, accessToken, playlistId, limit = 50, offset = 0 } = await req.json();
    console.log('Spotify API action:', action);

    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: 'Access token required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };

    if (action === 'getProfile') {
      console.log('Fetching user profile');
      const response = await fetch('https://api.spotify.com/v1/me', { headers });
      const data = await response.json();
      
      if (data.error) {
        console.error('Profile fetch error:', data.error);
        return new Response(
          JSON.stringify({ error: data.error.message }),
          { status: data.error.status || 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify(data),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'getPlaylists') {
      console.log('Fetching user playlists');
      const response = await fetch(
        `https://api.spotify.com/v1/me/playlists?limit=${limit}&offset=${offset}`,
        { headers }
      );
      const data = await response.json();
      
      if (data.error) {
        console.error('Playlists fetch error:', data.error);
        return new Response(
          JSON.stringify({ error: data.error.message }),
          { status: data.error.status || 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify(data),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'getPlaylistTracks') {
      console.log('Fetching playlist tracks for:', playlistId);
      const response = await fetch(
        `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=${limit}&offset=${offset}`,
        { headers }
      );
      const data = await response.json();
      
      if (data.error) {
        console.error('Tracks fetch error:', data.error);
        return new Response(
          JSON.stringify({ error: data.error.message }),
          { status: data.error.status || 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify(data),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'getLikedSongs') {
      console.log('Fetching liked songs');
      const response = await fetch(
        `https://api.spotify.com/v1/me/tracks?limit=${limit}&offset=${offset}`,
        { headers }
      );
      const data = await response.json();
      
      if (data.error) {
        console.error('Liked songs fetch error:', data.error);
        return new Response(
          JSON.stringify({ error: data.error.message }),
          { status: data.error.status || 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify(data),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Spotify API error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
