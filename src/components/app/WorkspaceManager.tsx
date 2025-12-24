import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Folder, ChevronDown, Check, MoreHorizontal, Pencil, Trash2, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Workspace } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface WorkspaceManagerProps {
  activeWorkspace: Workspace | null;
  onWorkspaceChange: (workspace: Workspace) => void;
  isCollapsed?: boolean;
}

const EMOJI_OPTIONS = ['📁', '🏠', '💼', '🎨', '📚', '🚀', '💡', '🔬', '🎯', '🌟'];

const WorkspaceManager = ({ activeWorkspace, onWorkspaceChange, isCollapsed }: WorkspaceManagerProps) => {
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('📁');
  const [editName, setEditName] = useState('');
  const [editIcon, setEditIcon] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchWorkspaces();
    }
  }, [user]);

  const fetchWorkspaces = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('workspaces')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (error) {
      toast.error('Failed to load workspaces');
      return;
    }

    setWorkspaces(data || []);
    
    // Auto-select first workspace if none selected
    if (data && data.length > 0 && !activeWorkspace) {
      onWorkspaceChange(data[0]);
    }
  };

  const createWorkspace = async () => {
    if (!user || !newName.trim()) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('workspaces')
      .insert({
        user_id: user.id,
        name: newName.trim(),
        icon: newIcon
      })
      .select()
      .single();

    if (error) {
      toast.error('Failed to create workspace');
    } else {
      toast.success('Workspace created!');
      setWorkspaces([...workspaces, data]);
      onWorkspaceChange(data);
      setNewName('');
      setNewIcon('📁');
      setIsCreating(false);
    }
    setLoading(false);
  };

  const updateWorkspace = async (id: string) => {
    if (!editName.trim()) return;

    setLoading(true);
    const { error } = await supabase
      .from('workspaces')
      .update({ name: editName.trim(), icon: editIcon })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update workspace');
    } else {
      toast.success('Workspace updated!');
      setWorkspaces(workspaces.map(w => 
        w.id === id ? { ...w, name: editName.trim(), icon: editIcon } : w
      ));
      if (activeWorkspace?.id === id) {
        onWorkspaceChange({ ...activeWorkspace, name: editName.trim(), icon: editIcon });
      }
      setIsEditing(null);
    }
    setLoading(false);
  };

  const deleteWorkspace = async (id: string) => {
    if (workspaces.length <= 1) {
      toast.error('Cannot delete the only workspace');
      return;
    }

    const { error } = await supabase
      .from('workspaces')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete workspace');
    } else {
      toast.success('Workspace deleted');
      const remaining = workspaces.filter(w => w.id !== id);
      setWorkspaces(remaining);
      if (activeWorkspace?.id === id && remaining.length > 0) {
        onWorkspaceChange(remaining[0]);
      }
    }
  };

  const startEdit = (workspace: Workspace) => {
    setIsEditing(workspace.id);
    setEditName(workspace.name);
    setEditIcon(workspace.icon);
  };

  if (isCollapsed) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-lg"
          >
            {activeWorkspace?.icon || '📁'}
          </motion.button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="start" className="w-48">
          {workspaces.map(workspace => (
            <DropdownMenuItem
              key={workspace.id}
              onClick={() => onWorkspaceChange(workspace)}
              className={cn(
                "flex items-center gap-2",
                activeWorkspace?.id === workspace.id && "bg-primary/10"
              )}
            >
              <span>{workspace.icon}</span>
              <span>{workspace.name}</span>
              {activeWorkspace?.id === workspace.id && (
                <Check className="w-4 h-4 ml-auto text-primary" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs tracking-widest text-muted-foreground">WORKSPACE</span>
        <motion.button 
          whileHover={{ scale: 1.1, rotate: 90 }} 
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsCreating(true)}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <Plus className="w-4 h-4" />
        </motion.button>
      </div>

      {/* Workspace Selector */}
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <motion.button
            whileHover={{ scale: 1.01 }}
            className="w-full flex items-center gap-2 p-2 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors text-left"
          >
            <span className="text-lg">{activeWorkspace?.icon || '📁'}</span>
            <span className="flex-1 text-sm font-medium truncate">
              {activeWorkspace?.name || 'Select Workspace'}
            </span>
            <ChevronDown className={cn(
              "w-4 h-4 text-muted-foreground transition-transform",
              isOpen && "rotate-180"
            )} />
          </motion.button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-52" align="start">
          {workspaces.map(workspace => (
            <div key={workspace.id} className="flex items-center">
              {isEditing === workspace.id ? (
                <div className="flex-1 p-2 space-y-2">
                  <div className="flex gap-1 flex-wrap">
                    {EMOJI_OPTIONS.map(emoji => (
                      <button
                        key={emoji}
                        onClick={() => setEditIcon(emoji)}
                        className={cn(
                          "w-6 h-6 rounded text-sm hover:bg-secondary",
                          editIcon === emoji && "bg-primary/20 ring-1 ring-primary"
                        )}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="h-8 text-sm"
                    placeholder="Workspace name"
                  />
                  <div className="flex gap-1">
                    <Button 
                      size="sm" 
                      className="h-7 text-xs flex-1"
                      onClick={() => updateWorkspace(workspace.id)}
                      disabled={loading}
                    >
                      Save
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-7 text-xs"
                      onClick={() => setIsEditing(null)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <DropdownMenuItem
                    onClick={() => {
                      onWorkspaceChange(workspace);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "flex-1 flex items-center gap-2",
                      activeWorkspace?.id === workspace.id && "bg-primary/10"
                    )}
                  >
                    <span>{workspace.icon}</span>
                    <span className="flex-1">{workspace.name}</span>
                    {activeWorkspace?.id === workspace.id && (
                      <Check className="w-4 h-4 text-primary" />
                    )}
                  </DropdownMenuItem>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="right">
                      <DropdownMenuItem onClick={() => startEdit(workspace)}>
                        <Pencil className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => deleteWorkspace(workspace.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
            </div>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Create New Workspace */}
      <AnimatePresence>
        {isCreating && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-3 rounded-lg bg-secondary/30 border border-border space-y-3">
              <div className="flex gap-1 flex-wrap">
                {EMOJI_OPTIONS.map(emoji => (
                  <motion.button
                    key={emoji}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setNewIcon(emoji)}
                    className={cn(
                      "w-7 h-7 rounded text-sm hover:bg-secondary transition-colors",
                      newIcon === emoji && "bg-primary/20 ring-2 ring-primary"
                    )}
                  >
                    {emoji}
                  </motion.button>
                ))}
              </div>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Workspace name..."
                className="h-9"
                onKeyDown={(e) => e.key === 'Enter' && createWorkspace()}
              />
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  className="flex-1"
                  onClick={createWorkspace}
                  disabled={loading || !newName.trim()}
                >
                  Create
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => {
                    setIsCreating(false);
                    setNewName('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WorkspaceManager;
