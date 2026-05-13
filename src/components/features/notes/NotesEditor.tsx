import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import {
  Plus, Search, Trash2, MoreVertical, FileText,
  Save, Bold, Italic, List, Heading1, Heading2, Code, Loader2, Star, Hash, PanelLeftClose, PanelRightClose, Columns2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

type ViewMode = 'edit' | 'preview' | 'split';

const NotesEditor = () => {
  const { user } = useAuth();
  const [notes, setNotes] = useState<any[]>([]);
  const [activeNote, setActiveNote] = useState<any>(null);
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [searchQuery, setSearchQuery] = useState('');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const fetchNotes = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });
    if (data) setNotes(data);
  }, [user]);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  useEffect(() => {
    if (activeNote) {
      setTitle(activeNote.title || '');
      const raw = activeNote.content;
      setContent(typeof raw === 'string' ? raw : '');
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
  };

  // Insert markdown syntax around selection
  const insertFormat = (prefix: string, suffix = '') => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = content.substring(start, end);
    const newContent = content.substring(0, start) + prefix + selected + suffix + content.substring(end);
    setContent(newContent);
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  };

  const filteredNotes = notes.filter(n =>
    n.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (n.content_text || n.content || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const wordCount = content.split(/\s+/).filter(Boolean).length;

  const formatButtons = [
    { icon: <Bold className="w-3.5 h-3.5" />, label: 'Bold', action: () => insertFormat('**', '**') },
    { icon: <Italic className="w-3.5 h-3.5" />, label: 'Italic', action: () => insertFormat('_', '_') },
    { icon: <Code className="w-3.5 h-3.5" />, label: 'Code', action: () => insertFormat('`', '`') },
    { icon: <Heading1 className="w-3.5 h-3.5" />, label: 'H1', action: () => insertFormat('# ') },
    { icon: <Heading2 className="w-3.5 h-3.5" />, label: 'H2', action: () => insertFormat('## ') },
    { icon: <List className="w-3.5 h-3.5" />, label: 'List', action: () => insertFormat('- ') },
    { icon: <Hash className="w-3.5 h-3.5" />, label: 'Quote', action: () => insertFormat('> ') },
  ];

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
              <h2 className="text-2xl font-bold mb-1 text-gradient">Your Notes</h2>
              <p className="text-muted-foreground text-sm max-w-xs">Select a note to start editing, or create a new one.</p>
            </div>
            <button onClick={handleCreateNote} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-primary text-white font-semibold text-sm hover:opacity-90 transition-all shadow-lg shadow-primary/20 active:scale-95">
              <Plus className="w-4 h-4" /> Create First Note
            </button>
          </motion.div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0">

            {/* ── Toolbar ── */}
            <div className="h-12 border-b border-border/50 flex items-center gap-3 px-4 bg-card/30 backdrop-blur-md shrink-0">
              {/* Title */}
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                onBlur={() => saveNote()}
                onKeyDown={e => e.key === 'Enter' && saveNote()}
                className="flex-1 bg-transparent border-none focus:outline-none text-sm font-bold placeholder:text-muted-foreground/40 min-w-0"
                placeholder="Note title..."
              />

              {/* View mode toggles */}
              <div className="flex items-center bg-secondary/50 rounded-lg p-0.5 shrink-0">
                {([
                  { mode: 'edit', icon: <PanelLeftClose className="w-3.5 h-3.5" />, label: 'Edit' },
                  { mode: 'split', icon: <Columns2 className="w-3.5 h-3.5" />, label: 'Split' },
                  { mode: 'preview', icon: <PanelRightClose className="w-3.5 h-3.5" />, label: 'Preview' },
                ] as { mode: ViewMode; icon: React.ReactNode; label: string }[]).map(({ mode, icon, label }) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    title={label}
                    className={cn(
                      'flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all',
                      viewMode === mode ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {icon} {label}
                  </button>
                ))}
              </div>

              {/* Save indicator */}
              <div className="flex items-center gap-2 shrink-0">
                {isSaving ? (
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" />Saving…</span>
                ) : lastSaved ? (
                  <span className="text-[10px] text-primary font-medium">✓ Saved</span>
                ) : null}
                <button
                  onMouseDown={e => { e.preventDefault(); saveNote(); }}
                  className="p-1.5 rounded-lg text-primary hover:opacity-80 hover:bg-primary/10 transition-all"
                  title="Save (Ctrl+S)"
                >
                  <Save className="w-3.5 h-3.5" />
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0"><MoreVertical className="w-4 h-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => deleteNote(activeNote.id)} className="text-destructive">
                      <Trash2 className="w-4 h-4 mr-2" /> Delete Note
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* ── Format Bar (only in edit/split) ── */}
            {(viewMode === 'edit' || viewMode === 'split') && (
              <div className="flex items-center gap-0.5 px-4 py-1.5 border-b border-border/40 bg-muted/10 shrink-0 overflow-x-auto">
                {formatButtons.map(({ icon, label, action }) => (
                  <button
                    key={label}
                    title={label}
                    onMouseDown={e => { e.preventDefault(); action(); }}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all shrink-0"
                  >
                    {icon}
                  </button>
                ))}
              </div>
            )}

            {/* ── Main Content Area ── */}
            <div className="flex-1 overflow-hidden flex min-h-0">

              {/* Editor pane — shown in 'edit' and 'split' */}
              {(viewMode === 'edit' || viewMode === 'split') && (
                <div className={cn(
                  'flex flex-col min-h-0',
                  viewMode === 'split' ? 'w-1/2 border-r border-border/40' : 'flex-1'
                )}>
                  {viewMode === 'split' && (
                    <div className="px-4 py-1.5 border-b border-border/30 bg-muted/10">
                      <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">✏️ Editor</span>
                    </div>
                  )}
                  <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    className="flex-1 w-full bg-transparent px-6 py-5 focus:outline-none resize-none font-mono text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/30 overflow-y-auto"
                    placeholder={`Start writing in Markdown…\n\n# Heading\n**bold** _italic_ \`code\`\n- List item\n> Blockquote`}
                    onKeyDown={e => {
                      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                        e.preventDefault();
                        saveNote();
                      }
                    }}
                  />
                </div>
              )}

              {/* Preview pane — shown in 'preview' and 'split' */}
              {(viewMode === 'preview' || viewMode === 'split') && (
                <div className={cn(
                  'flex flex-col min-h-0',
                  viewMode === 'split' ? 'w-1/2' : 'flex-1'
                )}>
                  {viewMode === 'split' && (
                    <div className="px-4 py-1.5 border-b border-border/30 bg-muted/10">
                      <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">👁 Preview</span>
                    </div>
                  )}
                  <div className="flex-1 overflow-y-auto px-8 py-5">
                    {viewMode === 'preview' && (
                      <h1 className="text-2xl font-bold mb-5">{title}</h1>
                    )}
                    {content ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none
                        prose-headings:font-bold prose-headings:text-foreground
                        prose-p:text-foreground/90 prose-p:leading-relaxed
                        prose-code:text-primary prose-code:bg-black/20 prose-code:rounded prose-code:px-1 prose-code:text-xs
                        prose-pre:bg-black/30 prose-pre:rounded-xl prose-pre:border prose-pre:border-border/40
                        prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground
                        prose-strong:text-foreground prose-em:text-foreground/80
                        prose-ul:text-foreground/90 prose-li:marker:text-primary">
                        <ReactMarkdown>{content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-muted-foreground/40 text-sm italic">Nothing to preview yet. Start typing in the editor.</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* ── Footer ── */}
            <div className="h-8 border-t border-border/40 flex items-center justify-between px-5 bg-muted/10 text-[10px] text-muted-foreground/60 font-medium shrink-0">
              <span>{wordCount} words · {content.length} chars</span>
              <span className="capitalize">{viewMode} mode · Markdown</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotesEditor;
