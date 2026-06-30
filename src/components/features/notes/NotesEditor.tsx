import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Note } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import NoteSidebar from './NoteSidebar';
import NoteHeader from './NoteHeader';
import BlockEditor from './BlockEditor';
import { TemplateGallery } from './TemplateGallery';
import { Loader2, FileText, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const NotesEditor = () => {
  const { user } = useAuth();
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);
  const activeNoteRef = useRef<Note | null>(null);

  // Sync ref with state for the timer to avoid stale closures
  useEffect(() => {
    activeNoteRef.current = activeNote;
  }, [activeNote]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      try {
        // Specifically select columns to avoid potential 406 errors with select(*)
        const { data, error } = await supabase
          .from('profiles')
          .select('display_name, avatar_url, bio, focus_settings')
          .eq('id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Profile fetch error:', error);
          // If 406, it might be a specific column issue, try minimal select
          if (error.code === '406' || error.message?.includes('406')) {
            const { data: minimalData } = await supabase
              .from('profiles')
              .select('display_name')
              .eq('id', user.id)
              .maybeSingle();
            if (minimalData) setProfile(minimalData);
            return;
          }
          throw error;
        }

        if (data) {
          setProfile(data);
        } else {
          console.warn('No profile found, creating default for user:', user.id);
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert([{ id: user.id, user_id: user.id, display_name: user.email?.split('@')[0] }])
            .select('display_name, avatar_url, bio, focus_settings')
            .maybeSingle();
          if (newProfile) setProfile(newProfile);
          if (createError) console.error('Failed to auto-create profile:', createError);
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
      }
    };
    fetchProfile();
  }, [user]);

  const saveNote = useCallback(async (noteToSave: Note) => {
    if (!user) return;
    setIsSaving(true);
    try {
      // Ensure we are only sending fields that exist in the DB
      // AND handle content stringification as a fallback for 400 errors
      const updatePayload: any = {
        title: noteToSave.title || 'Untitled Note',
        content: noteToSave.content,
        icon: noteToSave.icon,
        cover_image: noteToSave.cover_image,
        is_favorite: !!noteToSave.is_favorite,
        is_full_width: !!noteToSave.is_full_width,
        word_count: noteToSave.word_count || 0,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('notes')
        .update(updatePayload)
        .eq('id', noteToSave.id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Initial save failed, trying minimal payload:', error);
        
        // Final fallback: Send only core fields
        const { error: finalError } = await supabase
          .from('notes')
          .update({
            title: noteToSave.title || 'Untitled Note',
            content: noteToSave.content,
            updated_at: new Date().toISOString()
          })
          .eq('id', noteToSave.id)
          .eq('user_id', user.id);
        
        if (finalError) throw finalError;
      }
    } catch (err: any) {
      console.error('Failed to save note:', err);
      toast.error(`Failed to save changes: ${err.message || 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  }, [user]);

  const handleUpdateNote = (updates: Partial<Note>) => {
    if (!activeNote) return;
    const updatedNote = { ...activeNote, ...updates };
    setActiveNote(updatedNote);

    // Debounced autosave using the ref to ensure we always have the latest state
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      if (activeNoteRef.current) {
        saveNote(activeNoteRef.current);
      }
    }, 1500);
  };

  const handleCreateNote = async (folderId?: string, templateContent?: any, templateTitle?: string) => {
    if (!user) return;
    const { data } = await supabase
      .from('notes')
      .insert([{ 
        user_id: user.id, 
        title: templateTitle || 'Untitled Note', 
        content: templateContent || { type: 'doc', content: [] },
        folder_id: folderId
      }])
      .select().single();
    
    if (data) {
      setActiveNote(data);
      toast.success(templateTitle ? `Created from template` : 'Note instantiated');
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
                  onChange={(content, wordCount) => handleUpdateNote({ content, word_count: wordCount })}
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
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12 gap-8">
            <div className="space-y-6">
              <div className="w-20 h-20 rounded-3xl bg-white/[0.03] border border-white/10 flex items-center justify-center mx-auto shadow-2xl">
                <FileText className="w-10 h-10 text-white/30" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-white tracking-tighter">Notes Hub</h2>
                <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.3em] leading-loose max-w-[280px] mx-auto">
                  Select a note to begin or create a new one.
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button 
                onClick={() => handleCreateNote()} 
                className="h-12 px-8 rounded-2xl bg-white text-black hover:bg-white/90 font-black uppercase tracking-[0.25em] text-[10px] shadow-2xl shadow-white/5 active:scale-95 transition-all"
              >
                New Note
              </Button>
              <Button
                onClick={() => setShowTemplates(true)}
                variant="outline"
                className="h-12 px-8 rounded-2xl border-white/10 bg-white/[0.03] text-white/60 hover:bg-white/[0.06] hover:text-white font-bold uppercase tracking-[0.15em] text-[10px] transition-all"
              >
                <Sparkles className="w-3.5 h-3.5 mr-2 text-amber-400" />
                Templates
              </Button>
            </div>

            <TemplateGallery
              isOpen={showTemplates}
              onClose={() => setShowTemplates(false)}
              onSelectTemplate={(tpl) => {
                setShowTemplates(false);
                handleCreateNote(undefined, tpl.content, tpl.name);
              }}
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default NotesEditor;
