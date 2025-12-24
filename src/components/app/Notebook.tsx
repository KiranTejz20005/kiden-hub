import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Note } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, FileText, Search, Star, Archive, Trash2, MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';

const Notebook = () => {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchNotes();
    }
  }, [user]);

  const fetchNotes = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_archived', false)
      .eq('is_template', false)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching notes:', error);
    } else {
      setNotes(data as Note[]);
      if (data.length > 0 && !selectedNote) {
        setSelectedNote(data[0] as Note);
      }
    }
    setLoading(false);
  };

  const createNote = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('notes')
      .insert({
        user_id: user.id,
        title: 'Untitled',
        content: [],
      })
      .select()
      .single();

    if (error) {
      toast.error('Failed to create note');
    } else {
      const newNote = data as Note;
      setNotes((prev) => [newNote, ...prev]);
      setSelectedNote(newNote);
      toast.success('Note created!');
    }
  };

  const updateNote = async (id: string, updates: Partial<Note>) => {
    const { error } = await supabase
      .from('notes')
      .update(updates)
      .eq('id', id);

    if (error) {
      toast.error('Failed to update note');
    } else {
      setNotes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, ...updates } : n))
      );
      if (selectedNote?.id === id) {
        setSelectedNote((prev) => prev ? { ...prev, ...updates } : null);
      }
    }
  };

  const deleteNote = async (id: string) => {
    const { error } = await supabase.from('notes').delete().eq('id', id);

    if (error) {
      toast.error('Failed to delete note');
    } else {
      setNotes((prev) => prev.filter((n) => n.id !== id));
      if (selectedNote?.id === id) {
        setSelectedNote(null);
      }
      toast.success('Note deleted');
    }
  };

  const toggleFavorite = async (note: Note) => {
    await updateNote(note.id, { is_favorite: !note.is_favorite });
  };

  const archiveNote = async (note: Note) => {
    await updateNote(note.id, { is_archived: true });
    setNotes((prev) => prev.filter((n) => n.id !== note.id));
    if (selectedNote?.id === note.id) {
      setSelectedNote(null);
    }
    toast.success('Note archived');
  };

  const filteredNotes = notes.filter((note) =>
    note.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-2rem)] flex">
      {/* Sidebar */}
      <div className="w-72 border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-foreground">Notebook</h2>
            <Button onClick={createNote} size="icon" variant="ghost">
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

        <div className="flex-1 overflow-auto p-2">
          <AnimatePresence mode="popLayout">
            {filteredNotes.map((note) => (
              <motion.button
                key={note.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedNote(note)}
                className={`w-full text-left p-3 rounded-xl mb-1 flex items-start gap-3 group ${
                  selectedNote?.id === note.id
                    ? 'bg-primary/10 border border-primary/20'
                    : 'hover:bg-secondary'
                }`}
              >
                <span className="text-lg">{note.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{note.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(note.updated_at).toLocaleDateString()}
                  </p>
                </div>
                {note.is_favorite && (
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                )}
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
      </div>

      {/* Editor */}
      <div className="flex-1 flex flex-col">
        {selectedNote ? (
          <>
            {/* Toolbar */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <Input
                value={selectedNote.title}
                onChange={(e) => updateNote(selectedNote.id, { title: e.target.value })}
                className="text-xl font-bold bg-transparent border-none p-0 h-auto focus-visible:ring-0"
              />
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => toggleFavorite(selectedNote)}
                >
                  <Star
                    className={`w-4 h-4 ${
                      selectedNote.is_favorite
                        ? 'text-yellow-500 fill-yellow-500'
                        : 'text-muted-foreground'
                    }`}
                  />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => archiveNote(selectedNote)}
                >
                  <Archive className="w-4 h-4 text-muted-foreground" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteNote(selectedNote.id)}
                >
                  <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                </Button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 p-6 overflow-auto">
              <textarea
                placeholder="Start writing..."
                className="w-full h-full bg-transparent border-none resize-none text-foreground placeholder:text-muted-foreground focus:outline-none"
                value={typeof selectedNote.content === 'string' ? selectedNote.content : ''}
                onChange={(e) => updateNote(selectedNote.id, { content: e.target.value as any })}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
              <h3 className="text-lg text-muted-foreground mb-2">No note selected</h3>
              <Button onClick={createNote} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Create new note
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notebook;