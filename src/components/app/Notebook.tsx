import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Note } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import BlockEditor, { Block } from './BlockEditor';
import NotebookAI from './NotebookAI';
import { v4 as uuidv4 } from 'uuid';
import { 
  Plus, FileText, Search, Star, Archive, Trash2, 
  Sparkles, Menu, X, ChevronLeft
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const Notebook = () => {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAI, setShowAI] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [blocks, setBlocks] = useState<Block[]>([{ id: uuidv4(), type: 'paragraph', content: '' }]);

  useEffect(() => {
    if (user) fetchNotes();
  }, [user]);

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
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_archived', false)
      .eq('is_template', false)
      .order('updated_at', { ascending: false });

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
      .insert({ user_id: user.id, title: 'Untitled', content: newBlocks })
      .select()
      .single();

    if (!error && data) {
      const newNote = data as Note;
      setNotes(prev => [newNote, ...prev]);
      setSelectedNote(newNote);
      setBlocks(newBlocks);
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

  const saveBlocks = async (newBlocks: Block[]) => {
    setBlocks(newBlocks);
    if (selectedNote) {
      await updateNote(selectedNote.id, { content: newBlocks as any });
    }
  };

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

  return (
    <div className="h-[calc(100vh-2rem)] flex relative overflow-hidden">
      {/* Mobile sidebar toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 left-4 z-50 lg:hidden"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </Button>

      {/* Sidebar */}
      <motion.div
        initial={false}
        animate={{ x: sidebarOpen ? 0 : -300 }}
        className={cn(
          "absolute lg:relative z-40 w-72 h-full bg-card border-r border-border flex flex-col",
          "lg:translate-x-0"
        )}
      >
        <div className="p-4 border-b border-border pt-14 lg:pt-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-foreground flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Notebook
            </h2>
            <Button onClick={createNote} size="icon" variant="ghost" className="hover:bg-primary/20">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes..."
              className="pl-9 bg-secondary border-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto p-2 space-y-1">
          <AnimatePresence mode="popLayout">
            {filteredNotes.map((note) => (
              <motion.button
                key={note.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onClick={() => { setSelectedNote(note); setSidebarOpen(false); }}
                className={cn(
                  "w-full text-left p-3 rounded-xl flex items-start gap-3 group transition-all",
                  selectedNote?.id === note.id
                    ? 'bg-primary/10 border border-primary/20'
                    : 'hover:bg-secondary'
                )}
              >
                <span className="text-lg">{note.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{note.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(note.updated_at).toLocaleDateString()}
                  </p>
                </div>
                {note.is_favorite && <Star className="w-4 h-4 text-amber fill-amber" />}
              </motion.button>
            ))}
          </AnimatePresence>

          {filteredNotes.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No notes yet</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Editor */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedNote ? (
          <>
            <div className="flex items-center justify-between p-4 border-b border-border pl-14 lg:pl-4">
              <Input
                value={selectedNote.title}
                onChange={(e) => updateNote(selectedNote.id, { title: e.target.value })}
                className="text-xl font-bold bg-transparent border-none p-0 h-auto focus-visible:ring-0 flex-1"
              />
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={() => setShowAI(!showAI)} className={cn(showAI && "bg-primary/20")}>
                  <Sparkles className="w-4 h-4 text-primary" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => updateNote(selectedNote.id, { is_favorite: !selectedNote.is_favorite })}>
                  <Star className={cn("w-4 h-4", selectedNote.is_favorite ? 'text-amber fill-amber' : 'text-muted-foreground')} />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => { updateNote(selectedNote.id, { is_archived: true }); setNotes(prev => prev.filter(n => n.id !== selectedNote.id)); setSelectedNote(null); }}>
                  <Archive className="w-4 h-4 text-muted-foreground" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => deleteNote(selectedNote.id)}>
                  <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                </Button>
              </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
              <div className="flex-1 p-6 overflow-auto">
                <BlockEditor blocks={blocks} onChange={saveBlocks} />
              </div>

              <AnimatePresence>
                {showAI && (
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: 320 }}
                    exit={{ width: 0 }}
                    className="overflow-hidden"
                  >
                    <NotebookAI
                      noteContent={getPlainText()}
                      noteTitle={selectedNote.title}
                      onInsert={handleAIInsert}
                      onClose={() => setShowAI(false)}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
              <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
              <h3 className="text-lg text-muted-foreground mb-2">No note selected</h3>
              <Button onClick={createNote} variant="outline" className="gap-2">
                <Plus className="w-4 h-4" /> Create new note
              </Button>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notebook;
