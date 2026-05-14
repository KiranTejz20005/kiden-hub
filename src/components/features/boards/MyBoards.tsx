import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { 
  Plus, Search, FolderKanban, PlusCircle, Loader2, 
  ChevronDown, Settings, CreditCard, LogOut, 
  ExternalLink, MoreHorizontal, Link as LinkIcon, 
  FileText, MessageSquare, Upload, TrendingUp, 
  Sparkles, LayoutTemplate 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { formatDistanceToNow } from 'date-fns';

interface Board {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  emoji: string;
  is_shared?: boolean;
  created_at: string;
  updated_at: string;
  item_count?: number;
}

interface BoardItem {
  id: string;
  type: 'link' | 'note' | 'file' | 'idea' | 'video' | 'chat';
  title: string;
  content: any;
  url?: string;
  thumbnail_url?: string;
  created_at: string;
}

const MyBoards = ({ 
  selectedBoard, 
  onBoardSelect, 
  boards, 
  onBoardsUpdate,
  resetCounter = 0 
}: { 
  selectedBoard: Board | null;
  onBoardSelect: (board: Board) => void;
  boards: Board[];
  onBoardsUpdate: () => void;
  resetCounter?: number;
}) => {
  const { user } = useAuth();
  const [items, setItems] = useState<BoardItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Quick Add Modal States
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [isAddingItem, setIsAddingItem] = useState(false);

  const fetchItems = useCallback(async () => {
    if (!selectedBoard || !user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('research_board_items')
        .select('*')
        .eq('board_id', selectedBoard.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedBoard, user]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleAddItem = async (type: BoardItem['type'], data: any) => {
    if (!user || !selectedBoard) return;
    setIsAddingItem(true);
    try {
      const { error } = await supabase
        .from('research_board_items')
        .insert([{
          board_id: selectedBoard.id,
          user_id: user.id,
          type,
          title: data.title || 'Untitled Item',
          content: data.content || {},
          url: data.url,
          thumbnail_url: data.thumbnail_url
        }]);

      if (error) throw error;
      toast.success('Item added to board');
      fetchItems();
    } catch (error) {
      toast.error('Failed to add item');
    } finally {
      setIsAddingItem(false);
      setShowLinkModal(false);
      setLinkUrl('');
    }
  };

  const openCreateModal = () => {
    setNewBoardTitle('');
    setShowCreateModal(true);
  };

  const handleCreateBoard = async () => {
    if (!user || !newBoardTitle.trim()) return;

    setIsCreating(true);
    try {
      const { data, error } = await supabase
        .from('research_boards' as any)
        .insert([
          {
            user_id: user.id,
            title: newBoardTitle.trim(),
            emoji: '📁',
          },
        ])
        .select()
        .single();

      if (error) throw error;

      onBoardsUpdate();
      setShowCreateModal(false);
      setNewBoardTitle('');
      toast.success('Board created');
    } catch (error) {
      toast.error('Failed to create board');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="h-full flex min-h-0 overflow-hidden bg-background text-foreground">
      <main className="flex-1 min-w-0 flex flex-col bg-[#050505] overflow-hidden">
        {selectedBoard ? (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Board Header */}
            <div className="h-14 flex items-center justify-between px-8 border-b border-white/5 bg-black/40 backdrop-blur-md sticky top-0 z-10">
              <div className="flex items-center gap-6 flex-1 min-w-0">
                <div className="relative group max-w-md w-full">
                  <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-white/40 transition-colors" />
                  <input 
                    placeholder="Search this board"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-transparent border-none focus:outline-none pl-7 text-[13px] text-white placeholder:text-white/20 transition-all"
                  />
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <h2 className="text-xl font-bold text-white truncate uppercase tracking-tight">{selectedBoard.title}</h2>
                  <button onClick={openCreateModal} className="p-1 rounded-md hover:bg-white/5 text-white/20 hover:text-white transition-all">
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-6">
                {['SORT', 'CHAT', 'SHARE'].map((action) => (
                  <button key={action} className="text-[10px] font-bold tracking-[0.2em] text-white/30 hover:text-white transition-colors">
                    {action}
                  </button>
                ))}
                <div className="w-px h-4 bg-white/10" />
                <button className="text-white/30 hover:text-white transition-colors">
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Board Content Area */}
            <ScrollArea className="flex-1">
              {items.length > 0 ? (
                <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  <button 
                    onClick={() => setShowLinkModal(true)}
                    className="aspect-[4/3] rounded-[2rem] border-2 border-dashed border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10 transition-all flex flex-col items-center justify-center gap-3 group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/20 group-hover:text-emerald-400 group-hover:bg-emerald-400/10 transition-all">
                      <Plus className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest text-white/20 group-hover:text-white">Add New Item</span>
                  </button>

                  {items.filter(item => 
                    item.title.toLowerCase().includes(searchQuery.toLowerCase())
                  ).map((item) => (
                    <motion.div
                      layout
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="aspect-[4/3] rounded-[2rem] bg-white/[0.03] border border-white/5 p-6 hover:bg-white/[0.05] hover:border-white/10 transition-all group flex flex-col"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40">
                          {item.type === 'link' && <LinkIcon className="w-5 h-5" />}
                          {item.type === 'note' && <FileText className="w-5 h-5" />}
                          {item.type === 'chat' && <MessageSquare className="w-5 h-5" />}
                        </div>
                        <button className="opacity-0 group-hover:opacity-100 p-2 hover:bg-white/5 rounded-lg transition-all">
                          <MoreHorizontal className="w-4 h-4 text-white/20" />
                        </button>
                      </div>
                      <h4 className="text-[15px] font-bold text-white mb-2 line-clamp-2">{item.title}</h4>
                      <div className="mt-auto flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-white/20">
                        <span>{item.type}</span>
                        <span>{formatDistanceToNow(new Date(item.created_at))} ago</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="min-h-full flex items-center justify-center p-8">
                  <div className="w-full max-w-xl bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-10 md:p-14 shadow-2xl relative overflow-hidden group/board">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent opacity-0 group-hover/board:opacity-100 transition-opacity duration-700" />
                    
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-8">
                        <div>
                          <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/30">Add to this board</h3>
                          <p className="mt-2 text-sm text-white/40 leading-relaxed font-medium">New items will land here in a tidy grid.</p>
                        </div>
                        <Button 
                          variant="ghost" 
                          onClick={() => setShowLinkModal(true)}
                          className="h-10 rounded-xl border border-emerald-400/20 bg-emerald-400/5 px-4 text-[10px] font-bold uppercase tracking-widest text-emerald-400 hover:bg-emerald-400/10 transition-all shadow-lg shadow-emerald-400/5"
                        >
                          <LayoutTemplate className="w-4 h-4 mr-2" /> Browse Templates
                        </Button>
                      </div>

                      <div className="space-y-1">
                        {[
                          { icon: LinkIcon, label: 'Paste a link', shortcut: 'Ctrl V', type: 'link', action: () => setShowLinkModal(true) },
                          { icon: FileText, label: 'Start a document', shortcut: 'D', type: 'note', action: () => handleAddItem('note', { title: 'New Document' }) },
                          { icon: MessageSquare, label: 'Jot quick ideas or drafts', shortcut: 'C', type: 'idea', action: () => handleAddItem('idea', { title: 'Quick Thought' }) },
                          { icon: Upload, label: 'Drop images, PDFs, or files', shortcut: 'DRAG', type: 'file', action: () => toast.info('File drop coming soon') },
                          { icon: TrendingUp, label: 'Save top performing content', shortcut: 'DISCOVER', type: 'video', action: () => toast.info('Discovery integration coming soon') },
                          { icon: Sparkles, label: 'Save an AI chat response', shortcut: 'CHAT', type: 'chat', action: () => toast.info('AI Chat sync coming soon') }
                        ].map((item) => (
                          <button 
                            key={item.label}
                            onClick={item.action}
                            className="w-full flex items-center justify-between group/btn px-4 py-3.5 rounded-2xl hover:bg-white/5 border border-transparent hover:border-white/5 transition-all text-left"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-white/40 group-hover/btn:text-emerald-400 group-hover/btn:bg-emerald-400/10 group-hover/btn:border-emerald-400/20 transition-all">
                                <item.icon className="w-4 h-4" />
                              </div>
                              <span className="text-[13px] font-bold text-white/60 group-hover/btn:text-white transition-colors">{item.label}</span>
                            </div>
                            <div className={cn(
                              "px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all",
                              ['link', 'note', 'idea'].includes(item.type) 
                                ? "bg-white/5 text-white/20 border border-white/5 group-hover/btn:bg-white/10 group-hover/btn:text-white/40"
                                : "bg-emerald-500/10 text-emerald-500/40 border border-emerald-500/10 group-hover/btn:bg-emerald-500/20 group-hover/btn:text-emerald-400"
                            )}>
                              {item.shortcut}
                            </div>
                          </button>
                        ))}
                      </div>

                      <button className="mt-10 text-[11px] font-medium text-white/20 hover:text-emerald-400 transition-colors underline underline-offset-4 decoration-white/10 hover:decoration-emerald-400/40">
                        Don't know what to create?
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </ScrollArea>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="max-w-md text-center space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/70">
                <FolderKanban className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">No board selected</h3>
                <p className="mt-2 text-sm leading-6 text-white/45">Create a board to open a blank canvas for links, notes, and uploads.</p>
              </div>
              <Button onClick={openCreateModal} className="h-11 rounded-xl bg-white text-black hover:bg-white/90 font-medium">
                <PlusCircle className="mr-2 h-4 w-4" /> Create board
              </Button>
            </div>
          </div>
        )}
      </main>

      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-md rounded-3xl border-white/10 bg-[#0a0a0a] p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-white">Create board</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-[10px] uppercase tracking-[0.24em] text-white/45">Board name</Label>
              <Input
                autoFocus
                value={newBoardTitle}
                onChange={(e) => setNewBoardTitle(e.target.value)}
                placeholder="Enter a board name"
                className="h-11 rounded-xl border-white/10 bg-white/5 text-sm placeholder:text-white/25 focus-visible:ring-1 focus-visible:ring-emerald-400/30"
              />
            </div>

            <p className="text-sm leading-6 text-white/45">Keep it short and clear. You can start adding content right after creation.</p>
          </div>

          <DialogFooter className="gap-3 sm:gap-3">
            <Button variant="ghost" onClick={() => setShowCreateModal(false)} className="h-11 rounded-xl border border-white/10 bg-white/5 text-white hover:bg-white/10">
              Cancel
            </Button>
            <Button onClick={handleCreateBoard} disabled={isCreating || !newBoardTitle.trim()} className="h-11 rounded-xl bg-white text-black hover:bg-white/90 font-medium">
              {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create board'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={showLinkModal} onOpenChange={setShowLinkModal}>
        <DialogContent className="max-w-md rounded-3xl border-white/10 bg-[#0a0a0a] p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-white">Add Link</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-[10px] uppercase tracking-[0.24em] text-white/45">URL</Label>
              <Input
                autoFocus
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
                className="h-11 rounded-xl border-white/10 bg-white/5 text-sm placeholder:text-white/25 focus-visible:ring-1 focus-visible:ring-emerald-400/30"
              />
            </div>
            <p className="text-sm leading-6 text-white/45">Paste a link to a website, article, or video to save it to your board.</p>
          </div>

          <DialogFooter className="gap-3 sm:gap-3">
            <Button variant="ghost" onClick={() => setShowLinkModal(false)} className="h-11 rounded-xl border border-white/10 bg-white/5 text-white hover:bg-white/10">
              Cancel
            </Button>
            <Button 
              onClick={() => handleAddItem('link', { title: linkUrl, url: linkUrl })} 
              disabled={isAddingItem || !linkUrl.trim()} 
              className="h-11 rounded-xl bg-white text-black hover:bg-white/90 font-medium"
            >
              {isAddingItem ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add Link'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyBoards;