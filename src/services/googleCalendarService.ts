import { supabase } from '@/integrations/supabase/client';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
// Dynamically determine redirect URI based on environment
const GOOGLE_REDIRECT_URI = `${window.location.origin}/auth/callback/google`;

export const googleCalendarService = {
  /**
   * Generates the Google OAuth URL for calendar access
   */
  getConnectUrl: () => {
    const scopes = [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ];

    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID || '',
      redirect_uri: GOOGLE_REDIRECT_URI || '',
      response_type: 'code',
      scope: scopes.join(' '),
      access_type: 'offline',
      prompt: 'consent',
      state: 'kiden_hub_calendar_sync',
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  },

  /**
   * Checks if the user has an active Google Calendar connection
   */
  getConnectionStatus: async (userId: string) => {
    const { data, error } = await supabase
      .from('user_google_connections' as any)
      .select('email, updated_at')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) return null;
    return data;
  },

  /**
   * Disconnects the user's Google Calendar
   */
  disconnect: async (userId: string) => {
    const { error } = await supabase
      .from('user_google_connections' as any)
      .delete()
      .eq('user_id', userId);

    if (error) throw error;
    return true;
  },

  /**
   * Fetches events from Supabase (synced from Google)
   */
  getEvents: async (userId: string, start: Date, end: Date) => {
    const { data, error } = await supabase
      .from('calendar_events' as any)
      .select('*')
      .eq('user_id', userId)
      .gte('start_time', start.toISOString())
      .lte('end_time', end.toISOString());

    if (error) throw error;
    return data || [];
  },

  /**
   * Triggers a sync with Google (Edge Function would be best for this)
   */
  sync: async () => {
    // In a real app, this would call a Supabase Edge Function to:
    // 1. Refresh the Google access token
    // 2. Fetch new/updated events from Google
    // 3. Update the Supabase database
    console.log('Syncing with Google Calendar...');
    // Mocking a successful sync call
    const { data, error } = await supabase.functions.invoke('google-calendar-sync');
    return { data, error };
  }
};
