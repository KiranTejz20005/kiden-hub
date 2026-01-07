import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

export interface Habit {
    id: string;
    user_id: string;
    name: string;
    description?: string;
    icon?: string;
    color?: string;
    goal: number;
    unit?: string;
    target_time?: string;
    is_active: boolean;
    created_at: string;
}

export interface HabitLog {
    id: string;
    habit_id: string;
    value: number;
    date: string;
}

const STORAGE_KEY_HABITS = 'kiden_guest_habits';
const STORAGE_KEY_LOGS = 'kiden_guest_habit_logs';

export function useHabits() {
    const { user } = useAuth();
    const [habits, setHabits] = useState<Habit[]>([]);
    const [logs, setLogs] = useState<HabitLog[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchHabits = useCallback(async () => {
        setLoading(true);
        if (!user) {
            // Guest: Load from LocalStorage
            try {
                const storedHabits = localStorage.getItem(STORAGE_KEY_HABITS);
                const storedLogs = localStorage.getItem(STORAGE_KEY_LOGS);
                if (storedHabits) setHabits(JSON.parse(storedHabits));
                if (storedLogs) setLogs(JSON.parse(storedLogs));
            } catch (e) {
                console.error("Failed to load local habits", e);
            }
            setLoading(false);
            return;
        }

        try {
            // Auth: Fetch Habits
            const { data: habitsData, error: habitsError } = await supabase
                .from('habits')
                .select('*')
                .eq('user_id', user.id)
                .eq('is_active', true);

            if (habitsError) throw habitsError;
            setHabits(habitsData || []);

            // Auth: Fetch Recent Logs (last 30 days)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const { data: logsData, error: logsError } = await supabase
                .from('habit_logs')
                .select('*')
                .eq('user_id', user.id)
                .gte('date', thirtyDaysAgo.toISOString().split('T')[0]);

            if (!logsError) {
                setLogs(logsData || []);
            }

        } catch (error) {
            console.warn('Error fetching habits:', error);
            toast.error("Failed to sync habits");
        } finally {
            setLoading(false);
        }
    }, [user]);

    const createHabit = async (habitData: Partial<Habit>) => {
        const tempId = uuidv4();
        const newHabit: Habit = {
            id: tempId,
            user_id: user?.id || 'guest',
            name: habitData.name || 'New Habit',
            description: habitData.description || '',
            icon: habitData.icon || 'Target',
            color: habitData.color || '#3b82f6',
            goal: habitData.goal || 1,
            unit: habitData.unit || 'times',
            is_active: true,
            created_at: new Date().toISOString()
        };

        // Optimistic Update
        const updatedHabits = [...habits, newHabit];
        setHabits(updatedHabits);

        if (!user) {
            localStorage.setItem(STORAGE_KEY_HABITS, JSON.stringify(updatedHabits));
            toast.success('Habit created (Local)');
            return;
        }

        try {
            const { id: _, ...payload } = newHabit; // Exclude local ID to let DB generate one
            // Actually, we can let DB generate ID or use ours. Supabase defaults usually create uuid.
            // But if we want to matching optimistic ID, we can force it if RLS/schema allows.
            // Safer to simple insert payload without ID and update local state.

            const { data, error } = await supabase
                .from('habits')
                .insert({
                    user_id: user.id,
                    name: newHabit.name,
                    description: newHabit.description,
                    icon: newHabit.icon,
                    color: newHabit.color,
                    goal: newHabit.goal,
                    unit: newHabit.unit,
                    is_active: true
                })
                .select()
                .single();

            if (error) throw error;

            // Replace temp ID with real one
            setHabits(prev => prev.map(h => h.id === tempId ? (data as Habit) : h));
            toast.success('Habit created');

        } catch (error) {
            console.error('Create habit error:', error);
            toast.error('Failed to save habit to cloud');
            // Keep local version but warn
        }
    };

    const logHabit = async (habitId: string, value: number = 1, date: string = new Date().toISOString().split('T')[0]) => {
        const newLog = {
            id: uuidv4(),
            habit_id: habitId,
            value,
            date,
            user_id: user?.id || 'guest'
        };

        // Optimistic
        const updatedLogs = [...logs, newLog]; // Simple append, might need dedupe logic for UI if we strictly sum
        setLogs(updatedLogs);

        if (!user) {
            // For Guest, we need to be smarter: if log exists for date, update it.
            const existingIndex = logs.findIndex(l => l.habit_id === habitId && l.date === date);
            let finalLogs;
            if (existingIndex >= 0) {
                const updated = [...logs];
                updated[existingIndex].value += value;
                finalLogs = updated;
            } else {
                finalLogs = [...logs, newLog];
            }
            setLogs(finalLogs);
            localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(finalLogs));
            toast.success('Habit logged (Local)');
            return;
        }

        try {
            // Upsert mechanism for Server
            const { data: existing } = await supabase
                .from('habit_logs')
                .select('id, value')
                .eq('habit_id', habitId)
                .eq('date', date)
                .maybeSingle(); // Use maybeSingle to avoid 406 on zero rows

            if (existing) {
                await supabase
                    .from('habit_logs')
                    .update({ value: existing.value + value })
                    .eq('id', existing.id);
            } else {
                await supabase
                    .from('habit_logs')
                    .insert({ habit_id: habitId, user_id: user.id, value, date });
            }
            toast.success('Habit logged');
            // Background refresh to ensure perfect sync
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const { data: freshLogs } = await supabase
                .from('habit_logs')
                .select('*')
                .eq('user_id', user.id)
                .gte('date', thirtyDaysAgo.toISOString().split('T')[0]);
            if (freshLogs) setLogs(freshLogs);

        } catch (error) {
            console.error(error);
            toast.error('Failed to sync log');
        }
    };

    useEffect(() => {
        fetchHabits();
    }, [user, fetchHabits]);

    return {
        habits,
        logs,
        loading,
        createHabit,
        logHabit,
        refreshHabits: fetchHabits
    };
}
