import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useWorkspace } from '@/hooks/useWorkspace';
import { supabase } from '@/integrations/supabase/client';
import { Note } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import BlockEditor, { Block } from './BlockEditor';
import NotebookAI from '../ai/NotebookAI';
import CollaborativePresence from './CollaborativePresence';
import { v4 as uuidv4 } from 'uuid';
import {
  Plus, FileText, Search, Star, Archive, Trash2,
  Sparkles, Menu, X, PanelRightOpen, Wifi, Users,
  Clock, ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const Notebook = () => {
  const { user } = useAuth();
  const { activeWorkspace } = useWorkspace();
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAI, setShowAI] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [blocks, setBlocks] = useState<Block[]>([{ id: uuidv4(), type: 'paragraph', content: '' }]);
  const [isRealtime, setIsRealtime] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [lastEditedBy, setLastEditedBy] = useState<string | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isSharedWorkspace = activeWorkspace && activeWorkspace.user_id !== user?.id;

  useEffect(() => {
    if (user) fetchNotes();
  }, [user, activeWorkspace?.id]);

  // Set up real-time subscription for notes
  useEffect(() => {
    if (!user || !activeWorkspace) return;

    const channel = supabase
      .channel(`notes-realtime-${activeWorkspace.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notes',
          filter: `workspace_id=eq.${activeWorkspace.id}`
        },
        (payload) => {
          setIsRealtime(true);

          if (payload.eventType === 'INSERT') {
            const newNote = payload.new as Note;
            // Only add if not created by current user (they already have it)
            if (newNote.user_id !== user.id) {
              setNotes(prev => [newNote, ...prev]);
              toast.info('New note created by a collaborator');
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedNote = payload.new as Note;
            setNotes(prev => prev.map(n => n.id === updatedNote.id ? updatedNote : n));

            // Update selected note if it's the one being edited by collaborator
            if (selectedNote?.id === updatedNote.id && updatedNote.user_id !== user.id) {
              setSelectedNote(updatedNote);
              const content = updatedNote.content;
              if (Array.isArray(content) && content.length > 0 && content[0]?.id) {
                setBlocks(content as Block[]);
              }
              setLastEditedBy('A collaborator');
              setTimeout(() => setLastEditedBy(null), 3000);
            }
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old.id;
            setNotes(prev => prev.filter(n => n.id !== deletedId));
            if (selectedNote?.id === deletedId) {
              setSelectedNote(null);
              toast.info('This note was deleted by a collaborator');
            }
          }

          // Reset realtime indicator after a moment
          setTimeout(() => setIsRealtime(false), 2000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, activeWorkspace?.id, selectedNote?.id]);

  useEffect(() => {
    if (selectedNote) {
      const content = selectedNote.content;
      if (Array.isArray(content) && content.length > 0 && content[0]?.id) {
        setBlocks(content as Block[]);
      } else if (typeof content === 'string' && content) {
        setBlocks([{ id: uuidv4(), type: 'paragraph', content: content }]);
      } else {
        setBlocks([{ id: uuidv4(), type: 'paragraph', content: '' }]);
      }
    }
  }, [selectedNote?.id]);

  const fetchNotes = async () => {
    if (!user) return;

    let query = supabase
      .from('notes')
      .select('*')
      .eq('is_archived', false)
      .eq('is_template', false)
      .order('updated_at', { ascending: false });

    // If workspace is selected, filter by workspace
    if (activeWorkspace) {
      query = query.eq('workspace_id', activeWorkspace.id);
    } else {
      query = query.eq('user_id', user.id);
    }

    const { data, error } = await query;

    if (!error && data) {
      setNotes(data as Note[]);
      if (data.length > 0 && !selectedNote) setSelectedNote(data[0] as Note);
    }
    setLoading(false);
  };

  const createNote = async () => {
    if (!user) return;
    const newBlocks = [{ id: uuidv4(), type: 'paragraph' as const, content: '' }];
    const { data, error } = await supabase
      .from('notes')
      .insert({
        user_id: user.id,
        title: 'Untitled',
        content: newBlocks,
        workspace_id: activeWorkspace?.id || null
      })
      .select()
      .single();

    if (!error && data) {
      const newNote = data as Note;
      setNotes(prev => [newNote, ...prev]);
      setSelectedNote(newNote);
      setBlocks(newBlocks);
      setSidebarOpen(false);
      toast.success('Note created!');
    }
  };

  const updateNote = async (id: string, updates: Partial<Note>) => {
    const { error } = await supabase.from('notes').update(updates).eq('id', id);
    if (!error) {
      setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n));
      if (selectedNote?.id === id) setSelectedNote(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  // Debounced save for collaborative editing
  const saveBlocks = useCallback(async (newBlocks: Block[]) => {
    setBlocks(newBlocks);
    setIsEditing(true);

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      if (selectedNote) {
        await updateNote(selectedNote.id, { content: newBlocks as any });
        setIsEditing(false);
      }
    }, 300); // 300ms debounce for smoother real-time collaboration
  }, [selectedNote]);


  const deleteNote = async (id: string) => {
    await supabase.from('notes').delete().eq('id', id);
    setNotes(prev => prev.filter(n => n.id !== id));
    if (selectedNote?.id === id) setSelectedNote(null);
    toast.success('Note deleted');
  };

  const getPlainText = () => blocks.map(b => b.content).join('\n');

  const handleAIInsert = (text: string) => {
    const newBlock: Block = { id: uuidv4(), type: 'paragraph', content: text };
    const newBlocks = [...blocks, newBlock];
    saveBlocks(newBlocks);
    toast.success('Content inserted!');
  };

  const filteredNotes = notes.filter(n => n.title.toLowerCase().includes(searchQuery.toLowerCase()));

  // Mobile AI Panel using Sheet
  const AIPanel = () => (
    <NotebookAI
      noteContent={getPlainText()}
      noteTitle={selectedNote?.title || ''}
      onInsert={handleAIInsert}
      onClose={() => setShowAI(false)}
    />
  );

  return (
    <TooltipProvider>
      <div className="h-full min-h-[calc(100vh-4rem)] flex relative overflow-hidden bg-gradient-to-br from-background to-secondary/20">
        {/* Mobile sidebar toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 left-4 z-50 lg:hidden bg-card/80 backdrop-blur-sm border border-border"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>

        {/* Mobile overlay */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Sidebar */}
        <motion.div
          initial={false}
          animate={{
            x: sidebarOpen ? 0 : (typeof window !== 'undefined' && window.innerWidth < 1024) ? -300 : 0
          }}
          className={cn(
            "fixed lg:relative z-40 w-72 h-full bg-card/95 backdrop-blur-xl border-r border-border/50 flex flex-col",
            "lg:translate-x-0"
          )}
        >
          <div className="p-4 border-b border-border/50 pt-14 lg:pt-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-foreground flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <FileText className="w-4 h-4 text-primary-foreground" />
                </div>
                Notebook
              </h2>
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.div whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }}>
                    <Button onClick={createNote} size="icon" variant="ghost" className="hover:bg-primary/20">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent>New note</TooltipContent>
              </Tooltip>
            </div>

            {/* Workspace indicator */}
            {activeWorkspace && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "mb-3 px-3 py-2 rounded-lg text-xs flex items-center gap-2",
                  isSharedWorkspace
                    ? "bg-violet/10 border border-violet/20 text-violet"
                    : "bg-primary/10 border border-primary/20 text-primary"
                )}
              >
                {isSharedWorkspace ? <Users className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                <span className="font-medium truncate">{activeWorkspace.icon} {activeWorkspace.name}</span>
                {isSharedWorkspace && <Badge variant="outline" className="text-[9px] px-1 py-0">Shared</Badge>}
              </motion.div>
            )}

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notes..."
                className="pl-9 bg-secondary/50 border-border/50"
              />
            </div>
          </div>

          <div className="flex-1 overflow-auto p-2 space-y-1">
            <AnimatePresence mode="popLayout">
              {filteredNotes.map((note, i) => (
                <motion.button
                  key={note.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: i * 0.02 }}
                  whileHover={{ x: 4 }}
                  onClick={() => { setSelectedNote(note); setSidebarOpen(false); }}
                  className={cn(
                    "w-full text-left p-3 rounded-xl flex items-start gap-3 group transition-all",
                    selectedNote?.id === note.id
                      ? 'bg-gradient-to-r from-primary/15 to-accent/10 border border-primary/20 shadow-sm'
                      : 'hover:bg-secondary/60'
                  )}
                >
                  <span className="text-lg">{note.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{note.title}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(note.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                  {note.is_favorite && <Star className="w-4 h-4 text-amber-500 fill-amber-500" />}
                  <ChevronRight className={cn(
                    "w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity",
                    selectedNote?.id === note.id && "opacity-100 text-primary"
                  )} />
                </motion.button>
              ))}
            </AnimatePresence>

            {filteredNotes.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8 text-muted-foreground"
              >
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No notes yet</p>
                <Button onClick={createNote} variant="ghost" size="sm" className="mt-2 gap-1">
                  <Plus className="w-3 h-3" /> Create one
                </Button>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Editor */}
        <div className="flex-1 flex flex-col min-w-0">
          {selectedNote ? (
            <>
              <div className="flex items-center justify-between p-3 md:p-4 border-b border-border/50 bg-card/50 backdrop-blur-sm pl-14 lg:pl-4 gap-2">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Input
                    value={selectedNote.title}
                    onChange={(e) => updateNote(selectedNote.id, { title: e.target.value })}
                    className="text-lg md:text-xl font-bold bg-transparent border-none p-0 h-auto focus-visible:ring-0 flex-1 min-w-0"
                  />

                  {/* Real-time indicators */}
                  <div className="flex items-center gap-2">
                    {isRealtime && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                      >
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-1 shrink-0 bg-green-500/10 border-green-500/30 text-green-600">
                          <Wifi className="w-3 h-3" />
                          <span className="hidden sm:inline">Live</span>
                        </Badge>
                      </motion.div>
                    )}

                    {lastEditedBy && (
                      <motion.div
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                      >
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-amber-500/10 border-amber-500/30 text-amber-600">
                          {lastEditedBy} just edited
                        </Badge>
                      </motion.div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Collaborative presence - show who's viewing/editing */}
                  <CollaborativePresence
                    noteId={selectedNote.id}
                    isEditing={isEditing}
                  />

                  {/* Mobile: Use Sheet for AI */}
                  <Sheet open={showAI} onOpenChange={setShowAI}>
                    <SheetTrigger asChild>
                      <Button variant="ghost" size="icon" className="lg:hidden">
                        <Sparkles className="w-4 h-4 text-primary" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="bottom" className="h-[85vh] p-0">
                      <AIPanel />
                    </SheetContent>
                  </Sheet>

                  {/* Desktop: Toggle side panel */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowAI(!showAI)}
                        className={cn("hidden lg:flex", showAI && "bg-primary/20")}
                      >
                        <PanelRightOpen className="w-4 h-4 text-primary" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>AI Assistant</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => updateNote(selectedNote.id, { is_favorite: !selectedNote.is_favorite })}
                      >
                        <Star className={cn("w-4 h-4", selectedNote.is_favorite ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground')} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{selectedNote.is_favorite ? 'Remove from favorites' : 'Add to favorites'}</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="hidden sm:flex"
                        onClick={() => {
                          updateNote(selectedNote.id, { is_archived: true });
                          setNotes(prev => prev.filter(n => n.id !== selectedNote.id));
                          setSelectedNote(null);
                        }}
                      >
                        <Archive className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Archive</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteNote(selectedNote.id)}
                      >
                        <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Delete</TooltipContent>
                  </Tooltip>
                </div>
              </div>

              <div className="flex-1 flex overflow-hidden">
                <div className="flex-1 p-4 md:p-6 overflow-auto">
                  <BlockEditor blocks={blocks} onChange={saveBlocks} />
                </div>

                {/* Desktop AI Panel */}
                <AnimatePresence>
                  {showAI && (
                    <motion.div
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: 340, opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      className="overflow-hidden hidden lg:block border-l border-border/50"
                    >
                      <AIPanel />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center max-w-sm"
              >
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center"
                >
                  <FileText className="w-10 h-10 text-primary/50" />
                </motion.div>
                <h3 className="text-xl font-semibold text-foreground mb-2">No note selected</h3>
                <p className="text-muted-foreground mb-6 text-sm">
                  Select a note from the sidebar or create a new one to get started
                </p>
                <Button onClick={createNote} className="gap-2">
                  <Plus className="w-4 h-4" /> Create new note
                </Button>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
};

export default Notebook;