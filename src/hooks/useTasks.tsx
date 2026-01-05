import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Task } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export function useTasks(projectId?: string) {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const { toast } = useToast();

    const fetchTasks = useCallback(async () => {
        if (!user) return;
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
                // Silently handle missing table or permission errors
                console.warn('Tasks fetch warning:', error.message);
                setTasks([]);
                return;
            }
            setTasks((data as Task[]) || []);
        } catch (error: unknown) {
            // Silently log
            console.warn('Error fetching tasks:', error);
            setTasks([]);
        } finally {
            setLoading(false);
        }
    }, [user, projectId]);

    const createTask = async (task: Partial<Task>) => {
        if (!user) return;
        try {
            const { error } = await supabase
                .from('tasks')
                .insert({ ...task, user_id: user.id, title: task.title || 'New Task' });

            if (error) {
                console.warn('Task creation warning:', error.message);
                return;
            }
            toast({ title: 'Task created' });
            fetchTasks();
        } catch (error: unknown) {
            console.warn('Error creating task:', error);
        }
    };

    const updateTask = async (id: string, updates: Partial<Task>) => {
        try {
            const { error } = await supabase
                .from('tasks')
                .update(updates)
                .eq('id', id);

            if (error) throw error;
            // toast({ title: 'Task updated' }); 
            fetchTasks();
        } catch (error: unknown) {
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Failed to update task',
                variant: 'destructive'
            });
        }
    };

    const deleteTask = async (id: string) => {
        try {
            const { error } = await supabase
                .from('tasks')
                .delete()
                .eq('id', id);

            if (error) throw error;
            toast({ title: 'Task deleted' });
            fetchTasks();
        } catch (error: unknown) {
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Failed to delete task',
                variant: 'destructive'
            });
        }
    };

    useEffect(() => {
        if (!user) return;

        fetchTasks();

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
                () => {
                    fetchTasks();
                }
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
