import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { FocusSession } from '@/lib/types';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export function useFocusSessions() {
    const { user } = useAuth();
    const [sessions, setSessions] = useState<FocusSession[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchSessions = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('focus_sessions')
                .select('*')
                .eq('user_id', user.id)
                .order('started_at', { ascending: false });

            if (error) throw error;
            setSessions(data || []);
        } catch (error) {
            console.error('Error fetching sessions:', error);
            toast.error('Failed to load focus history');
        } finally {
            setLoading(false);
        }
    }, [user]);

    const createSession = async (session: Partial<FocusSession>) => {
        if (!user) return;
        setLoading(true);
        try {
            const { error } = await supabase
                .from('focus_sessions')
                .insert({
                    ...session,
                    user_id: user.id
                });

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error creating session:', error);
            toast.error('Failed to save session');
            return false;
        } finally {
            setLoading(false);
        }
    };

    const updateSession = async (id: string, updates: Partial<FocusSession>) => {
        try {
            const { error } = await supabase
                .from('focus_sessions')
                .update(updates)
                .eq('id', id);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error updating session:', error);
            toast.error('Failed to update session');
            return false;
        }
    };

    useEffect(() => {
        if (user) {
            fetchSessions();
        }
    }, [user, fetchSessions]);

    return {
        sessions,
        fetchSessions,
        createSession,
        updateSession,
        loading
    };
}
