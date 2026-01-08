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
    icon: string;
    color: string;
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
    user_id?: string;
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
            // Auth: Fetch Habits from database
            const { data: habitsData, error: habitsError } = await supabase
                .from('habits')
                .select('*')
                .eq('user_id', user.id)
                .eq('is_active', true);

            if (habitsError) throw habitsError;
            
            // Map database habits to our interface with defaults
            const mappedHabits: Habit[] = (habitsData || []).map(h => ({
                id: h.id,
                user_id: h.user_id,
                name: h.name,
                icon: h.icon || 'Target',
                color: h.color || '#3b82f6',
                goal: 1, // Default goal
                is_active: h.is_active,
                created_at: h.created_at
            }));
            setHabits(mappedHabits);

            // Auth: Fetch Recent Logs (last 30 days)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const { data: logsData, error: logsError } = await supabase
                .from('habit_logs')
                .select('*')
                .eq('user_id', user.id)
                .gte('completed_date', thirtyDaysAgo.toISOString().split('T')[0]);

            if (!logsError && logsData) {
                // Map database logs to our interface
                const mappedLogs: HabitLog[] = logsData.map(l => ({
                    id: l.id,
                    habit_id: l.habit_id,
                    value: 1,
                    date: l.completed_date,
                    user_id: l.user_id
                }));
                setLogs(mappedLogs);
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
            const { data, error } = await supabase
                .from('habits')
                .insert({
                    user_id: user.id,
                    name: newHabit.name,
                    icon: newHabit.icon,
                    color: newHabit.color,
                    is_active: true
                })
                .select()
                .single();

            if (error) throw error;

            // Replace temp ID with real one
            setHabits(prev => prev.map(h => h.id === tempId ? { ...newHabit, id: data.id } : h));
            toast.success('Habit created');

        } catch (error) {
            console.error('Create habit error:', error);
            toast.error('Failed to save habit to cloud');
        }
    };

    const logHabit = async (habitId: string, value: number = 1, date: string = new Date().toISOString().split('T')[0]) => {
        const newLog: HabitLog = {
            id: uuidv4(),
            habit_id: habitId,
            value,
            date,
            user_id: user?.id || 'guest'
        };

        if (!user) {
            // For Guest, handle locally
            const existingIndex = logs.findIndex(l => l.habit_id === habitId && l.date === date);
            let finalLogs: HabitLog[];
            if (existingIndex >= 0) {
                finalLogs = logs.map((l, i) => i === existingIndex ? { ...l, value: l.value + value } : l);
            } else {
                finalLogs = [...logs, newLog];
            }
            setLogs(finalLogs);
            localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(finalLogs));
            toast.success('Habit logged (Local)');
            return;
        }

        // Optimistic update
        setLogs(prev => [...prev, newLog]);

        try {
            // Check if log exists for today
            const { data: existing } = await supabase
                .from('habit_logs')
                .select('id')
                .eq('habit_id', habitId)
                .eq('completed_date', date)
                .maybeSingle();

            if (existing) {
                // Already logged today
                toast.success('Already logged today!');
            } else {
                await supabase
                    .from('habit_logs')
                    .insert({ habit_id: habitId, user_id: user.id, completed_date: date });
                toast.success('Habit logged');
            }
            
            // Refresh to sync
            fetchHabits();

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
