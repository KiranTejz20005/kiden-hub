import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Project } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export function useProjects() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const { toast } = useToast();

    const fetchProjects = useCallback(async () => {
        if (!user) return;
        try {
            const { data, error } = await supabase
                .from('projects')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) {
                // Silently handle missing table or permission errors during initial setup
                console.warn('Projects fetch warning:', error.message);
                setProjects([]);
                return;
            }
            setProjects((data as Project[]) || []);
        } catch (error: unknown) {
            // Silently log the error - table might not exist yet
            console.warn('Error fetching projects:', error);
            setProjects([]);
        } finally {
            setLoading(false);
        }
    }, [user]);

    const createProject = async (project: Partial<Project>) => {
        if (!user) return;
        try {
            const { error } = await supabase
                .from('projects')
                .insert({ ...project, user_id: user.id, name: project.name || 'Untitled' });

            if (error) throw error;
            toast({ title: 'Project created' });
        } catch (error: unknown) {
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Failed to create project',
                variant: 'destructive'
            });
        }
    };

    const updateProject = async (id: string, updates: Partial<Project>) => {
        try {
            const { error } = await supabase
                .from('projects')
                .update(updates)
                .eq('id', id);

            if (error) throw error;
            toast({ title: 'Project updated' });
        } catch (error: unknown) {
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Failed to update project',
                variant: 'destructive'
            });
        }
    };

    const deleteProject = async (id: string) => {
        try {
            const { error } = await supabase
                .from('projects')
                .delete()
                .eq('id', id);

            if (error) throw error;
            toast({ title: 'Project deleted' });
        } catch (error: unknown) {
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Failed to delete project',
                variant: 'destructive'
            });
        }
    };

    useEffect(() => {
        if (!user) return;

        fetchProjects();

        const channel = supabase
            .channel('projects-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'projects',
                    filter: `user_id=eq.${user.id}`,
                },
                () => {
                    fetchProjects();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, fetchProjects]);

    return {
        projects,
        loading,
        createProject,
        updateProject,
        deleteProject,
        refreshProjects: fetchProjects
    };
}
