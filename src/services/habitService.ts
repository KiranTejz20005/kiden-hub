import { supabase } from '@/integrations/supabase/client';
import { Habit, HabitLog } from '@/lib/types';

export const fetchHabits = async (userId: string): Promise<Habit[]> => {
  const { data, error } = await supabase
    .from('habits' as any)
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: true });
  if (error) { console.error('fetchHabits:', error); return []; }
  return (data as unknown as Habit[]) || [];
};

export const createHabit = async (
  userId: string,
  habit: Omit<Habit, 'id' | 'user_id' | 'created_at' | 'current' | 'completed'>
): Promise<Habit | null> => {
  const { data, error } = await supabase
    .from('habits' as any)
    .insert([{ ...habit, user_id: userId }])
    .select()
    .single();
  if (error) { console.error('createHabit:', error); return null; }
  return data as unknown as Habit;
};

export const updateHabit = async (
  habitId: string,
  userId: string,
  updates: Partial<Habit>
): Promise<void> => {
  const { error } = await supabase
    .from('habits' as any)
    .update(updates)
    .eq('id', habitId)
    .eq('user_id', userId);
  if (error) {console.error('updateHabit:', error);}
};

export const deleteHabit = async (habitId: string, userId: string): Promise<void> => {
  const { error } = await supabase
    .from('habits' as any)
    .update({ is_active: false })
    .eq('id', habitId)
    .eq('user_id', userId);
  if (error) {console.error('deleteHabit:', error);}
};

export const fetchTodayLogs = async (userId: string): Promise<HabitLog[]> => {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from('habit_logs' as any)
    .select('*')
    .eq('user_id', userId)
    .eq('date', today);
  if (error) { console.error('fetchTodayLogs:', error); return []; }
  return (data as unknown as HabitLog[]) || [];
};

export const logHabit = async (
  userId: string,
  habitId: string,
  value: number
): Promise<HabitLog | null> => {
  const today = new Date().toISOString().slice(0, 10);
  // Upsert: update if already logged today, insert otherwise
  const { data, error } = await supabase
    .from('habit_logs' as any)
    .upsert([{
      user_id: userId,
      habit_id: habitId,
      value,
      date: today,
      completed_at: new Date().toISOString()
    }], { onConflict: 'user_id,habit_id,date' })
    .select()
    .single();
  if (error) { console.error('logHabit:', error); return null; }
  return data as unknown as HabitLog;
};

export const fetchHabitStreaks = async (userId: string, habitId: string): Promise<number> => {
  const { data, error } = await supabase
    .from('habit_logs' as any)
    .select('date, value')
    .eq('user_id', userId)
    .eq('habit_id', habitId)
    .order('date', { ascending: false })
    .limit(60);
  if (error || !data) {return 0;}

  let streak = 0;
  const today = new Date();
  for (let i = 0; i < (data as any[]).length; i++) {
    const d = new Date((data as any[])[i].date);
    const diffDays = Math.round((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === i && (data as any[])[i].value > 0) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
};

export const fetchHeatmapData = async (
  userId: string,
  habitId: string,
  days = 90
): Promise<HabitLog[]> => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const { data, error } = await supabase
    .from('habit_logs' as any)
    .select('*')
    .eq('user_id', userId)
    .eq('habit_id', habitId)
    .gte('date', startDate.toISOString().slice(0, 10))
    .order('date', { ascending: true });
  if (error) { console.error('fetchHeatmapData:', error); return []; }
  return (data as unknown as HabitLog[]) || [];
};
