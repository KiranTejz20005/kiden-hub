import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import {
  Plus, Trash2, MoreVertical, X, Loader2,
  Pencil, Columns, Search, 
  Layout, Eye, Star, ChevronRight, LayoutGrid,
  Calendar, Clock, FolderKanban, Share2, 
  Settings2, PlusCircle, ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

// ─── Types ────────────────────────────────────────────────
interface Board {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  emoji: string;
  created_at: string;
  updated_at: string;
  item_count?: number;
}

const MyBoards = () => {
  const { user } = useAuth();
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBoard, setSelectedBoard] = useState<Board | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [newBoard, setNewBoard] = useState({ title: '', description: '', emoji: '📁' });
  const [boardToEdit, setBoardToEdit] = useState<Board | null>(null);
  const [boardToDelete, setBoardToDelete] = useState<Board | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchBoards = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('research_boards')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Mock item counts for now, or fetch if available
      const boardsWithCounts = data.map(b => ({ ...b, item_count: Math.floor(Math.random() * 20) }));
      setBoards(boardsWithCounts);
    } catch (error) {
      toast.error('Failed to load boards');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchBoards();
  }, [fetchBoards]);

  const handleCreateBoard = async () => {
    if (!user || !newBoard.title.trim()) return;
    setIsProcessing(true);
    try {
      const { data, error } = await supabase
        .from('research_boards')
        .insert([{
          user_id: user.id,
          title: newBoard.title.trim(),
          description: newBoard.description.trim(),
          emoji: newBoard.emoji
        }])
        .select()
        .single();

      if (error) throw error;

      setBoards([data, ...boards]);
      setShowCreateModal(false);
      setNewBoard({ title: '', description: '', emoji: '📁' });
      toast.success('Board created successfully');
    } catch (error) {
      toast.error('Failed to create board');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateBoard = async () => {
    if (!boardToEdit || !boardToEdit.title.trim()) return;
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('research_boards')
        .update({
          title: boardToEdit.title.trim(),
          description: boardToEdit.description?.trim(),
        })
        .eq('id', boardToEdit.id);

      if (error) throw error;

      setBoards(boards.map(b => b.id === boardToEdit.id ? boardToEdit : b));
      setShowEditModal(false);
      toast.success('Board updated');
    } catch (error) {
      toast.error('Failed to update board');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteBoard = async () => {
    if (!boardToDelete) return;
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('research_boards')
        .delete()
        .eq('id', boardToDelete.id);

      if (error) throw error;

      setBoards(boards.filter(b => b.id !== boardToDelete.id));
      setShowDeleteModal(false);
      toast.success('Board deleted permanently');
    } catch (error) {
      toast.error('Failed to delete board');
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredBoards = boards.filter(b => 
    b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (selectedBoard) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-6 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSelectedBoard(null)}
              className="p-2 rounded-xl hover:bg-white/5 text-muted-foreground transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-xl font-black uppercase tracking-widest text-white">{selectedBoard.title}</h2>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">Board Workspace</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <Button variant="ghost" size="sm" className="rounded-xl font-black text-[10px] uppercase tracking-widest text-muted-foreground">
                <Share2 className="w-4 h-4 mr-2" /> Share
             </Button>
             <Button variant="ghost" size="sm" className="rounded-xl font-black text-[10px] uppercase tracking-widest text-muted-foreground">
                <Settings2 className="w-4 h-4 mr-2" /> Board Settings
             </Button>
          </div>
        </div>
        <div className="flex-1 overflow-hidden p-8 flex items-center justify-center text-muted-foreground">
           <div className="text-center space-y-4">
              <FolderKanban className="w-16 h-16 mx-auto opacity-10" />
              <p className="text-sm font-black uppercase tracking-[0.2em]">Board View Loading...</p>
              <p className="text-[10px] opacity-60">Board contents and columns will appear here.</p>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-8 p-10 max-w-[1600px] mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-xl shadow-primary/5">
              <Columns className="w-5 h-5" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white uppercase">My Boards</h1>
          </div>
          <p className="text-sm text-muted-foreground">Organize your cross-platform research into structured workflows.</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
            <Input 
              placeholder="Search boards..." 
              className="pl-12 h-12 w-64 bg-white/5 border-white/5 rounded-2xl text-sm focus:ring-1 focus:ring-primary/30"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="h-12 px-8 rounded-2xl bg-white text-black hover:bg-white/90 font-black uppercase tracking-widest text-xs shadow-xl shadow-white/5 active:scale-95 transition-all"
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            Create Board
          </Button>
        </div>
      </div>

      {/* Grid Content */}
      <div className="flex-1">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-64 rounded-[2.5rem] bg-white/5 border border-white/5 animate-pulse" />
            ))}
          </div>
        ) : filteredBoards.length > 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            <AnimatePresence>
              {filteredBoards.map((board) => (
                <motion.div
                  layout
                  key={board.id}
                  whileHover={{ y: -5 }}
                  className="group relative h-72 rounded-[2.5rem] bg-[#111111] border border-white/5 hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/5 transition-all cursor-pointer overflow-hidden flex flex-col"
                  onClick={() => setSelectedBoard(board)}
                >
                  {/* Top: Header/Emoji */}
                  <div className="p-8 pb-4 flex items-start justify-between">
                    <div className="w-14 h-14 rounded-[1.5rem] bg-white/5 flex items-center justify-center text-2xl shadow-inner border border-white/5 group-hover:scale-110 transition-transform">
                      {board.emoji}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical className="w-4 h-4 text-muted-foreground" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-[#0A0A0A] border-white/10 rounded-2xl p-2 shadow-2xl">
                        <DropdownMenuItem 
                          onClick={(e) => { e.stopPropagation(); setBoardToEdit(board); setShowEditModal(true); }}
                          className="flex items-center gap-2 p-3 rounded-xl text-xs font-bold focus:bg-white/5"
                        >
                          <Pencil className="w-3.5 h-3.5" /> Rename Board
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={(e) => { e.stopPropagation(); setBoardToDelete(board); setShowDeleteModal(true); }}
                          className="flex items-center gap-2 p-3 rounded-xl text-xs font-bold text-red-500 focus:bg-red-500/10"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete Permanently
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Middle: Content */}
                  <div className="px-8 flex-1">
                    <h3 className="text-xl font-black text-white leading-tight line-clamp-1">{board.title}</h3>
                    <p className="text-[11px] text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
                      {board.description || 'Structured research board for intelligent tracking and knowledge management.'}
                    </p>
                  </div>

                  {/* Bottom: Meta */}
                  <div className="px-8 pb-8 flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        <FolderKanban className="w-3 h-3" /> {board.item_count} Items
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        <Clock className="w-3 h-3" /> {formatDistanceToNow(new Date(board.updated_at), { addSuffix: true })}
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                      <ChevronRight className="w-4 h-4 text-white" />
                    </div>
                  </div>

                  {/* Accent Gradient */}
                  <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 gap-6 text-center border-2 border-dashed border-white/5 rounded-[4rem] bg-white/[0.02]">
            <div className="w-24 h-24 rounded-[2.5rem] bg-white/5 flex items-center justify-center text-muted-foreground/20 border border-white/5 shadow-inner">
              <Columns className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-white uppercase tracking-widest">No Boards Found</h3>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
                Start your journey by creating a specialized board to track your research progress.
              </p>
            </div>
            <Button 
              onClick={() => setShowCreateModal(true)}
              className="mt-4 rounded-full bg-primary text-white hover:bg-primary/90 font-black px-10 h-12 shadow-xl shadow-primary/20"
            >
              Initialize My First Board
            </Button>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="bg-[#0A0A0A] border-white/10 rounded-[3rem] p-10 max-w-lg shadow-2xl">
          <DialogHeader>
            <div className="flex items-center gap-4 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                <PlusCircle className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-black uppercase tracking-widest text-white">New Intelligence Board</h2>
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-1">Workspace Initialization</p>
              </div>
            </div>
          </DialogHeader>
          <div className="space-y-8 py-8">
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Board Identity (Name)</Label>
              <Input 
                autoFocus
                placeholder="e.g. Quantum Computing Research"
                className="h-14 bg-white/5 border-white/5 rounded-2xl text-base font-bold placeholder:text-muted-foreground/20"
                value={newBoard.title}
                onChange={(e) => setNewBoard({ ...newBoard, title: e.target.value })}
              />
            </div>
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Strategic Description</Label>
              <Input 
                placeholder="Objective, scope, or key focus areas..."
                className="h-14 bg-white/5 border-white/5 rounded-2xl text-sm placeholder:text-muted-foreground/20"
                value={newBoard.description}
                onChange={(e) => setNewBoard({ ...newBoard, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter className="gap-3">
            <Button variant="ghost" onClick={() => setShowCreateModal(false)} className="rounded-2xl font-black uppercase tracking-widest text-[10px] h-12 px-8">Discard</Button>
            <Button 
              onClick={handleCreateBoard}
              disabled={isProcessing || !newBoard.title.trim()}
              className="flex-1 rounded-2xl bg-white text-black hover:bg-white/90 font-black uppercase tracking-widest text-xs h-12 shadow-xl shadow-white/5"
            >
              {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Instantiate Board'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="bg-[#0A0A0A] border-white/10 rounded-[3rem] p-10 max-w-lg">
          <DialogHeader>
            <h2 className="text-2xl font-black uppercase tracking-widest text-white">Refine Board</h2>
          </DialogHeader>
          {boardToEdit && (
            <div className="space-y-6 py-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Title</Label>
                <Input 
                  className="h-14 bg-white/5 border-white/5 rounded-2xl"
                  value={boardToEdit.title}
                  onChange={(e) => setBoardToEdit({ ...boardToEdit, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Description</Label>
                <Input 
                  className="h-14 bg-white/5 border-white/5 rounded-2xl"
                  value={boardToEdit.description || ''}
                  onChange={(e) => setBoardToEdit({ ...boardToEdit, description: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowEditModal(false)} className="rounded-2xl font-black">Cancel</Button>
            <Button 
              onClick={handleUpdateBoard}
              disabled={isProcessing}
              className="px-10 rounded-2xl bg-white text-black font-black"
            >
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="bg-[#0A0A0A] border-red-500/20 rounded-[3rem] p-10 max-w-md">
          <DialogHeader>
            <h2 className="text-2xl font-black uppercase tracking-widest text-red-500">Terminate Board?</h2>
          </DialogHeader>
          <div className="py-6">
            <p className="text-sm text-muted-foreground leading-relaxed">
              This action is <span className="text-white font-bold underline">irreversible</span>. All data, columns, and task cards within <span className="text-white font-bold">"{boardToDelete?.title}"</span> will be permanently purged from the intelligence matrix.
            </p>
          </div>
          <DialogFooter className="gap-3">
            <Button variant="ghost" onClick={() => setShowDeleteModal(false)} className="flex-1 rounded-2xl font-black">Safe Exit</Button>
            <Button 
              onClick={handleDeleteBoard}
              disabled={isProcessing}
              className="flex-1 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black"
            >
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Purge'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyBoards;
