import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Note } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import NoteSidebar from './NoteSidebar';
import NoteHeader from './NoteHeader';
import BlockEditor from './BlockEditor';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const NotesEditor = () => {
  const { user } = useAuth();
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (data) setProfile(data);
    };
    fetchProfile();
  }, [user]);

  const saveNote = useCallback(async (noteToSave: Note) => {
    if (!user) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('notes')
        .update({
          title: noteToSave.title,
          content: noteToSave.content,
          icon: noteToSave.icon,
          cover_image: noteToSave.cover_image,
          is_favorite: noteToSave.is_favorite,
          is_full_width: noteToSave.is_full_width,
          updated_at: new Date().toISOString(),
        })
        .eq('id', noteToSave.id)
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (err) {
      console.error('Failed to save note:', err);
      toast.error('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  }, [user]);

  const handleUpdateNote = (updates: Partial<Note>) => {
    if (!activeNote) return;
    const updatedNote = { ...activeNote, ...updates };
    setActiveNote(updatedNote);

    // Debounced autosave
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => saveNote(updatedNote), 1500);
  };

  const handleCreateNote = async (folderId?: string) => {
    if (!user) return;
    const { data, error } = await supabase
      .from('notes')
      .insert([{ 
        user_id: user.id, 
        title: 'Untitled Note', 
        content: { type: 'doc', content: [] },
        folder_id: folderId
      }])
      .select().single();
    
    if (data) {
      setActiveNote(data);
      toast.success('Note instantiated');
    } else {
      toast.error('Failed to create note');
    }
  };

  const handleDeleteNote = async (id: string) => {
    const { error } = await supabase.from('notes').update({ is_deleted: true, deleted_at: new Date().toISOString() }).eq('id', id);
    if (!error) {
      toast.success('Note moved to trash');
      if (activeNote?.id === id) setActiveNote(null);
    }
  };

  const handleToggleFavorite = (note: Note) => {
    handleUpdateNote({ is_favorite: !note.is_favorite });
  };

  const handleDuplicateNote = async (note: Note) => {
    if (!user) return;
    const { data } = await supabase
      .from('notes')
      .insert([{ 
        user_id: user.id, 
        title: `${note.title} (Copy)`, 
        content: note.content,
        icon: note.icon,
        cover_image: note.cover_image,
        folder_id: note.folder_id
      }])
      .select().single();
    if (data) {
      setActiveNote(data);
      toast.success('Note duplicated');
    }
  };

  const copyNoteLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success('Note link copied to clipboard');
  };

  return (
    <div className="flex h-full bg-[#050505] overflow-hidden rounded-2xl border border-white/5">
      <NoteSidebar 
        activeNoteId={activeNote?.id || null}
        onNoteSelect={setActiveNote}
        onNewNote={handleCreateNote}
        onDeleteNote={handleDeleteNote}
        onToggleFavorite={handleToggleFavorite}
        onDuplicateNote={handleDuplicateNote}
      />

      <main className="flex-1 flex flex-col min-w-0 bg-background relative overflow-hidden">
        {activeNote ? (
          <div className="flex-1 flex flex-col min-h-0 overflow-y-auto scrollbar-hide">
            <NoteHeader 
              note={activeNote}
              profile={profile}
              onUpdate={handleUpdateNote}
              onDelete={() => handleDeleteNote(activeNote.id)}
              onDuplicate={() => handleDuplicateNote(activeNote)}
              onToggleFavorite={() => handleToggleFavorite(activeNote)}
              onCopyLink={copyNoteLink}
            />
            
            <div className="flex-1 pb-32">
              <div className={cn(
                "mx-auto transition-all duration-500",
                activeNote.is_full_width ? "w-full" : "max-w-4xl"
              )}>
                <BlockEditor 
                  content={activeNote.content}
                  onChange={(content) => handleUpdateNote({ content })}
                  isFullWidth={activeNote.is_full_width}
                />
              </div>
            </div>

            {/* Save Status Indicator */}
            <div className="fixed bottom-6 right-6 z-50">
              <AnimatePresence>
                {isSaving && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-[10px] font-bold uppercase tracking-widest text-primary shadow-2xl"
                  >
                    <Loader2 className="w-3 h-3 animate-spin" /> Synchronizing...
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12 gap-6">
            <div className="w-24 h-24 rounded-[2.5rem] bg-primary/5 border border-primary/10 flex items-center justify-center shadow-inner">
              <div className="w-16 h-16 rounded-[1.8rem] bg-primary/10 flex items-center justify-center text-primary shadow-2xl">
                <Loader2 className="w-8 h-8 animate-pulse" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white tracking-tight">Intelligence Matrix</h2>
              <p className="text-muted-foreground text-sm max-w-xs mx-auto leading-relaxed">
                Select a research node to begin or initialize a new intelligence unit.
              </p>
            </div>
            <Button onClick={() => handleCreateNote()} className="h-11 px-8 rounded-xl bg-white text-black hover:bg-white/90 font-bold uppercase tracking-wider text-xs shadow-xl active:scale-95 transition-all">
              Initialize New Node
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default NotesEditor;
