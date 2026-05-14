import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import {
  Plus, Search, Trash2, MoreVertical, FileText,
  Save, Bold, Italic, List, Heading1, Heading2, Code, Loader2, Star, Hash, PanelLeftClose, PanelRightClose, Columns2, 
  ChevronRight, Share2, Star as StarOutline, Link as LinkIcon, Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import BlockEditor from './BlockEditor';

type ViewMode = 'edit' | 'preview' | 'split';

const NotesEditor = () => {
  const { user } = useAuth();
  const [notes, setNotes] = useState<any[]>([]);
  const [activeNote, setActiveNote] = useState<any>(null);
  const [content, setContent] = useState<any>('');
  const [title, setTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Prevent tab refresh refetch spam
  const fetchInProgressRef = useRef(false);
  const lastFetchTimeRef = useRef(0);
  const FETCH_COOLDOWN = 5 * 60 * 1000; // 5 minutes
  
  const fetchNotes = useCallback(async () => {
    if (fetchInProgressRef.current) return;
    const now = Date.now();
    if (now - lastFetchTimeRef.current < FETCH_COOLDOWN) return;
    
    if (!user) return;
    fetchInProgressRef.current = true;
    try {
      const { data } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
      if (data) {
        setNotes(data);
        lastFetchTimeRef.current = now;
      }
    } finally {
      fetchInProgressRef.current = false;
    }
  }, [user]);

  useEffect(() => {
    if (user && notes.length === 0) fetchNotes();
  }, [user]);
  
  // Refetch only on tab visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') fetchNotes();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user]);
  
  // Real-time sync: Subscribe to note updates
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`notes-updates-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notes', filter: `user_id=eq.${user.id}` },
        (payload) => {
          setNotes(prev => prev.map(n => n.id === payload.new.id ? payload.new : n));
          if (activeNote?.id === payload.new.id) setActiveNote(payload.new);
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notes', filter: `user_id=eq.${user.id}` },
        (payload) => {
          setNotes(prev => [payload.new, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, activeNote?.id]);

  useEffect(() => {
    if (activeNote) {
      setTitle(activeNote.title || '');
      const raw = activeNote.content;
      // If it's a string (old markdown), wrap it in a basic TipTap structure if possible, 
      // but TipTap handles HTML/Text well too.
      setContent(raw || '');
    } else {
      setTitle('');
      setContent('');
    }
    setLastSaved(null);
  }, [activeNote?.id]);

  const saveNote = useCallback(async (newContent?: string, newTitle?: string) => {
    if (!activeNote || !user) return;
    if (isSaving) return;
    setIsSaving(true);
    const c = newContent ?? content;
    const t = newTitle ?? title;
    try {
      const { error } = await supabase
        .from('notes')
        .update({
          content: c,
          title: t,
          updated_at: new Date().toISOString(),
        })
        .eq('id', activeNote.id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error saving note:', error);
        throw error;
      }

      setLastSaved(new Date());
      const updatedNote = { ...activeNote, title: t, content: c, updated_at: new Date().toISOString() };
      
      // Update both the list and the active note state
      setNotes(prev => prev.map(n => n.id === activeNote.id ? updatedNote : n));
      setActiveNote(updatedNote);
    } catch (err) {
      console.error('Failed to save note:', err);
      toast.error('Failed to save note');
    } finally {
      setIsSaving(false);
    }
  }, [activeNote, user, content, title]);

  // Debounced autosave — 1.5 s after user stops typing
  useEffect(() => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    if (activeNote && (content !== (activeNote.content || '') || title !== activeNote.title)) {
      autoSaveTimer.current = setTimeout(() => saveNote(), 1500);
    }
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
  }, [content, title]);

  const handleCreateNote = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('notes')
      .insert([{ user_id: user.id, title: 'Untitled Note', content: '' }])
      .select().single();
    if (data) {
      setNotes(prev => [data, ...prev]);
      setActiveNote(data);
      setTimeout(() => textareaRef.current?.focus(), 100);
    } else {
      console.error('Failed to create note:', error);
      toast.error('Failed to create note');
    }
  };

  const deleteNote = async (id: string) => {
    await supabase.from('notes').delete().eq('id', id);
    toast.success('Note deleted');
    if (activeNote?.id === id) setActiveNote(null);
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  const toggleFavorite = async (note: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const newVal = !note.is_favorite;
    await supabase.from('notes').update({ is_favorite: newVal }).eq('id', note.id);
    setNotes(prev => prev.map(n => n.id === note.id ? { ...n, is_favorite: newVal } : n));
    if (activeNote?.id === note.id) {
      setActiveNote({ ...activeNote, is_favorite: newVal });
    }
    toast.success(newVal ? 'Added to favorites' : 'Removed from favorites');
  };

  const duplicateNote = async (note: any) => {
    if (!user) return;
    const { data, error } = await supabase
      .from('notes')
      .insert([{ 
        user_id: user.id, 
        title: `${note.title} (Copy)`, 
        content: note.content,
        icon: note.icon
      }])
      .select().single();
    if (data) {
      setNotes(prev => [data, ...prev]);
      setActiveNote(data);
      toast.success('Note duplicated');
    } else {
      toast.error('Failed to duplicate note');
    }
  };

  const copyNoteLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success('Note link copied to clipboard');
  };

  const handleShare = () => {
    toast.info('Sharing options coming soon!', {
      description: 'Public link sharing will be available in V1.1'
    });
  };


  const filteredNotes = notes.filter(n =>
    n.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-full bg-background overflow-hidden rounded-2xl border border-border/50">

      {/* ── Notes Sidebar ── */}
      <div className="w-[260px] border-r border-border/50 flex flex-col bg-card/30 backdrop-blur-sm shrink-0">
        <div className="p-4 border-b border-border/50 space-y-3">
          <button
            onClick={handleCreateNote}
            className="w-full flex items-center gap-2.5 h-10 px-4 rounded-xl bg-gradient-primary text-white font-semibold text-sm hover:opacity-90 transition-all shadow-lg shadow-primary/20 active:scale-95"
          >
            <Plus className="w-4 h-4" /> New Note
          </button>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Search notes..."
              className="pl-9 h-9 bg-background/40 border-border/40 text-sm"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-0.5">
            <AnimatePresence>
              {filteredNotes.map(note => (
                <motion.button
                  key={note.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  onClick={() => setActiveNote(note)}
                  className={cn(
                    'w-full text-left px-3 py-2.5 rounded-xl transition-all flex items-start gap-2.5 group',
                    activeNote?.id === note.id
                      ? 'bg-primary/10 border border-primary/20'
                      : 'hover:bg-secondary/40'
                  )}
                >
                  <div className="w-7 h-7 rounded-lg bg-secondary/50 flex items-center justify-center shrink-0 mt-0.5 text-base">
                    {note.icon || '📝'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-xs font-semibold truncate', activeNote?.id === note.id ? 'text-primary' : 'text-foreground')}>
                      {note.title || 'Untitled'}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {formatDistanceToNow(new Date(note.updated_at), { addSuffix: true })}
                    </p>
                  </div>
                  <button
                    onClick={e => toggleFavorite(note, e)}
                    className={cn('opacity-0 group-hover:opacity-100 shrink-0 p-1 rounded-lg transition-all', note.is_favorite ? 'opacity-100 text-amber-400' : 'text-muted-foreground hover:text-amber-400')}
                  >
                    <Star className="w-3 h-3" fill={note.is_favorite ? 'currentColor' : 'none'} />
                  </button>
                </motion.button>
              ))}
            </AnimatePresence>
            {filteredNotes.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-10">
                {searchQuery ? 'No notes match your search.' : 'No notes yet.'}
              </p>
            )}
          </div>
        </ScrollArea>

        <div className="p-3 border-t border-border/50">
          <p className="text-[10px] text-muted-foreground text-center">{notes.length} note{notes.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* ── Editor Panel ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {!activeNote ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col items-center justify-center text-center p-12 gap-5"
          >
            <div className="w-20 h-20 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <FileText className="w-10 h-10 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-1 text-gradient">Notes Taking</h2>
              <p className="text-muted-foreground text-sm max-w-xs">Select a note to start editing, or create a new one.</p>
            </div>
            <button onClick={handleCreateNote} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-primary text-white font-semibold text-sm hover:opacity-90 transition-all shadow-lg shadow-primary/20 active:scale-95">
              <Plus className="w-4 h-4" /> Create First Note
            </button>
          </motion.div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0">

            {/* ── Notion-style Top Nav ── */}
            <div className="h-11 border-b border-border/30 flex items-center justify-between px-4 bg-background/50 backdrop-blur-md shrink-0">
              {/* Breadcrumbs */}
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium overflow-hidden">
                <span className="hover:text-foreground cursor-pointer transition-colors shrink-0">Notes Taking</span>
                <ChevronRight className="w-3 h-3 shrink-0 opacity-40" />
                <div className="flex items-center gap-1.5 hover:bg-secondary/50 px-1.5 py-0.5 rounded transition-colors cursor-pointer min-w-0">
                  <Lock className="w-3 h-3 shrink-0 text-amber-500/70" />
                  <span className="truncate text-foreground/80">{title || 'Untitled Note'}</span>
                </div>
              </div>

              {/* Top Right Actions */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground/60 font-medium mr-2">
                  {isSaving ? (
                    <span className="flex items-center gap-1"><Loader2 className="w-2.5 h-2.5 animate-spin" />Saving…</span>
                  ) : (
                    <span>Edited {formatDistanceToNow(new Date(activeNote.updated_at), { addSuffix: true })}</span>
                  )}
                </div>
                
                <button 
                  onClick={handleShare}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-md hover:bg-secondary text-[11px] font-semibold text-muted-foreground transition-all"
                >
                  <Share2 className="w-3.5 h-3.5" /> Share
                </button>

                <div className="w-px h-4 bg-border/40 mx-1" />

                <button 
                  onClick={copyNoteLink}
                  className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground transition-all"
                  title="Copy Link"
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                </button>
                <button 
                  onClick={e => toggleFavorite(activeNote, e)} 
                  className={cn("p-1.5 rounded-md hover:bg-secondary transition-all", activeNote.is_favorite ? "text-amber-400" : "text-muted-foreground")}
                  title={activeNote.is_favorite ? "Remove from favorites" : "Add to favorites"}
                >
                  <Star className="w-3.5 h-3.5" fill={activeNote.is_favorite ? "currentColor" : "none"} />
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground transition-all"><MoreVertical className="w-3.5 h-3.5" /></button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => duplicateNote(activeNote)}>
                      <Save className="w-4 h-4 mr-2" /> Duplicate Note
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => deleteNote(activeNote.id)} className="text-destructive">
                      <Trash2 className="w-4 h-4 mr-2" /> Delete Note
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* ── Main Content Area with Scroll Indicator ── */}
            <div className="flex-1 overflow-hidden relative flex bg-[#050505]/20">
              <ScrollArea className="flex-1" id="notes-content-scroll">
                <div className="max-w-4xl mx-auto min-h-full py-12 px-12 md:px-20">
                  {/* Title Area */}
                  <div className="flex items-center gap-4 mb-8 group">
                    <div className="w-14 h-14 rounded-2xl bg-secondary/50 flex items-center justify-center text-3xl shrink-0 group-hover:bg-secondary transition-all shadow-sm">
                      {activeNote.icon || '📝'}
                    </div>
                    <input
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      onBlur={() => saveNote()}
                      className="flex-1 bg-transparent border-none focus:outline-none text-4xl font-black tracking-tight placeholder:text-muted-foreground/20 min-w-0 text-foreground"
                      placeholder="Note title"
                    />
                  </div>

                  <BlockEditor 
                    content={content} 
                    onChange={(newContent) => setContent(newContent)} 
                  />
                </div>
              </ScrollArea>

              {/* Side Navigation Dots (Notion-style TOC indicator) */}
              <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col gap-1.5 py-4 px-1 opacity-20 hover:opacity-100 transition-opacity pointer-events-none md:pointer-events-auto z-10">
                {[...Array(24)].map((_, i) => (
                  <button 
                    key={i} 
                    onClick={() => {
                      const el = document.querySelector('#notes-content-scroll [data-radix-scroll-area-viewport]');
                      if (el) el.scrollTo({ top: (el.scrollHeight / 24) * i, behavior: 'smooth' });
                    }}
                    className={cn(
                      "group relative flex items-center justify-center transition-all",
                      i % 4 === 0 ? "h-6 w-6" : "h-3 w-3"
                    )}
                  >
                    <div className={cn(
                      "rounded-full transition-all group-hover:bg-primary/80 group-hover:scale-125", 
                      i % 4 === 0 ? "w-5 h-0.5 bg-foreground/40" : "w-3 h-0.5 bg-foreground/20"
                    )} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotesEditor;
