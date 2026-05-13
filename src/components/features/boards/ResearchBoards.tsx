import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import {
  Plus, Trash2, MoreVertical, X, GripVertical, Loader2,
  Pencil, Check, FolderKanban, Columns, Search, 
  Layout, Eye, ListTodo, Image as ImageIcon, 
  Star, ChevronRight, LayoutGrid, Sliders,
  Calendar, CheckSquare, Square, Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence, Reorder } from 'framer-motion';

// ─── Types ────────────────────────────────────────────────
type BoardType = 'kanban' | 'vision' | 'tracking';

interface Board {
  id: string; user_id: string; title: string; description?: string;
  emoji: string; type: BoardType; created_at: string; updated_at: string;
}
interface Column {
  id: string; board_id: string; title: string; color: string; position: number;
}
interface Card {
  id: string; column_id: string; board_id: string; title: string;
  body?: string; tags?: string[]; position: number; ai_generated?: boolean;
  metadata?: any;
}

const STICKY_COLORS: Record<string, string> = {
  'color:amber':  'bg-amber-400/90 border-amber-300/60 text-amber-950',
  'color:pink':   'bg-pink-400/90 border-pink-300/60 text-pink-950',
  'color:green':  'bg-emerald-400/90 border-emerald-300/60 text-emerald-950',
  'color:blue':   'bg-sky-400/90 border-sky-300/60 text-sky-950',
  'color:emerald': 'bg-emerald-400/90 border-emerald-300/60 text-emerald-950',
};

// ─── Components ───────────────────────────────────────────

const KanbanCard = ({ card, onDelete, onUpdate }: { card: Card; onDelete: () => void; onUpdate: (data: Partial<Card>) => void }) => {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(card.title);
  const [body, setBody] = useState(card.body || '');
  const isPinned = card.tags?.includes('pinned');
  const isSticky = card.tags?.includes('sticky');
  const colorKey = card.tags?.find(t => t.startsWith('color:')) ?? 'color:amber';
  const stickyClass = STICKY_COLORS[colorKey] ?? STICKY_COLORS['color:amber'];

  const save = () => {
    if (title.trim()) onUpdate({ title: title.trim(), body: body.trim() });
    setEditing(false);
  };

  const togglePin = () => {
    const newTags = isPinned
      ? (card.tags ?? []).filter(t => t !== 'pinned')
      : [...(card.tags ?? []), 'pinned'];
    onUpdate({ tags: newTags });
  };

  if (isSticky) {
    return (
      <motion.div layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
        className={cn('group relative w-44 min-h-[120px] rounded-xl border-2 p-3 shadow-lg flex-shrink-0 cursor-pointer rotate-[-1deg] hover:rotate-0 transition-transform', stickyClass)}
      >
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-black opacity-60 uppercase tracking-widest">📌 Sticky</span>
          <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 text-current/60 hover:text-current transition-opacity">
            <X className="w-3 h-3" />
          </button>
        </div>
        {editing ? (
          <div className="space-y-1">
            <textarea autoFocus value={title} onChange={e => setTitle(e.target.value)}
              className="w-full bg-black/10 rounded p-1 text-xs font-bold resize-none h-14 focus:outline-none"
              onBlur={save} onKeyDown={e => e.key === 'Escape' && setEditing(false)} />
          </div>
        ) : (
          <p className="text-xs font-bold leading-snug" onDoubleClick={() => setEditing(true)}>{card.title}</p>
        )}
        {card.body && <p className="text-[10px] mt-1 opacity-70 line-clamp-2">{card.body}</p>}
        <div className="absolute bottom-2 right-2 flex gap-1">
          {['color:amber','color:pink','color:green','color:blue','color:emerald'].map(c => (
            <button key={c} onClick={() => onUpdate({ tags: [...(card.tags?.filter(t => !t.startsWith('color:') && t !== 'sticky') ?? []), 'sticky', c] })}
              className={cn('w-3 h-3 rounded-full border border-white/40 transition-transform hover:scale-125',
                c === 'color:amber' ? 'bg-amber-400' : c === 'color:pink' ? 'bg-pink-400' : c === 'color:green' ? 'bg-emerald-400' : c === 'color:blue' ? 'bg-sky-400' : 'bg-emerald-400'
              )} />
          ))}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
      className={cn('group bg-card border rounded-xl p-3 cursor-pointer hover:shadow-md hover:shadow-black/10 transition-all',
        isPinned ? 'border-amber-500/40 bg-amber-500/5' : 'border-border/60 hover:border-primary/30')}
    >
      {editing ? (
        <div className="space-y-2" onClick={e => e.stopPropagation()}>
          <Input autoFocus value={title} onChange={e => setTitle(e.target.value)}
            className="h-7 text-xs font-semibold bg-background/50" onKeyDown={e => e.key === 'Enter' && save()} />
          <textarea value={body} onChange={e => setBody(e.target.value)}
            className="w-full bg-background/30 border border-border/40 rounded-lg p-2 text-xs resize-none h-16 focus:outline-none focus:border-emerald-500/30"
            placeholder="Add description or link a note..." />
          <div className="flex gap-1">
            <button onClick={save} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary text-white text-[10px] font-bold hover:opacity-90">
              <Check className="w-3 h-3" /> Save
            </button>
            <button onClick={() => setEditing(false)} className="px-2.5 py-1 rounded-lg bg-secondary text-xs">Cancel</button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs font-semibold leading-snug flex-1">
              {isPinned && <span className="mr-1">📌</span>}{card.title}
            </p>
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <button onClick={togglePin} className={cn('p-1 rounded-md transition-colors', isPinned ? 'text-amber-400' : 'text-muted-foreground hover:text-amber-400')} title="Pin">
                <span className="text-[10px]">📌</span>
              </button>
              <button onClick={() => setEditing(true)} className="p-1 rounded-md hover:bg-secondary/60 text-muted-foreground hover:text-foreground">
                <Pencil className="w-3 h-3" />
              </button>
              <button onClick={onDelete} className="p-1 rounded-md hover:bg-destructive/20 text-muted-foreground hover:text-destructive">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
          {card.body && <p className="text-[10px] text-muted-foreground mt-1.5 leading-relaxed line-clamp-2">{card.body}</p>}
          {card.tags && card.tags.filter(t => !t.startsWith('color:') && t !== 'pinned').length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {card.tags.filter(t => !t.startsWith('color:') && t !== 'pinned').slice(0, 3).map(tag => (
                <span key={tag} className="px-1.5 py-0.5 rounded-md bg-primary/10 text-primary text-[9px] font-bold">{tag}</span>
              ))}
            </div>
          )}
        </>
      )}
    </motion.div>
  );
};

