import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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

export const WorkspaceProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [activeCollection, setActiveCollection] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshWorkspaces = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('workspaces')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setWorkspaces(data);
      if (!activeWorkspace && data.length > 0) {
        setActiveWorkspace(data[0]);
      }
    }
  };

  const refreshCollections = async () => {
    if (!user || !activeWorkspace) return;
    
    const { data, error } = await supabase
      .from('collections')
      .select('*')
      .eq('user_id', user.id)
      .eq('workspace_id', activeWorkspace.id)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setCollections(data);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      if (user) {
        setLoading(true);
        await refreshWorkspaces();
        setLoading(false);
      } else {
        setWorkspaces([]);
        setActiveWorkspace(null);
        setCollections([]);
        setActiveCollection(null);
        setLoading(false);
      }
    };
    
    initialize();
  }, [user]);

  useEffect(() => {
    if (activeWorkspace) {
      refreshCollections();
      setActiveCollection(null);
    }
  }, [activeWorkspace]);

  // Set up realtime subscriptions
  useEffect(() => {
    if (!user) return;

    const workspaceChannel = supabase
      .channel('workspace-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workspaces',
          filter: `user_id=eq.${user.id}`
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
          filter: `user_id=eq.${user.id}`
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
  }, [user, activeWorkspace]);

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
