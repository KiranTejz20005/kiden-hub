import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Task } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY_TASKS = 'kiden_guest_tasks';

export function useTasks(projectId?: string) {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const { toast } = useToast();

    const fetchTasks = useCallback(async () => {
        setLoading(true);
        if (!user) {
            // Guest Mode: Load from LocalStorage
            try {
                const stored = localStorage.getItem(STORAGE_KEY_TASKS);
                if (stored) {
                    const parsed = JSON.parse(stored);
                    setTasks(parsed);
                }
            } catch (e) {
                console.error("Failed to load local tasks", e);
            }
            setLoading(false);
            return;
        }

        try {
            let query = supabase
                .from('tasks')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (projectId) {
                query = query.eq('project_id', projectId);
            }

            const { data, error } = await query;

            if (error) {
                console.warn('Tasks fetch warning:', error.message);
            } else {
                setTasks((data as Task[]) || []);
            }
        } catch (error: unknown) {
            console.warn('Error fetching tasks:', error);
        } finally {
            setLoading(false);
        }
    }, [user, projectId]);

    const createTask = async (task: Partial<Task>) => {
        const tempId = uuidv4();
        const newTask = {
            ...task,
            id: tempId,
            user_id: user?.id || 'guest',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            status: task.status || 'todo',
            priority: task.priority || 'medium',
            title: task.title || 'New Task'
        } as Task;

        // Optimistic
        const updatedTasks = [newTask, ...tasks];
        setTasks(updatedTasks);

        if (!user || user.id.startsWith('guest')) {
            localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(updatedTasks));
            toast({ title: 'Task created', description: 'Saved locally' });
            return;
        }

        try {
            const { id: _, ...taskPayload } = task;

            const payload = {
                user_id: user.id,
                title: task.title || 'New Task',
                description: task.description || null,
                priority: task.priority || 'medium',
                status: task.status || 'todo',
                project_id: task.project_id || null,
                due_date: task.due_date || null
            };

            const { data, error } = await supabase
                .from('tasks')
                .insert(payload)
                .select()
                .single();

            if (error) throw error;

            setTasks(prev => prev.map(t => t.id === tempId ? (data as Task) : t));
            toast({ title: 'Task saved' });

        } catch (error: unknown) {
            console.error('Error creating task:', error);
            const msg = (error as { message?: string })?.message || 'Unknown error';
            toast({ title: 'Sync Failed', description: msg, variant: 'destructive' });
        }
    };

    const updateTask = async (id: string, updates: Partial<Task>) => {
        const updatedTasks = tasks.map(t => t.id === id ? { ...t, ...updates } : t);
        setTasks(updatedTasks);

        if (!user || user.id.startsWith('guest')) {
            localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(updatedTasks));
            return;
        }

        try {
            const { error } = await supabase
                .from('tasks')
                .update(updates)
                .eq('id', id);

            if (error) throw error;
        } catch (error: unknown) {
            console.error("Failed to update on server", error);
        }
    };

    const deleteTask = async (id: string) => {
        const updatedTasks = tasks.filter(t => t.id !== id);
        setTasks(updatedTasks);

        if (!user || user.id.startsWith('guest')) {
            localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(updatedTasks));
            toast({ title: 'Task deleted' });
            return;
        }

        try {
            const { error } = await supabase
                .from('tasks')
                .delete()
                .eq('id', id);

            if (error) throw error;
            toast({ title: 'Task deleted' });
        } catch (error: unknown) {
            console.error("Failed to delete on server", error);
        }
    };

    useEffect(() => {
        fetchTasks();

        if (!user) return;

        const channel = supabase
            .channel(`tasks-changes-${projectId || 'all'}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'tasks',
                    filter: projectId
                        ? `user_id=eq.${user.id} AND project_id=eq.${projectId}`
                        : `user_id=eq.${user.id}`,
                },
                () => fetchTasks() // Simple refresh on any change
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, projectId, fetchTasks]);

    return {
        tasks,
        loading,
        createTask,
        updateTask,
        deleteTask,
        refreshTasks: fetchTasks
    };
}