const VisionCard = ({ card, onDelete, onUpdate }: { card: Card; onDelete: () => void; onUpdate: (data: Partial<Card>) => void }) => {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(card.title);
  const [body, setBody] = useState(card.body || '');
  const [showPreview, setShowPreview] = useState(false);
  
  // Detect image URL in body
  const imgUrl = body.match(/https?:\/\/[^\s]+?\.(jpg|jpeg|png|gif|webp|svg)/i)?.[0];

  const save = () => {
    if (title.trim()) onUpdate({ title: title.trim(), body: body.trim() });
    setEditing(false);
  };

  return (
    <>
      <motion.div layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        className="group relative bg-card border border-border/40 rounded-2xl overflow-hidden hover:border-primary/30 transition-all shadow-sm"
      >
        {imgUrl ? (
          <div className="relative aspect-[4/3] bg-black/20 overflow-hidden cursor-pointer" onClick={() => setShowPreview(true)}>
            <img src={imgUrl} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-3 left-3 right-3">
               <h4 className="text-white font-bold text-sm truncate">{title}</h4>
            </div>
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
               <div className="bg-black/40 backdrop-blur-md p-1.5 rounded-lg border border-white/10 text-white">
                 <Eye className="w-3.5 h-3.5" />
               </div>
            </div>
          </div>
        ) : (
          <div className="p-4 pt-10 text-center bg-secondary/10">
            <ImageIcon className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
            <h4 className="font-bold text-sm">{title}</h4>
          </div>
        )}

        {editing ? (
          <div className="p-3 space-y-2">
            <Input value={title} onChange={e => setTitle(e.target.value)} className="h-8 text-xs" placeholder="Goal or title..." />
            <textarea value={body} onChange={e => setBody(e.target.value)} className="w-full bg-background border rounded-lg p-2 text-xs h-20 resize-none focus:outline-none" placeholder="Image URL or description..." />
            <div className="flex gap-1">
              <Button size="sm" className="h-7 text-[10px]" onClick={save}>Save</Button>
              <Button size="sm" variant="secondary" className="h-7 text-[10px]" onClick={() => setEditing(false)}>Cancel</Button>
            </div>
          </div>
        ) : (
          <div className="p-3 flex items-center justify-between">
            <p className="text-[10px] text-muted-foreground truncate flex-1">{body.substring(0, 50)}</p>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => setEditing(true)} className="p-1 hover:text-primary"><Pencil className="w-3 h-3" /></button>
              <button onClick={onDelete} className="p-1 hover:text-destructive"><Trash2 className="w-3 h-3" /></button>
            </div>
          </div>
        )}
      </motion.div>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black border-none ring-0">
          <div className="relative w-full h-full flex items-center justify-center bg-black/40">
             <img src={imgUrl} alt={title} className="max-h-[85vh] w-auto object-contain shadow-2xl" />
             <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/80 to-transparent">
                <h3 className="text-white text-2xl font-bold">{title}</h3>
                <p className="text-white/60 text-sm mt-1">{body}</p>
             </div>
             <button onClick={() => setShowPreview(false)} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/40 flex items-center justify-center text-white hover:bg-black/60 border border-white/10 transition-colors">
               <X className="w-5 h-5" />
             </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

const TrackingCard = ({ card, onDelete, onUpdate }: { card: Card; onDelete: () => void; onUpdate: (data: Partial<Card>) => void }) => {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(card.title);
  const [showSubtasks, setShowSubtasks] = useState(false);
  const [newSubtask, setNewSubtask] = useState('');
  
  const metadata = card.metadata || {};
  const subtasks = metadata.subtasks || [];
  const priority = metadata.priority || 'medium';
  const dueDate = metadata.due_date;
  
  // Calculate auto progress if subtasks exist
  const autoProgress = subtasks.length > 0;
  const completedSubtasks = subtasks.filter((s: any) => s.completed).length;
  const progress = autoProgress 
    ? Math.round((completedSubtasks / subtasks.length) * 100) 
    : (metadata.progress || 0);

  const priorities = [
    { value: 'low', label: 'Low', color: 'bg-slate-500' },
    { value: 'medium', label: 'Medium', color: 'bg-amber-500' },
    { value: 'high', label: 'High', color: 'bg-red-500' },
  ];

  const calculateProgress = (updatedSubtasks: any[]) => {
    if (updatedSubtasks.length === 0) return metadata.progress || 0;
    const completed = updatedSubtasks.filter((s: any) => s.completed).length;
    return Math.round((completed / updatedSubtasks.length) * 100);
  };

  const toggleSubtask = (id: string) => {
    const updated = subtasks.map((s: any) => s.id === id ? { ...s, completed: !s.completed } : s);
    const newProgress = calculateProgress(updated);
    onUpdate({ metadata: { ...metadata, subtasks: updated, progress: newProgress } });
  };

  const addSubtask = () => {
    if (!newSubtask.trim()) return;
    const newTask = { id: Date.now().toString(), title: newSubtask.trim(), completed: false };
    const updated = [...subtasks, newTask];
    const newProgress = calculateProgress(updated);
    onUpdate({ metadata: { ...metadata, subtasks: updated, progress: newProgress } });
    setNewSubtask('');
  };

  const removeSubtask = (id: string) => {
    const updated = subtasks.filter((s: any) => s.id !== id);
    const newProgress = calculateProgress(updated);
    onUpdate({ metadata: { ...metadata, subtasks: updated, progress: newProgress } });
  };

  return (
    <motion.div layout className="group flex flex-col p-4 bg-card border border-border/40 rounded-2xl hover:border-primary/20 transition-all shadow-sm">
      <div className="flex items-start gap-4">
        <div className="flex flex-col items-center gap-1.5 shrink-0 mt-1">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/10">
            <ListTodo className="w-5 h-5 text-primary" />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={cn("w-2.5 h-2.5 rounded-full cursor-pointer ring-2 ring-background ring-offset-1 ring-offset-transparent", priorities.find(p => p.value === priority)?.color)} title={`Priority: ${priority}`} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="text-[10px]">
              {priorities.map(p => (
                <DropdownMenuItem key={p.value} onClick={() => onUpdate({ metadata: { ...metadata, priority: p.value } })}>
                  <div className={cn("w-2 h-2 rounded-full mr-2", p.color)} /> {p.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="flex-1 min-w-0 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              {editing ? (
                <Input autoFocus value={title} onChange={e => setTitle(e.target.value)} className="h-8 text-sm font-bold bg-secondary/20" onBlur={() => { onUpdate({ title }); setEditing(false); }} onKeyDown={e => e.key === 'Enter' && (e.target as any).blur()} />
              ) : (
                <h4 className="text-sm font-bold truncate leading-tight cursor-pointer hover:text-primary transition-colors" onClick={() => setEditing(true)}>{card.title}</h4>
              )}
              
              {/* Description Field */}
              <div className="mt-1">
                <textarea
                  value={card.body || ''}
                  onChange={e => onUpdate({ body: e.target.value })}
                  placeholder="Add a description..."
                  className="w-full bg-transparent text-[11px] text-muted-foreground border-none focus:outline-none resize-none min-h-[40px] leading-relaxed p-0 scrollbar-hide"
                />
              </div>

              <div className="flex items-center gap-3 mt-2">
                {dueDate && (
                  <div className="flex items-center gap-1 text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                    <Clock className="w-3 h-3" /> {dueDate}
                  </div>
                )}
                <button onClick={() => setShowSubtasks(!showSubtasks)} className="text-[10px] text-muted-foreground hover:text-primary transition-colors font-bold uppercase tracking-widest flex items-center gap-1">
                   {subtasks.length > 0 ? `${completedSubtasks}/${subtasks.length} Subtasks` : '+ Add Subtasks'}
                </button>
              </div>
            </div>
            
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <input type="date" className="bg-transparent text-[10px] border-none focus:outline-none text-muted-foreground w-20" value={dueDate || ''} onChange={e => onUpdate({ metadata: { ...metadata, due_date: e.target.value } })} />
              <button onClick={onDelete} className="p-1.5 text-muted-foreground hover:text-destructive transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">
              <span>Progress</span>
              <span className={cn(progress === 100 ? "text-primary" : "text-foreground")}>{progress}%</span>
            </div>
            <div className="h-2 bg-secondary/50 rounded-full overflow-hidden border border-border/20 p-[1px]">
              <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className={cn("h-full rounded-full", progress === 100 ? "bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]" : "bg-primary/80")} />
            </div>
            {!autoProgress && (
              <input type="range" min="0" max="100" value={progress} onChange={e => onUpdate({ metadata: { ...metadata, progress: parseInt(e.target.value) } })} className="w-full accent-primary h-1 mt-2 opacity-20 hover:opacity-100 transition-opacity" />
            )}
          </div>

          {/* Subtasks Section */}
          <AnimatePresence>
            {showSubtasks && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden pt-2 border-t border-border/20 mt-4 space-y-2">
                <div className="space-y-1">
                  {subtasks.map((st: any) => (
                    <div key={st.id} className="flex items-center gap-2 group/st py-1 px-2 rounded-lg hover:bg-secondary/30 transition-all">
                      <button onClick={() => toggleSubtask(st.id)} className={cn("shrink-0 transition-colors", st.completed ? "text-primary" : "text-muted-foreground")}>
                        {st.completed ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                      </button>
                      <span className={cn("text-xs flex-1 transition-all", st.completed ? "text-muted-foreground line-through" : "text-foreground")}>{st.title}</span>
                      <button onClick={() => removeSubtask(st.id)} className="opacity-0 group-hover/st:opacity-100 p-1 text-muted-foreground hover:text-destructive"><X className="w-3 h-3" /></button>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-2 px-1">
                  <Input value={newSubtask} onChange={e => setNewSubtask(e.target.value)} placeholder="New subtask..." className="h-7 text-[11px] bg-secondary/20" onKeyDown={e => e.key === 'Enter' && addSubtask()} />
                  <Button size="sm" className="h-7 px-3 text-[10px]" onClick={addSubtask}>Add</Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

// ─── Column Component ────────────────────────────────────
const COLUMN_COLORS = ['#10b981', '#14b8a6', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899', '#8b5cf6'];

const KanbanColumn = ({ column, cards, onAddCard, onDeleteCard, onUpdateCard, onDeleteColumn, onUpdateColumn, boardType }: {
  column: Column;
  cards: Card[];
  onAddCard: (colId: string, title: string) => void;
  onDeleteCard: (cardId: string, colId: string) => void;
  onUpdateCard: (cardId: string, data: Partial<Card>) => void;
  onDeleteColumn: (colId: string) => void;
  onUpdateColumn: (colId: string, data: Partial<Column>) => void;
  boardType: BoardType;
}) => {
  const [addingCard, setAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [editingTitle, setEditingTitle] = useState(false);
  const [colTitle, setColTitle] = useState(column.title);

  const submitCard = () => {
    if (newCardTitle.trim()) {
      onAddCard(column.id, newCardTitle.trim());
      setNewCardTitle('');
      setAddingCard(false);
    }
  };

  const saveColumnTitle = () => {
    if (colTitle.trim()) onUpdateColumn(column.id, { title: colTitle.trim() });
    setEditingTitle(false);
  };

  const colCards = cards.filter(c => c.column_id === column.id).sort((a, b) => a.position - b.position);

  // Layouts based on type
  if (boardType === 'vision') {
    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-4">
           <h3 className="text-sm font-bold flex items-center gap-2">
             <div className="w-2 h-2 rounded-full" style={{ backgroundColor: column.color }} />
             {column.title}
             <span className="text-[10px] text-muted-foreground ml-2 font-normal">{colCards.length} images</span>
           </h3>
           <Button variant="ghost" size="sm" className="h-8 gap-2 text-xs" onClick={() => setAddingCard(true)}>
             <Plus className="w-3.5 h-3.5" /> Add Vision
           </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
           <AnimatePresence>
            {colCards.map(card => (
              <VisionCard key={card.id} card={card} onDelete={() => onDeleteCard(card.id, column.id)} onUpdate={(d) => onUpdateCard(card.id, d)} />
            ))}
           </AnimatePresence>
           {addingCard && (
             <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="p-4 bg-card border-2 border-dashed border-primary/20 rounded-2xl flex flex-col items-center justify-center gap-3">
               <Input autoFocus value={newCardTitle} onChange={e => setNewCardTitle(e.target.value)} placeholder="Title..." className="text-xs h-8" />
               <Button size="sm" onClick={submitCard} className="w-full">Add to Vision</Button>
               <Button size="sm" variant="ghost" onClick={() => setAddingCard(false)} className="w-full text-xs h-7">Cancel</Button>
             </motion.div>
           )}
        </div>
      </div>
    );
  }

  if (boardType === 'tracking') {
    return (
      <div className="w-full max-w-2xl mx-auto space-y-4">
        <div className="flex items-center justify-between bg-card/30 p-3 rounded-xl border border-border/40">
           <div className="flex items-center gap-3">
             <div className="w-3 h-3 rounded-full" style={{ backgroundColor: column.color }} />
             <h3 className="font-bold text-sm">{column.title}</h3>
           </div>
           <Button size="sm" variant="ghost" className="h-8 text-xs gap-1" onClick={() => setAddingCard(true)}><Plus className="w-3.5 h-3.5" /> New Task</Button>
        </div>
        
        <div className="space-y-2">
          <AnimatePresence>
            {colCards.map(card => (
              <TrackingCard key={card.id} card={card} onDelete={() => onDeleteCard(card.id, column.id)} onUpdate={(d) => onUpdateCard(card.id, d)} />
            ))}
          </AnimatePresence>
          {addingCard && (
             <div className="flex gap-2 p-1">
               <Input autoFocus value={newCardTitle} onChange={e => setNewCardTitle(e.target.value)} placeholder="Task name..." className="text-xs h-9" onKeyDown={e => e.key === 'Enter' && submitCard()} />
               <Button onClick={submitCard} className="h-9">Add</Button>
               <Button variant="ghost" onClick={() => setAddingCard(false)} className="h-9"><X className="w-4 h-4" /></Button>
             </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-shrink-0 w-72 flex flex-col bg-secondary/20 border border-border/40 rounded-2xl overflow-hidden">
      {/* Column Header */}
      <div className="px-3.5 py-3 flex items-center gap-2 border-b border-border/40 bg-card/50">
        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: column.color }} />
        {editingTitle ? (
          <input
            autoFocus
            value={colTitle}
            onChange={e => setColTitle(e.target.value)}
            onBlur={saveColumnTitle}
            onKeyDown={e => { if (e.key === 'Enter') saveColumnTitle(); if (e.key === 'Escape') setEditingTitle(false); }}
            className="flex-1 bg-background/50 border border-border/40 rounded-lg px-2 py-0.5 text-xs font-bold focus:outline-none focus:border-primary/50"
          />
        ) : (
          <span
            className="flex-1 text-xs font-bold cursor-pointer hover:text-primary transition-colors truncate"
            onDoubleClick={() => setEditingTitle(true)}
          >
            {column.title}
          </span>
        )}
        <span className="text-[10px] text-muted-foreground bg-secondary/50 px-1.5 py-0.5 rounded-md font-bold shrink-0">{colCards.length}</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all shrink-0">
              <MoreVertical className="w-3.5 h-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="text-xs">
            <DropdownMenuItem onClick={() => setEditingTitle(true)}><Pencil className="w-3.5 h-3.5 mr-2" />Rename</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDeleteColumn(column.id)} className="text-destructive">
              <Trash2 className="w-3.5 h-3.5 mr-2" />Delete Column
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Cards */}
      <ScrollArea className="flex-1 max-h-[calc(100vh-280px)]">
        <div className="p-2.5 space-y-2">
          <AnimatePresence>
            {colCards.map(card => (
              <KanbanCard
                key={card.id}
                card={card}
                onDelete={() => onDeleteCard(card.id, column.id)}
                onUpdate={(data) => onUpdateCard(card.id, data)}
              />
            ))}
          </AnimatePresence>

          {/* Add card form */}
          <AnimatePresence>
            {addingCard ? (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-2"
              >
                <textarea
                  autoFocus
                  value={newCardTitle}
                  onChange={e => setNewCardTitle(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitCard(); } if (e.key === 'Escape') setAddingCard(false); }}
                  className="w-full bg-card border border-border/60 rounded-xl p-3 text-xs resize-none h-20 focus:outline-none focus:border-primary/40 shadow-sm"
                  placeholder="Card title... (Enter to add)"
                />
                <div className="flex gap-1.5">
                  <button onClick={submitCard} className="flex-1 py-1.5 rounded-lg bg-primary text-white text-xs font-bold hover:opacity-90 transition-opacity">Add Card</button>
                  <button onClick={() => { setAddingCard(false); setNewCardTitle(''); }} className="px-3 py-1.5 rounded-lg bg-secondary text-xs hover:bg-secondary/80">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => setAddingCard(true)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/40 text-xs transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> Add a card
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </ScrollArea>
    </div>
  );
};

// ─── Template Selector ────────────────────────────────────

const TemplateSelector = ({ onSelect }: { onSelect: (type: BoardType) => void }) => {
  const templates: { type: BoardType; title: string; desc: string; icon: any; color: string }[] = [
    { type: 'kanban', title: 'Kanban Board', desc: 'Classic columns for workflow management.', icon: Columns, color: 'text-emerald-400' },
    { type: 'vision', title: 'Vision Board', desc: 'Visual grid for goals, dreams and inspiration.', icon: LayoutGrid, color: 'text-pink-400' },
    { type: 'tracking', title: 'Project Tracker', desc: 'List view with progress tracking and status.', icon: Sliders, color: 'text-blue-400' },
  ];

  return (
    <div className="grid grid-cols-1 gap-3">
      {templates.map(t => (
        <button
          key={t.type}
          onClick={() => onSelect(t.type)}
          className="flex items-start gap-4 p-4 rounded-2xl bg-secondary/30 border border-border/40 hover:border-primary/40 hover:bg-primary/5 transition-all text-left group"
        >
          <div className={cn('w-12 h-12 rounded-xl bg-background border border-border/40 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform', t.color)}>
            <t.icon className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-sm">{t.title}</h4>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{t.desc}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground/30 ml-auto self-center group-hover:translate-x-1 transition-transform" />
        </button>
      ))}
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────
const ResearchBoards = () => {
  const { user } = useAuth();
  const [boards, setBoards] = useState<Board[]>([]);
  const [activeBoard, setActiveBoard] = useState<Board | null>(null);
  const [columns, setColumns] = useState<Column[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingBoard, setLoadingBoard] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  // Fetch all boards
  const fetchBoards = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('research_boards')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setBoards(data);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchBoards(); }, [fetchBoards]);

  // Fetch columns and cards when board changes
  useEffect(() => {
    if (!activeBoard) { setColumns([]); setCards([]); return; }
    const load = async () => {
      setLoadingBoard(true);
      const [{ data: cols }, { data: cds }] = await Promise.all([
        supabase.from('board_columns').select('*').eq('board_id', activeBoard.id).order('position'),
        supabase.from('board_cards').select('*').eq('board_id', activeBoard.id).order('position'),
      ]);
      if (cols) setColumns(cols);
      if (cds) setCards(cds);
      setLoadingBoard(false);
    };
    load();
  }, [activeBoard?.id]);

  // ── Board CRUD ──
  const createBoard = async (type: BoardType) => {
    if (!user) return;
    const emojis = ['🔬', '📋', '💡', '🚀', '🎯', '📊', '🧠', '⚡'];
    const emoji = emojis[Math.floor(Math.random() * emojis.length)];
    const title = type === 'kanban' ? 'New Project' : type === 'vision' ? 'My Vision' : 'Project Tracker';
    
    const { data } = await supabase
      .from('research_boards')
      .insert([{ user_id: user.id, title, emoji, type }])
      .select().single();
      
    if (data) {
      setBoards(prev => [data, ...prev]);
      
      // Template specific columns
      let defaultCols: string[] = [];
      if (type === 'kanban') defaultCols = ['To Research', 'In Progress', 'Done'];
      else if (type === 'vision') defaultCols = ['Inspiration'];
      else if (type === 'tracking') defaultCols = ['Tasks'];

      await supabase.from('board_columns').insert(
        defaultCols.map((title, i) => ({
          board_id: data.id, title,
          color: COLUMN_COLORS[i % COLUMN_COLORS.length], position: i
        }))
      );
      
      const { data: cols } = await supabase.from('board_columns').select('*').eq('board_id', data.id).order('position');
      setColumns(cols ?? []);
      setCards([]);
      setActiveBoard(data);
      setShowTemplateModal(false);
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} board created!`);
    }
  };

  const deleteBoard = async (boardId: string) => {
    await supabase.from('board_cards').delete().eq('board_id', boardId);
    await supabase.from('board_columns').delete().eq('board_id', boardId);
    await supabase.from('research_boards').delete().eq('id', boardId);
    setBoards(prev => prev.filter(b => b.id !== boardId));
    if (activeBoard?.id === boardId) setActiveBoard(null);
    toast.success('Board deleted');
  };

  // ── Column CRUD ──
  const addColumn = async () => {
    if (!activeBoard) return;
    const pos = columns.length;
    const color = COLUMN_COLORS[pos % COLUMN_COLORS.length];
    const { data } = await supabase.from('board_columns')
      .insert([{ board_id: activeBoard.id, title: 'New Column', color, position: pos }])
      .select().single();
    if (data) setColumns(prev => [...prev, data]);
  };

  const deleteColumn = async (colId: string) => {
    await supabase.from('board_cards').delete().eq('column_id', colId);
    await supabase.from('board_columns').delete().eq('id', colId);
    setColumns(prev => prev.filter(c => c.id !== colId));
    setCards(prev => prev.filter(c => c.column_id !== colId));
  };

  const updateColumn = async (colId: string, data: Partial<Column>) => {
    await supabase.from('board_columns').update(data).eq('id', colId);
    setColumns(prev => prev.map(c => c.id === colId ? { ...c, ...data } : c));
  };

  // ── Card CRUD ──
  const addCard = async (colId: string, title: string) => {
    if (!activeBoard) return;
    const colCards = cards.filter(c => c.column_id === colId);
    const { data } = await supabase.from('board_cards')
      .insert([{ 
        board_id: activeBoard.id, 
        column_id: colId, 
        title, 
        position: colCards.length,
        metadata: activeBoard.type === 'tracking' ? { progress: 0 } : {}
      }])
      .select().single();
    if (data) setCards(prev => [...prev, data]);
  };

  const deleteCard = async (cardId: string) => {
    await supabase.from('board_cards').delete().eq('id', cardId);
    setCards(prev => prev.filter(c => c.id !== cardId));
  };

  const updateCard = async (cardId: string, data: Partial<Card>) => {
    await supabase.from('board_cards').update(data).eq('id', cardId);
    setCards(prev => prev.map(c => c.id === cardId ? { ...c, ...data } : c));
  };

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="flex h-full bg-background overflow-hidden rounded-2xl border border-border/50">
      {/* ── Boards Sidebar ── */}
      <div className="w-64 border-r border-border/50 flex flex-col bg-card/30 backdrop-blur-sm shrink-0">
        <div className="p-4 border-b border-border/50">
          <Dialog open={showTemplateModal} onOpenChange={setShowTemplateModal}>
            <DialogTrigger asChild>
              <button className="w-full flex items-center gap-2.5 h-10 px-4 rounded-xl bg-gradient-primary text-white font-semibold text-sm hover:opacity-90 transition-all shadow-lg shadow-primary/20 active:scale-95">
                <Plus className="w-4 h-4" /> New Board
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Choose a template</DialogTitle>
              </DialogHeader>
              <TemplateSelector onSelect={createBoard} />
            </DialogContent>
          </Dialog>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-0.5">
            <AnimatePresence>
              {boards.map(board => (
                <motion.button
                  key={board.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  onClick={() => setActiveBoard(board)}
                  className={cn(
                    'w-full text-left px-3 py-2.5 rounded-xl transition-all flex items-center gap-2.5 group',
                    activeBoard?.id === board.id
                      ? 'bg-primary/10 border border-primary/20'
                      : 'hover:bg-secondary/40'
                  )}
                >
                  <span className="text-base shrink-0">{board.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-xs font-semibold truncate', activeBoard?.id === board.id ? 'text-primary' : 'text-foreground')}>
                      {board.title}
                    </p>
                    <p className="text-[9px] opacity-40 uppercase tracking-tighter font-bold">{board.type || 'kanban'}</p>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); deleteBoard(board.id); }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all shrink-0"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </motion.button>
              ))}
            </AnimatePresence>
            {boards.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-10 px-4">No boards yet. Create one to get started!</p>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* ── Board Canvas ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {!activeBoard ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col items-center justify-center text-center p-12 gap-5"
          >
            <div className="w-20 h-20 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <FolderKanban className="w-10 h-10 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-1 text-gradient">Research Boards</h2>
              <p className="text-muted-foreground text-sm max-w-xs">Organize your research with kanban, vision boards, or trackers. Select a board or create a new one.</p>
            </div>
            <button
              onClick={() => setShowTemplateModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-primary text-white font-semibold text-sm hover:opacity-90 transition-all shadow-lg shadow-primary/20"
            >
              <Plus className="w-4 h-4" /> Create First Board
            </button>
          </motion.div>
        ) : (
          <>
            {/* Board Header */}
            <div className="h-14 border-b border-border/50 flex items-center justify-between px-5 bg-card/30 backdrop-blur-md shrink-0">
              <div className="flex items-center gap-3">
                <span className="text-xl">{activeBoard.emoji}</span>
                <input
                  defaultValue={activeBoard.title}
                  className="font-bold text-sm bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-emerald-500/40 rounded-lg px-1"
                  onBlur={async (e) => {
                    const newTitle = e.target.value.trim() || 'Untitled';
                    await supabase.from('research_boards').update({ title: newTitle }).eq('id', activeBoard.id);
                    setBoards(prev => prev.map(b => b.id === activeBoard.id ? { ...b, title: newTitle } : b));
                  }}
                  onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                />
                <span className="text-[10px] text-muted-foreground bg-secondary/40 px-2 py-1 rounded-lg font-medium">{columns.length} cols · {cards.length} cards · {activeBoard.type?.toUpperCase() || 'KANBAN'}</span>
              </div>
              <div className="flex items-center gap-2">
                {activeBoard.type === 'kanban' && (
                  <button
                    onClick={async () => {
                      if (!activeBoard) return;
                      const { data } = await supabase.from('board_cards')
                        .insert([{ board_id: activeBoard.id, column_id: columns[0]?.id ?? null, title: 'Sticky note...', body: '', tags: ['sticky', 'color:emerald'], position: 0 }])
                        .select().single();
                      if (data) setCards(prev => [data, ...prev]);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-semibold transition-all border border-emerald-500/20"
                  >
                    📌 Sticky Note
                  </button>
                )}
                {activeBoard.type === 'kanban' && (
                  <button
                    onClick={addColumn}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary/50 hover:bg-secondary text-xs font-semibold transition-all border border-border/40"
                  >
                    <Columns className="w-3.5 h-3.5" /> Add Column
                  </button>
                )}
              </div>
            </div>

            {/* Sticky Notes Strip (Only for Kanban) */}
            {activeBoard.type === 'kanban' && cards.filter(c => c.tags?.includes('sticky')).length > 0 && (
              <div className="px-5 pt-4 pb-0 shrink-0">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">📌 Sticky Notes</p>
                <div className="flex gap-3 overflow-x-auto pb-3">
                  <AnimatePresence>
                    {cards.filter(c => c.tags?.includes('sticky')).map(card => (
                      <KanbanCard key={card.id} card={card} onDelete={() => deleteCard(card.id)} onUpdate={(d) => updateCard(card.id, d)} />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* Board Canvas */}
            {loadingBoard ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <ScrollArea className="flex-1">
                <div className={cn("p-5 h-full", activeBoard.type === 'kanban' ? "flex gap-4 min-w-max" : "space-y-8")}>
                  <AnimatePresence>
                    {columns.map(col => (
                      <motion.div
                        key={col.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className={activeBoard.type === 'kanban' ? "h-full" : "w-full"}
                      >
                        <KanbanColumn
                          column={col}
                          cards={cards}
                          onAddCard={addCard}
                          onDeleteCard={deleteCard}
                          onUpdateCard={updateCard}
                          onDeleteColumn={deleteColumn}
                          onUpdateColumn={updateColumn}
                          boardType={activeBoard.type || 'kanban'}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  
                  {activeBoard.type === 'kanban' && (
                    <button
                      onClick={addColumn}
                      className="flex-shrink-0 w-72 h-16 flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border/40 text-muted-foreground hover:border-emerald-500/30 hover:text-foreground hover:bg-secondary/10 transition-all text-sm font-medium"
                    >
                      <Plus className="w-4 h-4" /> Add Column
                    </button>
                  )}
                </div>
              </ScrollArea>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ResearchBoards;
