import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { 
  Plus, Search, FolderKanban, PlusCircle, Loader2, 
  ChevronDown, Settings, CreditCard, LogOut, 
  ExternalLink, MoreHorizontal, Link as LinkIcon, 
  FileText, MessageSquare, Upload, TrendingUp, 
  Sparkles, LayoutTemplate, Trash2,
  Video, Image as ImageIcon, File, Paperclip,
  ArrowRight
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import * as ContextMenu from '@radix-ui/react-context-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import PDFThumbnail from './PDFThumbnail';
import { useAppCache } from "@/components/providers/CacheProvider";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { X } from 'lucide-react';



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
  const { get, set, invalidate } = useAppCache();
  const [items, setItems] = useState<BoardItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'alphabetical'>('newest');

  // Quick Add Modal States
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [activeNote, setActiveNote] = useState<BoardItem | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [paneItem, setPaneItem] = useState<BoardItem | null>(null);
  const [isResizing, setIsResizing] = useState(false);

  const TEMPLATES = [
    { title: 'Deep Learning Study', emoji: '🧠', items: [
      { type: 'note', title: 'Curriculum Outline', content: { type: 'doc', content: [] } },
      { type: 'link', title: 'Fast.ai Course', url: 'https://course.fast.ai' }
    ]},
    { title: 'Market Research', emoji: '📈', items: [
      { type: 'note', title: 'Competitor Analysis', content: { type: 'doc', content: [] } },
      { type: 'link', title: 'Crunchbase', url: 'https://crunchbase.com' }
    ]},
    { title: 'Product Launch', emoji: '🚀', items: [
      { type: 'note', title: 'Strategy Doc', content: { type: 'doc', content: [] } },
      { type: 'link', title: 'Product Hunt', url: 'https://producthunt.com' }
    ]}
  ];

  const fetchItems = useCallback(async () => {
    if (!selectedBoard || !user) return;
    
    // Layer 4: Check cache first
    const cacheKey = `board-items:${selectedBoard.id}`;
    const cachedData = get<BoardItem[]>(cacheKey);
    if (cachedData) {
      setItems(cachedData);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('research_board_items')
        .select('*')
        .eq('board_id', selectedBoard.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setItems(data || []);
      // Layer 4: Update cache with 5m TTL
      set(cacheKey, data || []);
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedBoard, user, get, set]);

  const sortedItems = useMemo(() => {
    let result = [...items];
    if (searchQuery) {
      result = result.filter(item => item.title.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    
    switch (sortOrder) {
      case 'alphabetical': return result.sort((a, b) => a.title.localeCompare(b.title));
      case 'oldest': return result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      case 'newest': default: return result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
  }, [items, searchQuery, sortOrder]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleAddItem = async (type: BoardItem['type'], data: any) => {
    if (!user || !selectedBoard) return;
    setIsAddingItem(true);
    try {
      // If it's a link, try to fetch metadata
      let itemData = { ...data };
      if (type === 'link' && data.url) {
        const isYoutube = data.url.includes('youtube.com') || data.url.includes('youtu.be');
        if (isYoutube) {
          const videoId = data.url.match(/(?:v=|\/)([a-zA-Z0-9_-]{11})/)?.[1];
          if (videoId) {
            itemData.type = 'video';
            itemData.thumbnail_url = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
            if (!itemData.title || itemData.title === 'New Link' || itemData.title === 'Pasted Link') {
              itemData.title = `YouTube Video (${videoId})`;
            }
          }
        }
      }

      const { error } = await supabase
        .from('research_board_items')
        .insert([{
          board_id: selectedBoard.id,
          user_id: user.id,
          type: itemData.type || type,
          title: itemData.title || 'Untitled Item',
          content: itemData.content || {},
          url: itemData.url,
          thumbnail_url: itemData.thumbnail_url
        }]);

      if (error) throw error;
       
       // Layer 4: Invalidate cache
       invalidate(`board-items:${selectedBoard.id}`);
       
       toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} added to board`);
       fetchItems();
    } catch (error: any) {
      console.error('Board Add Error:', error);
      toast.error(`Failed to add item: ${error.message || 'Unknown error'}`);
    } finally {
      setIsAddingItem(false);
      setShowLinkModal(false);
      setLinkUrl('');
    }
  };

  const renderItemPreview = (item: BoardItem) => {
    if (item.thumbnail_url) {
      return <img src={item.thumbnail_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={item.title} />;
    }

    if (item.type === 'note') {
      return (
        <div className="w-full h-full bg-white p-6 flex flex-col gap-3 overflow-hidden select-none">
          <div className="h-4 w-3/4 bg-black/10 rounded-full" />
          <div className="h-2 w-full bg-black/5 rounded-full" />
          <div className="h-2 w-5/6 bg-black/5 rounded-full" />
          <div className="mt-4 space-y-2">
            <div className="h-1.5 w-full bg-black/[0.03] rounded-full" />
            <div className="h-1.5 w-full bg-black/[0.03] rounded-full" />
            <div className="h-1.5 w-2/3 bg-black/[0.03] rounded-full" />
          </div>
          <div className="mt-auto pt-4 border-t border-black/5">
             <div className="h-2 w-1/4 bg-primary/20 rounded-full" />
          </div>
        </div>
      );
    }
    if (item.type === 'file') {
      const isPdf = item.title.toLowerCase().endsWith('.pdf');
      if (isPdf && item.url) {
        return <PDFThumbnail url={item.url} />;
      }
      return (
        <div className="w-full h-full bg-[#f8f9fa] p-8 flex flex-col items-center justify-center gap-4 group-hover:bg-white transition-colors">
          <div className="w-16 h-20 bg-white border border-black/10 rounded-md shadow-sm relative flex flex-col p-2 gap-1.5 overflow-hidden">
            <div className="h-1 w-full bg-black/5 rounded-full" />
            <div className="h-1 w-2/3 bg-black/5 rounded-full" />
            <div className="mt-2 space-y-1">
              <div className="h-0.5 w-full bg-black/[0.02] rounded-full" />
              <div className="h-0.5 w-full bg-black/[0.02] rounded-full" />
            </div>
            <div className={cn(
              "absolute bottom-0 right-0 left-0 h-5 flex items-center justify-center text-[8px] font-black tracking-tighter uppercase",
              isPdf ? "bg-rose-500 text-white" : "bg-primary text-white"
            )}>
              {isPdf ? 'PDF' : 'DOC'}
            </div>
          </div>
          <div className="text-center">
            <span className="text-[10px] font-bold text-black/40 truncate max-w-[120px] block">{item.title}</span>
          </div>
        </div>
      );
    }


    return (
      <div className="w-full h-full flex items-center justify-center text-white/5 group-hover:text-white/20 transition-colors">
        {item.type === 'link' && <LinkIcon className="w-16 h-16" />}
        {item.type === 'chat' && <MessageSquare className="w-16 h-16" />}
        {item.type === 'idea' && <Sparkles className="w-16 h-16" />}
      </div>
    );
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {

    if (!user || !selectedBoard) return;
    setIsUploading(true);
    
    for (const file of acceptedFiles) {
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${user.id}/${selectedBoard.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('workspace-assets')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true
          });

        if (uploadError) throw uploadError;


        const { data: { publicUrl } } = supabase.storage
          .from('workspace-assets')
          .getPublicUrl(filePath);

        await handleAddItem('file', {
          title: file.name,
          url: publicUrl,
          content: { size: file.size, type: file.type }
        });
      } catch (error) {
        console.error('Upload error:', error);
        toast.error(`Failed to upload ${file.name}`);
      }
    }
    setIsUploading(false);
  }, [user, selectedBoard, handleAddItem]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    noClick: true,
    noKeyboard: true
  });

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const text = e.clipboardData?.getData('text');
      if (text && (text.startsWith('http://') || text.startsWith('https://'))) {
        handleAddItem('link', { url: text, title: 'Pasted Link' });
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [handleAddItem]);


  const handleDeleteItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('research_board_items')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      toast.success('Item removed');
      fetchItems();
    } catch (error) {
      toast.error('Failed to remove item');
    }
  };

  const handleDeleteBoard = async () => {
    if (!selectedBoard || !user) return;
    if (!confirm('Are you sure you want to delete this board and all its items?')) return;
    
    try {
      const { error } = await supabase
        .from('research_boards' as any)
        .delete()
        .eq('id', selectedBoard.id)
        .eq('user_id', user.id); // Explicit security check
      
      if (error) throw error;
      toast.success('Board deleted');
      onBoardsUpdate();
    } catch (error) {
      toast.error('Failed to delete board');
    }
  };

  const handleShareBoard = () => {
    if (!selectedBoard) return;
    const url = `${window.location.origin}/dashboard/boards?id=${selectedBoard.id}`;
    navigator.clipboard.writeText(url);
    toast.success('Share link copied to clipboard');
  };

  const handleChatWithBoard = () => {
    // Navigate to chat and potentially pass context via state or URL
    toast.info('Opening AI Assistant with board context...');
    // Assuming onViewChange is available via a parent or we use window.location
    window.location.href = '/dashboard/chat';
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

  const handleSelectTemplate = async (template: any) => {
    if (!user) return;
    setIsCreating(true);
    try {
      const { data: board, error } = await supabase
        .from('research_boards' as any)
        .insert([{ user_id: user.id, title: template.title, emoji: template.emoji }])
        .select().single();

      if (error) throw error;

      // Add template items
      const itemsToAdd = template.items.map((item: any) => ({
        board_id: board.id,
        user_id: user.id,
        type: item.type,
        title: item.title,
        content: item.content || {},
        url: item.url
      }));

      await supabase.from('research_board_items').insert(itemsToAdd);
      
      onBoardsUpdate();
      setShowTemplatesModal(false);
      toast.success(`${template.title} board instantiated`);
    } catch (err) {
      toast.error('Failed to create from template');
    } finally {
      setIsCreating(false);
    }
  };


  return (
    <div className="h-full flex min-h-0 overflow-hidden bg-background text-foreground w-full">
      <ResizablePanelGroup 
        direction="horizontal" 
        className="flex-1"
        onDragging={(dragging) => setIsResizing(dragging)}
      >
        <ResizablePanel defaultSize={paneItem ? 60 : 100} minSize={30}>
          <main 
            {...getRootProps()}
            className="h-full flex flex-col bg-[#050505] overflow-hidden relative"
          >
            <input {...getInputProps()} />

        
        {/* Drag Overlay */}
        <AnimatePresence>
          {isDragActive && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-primary/10 backdrop-blur-sm border-4 border-dashed border-primary/40 flex flex-col items-center justify-center gap-6"
            >
              <div className="w-24 h-24 rounded-[2.5rem] bg-primary flex items-center justify-center text-white shadow-2xl shadow-primary/40 animate-bounce">
                <Upload className="w-10 h-10" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-bold text-white tracking-tight">Drop files to upload</h3>
                <p className="text-white/40 text-sm font-medium">Images, PDFs, or any research assets</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Uploading indicator */}
        {(isUploading || isAddingItem) && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[60] px-4 py-2 bg-primary/20 backdrop-blur-md border border-primary/20 rounded-full flex items-center gap-3 shadow-2xl animate-in fade-in slide-in-from-top-4">
            <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
            <span className="text-[10px] font-bold text-primary uppercase tracking-widest">
              {isUploading ? 'Ingesting assets...' : 'Processing link...'}
            </span>
          </div>
        )}

        {selectedBoard ? (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Board Header */}
            <div className="h-16 flex items-center justify-between px-6 border-b border-white/5 bg-black/40 backdrop-blur-md sticky top-0 z-10 gap-4">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="flex items-center gap-3 min-w-0 mr-4">
                  <h2 className={cn(
                    "font-black text-white truncate uppercase tracking-tighter transition-all duration-500",
                    paneItem ? "text-lg" : "text-2xl"
                  )}>
                    {selectedBoard.title}
                  </h2>
                  <button onClick={openCreateModal} className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/20 hover:text-white transition-all shrink-0">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="relative group max-w-[240px] flex-1 hidden md:block">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/10 group-focus-within:text-primary transition-colors" />
                  <input 
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/5 rounded-xl py-2 pl-9 pr-4 text-[12px] text-white placeholder:text-white/10 focus:outline-none focus:border-primary/30 transition-all focus:bg-white/[0.05]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 md:gap-5 shrink-0">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="text-[9px] font-black tracking-[0.2em] text-white/30 hover:text-white transition-colors uppercase py-2 px-3 hover:bg-white/5 rounded-lg flex items-center gap-2">
                      <TrendingUp className="w-3 h-3" />
                      {!paneItem && <span>SORT</span>}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-[#161616] border-white/10 rounded-xl p-1 shadow-2xl">
                    <DropdownMenuItem onClick={() => setSortOrder('newest')} className="text-[10px] font-black text-white/60 hover:text-white hover:bg-white/5 rounded-lg cursor-pointer py-2 px-3">NEWEST</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortOrder('oldest')} className="text-[10px] font-black text-white/60 hover:text-white hover:bg-white/5 rounded-lg cursor-pointer py-2 px-3">OLDEST</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortOrder('alphabetical')} className="text-[10px] font-black text-white/60 hover:text-white hover:bg-white/5 rounded-lg cursor-pointer py-2 px-3">A-Z</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <button 
                  onClick={handleChatWithBoard} 
                  className="text-[9px] font-black tracking-[0.2em] text-white/30 hover:text-white transition-colors uppercase py-2 px-3 hover:bg-white/5 rounded-lg flex items-center gap-2"
                  title="Chat with board"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  {!paneItem && <span>CHAT</span>}
                </button>
                
                <button 
                  onClick={handleShareBoard} 
                  className="text-[9px] font-black tracking-[0.2em] text-white/30 hover:text-white transition-colors uppercase py-2 px-3 hover:bg-white/5 rounded-lg flex items-center gap-2"
                  title="Share board"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  {!paneItem && <span>SHARE</span>}
                </button>

                <div className="w-px h-4 bg-white/5 hidden sm:block" />
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-2.5 rounded-xl hover:bg-white/5 text-white/20 hover:text-white transition-all">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-[#161616] border-white/10 rounded-xl p-1 shadow-2xl min-w-[160px]">
                    <DropdownMenuItem 
                      onClick={handleDeleteBoard}
                      className="text-rose-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg cursor-pointer text-xs font-bold gap-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete Board
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Board Content Area */}
            <ScrollArea className="flex-1">
              {items.length > 0 ? (
                <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">

                   {sortedItems.map((item) => (
                    <ContextMenu.Root key={item.id}>
                      <ContextMenu.Trigger>
                        <motion.div 
                          layout
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="aspect-square rounded-[2rem] bg-white/[0.02] border border-white/5 overflow-hidden hover:bg-white/[0.04] hover:border-white/10 transition-all group flex flex-col shadow-2xl relative"
                        >
                          {/* Media Preview */}
                          <div 
                            className="flex-1 bg-black/40 relative overflow-hidden group-hover:bg-black/20 transition-all cursor-pointer" 
                            onClick={() => setPaneItem(item)}
                          >
                            {renderItemPreview(item)}

                            {/* Overlay Actions */}
                            <div className="absolute top-5 right-5 flex gap-2">
                               <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button className="opacity-0 group-hover:opacity-100 p-2.5 bg-black/60 backdrop-blur-md hover:bg-black/80 rounded-2xl transition-all border border-white/10 shadow-xl">
                                    <MoreHorizontal className="w-4 h-4 text-white/60" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-[#161616] border-white/10 rounded-xl p-1 shadow-2xl">
                                  <DropdownMenuItem 
                                    onClick={() => handleDeleteItem(item.id)}
                                    className="text-rose-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg cursor-pointer text-xs font-bold gap-2"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" /> Delete Item
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>

                          {/* Content Info */}
                          <div className="p-6 pt-0 mt-5 space-y-2">
                            <div className="flex items-center gap-2.5 mb-1.5">
                              <div className={cn("w-2 h-2 rounded-full", 
                                item.type === 'video' ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.4)]' : 
                                item.type === 'note' ? 'bg-primary shadow-[0_0_10px_rgba(5,77,68,0.4)]' : 
                                item.type === 'file' ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.4)]' : 'bg-emerald-500/40'
                              )} />
                              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">{item.type}</span>
                            </div>
                            <h4 className="text-[14px] font-bold text-white/80 line-clamp-2 leading-relaxed group-hover:text-white transition-colors">{item.title}</h4>
                            <p className="text-[11px] text-white/20 font-bold">
                              {formatDistanceToNow(new Date(item.created_at))} ago
                            </p>
                          </div>
                        </motion.div>
                      </ContextMenu.Trigger>
                      
                      <ContextMenu.Portal>
                        <ContextMenu.Content className="min-w-[220px] bg-[#161616]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[100] animate-in fade-in zoom-in-95 duration-150">
                          <ContextMenu.Item 
                            onClick={() => setPaneItem(item)}
                            className="flex items-center justify-between px-3 py-2.5 text-[11px] font-bold text-white/60 hover:text-white hover:bg-white/5 rounded-xl outline-none cursor-pointer transition-all gap-8"
                          >

                            <div className="flex items-center gap-3">
                              <ExternalLink className="w-3.5 h-3.5" /> Open in Pane
                            </div>
                            <span className="text-[9px] text-white/20 tracking-widest font-black uppercase">Alt ↵</span>
                          </ContextMenu.Item>
                          <ContextMenu.Item className="flex items-center gap-3 px-3 py-2.5 text-[11px] font-bold text-white/60 hover:text-white hover:bg-white/5 rounded-xl outline-none cursor-pointer transition-all">
                            <MessageSquare className="w-3.5 h-3.5" /> Chat with
                          </ContextMenu.Item>
                          <ContextMenu.Item 
                            onClick={() => item.url && window.open(item.url, '_blank')}
                            className="flex items-center gap-3 px-3 py-2.5 text-[11px] font-bold text-white/60 hover:text-white hover:bg-white/5 rounded-xl outline-none cursor-pointer transition-all"
                          >
                            <Upload className="w-3.5 h-3.5 rotate-180" /> Download
                          </ContextMenu.Item>
                          
                          <ContextMenu.Separator className="h-px bg-white/5 my-1.5" />
                          
                          <ContextMenu.Item className="flex items-center gap-3 px-3 py-2.5 text-[11px] font-bold text-white/60 hover:text-white hover:bg-white/5 rounded-xl outline-none cursor-pointer transition-all">
                            <FileText className="w-3.5 h-3.5" /> Rename
                          </ContextMenu.Item>
                          <ContextMenu.Item className="flex items-center gap-3 px-3 py-2.5 text-[11px] font-bold text-white/60 hover:text-white hover:bg-white/5 rounded-xl outline-none cursor-pointer transition-all">
                            <PlusCircle className="w-3.5 h-3.5" /> Duplicate to Board
                          </ContextMenu.Item>
                          <ContextMenu.Item className="flex items-center gap-3 px-3 py-2.5 text-[11px] font-bold text-white/60 hover:text-white hover:bg-white/5 rounded-xl outline-none cursor-pointer transition-all">
                            <ArrowRight className="w-3.5 h-3.5" /> Move to Board
                          </ContextMenu.Item>

                          <ContextMenu.Separator className="h-px bg-white/5 my-1.5" />
                          
                          <ContextMenu.Item 
                            onClick={() => handleDeleteItem(item.id)}
                            className="flex items-center justify-between px-3 py-2.5 text-[11px] font-bold text-rose-400 hover:bg-rose-500/10 rounded-xl outline-none cursor-pointer transition-all"
                          >
                            <div className="flex items-center gap-3">
                              <Trash2 className="w-3.5 h-3.5" /> Delete
                            </div>
                            <span className="opacity-40">⌫</span>
                          </ContextMenu.Item>
                        </ContextMenu.Content>
                      </ContextMenu.Portal>
                    </ContextMenu.Root>
                  ))}
                </div>
              ) : (
                <div className="min-h-full flex items-center justify-center p-8">
                  <div className="w-full max-w-xl bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-10 md:p-14 shadow-2xl relative overflow-hidden group/board">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent opacity-0 group-hover/board:opacity-100 transition-opacity duration-700" />
                    
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-10">
                        <div className="space-y-1">
                          <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20">Board Canvas</h3>
                          <p className="text-xs text-white/40 leading-relaxed max-w-[240px]">New items will land here in a tidy grid.</p>
                        </div>
                        <Button 
                          variant="ghost" 
                          onClick={() => setShowTemplatesModal(true)}
                          className="h-12 rounded-2xl border border-white/10 bg-white/5 px-5 text-[9px] font-black uppercase tracking-[0.2em] text-white/60 hover:bg-white/10 transition-all shadow-xl"
                        >
                          <LayoutTemplate className="w-4 h-4 mr-2" /> Templates
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
                            className="w-full flex items-center justify-between group/btn px-4 py-4 rounded-[1.5rem] hover:bg-white/[0.03] border border-transparent hover:border-white/5 transition-all text-left"
                          >
                            <div className="flex items-center gap-5">
                              <div className="w-11 h-11 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-white/20 group-hover/btn:text-white group-hover/btn:bg-white/10 group-hover/btn:border-white/10 transition-all">
                                <item.icon className="w-4 h-4" />
                              </div>
                              <span className="text-[13px] font-bold text-white/50 group-hover/btn:text-white transition-colors">{item.label}</span>
                            </div>
                            <div className="px-3 py-1 rounded-xl text-[8px] font-black uppercase tracking-[0.2em] bg-white/5 text-white/20 border border-white/5 group-hover/btn:bg-white/10 group-hover/btn:text-white/40 transition-all">
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
     </ResizablePanel>

     {paneItem && (
       <>
         <ResizableHandle withHandle className="bg-white/5 hover:bg-primary/20 transition-colors duration-300">
            <div className="w-[2px] h-8 bg-primary/40 rounded-full animate-pulse" />
         </ResizableHandle>
         <ResizablePanel defaultSize={40} minSize={20} className="bg-[#0a0a0a] z-50">
           <div className="h-full flex flex-col relative">
             {isResizing && (
               <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px] z-[60] flex items-center justify-center">
                 <Loader2 className="w-6 h-6 animate-spin text-primary/40" />
               </div>
             )}
             <div className="h-14 flex items-center justify-between px-6 border-b border-white/5 bg-black/40 backdrop-blur-md">
               <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-white/40">
                   {paneItem.type === 'video' && <Video className="w-4 h-4" />}
                   {paneItem.type === 'file' && <File className="w-4 h-4" />}
                   {paneItem.type === 'note' && <FileText className="w-4 h-4" />}
                 </div>
                 <span className="text-xs font-bold text-white/60 truncate max-w-[200px]">{paneItem.title}</span>
               </div>
               <div className="flex items-center gap-2">
                 <Button variant="ghost" size="icon" onClick={() => window.open(paneItem.url!, '_blank')} className="w-8 h-8 rounded-lg text-white/20 hover:text-white">
                   <ExternalLink className="w-4 h-4" />
                 </Button>
                 <Button variant="ghost" size="icon" onClick={() => setPaneItem(null)} className="w-8 h-8 rounded-lg text-white/20 hover:text-rose-400">
                   <X className="w-4 h-4" />
                 </Button>
               </div>
             </div>
             <div className="flex-1 overflow-hidden p-6">
               {paneItem.type === 'video' ? (
                 <div className="aspect-video w-full rounded-2xl bg-black border border-white/5 overflow-hidden">
                   <iframe 
                     src={`https://www.youtube.com/embed/${paneItem.url?.match(/(?:v=|\/)([a-zA-Z0-9_-]{11})/)?.[1]}`}
                     className="w-full h-full border-0"
                     allowFullScreen
                   />
                 </div>
               ) : paneItem.type === 'file' && paneItem.url?.toLowerCase().endsWith('.pdf') ? (
                 <iframe 
                   src={`${paneItem.url}#toolbar=0`}
                   className="w-full h-full border-0 rounded-2xl bg-white"
                 />
               ) : paneItem.type === 'note' ? (
                 <ScrollArea className="h-full">
                   <div className="prose prose-invert max-w-none">
                     <h1 className="text-2xl font-bold mb-4">{paneItem.title}</h1>
                     <div className="text-white/60 leading-relaxed">
                       {typeof paneItem.content === 'string' ? paneItem.content : 'No content available.'}
                     </div>
                   </div>
                 </ScrollArea>
               ) : paneItem.thumbnail_url ? (
                 <img src={paneItem.thumbnail_url} className="w-full rounded-2xl border border-white/5" alt={paneItem.title} />
               ) : (
                 <div className="h-full flex flex-col items-center justify-center text-white/5 gap-4">
                   <File className="w-16 h-16" />
                   <span className="text-[10px] font-black uppercase tracking-widest">Preview unavailable</span>
                   {paneItem.url && (
                     <Button variant="outline" onClick={() => window.open(paneItem.url!, '_blank')} className="border-white/5 bg-white/5">
                       Download Asset
                     </Button>
                   )}
                 </div>
               )}
             </div>
           </div>
         </ResizablePanel>
       </>
     )}
   </ResizablePanelGroup>

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
      <Dialog open={showTemplatesModal} onOpenChange={setShowTemplatesModal}>
        <DialogContent className="max-w-2xl rounded-3xl border-white/10 bg-[#0a0a0a] p-8 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white mb-4">Board Templates</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
            {TEMPLATES.map(t => (
              <button 
                key={t.title}
                onClick={() => handleSelectTemplate(t)}
                className="flex flex-col items-center justify-center p-6 rounded-[2rem] bg-white/5 border border-white/5 hover:border-white/20 hover:bg-white/10 transition-all gap-4 group"
              >
                <span className="text-4xl group-hover:scale-110 transition-transform">{t.emoji}</span>
                <span className="text-xs font-bold text-center text-white/60 group-hover:text-white">{t.title}</span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
      {/* Note Editor Canvas Overlay */}
      <AnimatePresence>
        {activeNote && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xl flex items-center justify-center p-8"
          >
            <div className="w-full h-full max-w-6xl bg-[#080808] border border-white/10 rounded-[3rem] shadow-2xl flex flex-col overflow-hidden">
              <div className="h-20 flex items-center justify-between px-10 border-b border-white/5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                    <FileText className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold text-white tracking-tight">{activeNote.title}</h2>
                </div>
                <Button 
                  variant="ghost" 
                  onClick={() => setActiveNote(null)}
                  className="rounded-2xl hover:bg-white/5 text-white/40"
                >
                  <Plus className="w-5 h-5 rotate-45" /> Close Canvas
                </Button>
              </div>
              <div className="flex-1 overflow-hidden p-10">
                <ScrollArea className="h-full">
                  <div className="max-w-3xl mx-auto prose prose-invert">
                    <h1 className="text-4xl font-bold mb-8">{activeNote.title}</h1>
                    <div className="text-white/60 leading-relaxed space-y-4">
                      {typeof activeNote.content === 'string' ? activeNote.content : 'Start documenting your research findings here...'}
                    </div>
                  </div>
                </ScrollArea>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};


export default MyBoards;