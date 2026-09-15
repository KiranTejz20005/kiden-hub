import { supabase } from '@/integrations/supabase/client';
import { FocusSession } from '@/lib/types';

export interface DailyFocusStat {
  date: string;
  total_minutes: number;
  session_count: number;
}

export interface ActiveTimerState {
  sessionId?: string;
  sessionType: 'focus' | 'short_break' | 'long_break';
  totalDurationSeconds: number;
  remainingSeconds: number;
  targetEndTime: number; // timestamp ms
  startTime: number;     // timestamp ms
  isRunning: boolean;
}

export const getLocalActiveTimer = (userId: string): ActiveTimerState | null => {
  try {
    const raw = localStorage.getItem(`kiden_active_timer_${userId}`);
    if (!raw) return null;
    return JSON.parse(raw) as ActiveTimerState;
  } catch {
    return null;
  }
};

export const setLocalActiveTimer = (userId: string, state: ActiveTimerState | null): void => {
  try {
    if (!state) {
      localStorage.removeItem(`kiden_active_timer_${userId}`);
    } else {
      localStorage.setItem(`kiden_active_timer_${userId}`, JSON.stringify(state));
    }
  } catch {
    // Ignore storage quota errors
  }
};

export const fetchActiveFocusSession = async (
  userId: string
): Promise<FocusSession | null> => {
  try {
    const { data, error } = await supabase
      .from('focus_sessions' as any)
      .select('*')
      .eq('user_id', userId)
      .eq('completed', false)
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.warn('fetchActiveFocusSession error:', error);
      return null;
    }
    return (data as unknown as FocusSession) || null;
  } catch (err) {
    console.error('fetchActiveFocusSession exception:', err);
    return null;
  }
};

export const createFocusSession = async (
  userId: string,
  session: Omit<FocusSession, 'id' | 'started_at' | 'user_id'>
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
  if (error) {console.error('completeFocusSession:', error);}
};

export const cancelFocusSession = async (
  sessionId: string,
  userId: string
): Promise<void> => {
  const { error } = await supabase
    .from('focus_sessions' as any)
    .delete()
    .eq('id', sessionId)
    .eq('user_id', userId)
    .eq('completed', false);
  if (error) { console.error('cancelFocusSession:', error); }
};

export const fetchRecentFocusSessions = async (
  userId: string,
  limit = 10
): Promise<FocusSession[]> => {
  const { data, error } = await supabase
    .from('focus_sessions' as any)
    .select('*')
    .eq('user_id', userId)
    .eq('completed', true)
    .gt('duration_minutes', 0)
    .order('started_at', { ascending: false })
    .limit(limit);
  if (error) { console.error('fetchRecentFocusSessions:', error); return []; }
  return (data as unknown as FocusSession[]) || [];
};

export const logCompletedFocusSession = async (
  userId: string,
  durationMinutes: number,
  sessionType: 'work' | 'short_break' | 'long_break' | 'flow' = 'work',
  notes?: string
): Promise<FocusSession | null> => {
  const now = new Date();
  const startedAt = new Date(now.getTime() - durationMinutes * 60 * 1000).toISOString();
  const endedAt = now.toISOString();

  const { data, error } = await supabase
    .from('focus_sessions' as any)
    .insert([
      {
        user_id: userId,
        duration_minutes: durationMinutes,
        session_type: sessionType,
        completed: true,
        started_at: startedAt,
        ended_at: endedAt,
        notes: notes || null,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('logCompletedFocusSession:', error);
    return null;
  }
  return data as unknown as FocusSession;
};

export const deleteFocusSession = async (
  sessionId: string,
  userId: string
): Promise<void> => {
  const { error } = await supabase
    .from('focus_sessions' as any)
    .delete()
    .eq('id', sessionId)
    .eq('user_id', userId);
  if (error) { console.error('deleteFocusSession:', error); }
};

export const fetchTodayFocusMinutes = async (userId: string): Promise<number> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const { data, error } = await supabase
    .from('focus_sessions' as any)
    .select('started_at, duration_minutes')
    .eq('user_id', userId)
    .eq('completed', true)
    .gte('started_at', today.toISOString());
  if (error) { console.error('fetchTodayFocusMinutes:', error); return 0; }
  return (data as any[])?.reduce((acc: number, s: any) => acc + (s.duration_minutes || 0), 0) || 0;
};

export const fetchWeeklyFocusStats = async (userId: string): Promise<DailyFocusStat[]> => {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  weekAgo.setHours(0, 0, 0, 0);

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
    // Format date key using local browser calendar date (YYYY-MM-DD)
    const localDate = new Date(s.started_at).toLocaleDateString('en-CA');
    if (!map[localDate]) {
      map[localDate] = { date: localDate, total_minutes: 0, session_count: 0 };
    }
    map[localDate].total_minutes += s.duration_minutes || 0;
    map[localDate].session_count += 1;
  });
  return Object.values(map);
};

/* --- Daily Tasks Database CRUD for Focus Drawer --- */
export interface FocusTaskItem {
  id: string;
  user_id: string;
  title: string;
  status: 'todo' | 'in_progress' | 'done';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  created_at?: string;
}

