import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import {
  Plus, Search, Trash2, MoreVertical, FileText,
  Star, ChevronRight, ChevronDown, Folder, FolderOpen,
  Settings, History, Share2, MoreHorizontal, Pencil,
  Copy, Trash, Move, Pin, Archive, PlusCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { Note, NoteFolder } from '@/lib/types';

interface NoteSidebarProps {
  activeNoteId: string | null;
  onNoteSelect: (note: Note) => void;
  onNewNote: (folderId?: string) => void;
  onDeleteNote: (id: string) => void;
  onToggleFavorite: (note: Note) => void;
  onDuplicateNote: (note: Note) => void;
}

const NoteSidebar = ({
  activeNoteId,
  onNoteSelect,
  onNewNote,
  onDeleteNote,
  onToggleFavorite,
  onDuplicateNote
}: NoteSidebarProps) => {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<NoteFolder[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set());
  const [sidebarWidth, setSidebarWidth] = useState(260);
  const [isResizing, setIsResizing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [notesRes, foldersRes] = await Promise.all([
        supabase.from('notes').select('*').eq('user_id', user.id).eq('is_deleted', false).order('updated_at', { ascending: false }),
        supabase.from('note_folders').select('*').eq('user_id', user.id).order('name')
      ]);

      if (notesRes.data) setNotes(notesRes.data);
      if (foldersRes.data) {
        setFolders(foldersRes.data);
        const collapsed = new Set(foldersRes.data.filter(f => f.is_collapsed).map(f => f.id));
        setCollapsedFolders(collapsed);
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Real-time sync
  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel('note-sidebar-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notes', filter: `user_id=eq.${user.id}` }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'note_folders', filter: `user_id=eq.${user.id}` }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, fetchData]);

  const toggleFolder = (id: string) => {
    setCollapsedFolders(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    // Update in DB (fire and forget)
    supabase.from('note_folders').update({ is_collapsed: !collapsedFolders.has(id) }).eq('id', id);
  };

  const handleCreateFolder = async (parentId?: string) => {
    if (!user) return;
    const { data } = await supabase.from('note_folders').insert([{ 
      user_id: user.id, 
      name: 'New Folder',
      parent_id: parentId
    }]).select().single();
    if (data) {
      setFolders(prev => [...prev, data]);
      toast.success('Folder created');
    }
  };

  const deleteFolder = async (id: string) => {
    const { error } = await supabase.from('note_folders').delete().eq('id', id);
    if (!error) {
      setFolders(prev => prev.filter(f => f.id !== id));
      toast.success('Folder deleted');
    }
  };

  const startResizing = () => setIsResizing(true);
  const stopResizing = () => setIsResizing(false);
  const resize = (e: MouseEvent) => {
    if (isResizing) {
      const newWidth = Math.max(200, Math.min(450, e.clientX));
      setSidebarWidth(newWidth);
    }
  };

  useEffect(() => {
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResizing);
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [isResizing]);

  const favorites = notes.filter(n => n.is_favorite);
  const filteredNotes = notes.filter(n => 
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (n.content_text && n.content_text.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const renderNoteItem = (note: Note) => (
    <motion.div
      key={note.id}
      initial={{ opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        "group relative flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer transition-all",
        activeNoteId === note.id ? "bg-white/5 border border-white/10 shadow-lg" : "hover:bg-white/[0.02]"
      )}
      onClick={() => onNoteSelect(note)}
    >
      <div className="w-6 h-6 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-sm shrink-0">
        {note.icon || '📝'}
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn("text-xs font-bold truncate", activeNoteId === note.id ? "text-white" : "text-white/40 group-hover:text-white/60")}>
          {note.title || 'Untitled'}
        </p>
        <p className="text-[10px] text-muted-foreground/80 mt-0.5 font-medium">
          {formatDistanceToNow(new Date(note.updated_at), { addSuffix: true })}
        </p>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(note); }}
          className={cn("p-1 rounded-md hover:bg-white/10 transition-colors", note.is_favorite ? "text-white" : "text-white/20")}
        >
          <Star className="w-3 h-3" fill={note.is_favorite ? "currentColor" : "none"} />
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1 rounded-md hover:bg-white/10 text-muted-foreground" onClick={e => e.stopPropagation()}>
              <MoreHorizontal className="w-3 h-3" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuItem onClick={() => onDuplicateNote(note)}><Copy className="w-4 h-4 mr-2" /> Duplicate</DropdownMenuItem>
            <DropdownMenuItem><Move className="w-4 h-4 mr-2" /> Move to Folder</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onToggleFavorite(note)}><Star className="w-4 h-4 mr-2" /> {note.is_favorite ? 'Unfavorite' : 'Favorite'}</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={() => onDeleteNote(note.id)}><Trash className="w-4 h-4 mr-2" /> Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );

  const renderFolder = (folder: NoteFolder, level = 0) => {
    const isCollapsed = collapsedFolders.has(folder.id);
    const childFolders = folders.filter(f => f.parent_id === folder.id);
    const folderNotes = filteredNotes.filter(n => n.folder_id === folder.id);

    return (
      <div key={folder.id} className="space-y-0.5">
        <div 
          className={cn(
            "group flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-white/5 transition-all",
            level > 0 && "ml-4"
          )}
        >
          <button onClick={() => toggleFolder(folder.id)} className="p-0.5 rounded-md hover:bg-white/10 text-muted-foreground">
            {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          <div className="flex items-center gap-2 flex-1 min-w-0" onClick={() => toggleFolder(folder.id)}>
            {isCollapsed ? <Folder className="w-4 h-4 text-white/40" /> : <FolderOpen className="w-4 h-4 text-white/40" />}
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 group-hover:text-white/60 truncate">{folder.name}</span>
          </div>
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => onNewNote(folder.id)} className="p-1 rounded-md hover:bg-white/10 text-muted-foreground"><Plus className="w-3 h-3" /></button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-1 rounded-md hover:bg-white/10 text-muted-foreground"><MoreHorizontal className="w-3 h-3" /></button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuItem onClick={() => handleCreateFolder(folder.id)}><PlusCircle className="w-4 h-4 mr-2" /> New Subfolder</DropdownMenuItem>
                <DropdownMenuItem><Pencil className="w-4 h-4 mr-2" /> Rename</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={() => deleteFolder(folder.id)}><Trash className="w-4 h-4 mr-2" /> Delete Folder</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {!isCollapsed && (
          <div className="space-y-0.5">
            {childFolders.map(child => renderFolder(child, level + 1))}
            {folderNotes.map(note => (
              <div key={note.id} className="ml-6">
                {renderNoteItem(note)}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const orphanNotes = filteredNotes.filter(n => !n.folder_id);

  return (
    <aside 
      style={{ width: sidebarWidth }}
      className="relative border-r border-border/50 flex flex-col bg-card/20 backdrop-blur-xl shrink-0 select-none group"
    >
      <div className="p-5 border-b border-border/30 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20">Notes Base</h2>
          <button 
            onClick={() => onNewNote()} 
            className="p-2 rounded-lg bg-white/5 border border-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all active:scale-95"
            title="New Note"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40" />
          <Input
            placeholder="Search Notes..."
            className="h-10 pl-9 bg-white/5 border-white/5 text-[13px] rounded-xl placeholder:text-muted-foreground/20 focus:ring-1 focus:ring-primary/30 transition-all"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <ScrollArea className="flex-1 p-3">
        <div className="space-y-6">
          {/* Favourites Section */}
          {favorites.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 px-2 py-1 mb-1">
                <Star className="w-3.5 h-3.5 text-white/40" fill="none" />
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20">Pinned</span>
              </div>
              {favorites.map(renderNoteItem)}
            </div>
          )}

          {/* Root Content */}
          <div className="space-y-1">
            <div className="flex items-center justify-between px-2 py-1 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Workspace</span>
              <button onClick={() => handleCreateFolder()} className="p-1 rounded-md hover:bg-white/10 text-muted-foreground transition-all">
                <Plus className="w-3 h-3" />
              </button>
            </div>
            
            <div className="space-y-1">
              {folders.filter(f => !f.parent_id).map(f => renderFolder(f))}
              {orphanNotes.map(renderNoteItem)}
            </div>
          </div>
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-border/30 bg-white/[0.02]">
        <div className="flex items-center justify-between px-2 mb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">{notes.length} Active Notes</span>
          <button className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 hover:text-red-400 transition-colors flex items-center gap-1">
            <Trash2 className="w-3 h-3" /> Trash
          </button>
        </div>
      </div>

      {/* Resize Handle */}
      <div 
        onMouseDown={startResizing}
        className="absolute right-0 top-0 w-1 h-full cursor-col-resize hover:bg-primary/50 transition-colors z-50"
      />
    </aside>
  );
};

export default NoteSidebar;
