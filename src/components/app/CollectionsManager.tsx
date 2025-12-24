import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Folder, ChevronRight, MoreHorizontal, Pencil, Trash2, X, FolderOpen } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Collection, Workspace } from '@/lib/types';
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

interface CollectionsManagerProps {
  workspace: Workspace | null;
  activeCollection: Collection | null;
  onCollectionChange: (collection: Collection | null) => void;
  isCollapsed?: boolean;
}

const COLOR_OPTIONS = [
  { name: 'Emerald', value: '#10B981' },
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Yellow', value: '#EAB308' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Teal', value: '#14B8A6' },
];

const ICON_OPTIONS = ['📂', '📁', '📚', '🎯', '💡', '🚀', '📝', '🔖', '📌', '⭐'];

const CollectionsManager = ({ 
  workspace, 
  activeCollection, 
  onCollectionChange,
  isCollapsed 
}: CollectionsManagerProps) => {
  const { user } = useAuth();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('📂');
  const [newColor, setNewColor] = useState('#10B981');
  const [editName, setEditName] = useState('');
  const [editIcon, setEditIcon] = useState('');
  const [editColor, setEditColor] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && workspace) {
      fetchCollections();
    }
  }, [user, workspace]);

  const fetchCollections = async () => {
    if (!user || !workspace) return;
    
    const { data, error } = await supabase
      .from('collections')
      .select('*')
      .eq('user_id', user.id)
      .eq('workspace_id', workspace.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Failed to load collections:', error);
      return;
    }

    setCollections(data || []);
  };

  const createCollection = async () => {
    if (!user || !workspace || !newName.trim()) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('collections')
      .insert({
        user_id: user.id,
        workspace_id: workspace.id,
        name: newName.trim(),
        icon: newIcon,
        color: newColor
      })
      .select()
      .single();

    if (error) {
      toast.error('Failed to create collection');
    } else {
      toast.success('Collection created!');
      setCollections([...collections, data]);
      setNewName('');
      setNewIcon('📂');
      setNewColor('#10B981');
      setIsCreating(false);
    }
    setLoading(false);
  };

  const updateCollection = async (id: string) => {
    if (!editName.trim()) return;

    setLoading(true);
    const { error } = await supabase
      .from('collections')
      .update({ name: editName.trim(), icon: editIcon, color: editColor })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update collection');
    } else {
      toast.success('Collection updated!');
      setCollections(collections.map(c => 
        c.id === id ? { ...c, name: editName.trim(), icon: editIcon, color: editColor } : c
      ));
      if (activeCollection?.id === id) {
        onCollectionChange({ ...activeCollection, name: editName.trim(), icon: editIcon, color: editColor });
      }
      setIsEditing(null);
    }
    setLoading(false);
  };

  const deleteCollection = async (id: string) => {
    const { error } = await supabase
      .from('collections')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete collection');
    } else {
      toast.success('Collection deleted');
      setCollections(collections.filter(c => c.id !== id));
      if (activeCollection?.id === id) {
        onCollectionChange(null);
      }
    }
  };

  const startEdit = (collection: Collection) => {
    setIsEditing(collection.id);
    setEditName(collection.name);
    setEditIcon(collection.icon);
    setEditColor(collection.color);
  };

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  if (isCollapsed) {
    return (
      <div className="space-y-1">
        {collections.slice(0, 5).map(collection => (
          <motion.button
            key={collection.id}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onCollectionChange(collection)}
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-colors",
              activeCollection?.id === collection.id 
                ? "ring-2 ring-primary bg-primary/10" 
                : "hover:bg-secondary"
            )}
            style={{ backgroundColor: `${collection.color}20` }}
          >
            {collection.icon}
          </motion.button>
        ))}
        <motion.button
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsCreating(true)}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
        >
          <Plus className="w-5 h-5" />
        </motion.button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs tracking-widest text-muted-foreground">COLLECTIONS</span>
        <motion.button 
          whileHover={{ scale: 1.1, rotate: 90 }} 
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsCreating(true)}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <Plus className="w-4 h-4" />
        </motion.button>
      </div>

      {/* "All Notes" option */}
      <motion.button
        whileHover={{ x: 4 }}
        onClick={() => onCollectionChange(null)}
        className={cn(
          "w-full flex items-center gap-2 p-2 rounded-lg text-sm transition-colors text-left",
          activeCollection === null 
            ? "bg-primary/10 text-primary" 
            : "hover:bg-secondary text-muted-foreground hover:text-foreground"
        )}
      >
        <FolderOpen className="w-4 h-4" />
        <span>All Notes</span>
      </motion.button>

      {/* Collections List */}
      <div className="space-y-1">
        {collections.map((collection, index) => (
          <motion.div
            key={collection.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            {isEditing === collection.id ? (
              <div className="p-3 rounded-lg bg-secondary/30 border border-border space-y-3">
                <div className="flex gap-1 flex-wrap">
                  {ICON_OPTIONS.map(icon => (
                    <button
                      key={icon}
                      onClick={() => setEditIcon(icon)}
                      className={cn(
                        "w-6 h-6 rounded text-sm hover:bg-secondary",
                        editIcon === icon && "ring-1 ring-primary"
                      )}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
                <div className="flex gap-1 flex-wrap">
                  {COLOR_OPTIONS.map(color => (
                    <button
                      key={color.value}
                      onClick={() => setEditColor(color.value)}
                      className={cn(
                        "w-6 h-6 rounded-full",
                        editColor === color.value && "ring-2 ring-offset-2 ring-offset-background ring-foreground"
                      )}
                      style={{ backgroundColor: color.value }}
                    />
                  ))}
                </div>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="h-8 text-sm"
                />
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    className="flex-1 h-7 text-xs"
                    onClick={() => updateCollection(collection.id)}
                    disabled={loading}
                  >
                    Save
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-7"
                    onClick={() => setIsEditing(null)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="group flex items-center">
                <motion.button
                  whileHover={{ x: 4 }}
                  onClick={() => onCollectionChange(collection)}
                  className={cn(
                    "flex-1 flex items-center gap-2 p-2 rounded-lg text-sm transition-colors text-left",
                    activeCollection?.id === collection.id 
                      ? "bg-primary/10 text-foreground" 
                      : "hover:bg-secondary text-muted-foreground hover:text-foreground"
                  )}
                >
                  <div 
                    className="w-5 h-5 rounded flex items-center justify-center text-xs"
                    style={{ backgroundColor: `${collection.color}30` }}
                  >
                    {collection.icon}
                  </div>
                  <span className="flex-1 truncate">{collection.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {collection.item_count || 0}
                  </span>
                </motion.button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreHorizontal className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => startEdit(collection)}>
                      <Pencil className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => deleteCollection(collection.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Create New Collection */}
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
                {ICON_OPTIONS.map(icon => (
                  <motion.button
                    key={icon}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setNewIcon(icon)}
                    className={cn(
                      "w-7 h-7 rounded text-sm hover:bg-secondary transition-colors",
                      newIcon === icon && "ring-2 ring-primary"
                    )}
                  >
                    {icon}
                  </motion.button>
                ))}
              </div>
              <div className="flex gap-1 flex-wrap">
                {COLOR_OPTIONS.map(color => (
                  <motion.button
                    key={color.value}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setNewColor(color.value)}
                    className={cn(
                      "w-6 h-6 rounded-full transition-transform",
                      newColor === color.value && "ring-2 ring-offset-2 ring-offset-background ring-foreground scale-110"
                    )}
                    style={{ backgroundColor: color.value }}
                  />
                ))}
              </div>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Collection name..."
                className="h-9"
                onKeyDown={(e) => e.key === 'Enter' && createCollection()}
              />
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  className="flex-1"
                  onClick={createCollection}
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

      {collections.length === 0 && !isCreating && (
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-muted-foreground text-center py-4"
        >
          No collections yet. Create one to organize your notes!
        </motion.p>
      )}
    </div>
  );
};

export default CollectionsManager;
