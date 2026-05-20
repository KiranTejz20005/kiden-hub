import { supabase } from '@/integrations/supabase/client';
import { FocusSession } from '@/lib/types';

export interface DailyFocusStat {
  date: string;
  total_minutes: number;
  session_count: number;
}

export const createFocusSession = async (
  userId: string,
  session: Omit<FocusSession, 'id' | 'started_at'>
): Promise<FocusSession | null> => {
  const { data, error } = await supabase
    .from('focus_sessions' as any)
    .insert([{ ...session, user_id: userId, started_at: new Date().toISOString() }])
    .select()
    .single();
  if (error) { console.error('createFocusSession:', error); return null; }
  return data as unknown as FocusSession;
};

export const completeFocusSession = async (
  sessionId: string,
  userId: string,
  durationMinutes: number
): Promise<void> => {
  const { error } = await supabase
    .from('focus_sessions' as any)
    .update({ ended_at: new Date().toISOString(), completed: true, duration_minutes: durationMinutes })
    .eq('id', sessionId)
    .eq('user_id', userId);
  if (error) console.error('completeFocusSession:', error);
};

export const fetchRecentFocusSessions = async (
  userId: string,
  limit = 10
): Promise<FocusSession[]> => {
  const { data, error } = await supabase
    .from('focus_sessions' as any)
    .select('*')
    .eq('user_id', userId)
    .order('started_at', { ascending: false })
    .limit(limit);
  if (error) { console.error('fetchRecentFocusSessions:', error); return []; }
  return (data as unknown as FocusSession[]) || [];
};

export const fetchTodayFocusMinutes = async (userId: string): Promise<number> => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const { data, error } = await supabase
    .from('focus_sessions' as any)
    .select('duration_minutes')
    .eq('user_id', userId)
    .eq('completed', true)
    .gte('started_at', todayStart.toISOString());
  if (error) { console.error('fetchTodayFocusMinutes:', error); return 0; }
  return (data as any[])?.reduce((acc: number, s: any) => acc + (s.duration_minutes || 0), 0) || 0;
};

export const fetchWeeklyFocusStats = async (userId: string): Promise<DailyFocusStat[]> => {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const { data, error } = await supabase
    .from('focus_sessions' as any)
    .select('started_at, duration_minutes')
    .eq('user_id', userId)
    .eq('completed', true)
    .gte('started_at', weekAgo.toISOString())
    .order('started_at', { ascending: true });
  if (error) { console.error('fetchWeeklyFocusStats:', error); return []; }

  const map: Record<string, DailyFocusStat> = {};
  (data as any[])?.forEach((s: any) => {
    const date = s.started_at.slice(0, 10);
    if (!map[date]) map[date] = { date, total_minutes: 0, session_count: 0 };
    map[date].total_minutes += s.duration_minutes || 0;
    map[date].session_count += 1;
  });
  return Object.values(map);
};
