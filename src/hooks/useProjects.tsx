import { useState, useEffect, useCallback } from 'react';
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
        try {
            const stored = localStorage.getItem(STORAGE_KEY_PROJECTS);
            if (stored) {
                setProjects(JSON.parse(stored));
            } else {
                setProjects([]);
            }
        } catch (e) {
            console.error("Failed to load projects", e);
            setProjects([]);
        }
        setLoading(false);
    }, []);

    const createProject = async (project: Partial<Project>) => {
        const newProject: Project = {
            id: uuidv4(),
            user_id: user?.id || 'guest',
            name: project.name || 'New Project',
            description: project.description || '',
            color: project.color || '#10B981',
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const updatedProjects = [newProject, ...projects];
        setProjects(updatedProjects);
        localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(updatedProjects));
        toast.success('Project created');
    };

    const updateProject = async (id: string, updates: Partial<Project>) => {
        const updatedProjects = projects.map(p => 
            p.id === id ? { ...p, ...updates, updated_at: new Date().toISOString() } : p
        );
        setProjects(updatedProjects);
        localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(updatedProjects));
    };

    const deleteProject = async (id: string) => {
        const updatedProjects = projects.filter(p => p.id !== id);
        setProjects(updatedProjects);
        localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(updatedProjects));
        toast.success('Project deleted');
    };

    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    return {
        projects,
        loading,
        createProject,
        updateProject,
        deleteProject,
        refreshProjects: fetchProjects
    };
}