export const fetchFocusTasks = async (userId: string): Promise<FocusTaskItem[]> => {
  try {
    const { data, error } = await supabase
      .from('tasks' as any)
      .select('id, user_id, title, status, priority, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('fetchFocusTasks error:', error);
      const local = localStorage.getItem(`kiden_focus_tasks_${userId}`);
      return local ? JSON.parse(local) : [];
    }
    const tasks = (data as unknown as FocusTaskItem[]) || [];
    localStorage.setItem(`kiden_focus_tasks_${userId}`, JSON.stringify(tasks));
    return tasks;
  } catch (err) {
    console.error('fetchFocusTasks exception:', err);
    const local = localStorage.getItem(`kiden_focus_tasks_${userId}`);
    return local ? JSON.parse(local) : [];
  }
};

export const createFocusTask = async (
  userId: string,
  title: string
): Promise<FocusTaskItem | null> => {
  try {
    const { data, error } = await supabase
      .from('tasks' as any)
      .insert([
        {
          user_id: userId,
          title: title.trim(),
          status: 'todo',
          priority: 'medium',
        },
      ])
      .select()
      .single();

    if (error) {
      console.warn('createFocusTask fallback to local:', error);
      const newTask: FocusTaskItem = {
        id: 'task_' + Date.now(),
        user_id: userId,
        title: title.trim(),
        status: 'todo',
        created_at: new Date().toISOString(),
      };
      const existing = await fetchFocusTasks(userId);
      const updated = [newTask, ...existing];
      localStorage.setItem(`kiden_focus_tasks_${userId}`, JSON.stringify(updated));
      return newTask;
    }
    return data as unknown as FocusTaskItem;
  } catch (err) {
    console.error('createFocusTask exception:', err);
    return null;
  }
};

export const toggleFocusTask = async (
  taskId: string,
  userId: string,
  isDone: boolean
): Promise<boolean> => {
  const newStatus = isDone ? 'done' : 'todo';
  try {
    const { error } = await supabase
      .from('tasks' as any)
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', taskId)
      .eq('user_id', userId);

    if (error) {
      console.warn('toggleFocusTask database error, updating local:', error);
    }
    // Update local cache
    const existing = await fetchFocusTasks(userId);
    const updated = existing.map((t) => (t.id === taskId ? { ...t, status: newStatus as any } : t));
    localStorage.setItem(`kiden_focus_tasks_${userId}`, JSON.stringify(updated));
    return true;
  } catch (err) {
    console.error('toggleFocusTask exception:', err);
    return false;
  }
};

export const deleteFocusTask = async (
  taskId: string,
  userId: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('tasks' as any)
      .delete()
      .eq('id', taskId)
      .eq('user_id', userId);

    if (error) {
      console.warn('deleteFocusTask database error, updating local:', error);
    }
    const existing = await fetchFocusTasks(userId);
    const updated = existing.filter((t) => t.id !== taskId);
    localStorage.setItem(`kiden_focus_tasks_${userId}`, JSON.stringify(updated));
    return true;
  } catch (err) {
    console.error('deleteFocusTask exception:', err);
    return false;
  }
};

/* --- Scratchpad Notes Database CRUD --- */
export const fetchFocusScratchpadNote = async (userId: string): Promise<string> => {
  const localKey = `kiden_focus_scratchpad_${userId}`;
  try {
    const { data, error } = await supabase
      .from('notes' as any)
      .select('id, content, title')
      .eq('user_id', userId)
      .eq('title', 'Focus Scratchpad')
      .maybeSingle();

    if (error || !data) {
      return localStorage.getItem(localKey) || '### Focus Scratchpad\n\n- Key objectives for this session\n- Distractions parked here\n';
    }
    const noteData = data as any;
    const content = typeof noteData?.content === 'string' ? noteData.content : JSON.stringify(noteData?.content || '');
    localStorage.setItem(localKey, content);
    return content;
  } catch {
    return localStorage.getItem(localKey) || '### Focus Scratchpad\n\n- Key objectives for this session\n';
  }
};

export const saveFocusScratchpadNote = async (
  userId: string,
  content: string
): Promise<void> => {
  const localKey = `kiden_focus_scratchpad_${userId}`;
  localStorage.setItem(localKey, content);

  try {
    const { data: existing } = await supabase
      .from('notes' as any)
      .select('id')
      .eq('user_id', userId)
      .eq('title', 'Focus Scratchpad')
      .maybeSingle();

    const existingNote = existing as any;
    if (existingNote?.id) {
      await supabase
        .from('notes' as any)
        .update({
          content,
          updated_at: new Date().toISOString(),
        } as any)
        .eq('id', existingNote.id)
        .eq('user_id', userId);
    } else {
      await supabase
        .from('notes' as any)
        .insert([
          {
            user_id: userId,
            title: 'Focus Scratchpad',
            content,
            is_favorite: false,
          },
        ]);
    }
  } catch (err) {
    console.error('saveFocusScratchpadNote error:', err);
  }
};
