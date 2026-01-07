import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Project } from '@/lib/types';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY_PROJECTS = 'kiden_guest_projects';

export function useProjects() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    const fetchProjects = useCallback(async () => {
        setLoading(true);
        if (!user) {
            try {
                const stored = localStorage.getItem(STORAGE_KEY_PROJECTS);
                if (stored) setProjects(JSON.parse(stored));
                else setProjects([]); // Empty for guest first load
            } catch (e) {
                console.error("Local load fail", e);
            }
            setLoading(false);
            return;
        }

        try {
            const { data, error } = await supabase
                .from('projects')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) {
                console.warn('Projects fetch warning:', error.message);
                setProjects([]); // Don't mock for Auth users, show empty
            } else {
                setProjects((data as Project[]) || []);
            }
        } catch (error: unknown) {
            console.warn('Error fetching projects:', error);
            setProjects([]);
        } finally {
            setLoading(false);
        }
    }, [user]);

    const createProject = async (project: Partial<Project>) => {
        const tempId = uuidv4();
        const newProject: Project = {
            id: tempId,
            user_id: user?.id || 'guest',
            name: project.name || 'New Project',
            color: project.color || '#10B981',
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            description: project.description || ''
        };

        const updatedProjects = [newProject, ...projects];
        setProjects(updatedProjects);

        if (!user || user.id.startsWith('guest')) {
            localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(updatedProjects));
            toast.success('Project created (Local)');
            return;
        }

        try {
            const { data, error } = await supabase
                .from('projects')
                .insert({
                    user_id: user.id,
                    name: newProject.name,
                    color: newProject.color,
                    status: newProject.status,
                    description: newProject.description
                })
                .select()
                .single();

            if (error) throw error;
            setProjects(prev => prev.map(p => p.id === tempId ? (data as Project) : p));
            toast.success('Project created');
        } catch (error: unknown) {
            console.error('Error creating project:', error);
            toast.error('Failed to create project on server');
        }
    };

    const updateProject = async (id: string, updates: Partial<Project>) => {
        const updatedProjects = projects.map(p => p.id === id ? { ...p, ...updates } : p);
        setProjects(updatedProjects);

        if (!user || user.id.startsWith('guest')) {
            localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(updatedProjects));
            return;
        }

        try {
            const { error } = await supabase
                .from('projects')
                .update(updates)
                .eq('id', id);
            if (error) throw error;
        } catch (err) {
            console.error(err);
            toast.error("Update failed");
        }
    };

    const deleteProject = async (id: string) => {
        const updatedProjects = projects.filter(p => p.id !== id);
        setProjects(updatedProjects);

        if (!user || user.id.startsWith('guest')) {
            localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(updatedProjects));
            toast.success('Project deleted');
            return;
        }

        try {
            const { error } = await supabase.from('projects').delete().eq('id', id);
            if (error) throw error;
            toast.success('Project deleted');
        } catch (err) {
            console.error(err);
            toast.error("Delete failed");
        }
    };

    useEffect(() => {
        fetchProjects();

        if (!user) return;
        const channel = supabase.channel('projects-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'projects', filter: `user_id=eq.${user.id}` }, fetchProjects)
            .subscribe();

        return () => { supabase.removeChannel(channel); };
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
