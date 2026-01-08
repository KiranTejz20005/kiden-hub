import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Workspace, Collection } from '@/lib/types';

interface WorkspaceContextType {
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  collections: Collection[];
  activeCollection: Collection | null;
  setActiveWorkspace: (workspace: Workspace) => void;
  setActiveCollection: (collection: Collection | null) => void;
  refreshWorkspaces: () => Promise<void>;
  refreshCollections: () => Promise<void>;
  loading: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

const MOCK_WORKSPACES: Workspace[] = [
  { id: '1', name: 'Personal', icon: '🏠', user_id: 'guest', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '2', name: 'Work', icon: '💼', user_id: 'guest', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '3', name: 'Projects', icon: '🚀', user_id: 'guest', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

export const WorkspaceProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const userId = user?.id;
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [activeCollection, setActiveCollection] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshWorkspaces = useCallback(async () => {
    // FALLBACK: If no user, show mocks immediately
    if (!userId) {
      setWorkspaces(MOCK_WORKSPACES);
      // Only set active workspace if not already set, to avoid trashing user selection
      setActiveWorkspace(prev => prev || MOCK_WORKSPACES[0]);
      return;
    }

    // Fetch workspaces the user owns
    const { data: ownedWorkspaces, error: ownedError } = await supabase
      .from('workspaces')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    // Fetch workspace IDs where user is a member
    const { data: memberWorkspaces } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', userId)
      .not('accepted_at', 'is', null);

    let allWorkspaces: Workspace[] = ownedWorkspaces || [];

    // Fetch full workspace data for member workspaces
    if (memberWorkspaces && memberWorkspaces.length > 0) {
      const memberWorkspaceIds = memberWorkspaces.map(m => m.workspace_id);
      const { data: sharedWorkspaces } = await supabase
        .from('workspaces')
        .select('*')
        .in('id', memberWorkspaceIds);

      if (sharedWorkspaces) {
        // Filter out duplicates (in case user owns and is member of same workspace)
        const existingIds = new Set(allWorkspaces.map(w => w.id));
        const uniqueShared = sharedWorkspaces.filter(w => !existingIds.has(w.id));
        allWorkspaces = [...allWorkspaces, ...uniqueShared];
      }
    }

    if (!ownedError) {
      if (allWorkspaces.length === 0) {
        // Inject mocks if visible workspaces are empty
        setWorkspaces(MOCK_WORKSPACES);
        setActiveWorkspace(prev => prev || MOCK_WORKSPACES[0]);
      } else {
        setWorkspaces(allWorkspaces);
        setActiveWorkspace(prev => prev || allWorkspaces[0]);
      }
    } else {
      // On error, also inject mocks (robustness)
      setWorkspaces(MOCK_WORKSPACES);
      setActiveWorkspace(prev => prev || MOCK_WORKSPACES[0]);
    }
  }, [userId]);

  const refreshCollections = useCallback(async () => {
    if (!userId || !activeWorkspace) return;

    // Fetch collections for the active workspace (RLS handles access control)
    const { data, error } = await supabase
      .from('collections')
      .select('*')
      .eq('workspace_id', activeWorkspace.id)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setCollections(data);
    }
  }, [userId, activeWorkspace]);

  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      await refreshWorkspaces();
      setLoading(false);
    };

    initialize();
  }, [refreshWorkspaces]);

  useEffect(() => {
    if (activeWorkspace) {
      refreshCollections();
      setActiveCollection(null);
    }
  }, [activeWorkspace, refreshCollections]);

  // Set up realtime subscriptions
  useEffect(() => {
    if (!userId) return;

    const workspaceChannel = supabase
      .channel('workspace-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workspaces',
          filter: `user_id=eq.${userId}`
        },
        () => {
          refreshWorkspaces();
        }
      )
      .subscribe();

    const collectionChannel = supabase
      .channel('collection-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'collections',
          filter: `user_id=eq.${userId}`
        },
        () => {
          refreshCollections();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(workspaceChannel);
      supabase.removeChannel(collectionChannel);
    };
  }, [userId, refreshWorkspaces, refreshCollections]);

  return (
    <WorkspaceContext.Provider value={{
      workspaces,
      activeWorkspace,
      collections,
      activeCollection,
      setActiveWorkspace,
      setActiveCollection,
      refreshWorkspaces,
      refreshCollections,
      loading
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};
