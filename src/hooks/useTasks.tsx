import { useState, useEffect, useCallback } from 'react';
import { Task } from '@/lib/types';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY_TASKS = 'kiden_guest_tasks';

export function useTasks(projectId?: string) {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    const fetchTasks = useCallback(async () => {
        setLoading(true);
        try {
            const stored = localStorage.getItem(STORAGE_KEY_TASKS);
            if (stored) {
                const parsed = JSON.parse(stored) as Task[];
                const filtered = projectId 
                    ? parsed.filter(t => t.project_id === projectId)
                    : parsed;
                setTasks(filtered);
            } else {
                setTasks([]);
            }
        } catch (e) {
            console.error("Failed to load tasks", e);
            setTasks([]);
        }
        setLoading(false);
    }, [projectId]);

    const saveToStorage = (updatedTasks: Task[]) => {
        // Get all tasks, update the ones for current filter
        const stored = localStorage.getItem(STORAGE_KEY_TASKS);
        let allTasks = stored ? JSON.parse(stored) as Task[] : [];
        
        if (projectId) {
            // Replace tasks for this project only
            allTasks = allTasks.filter(t => t.project_id !== projectId);
            allTasks = [...allTasks, ...updatedTasks];
        } else {
            allTasks = updatedTasks;
        }
        
        localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(allTasks));
    };

    const createTask = async (task: Partial<Task>) => {
        const newTask: Task = {
            id: uuidv4(),
            user_id: user?.id || 'guest',
            title: task.title || 'New Task',
            description: task.description || null,
            status: task.status || 'todo',
            priority: task.priority || 'medium',
            project_id: task.project_id || projectId || null,
            due_date: task.due_date || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const updatedTasks = [newTask, ...tasks];
        setTasks(updatedTasks);
        saveToStorage(updatedTasks);
        toast.success('Task created');
    };

    const updateTask = async (id: string, updates: Partial<Task>) => {
        const updatedTasks = tasks.map(t => 
            t.id === id ? { ...t, ...updates, updated_at: new Date().toISOString() } : t
        );
        setTasks(updatedTasks);
        saveToStorage(updatedTasks);
    };

    const deleteTask = async (id: string) => {
        const updatedTasks = tasks.filter(t => t.id !== id);
        setTasks(updatedTasks);
        saveToStorage(updatedTasks);
        toast.success('Task deleted');
    };

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    return {
        tasks,
        loading,
        createTask,
        updateTask,
        deleteTask,
        refreshTasks: fetchTasks
    };
}
