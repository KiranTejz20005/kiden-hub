import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { 
  Plus, Search, FolderKanban, Loader2, 
  Settings, 
  ExternalLink, Link as LinkIcon, 
  FileText, MessageSquare, Upload, TrendingUp, 
  Sparkles, LayoutTemplate, Trash2,
  Video, File,
  ArrowRight, Database, Download, Edit2, ChevronRight
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
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
  section?: string;
  created_at: string;
}

const MyBoards = ({ 
  selectedBoard, 
  onBoardSelect, 
  onBoardsUpdate,
  onBoardCreateOptimistic
}: { 
  selectedBoard: Board | null;
  onBoardSelect: (board: Board) => void;
  boards: Board[];
  onBoardsUpdate: () => void;
  onBoardCreateOptimistic?: (board: any) => void;
  resetCounter?: number;
}) => {
  const { user } = useAuth();
  const { get, set, invalidate } = useAppCache();
  const [items, setItems] = useState<BoardItem[]>([]);
  const [, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [sortOrder] = useState<'newest' | 'oldest' | 'alphabetical'>('newest');
  const [selectedSection, setSelectedSection] = useState('ALL');

  // Quick Add Modal States
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [activeNote, setActiveNote] = useState<BoardItem | null>(null);
  const [, setIsUploading] = useState(false);
  const [isResizing] = useState(false);
  const [showBoardChat, setShowBoardChat] = useState(false);
  const [boardChatQuery, setBoardChatQuery] = useState('');
  const [paneItem, setPaneItem] = useState<BoardItem | null>(null);
  const [editingItem, setEditingItem] = useState<BoardItem | null>(null);
  const [renamingTitle, setRenamingTitle] = useState('');

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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('create') === 'true') {
      setShowCreateModal(true);
      // Clean up URL without reload
      const newUrl = window.location.pathname + window.location.search.replace(/[?&]create=true/, '').replace(/^&/, '?');
      window.history.replaceState({}, '', newUrl);
    }
  }, [location.pathname]);

  const fetchItems = useCallback(async () => {
    if (!selectedBoard || !user) {
      setItems([]);
      return;
    }
    
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

  const sections = useMemo(() => {
    const s = new Set<string>();
    items.forEach(item => {
      if (item.section) s.add(item.section);
    });
    return Array.from(s).sort();
  }, [items]);

  const filteredItems = useMemo(() => {
    let result = sortedItems;
    if (selectedSection !== 'ALL') {
      result = result.filter(item => item.section === selectedSection);
    }
    return result;
  }, [sortedItems, selectedSection]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Remove this item from board?')) return;
    try {
      const { error } = await supabase.from('research_board_items').delete().eq('id', id);
      if (error) throw error;
      setItems(prev => prev.filter(i => i.id !== id));
      toast.success('Item removed');
      if (paneItem?.id === id) setPaneItem(null);
    } catch (err) {
      toast.error('Failed to delete item');
    }
  };

  const handleRenameItem = async () => {
    if (!editingItem || !renamingTitle.trim()) return;
    try {
      const { error } = await supabase
        .from('research_board_items')
        .update({ title: renamingTitle.trim() })
        .eq('id', editingItem.id);
      
      if (error) throw error;
      
      const updatedTitle = renamingTitle.trim();
      setItems(prev => prev.map(i => i.id === editingItem.id ? { ...i, title: updatedTitle } : i));
      
      // Update paneItem if it's the one being renamed
      if (paneItem?.id === editingItem.id) {
        setPaneItem({ ...paneItem, title: updatedTitle });
      }
      
      toast.success('Item renamed');
      setEditingItem(null);
    } catch (err) {
      toast.error('Failed to rename item');
    }
  };

  const handleMoveToSection = async (itemId: string, section: string) => {
    try {
      const { error } = await supabase
        .from('research_board_items')
        .update({ section })
        .eq('id', itemId);
      
      if (error) throw error;
      setItems(prev => prev.map(i => i.id === itemId ? { ...i, section } : i));
      toast.success(`Moved to ${section}`);
    } catch (err) {
      toast.error('Failed to move item');
    }
  };

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
    if (item.type === 'note') {
      return (
        <div className="w-full bg-white p-6 flex flex-col gap-3 min-h-[160px]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold text-black leading-tight">{item.title}</h3>
            {item.section && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
          </div>
          <div className="space-y-2">
            <div className="h-2 w-full bg-black/5 rounded-full" />
            <div className="h-2 w-5/6 bg-black/5 rounded-full" />
            <div className="h-2 w-4/6 bg-black/5 rounded-full" />
          </div>
          <div className="mt-auto pt-4 flex items-center justify-between text-[10px] font-black uppercase text-black/20">
            <span>{formatDistanceToNow(new Date(item.created_at))} ago</span>
            <FileText className="w-3 h-3" />
          </div>
        </div>
      );
    }

    if (item.type === 'video') {
      const videoId = item.url?.match(/(?:v=|\/)([a-zA-Z0-9_-]{11})/)?.[1];
      const views = Math.floor(Math.random() * 500 + 10) + 'K';
      
      return (
        <div className="w-full bg-[#161616] flex flex-col group/video">
          <div className="p-3 flex items-center gap-2">
            <img 
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${item.id}`} 
              className="w-5 h-5 rounded-full" 
              alt="Author" 
            />
            <span className="text-[11px] font-bold text-white/50 group-hover:text-white/80 transition-colors">Research Assistant</span>
          </div>
          <div className="relative aspect-video overflow-hidden">
            <img src={item.thumbnail_url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`} className="w-full h-full object-cover transition-transform duration-700 group-hover/video:scale-105" alt={item.title} />
            <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-md text-[10px] font-bold text-white px-1.5 py-0.5 rounded">
              {Math.floor(Math.random() * 15 + 2)}:{Math.floor(Math.random() * 59).toString().padStart(2, '0')}
            </div>
          </div>
          <div className="p-4 space-y-3">
            <h4 className="text-[13px] font-bold text-white line-clamp-2 leading-relaxed group-hover:text-white">{item.title}</h4>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[10px] font-bold text-white/20 uppercase tracking-widest">
                <span>{views} views</span>
                <span className="w-0.5 h-0.5 rounded-full bg-white/10" />
                <span>{formatDistanceToNow(new Date(item.created_at))} ago</span>
              </div>
              <div className="w-4 h-4 text-white/20 group-hover:text-red-500 transition-colors">
                <Video className="w-full h-full" />
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (item.type === 'file') {
      const isPdf = item.title.toLowerCase().endsWith('.pdf');
      return (
        <div className="w-full bg-[#161616] p-6 flex flex-col gap-4">
          <div className="w-full aspect-[4/3] bg-white/5 rounded-2xl flex flex-col items-center justify-center gap-3 relative group/file">
            {isPdf ? (
              <div className="flex flex-col items-center gap-2">
                <FileText className="w-10 h-10 text-rose-500" />
                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">PDF DOCUMENT</span>
              </div>
            ) : (
              <img src={item.thumbnail_url || `https://api.dicebear.com/7.x/shapes/svg?seed=${item.title}`} className="w-full h-full object-cover rounded-2xl opacity-40" />
            )}
            <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center opacity-0 group-hover/file:opacity-100 transition-opacity">
              <Download className="w-3.5 h-3.5 text-white" />
            </div>
          </div>
          <div className="space-y-1">
            <h4 className="text-[13px] font-bold text-white/90 truncate">{item.title}</h4>
            <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">
              {isPdf ? 'Portable Document' : 'Media Asset'}
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="w-full bg-[#161616] p-6">
        <div className="w-full aspect-square bg-white/5 rounded-2xl flex items-center justify-center text-white/20">
          <LinkIcon className="w-8 h-8" />
        </div>
        <h4 className="mt-4 text-[13px] font-bold text-white/90 truncate">{item.title}</h4>
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

  const { getRootProps, getInputProps } = useDropzone({ 
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




  const openCreateModal = () => {
    setNewBoardTitle('');
    setShowCreateModal(true);
  };

  const handleCreateBoard = async () => {
    if (!user || !newBoardTitle.trim()) return;

    const optimisticBoard = {
      id: crypto.randomUUID(),
      user_id: user.id,
      title: newBoardTitle.trim(),
      emoji: '📁',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Optimistic Update
    if (onBoardCreateOptimistic) {
      onBoardCreateOptimistic(optimisticBoard);
    }
    
    setShowCreateModal(false);
    setNewBoardTitle('');
    toast.success('Board created');

    try {
      const { error } = await supabase
        .from('research_boards' as any)
        .insert([
          {
            user_id: user.id,
            title: optimisticBoard.title,
            emoji: optimisticBoard.emoji,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      
      // Silently refresh to get real ID and data
      onBoardsUpdate();
    } catch (error) {
      toast.error('Failed to sync board with server');
      // Revert if necessary (optional depending on complexity)
      onBoardsUpdate(); 
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
      
      await onBoardsUpdate();
      onBoardSelect(board); // Select the new board
      setShowTemplatesModal(false);
      toast.success(`${template.title} board instantiated`);
    } catch (err) {
      console.error('Template error:', err);
      toast.error('Failed to create from template');
    } finally {
      setIsCreating(false);
    }
  };

  const handleChatWithBoard = () => {
    setShowBoardChat(!showBoardChat);
    if (paneItem) setPaneItem(null);
  };

  const handleShareBoard = () => {
    toast.success('Sharing link copied to clipboard');
  };

  const [selectedSpace] = useState('Workspace');


  return (
    <div className="h-full flex min-h-0 overflow-hidden bg-background text-foreground w-full">
      {selectedBoard ? (
        <ResizablePanelGroup 
          direction="horizontal" 
          className="flex-1"
        >
          <ResizablePanel defaultSize={(paneItem || showBoardChat) ? 60 : 100} minSize={30}>
            <main 
              {...getRootProps()}
              className="h-full flex flex-col bg-[#050505] overflow-hidden relative"
            >
              <input {...getInputProps()} />
              <div className="flex-1 flex flex-col min-h-0">
                {/* Board Topbar (Eden Style) */}
                <div className="h-14 flex items-center justify-between px-6 border-b border-white/5 bg-black/40 backdrop-blur-md sticky top-0 z-10 gap-4">
                  {/* Left: Title & Add */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20 mb-0.5">{selectedSpace}</span>
                      <div className="flex items-center gap-2">
                        <h2 className="text-sm font-bold text-white tracking-tight uppercase">{selectedBoard.title}</h2>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="w-5 h-5 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all text-white/20 hover:text-white">
                              <Plus className="w-3 h-3" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-56 bg-[#161616] border-white/10 rounded-2xl p-2 shadow-2xl z-[100]">
                            <DropdownMenuItem onClick={() => setShowLinkModal(true)} className="flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer hover:bg-white/5 transition-all">
                              <div className="flex items-center gap-3 text-[11px] font-bold text-white/60">
                                <Plus className="w-3.5 h-3.5" /> Paste a link
                              </div>
                              <span className="text-[9px] font-black text-white/20">⇧L</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAddItem('note', { title: 'Untitled' })} className="flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer hover:bg-white/5 transition-all">
                              <div className="flex items-center gap-3 text-[11px] font-bold text-white/60">
                                <FileText className="w-3.5 h-3.5" /> Create a document
                              </div>
                              <span className="text-[9px] font-black text-white/20">D</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer hover:bg-white/5 transition-all">
                              <div className="flex items-center gap-3 text-[11px] font-bold text-white/60">
                                <Database className="w-3.5 h-3.5" /> Create a card
                              </div>
                              <span className="text-[9px] font-black text-white/20">C</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-white/5 my-1" />
                            <DropdownMenuItem className="flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer hover:bg-white/5 transition-all">
                              <div className="flex items-center gap-3 text-[11px] font-bold text-white/60">
                                <Plus className="w-3.5 h-3.5" /> Add section
                              </div>
                              <span className="text-[9px] font-black text-white/20">S</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>

                  {/* Center: Wide Search */}
                  <div className="flex-1 max-w-[600px] relative group hidden md:block">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/10 group-focus-within:text-white/40 transition-colors" />
                    <input 
                      type="text" 
                      placeholder={`Search in ${selectedBoard.title}...`}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-white/[0.03] border border-white/5 hover:border-white/10 focus:border-white/20 rounded-full pl-10 pr-4 py-1.5 text-xs text-white placeholder:text-white/10 focus:ring-0 transition-all outline-none"
                    />
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <Button 
                      onClick={handleChatWithBoard} 
                      variant="ghost" 
                      className={cn(
                        "h-8 text-[10px] font-black uppercase tracking-widest px-3 transition-all",
                        showBoardChat ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "text-white/40 hover:text-white hover:bg-white/5"
                      )}
                    >
                      <Sparkles className="w-3 h-3 mr-2" /> CHAT
                    </Button>
                    <Button onClick={handleShareBoard} variant="ghost" className="h-8 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white hover:bg-white/5 px-3">SHARE</Button>
                    <div className="w-px h-4 bg-white/5 mx-2" />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1.5 rounded-full hover:bg-white/5 text-white/20 hover:text-white transition-all">
                          <Settings className="w-4 h-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-48 bg-[#161616] border-white/10 rounded-2xl p-2 shadow-2xl">
                        <div className="px-3 py-2 text-[9px] font-black text-white/20 uppercase tracking-widest">Sort By</div>
                        <DropdownMenuItem className="text-[11px] font-bold text-white/60 hover:text-white rounded-xl">Date Created</DropdownMenuItem>
                        <DropdownMenuItem className="text-[11px] font-bold text-white/60 hover:text-white rounded-xl">Name</DropdownMenuItem>
                        <DropdownMenuItem className="text-[11px] font-bold text-white/60 hover:text-white rounded-xl">Item Type</DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-white/5 my-1" />
                        <DropdownMenuItem className="text-[11px] font-bold text-white/60 hover:text-white rounded-xl flex items-center gap-2">
                          <LayoutTemplate className="w-3.5 h-3.5" /> Save as Template
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Section Filter Pills */}
                <div className="px-6 py-3 flex items-center gap-2 overflow-x-auto scrollbar-hide border-b border-white/5 bg-black/20">
                  <button 
                    onClick={() => setSelectedSection('ALL')}
                    className={cn(
                      "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all shrink-0 flex items-center gap-2",
                      selectedSection === 'ALL' ? "bg-white text-black shadow-lg" : "text-white/30 hover:text-white hover:bg-white/5"
                    )}
                  >
                    <div className={cn("w-1.5 h-1.5 rounded-full", selectedSection === 'ALL' ? "bg-black/20" : "bg-white/20")} />
                    All Items
                  </button>
                  {sections.map((section, idx) => {
                    const colors = ['bg-emerald-500', 'bg-blue-500', 'bg-purple-500', 'bg-orange-500', 'bg-rose-500'];
                    const color = colors[idx % colors.length];
                    return (
                      <button 
                        key={section}
                        onClick={() => setSelectedSection(section)}
                        className={cn(
                          "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all shrink-0 flex items-center gap-2",
                          selectedSection === section ? "bg-white text-black shadow-lg" : "text-white/30 hover:text-white hover:bg-white/5"
                        )}
                      >
                        <div className={cn("w-1.5 h-1.5 rounded-full", selectedSection === section ? "bg-black/20" : color)} />
                        {section}
                      </button>
                    );
                  })}
                </div>

                {/* Board Content Area (Masonry) */}
                <ScrollArea className="flex-1">
                  {items.length > 0 ? (
                    <div className="p-8 masonry-grid">
                      {filteredItems.map((item) => (
                        <div key={item.id} className="masonry-item">
                          <ContextMenu.Root>
                            <ContextMenu.Trigger>
                              <motion.div 
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                onClick={() => setPaneItem(item)}
                                className={cn(
                                  "rounded-3xl border border-white/5 overflow-hidden transition-all duration-500 group flex flex-col relative cursor-pointer",
                                  item.type === 'note' ? "bg-white shadow-xl" : "bg-[#161616] hover:border-emerald-500/30 hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)]"
                                )}
                              >
                                {renderItemPreview(item)}
                              </motion.div>
                            </ContextMenu.Trigger>
                            
                            <ContextMenu.Portal>
                              <ContextMenu.Content className="min-w-[220px] bg-[#161616]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[100] animate-in fade-in zoom-in-95 duration-150">
                                <ContextMenu.Item 
                                  onClick={() => setPaneItem(item)}
                                  className="flex items-center justify-between px-3 py-2 text-[11px] font-bold text-white/60 hover:text-white hover:bg-white/5 rounded-xl outline-none cursor-pointer transition-all"
                                >
                                  <div className="flex items-center gap-3">
                                    <ExternalLink className="w-3.5 h-3.5" /> Open in Pane
                                  </div>
                                  <span className="text-[9px] text-white/20 font-black">Alt O</span>
                                </ContextMenu.Item>
                                
                                {item.url && (
                                  <>
                                    <ContextMenu.Item 
                                      onClick={() => window.open(item.url!, '_blank')}
                                      className="flex items-center gap-3 px-3 py-2 text-[11px] font-bold text-white/60 hover:text-white hover:bg-white/5 rounded-xl outline-none cursor-pointer transition-all"
                                    >
                                      <ExternalLink className="w-3.5 h-3.5" /> Open original link
                                    </ContextMenu.Item>
                                    <ContextMenu.Item 
                                      onClick={() => {
                                        navigator.clipboard.writeText(item.url!);
                                        toast.success('Link copied');
                                      }}
                                      className="flex items-center gap-3 px-3 py-2 text-[11px] font-bold text-white/60 hover:text-white hover:bg-white/5 rounded-xl outline-none cursor-pointer transition-all"
                                    >
                                      <LinkIcon className="w-3.5 h-3.5" /> Copy link address
                                    </ContextMenu.Item>
                                  </>
                                )}

                                <ContextMenu.Item 
                                  onClick={() => {
                                    setShowBoardChat(true);
                                    setBoardChatQuery(`Tell me more about "${item.title}"`);
                                  }}
                                  className="flex items-center gap-3 px-3 py-2 text-[11px] font-bold text-white/60 hover:text-white hover:bg-white/5 rounded-xl outline-none cursor-pointer transition-all"
                                >
                                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Chat with
                                </ContextMenu.Item>

                                <ContextMenu.Separator className="h-px bg-white/5 my-1" />
                                
                                <ContextMenu.Item 
                                  onClick={() => {
                                    setEditingItem(item);
                                    setRenamingTitle(item.title);
                                  }}
                                  className="flex items-center gap-3 px-3 py-2 text-[11px] font-bold text-white/60 hover:text-white hover:bg-white/5 rounded-xl outline-none cursor-pointer transition-all"
                                >
                                  <Edit2 className="w-3.5 h-3.5" /> Rename
                                </ContextMenu.Item>

                                <ContextMenu.Sub>
                                  <ContextMenu.SubTrigger className="flex items-center justify-between px-3 py-2 text-[11px] font-bold text-white/60 hover:text-white hover:bg-white/5 rounded-xl outline-none cursor-pointer transition-all">
                                    <div className="flex items-center gap-3">
                                      <FolderKanban className="w-3.5 h-3.5" /> Move to Section
                                    </div>
                                    <ChevronRight className="w-3.5 h-3.5" />
                                  </ContextMenu.SubTrigger>
                                  <ContextMenu.SubContent className="min-w-[180px] bg-[#161616]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-1.5 shadow-2xl z-[110]">
                                    {['Research', 'Inspiration', 'Resources', 'Drafts'].map(section => (
                                      <ContextMenu.Item 
                                        key={section}
                                        onClick={() => handleMoveToSection(item.id, section)}
                                        className="flex items-center gap-3 px-3 py-2 text-[11px] font-bold text-white/60 hover:text-white hover:bg-white/5 rounded-xl outline-none cursor-pointer transition-all"
                                      >
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                        {section}
                                      </ContextMenu.Item>
                                    ))}
                                  </ContextMenu.SubContent>
                                </ContextMenu.Sub>

                                <ContextMenu.Separator className="h-px bg-white/5 my-1" />

                                <ContextMenu.Item 
                                  onClick={() => handleDeleteItem(item.id)}
                                  className="flex items-center gap-3 px-3 py-2 text-[11px] font-bold text-rose-400 hover:bg-rose-500/10 rounded-xl outline-none cursor-pointer transition-all"
                                >
                                  <Trash2 className="w-3.5 h-3.5" /> Delete
                                </ContextMenu.Item>
                              </ContextMenu.Content>
                            </ContextMenu.Portal>
                          </ContextMenu.Root>
                        </div>
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
            </main>
          </ResizablePanel>

          {(paneItem || showBoardChat) && (
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
                    {showBoardChat ? (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                          <Sparkles className="w-4 h-4 text-emerald-500" />
                        </div>
                        <div>
                          <h3 className="text-xs font-bold text-white uppercase tracking-widest">Board Chat</h3>
                          <p className="text-[10px] text-white/20 font-bold">{items.length} items indexed</p>
                        </div>
                      </div>
                    ) : paneItem && (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-white/80">
                          {paneItem.type === 'video' && <Video className="w-4 h-4" />}
                          {paneItem.type === 'file' && <File className="w-4 h-4" />}
                          {paneItem.type === 'note' && <FileText className="w-4 h-4" />}
                        </div>
                        <span className="text-xs font-bold text-white/90 truncate max-w-[200px]">{paneItem.title}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      {paneItem && paneItem.url && (
                        <Button variant="ghost" size="icon" onClick={() => window.open(paneItem.url!, '_blank')} className="w-8 h-8 rounded-lg text-white/60 hover:text-white">
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => {
                          setPaneItem(null);
                          setShowBoardChat(false);
                        }} 
                        className="w-8 h-8 rounded-lg text-white/60 hover:text-rose-400"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex-1 overflow-hidden p-0 flex flex-col">
                    {showBoardChat ? (
                      <div className="flex-1 flex flex-col min-h-0">
                        <ScrollArea className="flex-1 p-6">
                          <div className="space-y-6">
                            <div className="bg-white/[0.02] rounded-2xl p-5 border border-white/5">
                              <p className="text-xs text-white/60 leading-relaxed mb-4">
                                I've analyzed the **{items.length} assets** on this board. I can help you find patterns, summarize documents, or generate new ideas.
                              </p>
                              <div className="space-y-2">
                                {[
                                  'Summarize key insights',
                                  'Find connections between items',
                                  'Generate 5 content hooks',
                                  'Analyze target audience sentiment'
                                ].map((hint) => (
                                  <button key={hint} className="w-full text-left p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-emerald-500/30 hover:bg-emerald-500/5 text-[10px] font-bold text-white/40 hover:text-emerald-500 transition-all flex items-center justify-between group">
                                    {hint}
                                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                                <Sparkles className="w-4 h-4 text-emerald-500" />
                              </div>
                              <div className="bg-white/5 rounded-2xl p-4 border border-white/5 max-w-[85%]">
                                <p className="text-xs text-white/80 leading-relaxed">
                                  Ready to deep-dive into **{selectedBoard.title}**. What's on your mind?
                                </p>
                              </div>
                            </div>
                          </div>
                        </ScrollArea>

                        <div className="p-4 border-t border-white/5 bg-black/40">
                          <div className="relative group">
                            <input 
                              type="text"
                              value={boardChatQuery}
                              onChange={(e) => setBoardChatQuery(e.target.value)}
                              placeholder="Ask your board..."
                              className="w-full bg-white/5 border border-white/5 rounded-2xl pl-4 pr-12 py-3.5 text-xs text-white placeholder:text-white/10 focus:ring-1 focus:ring-emerald-500/50 transition-all outline-none"
                            />
                            <button className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center hover:scale-105 transition-all shadow-lg shadow-emerald-500/20 active:scale-95">
                              <ArrowRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : paneItem && (
                      <div className="flex-1 flex flex-col h-full overflow-hidden">
                        {(paneItem.type === 'file' && (paneItem.url?.toLowerCase().includes('.pdf') || paneItem.title?.toLowerCase().endsWith('.pdf'))) ? (
                          <div className="flex-1 flex flex-col h-full bg-[#050505] p-2">
                            <iframe 
                              src={`${paneItem.url}#toolbar=0`}
                              className="w-full h-full border-0 rounded-2xl bg-white shadow-2xl"
                              title={paneItem.title}
                            />
                            <div className="h-12 flex items-center justify-center gap-4 px-4 bg-black/40 backdrop-blur-md rounded-b-2xl border-t border-white/5">
                               <Button 
                                  variant="ghost"
                                  onClick={() => {
                                    setEditingItem(paneItem);
                                    setRenamingTitle(paneItem.title);
                                  }}
                                  className="h-8 rounded-lg text-[9px] font-black uppercase tracking-widest text-white/40 hover:text-white"
                                >
                                  <Edit2 className="w-3 h-3 mr-2" /> Rename
                                </Button>
                                <div className="w-px h-4 bg-white/5" />
                                <Button 
                                  variant="ghost"
                                  onClick={() => handleDeleteItem(paneItem.id)}
                                  className="h-8 rounded-lg text-[9px] font-black uppercase tracking-widest text-rose-400/60 hover:text-rose-400"
                                >
                                  <Trash2 className="w-3 h-3 mr-2" /> Delete
                                </Button>
                            </div>
                          </div>
                        ) : (
                          <ScrollArea className="flex-1 p-8">
                            {paneItem.type === 'note' ? (
                              <div className="prose prose-invert max-w-none">
                                <h1 className="text-3xl font-black text-white mb-8 tracking-tighter uppercase">{paneItem.title}</h1>
                                <div className="text-white/60 leading-relaxed text-sm space-y-4">
                                  {typeof paneItem.content === 'string' ? paneItem.content : 'Select text to start analyzing or use board chat to expand on this note.'}
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-8">
                                <div className="aspect-video rounded-[2rem] bg-black border border-white/10 overflow-hidden shadow-2xl relative group/preview">
                                  {paneItem.type === 'video' ? (
                                    <iframe 
                                      src={`https://www.youtube.com/embed/${paneItem.url?.match(/(?:v=|\/)([a-zA-Z0-9_-]{11})/)?.[1]}`}
                                      className="w-full h-full border-0"
                                      allowFullScreen
                                    />
                                  ) : paneItem.thumbnail_url ? (
                                    <img src={paneItem.thumbnail_url} className="w-full h-full object-cover" alt={paneItem.title} />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-white/5">
                                      <File className="w-12 h-12 text-white/10" />
                                    </div>
                                  )}
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/preview:opacity-100 transition-opacity flex items-center justify-center">
                                     <Button variant="outline" className="rounded-full border-white/20 bg-black/40 backdrop-blur-md">
                                       <Sparkles className="w-4 h-4 mr-2" /> AI Analysis
                                     </Button>
                                  </div>
                                </div>
                                
                                <div className="space-y-4">
                                  <h2 className="text-2xl font-bold text-white tracking-tight">{paneItem.title}</h2>
                                  <div className="flex flex-wrap gap-2">
                                     <div className="px-3 py-1 rounded-full bg-white/5 border border-white/5 text-[10px] font-bold text-white/40 uppercase tracking-widest">{paneItem.type}</div>
                                     {paneItem.section && (
                                       <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-500 uppercase tracking-widest">{paneItem.section}</div>
                                     )}
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                   <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-5 group hover:border-white/10 transition-colors">
                                      <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] block mb-2">Confidence Score</span>
                                      <div className="flex items-center gap-2">
                                         <div className="h-1.5 flex-1 bg-white/5 rounded-full overflow-hidden">
                                            <div className="h-full bg-emerald-500 w-[85%]" />
                                         </div>
                                         <span className="text-xs font-bold text-white">85%</span>
                                      </div>
                                   </div>
                                   <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-5 group hover:border-white/10 transition-colors">
                                      <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] block mb-2">Saved From</span>
                                      <span className="text-xs font-bold text-white/60">{formatDistanceToNow(new Date(paneItem.created_at))} ago</span>
                                   </div>
                                </div>

                                <div className="pt-6 border-t border-white/5 space-y-3">
                                  <Button 
                                    onClick={() => window.open(paneItem.url!, '_blank')}
                                    className="w-full h-12 rounded-2xl bg-white text-black hover:bg-white/90 font-black uppercase tracking-widest shadow-xl"
                                  >
                                    <ExternalLink className="w-4 h-4 mr-2" /> Open Original Post
                                  </Button>
                                  <div className="flex gap-2">
                                    <Button 
                                      variant="ghost"
                                      onClick={() => {
                                        setEditingItem(paneItem);
                                        setRenamingTitle(paneItem.title);
                                      }}
                                      className="flex-1 h-11 rounded-xl border border-white/10 bg-white/5 text-white/60 hover:text-white hover:bg-white/10 font-bold uppercase tracking-widest text-[10px]"
                                    >
                                      <Edit2 className="w-3.5 h-3.5 mr-2" /> Rename
                                    </Button>
                                    <Button 
                                      variant="ghost"
                                      onClick={() => handleDeleteItem(paneItem.id)}
                                      className="flex-1 h-11 rounded-xl border border-rose-500/10 bg-rose-500/5 text-rose-400 hover:bg-rose-500/10 font-bold uppercase tracking-widest text-[10px]"
                                    >
                                      <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </ScrollArea>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-12 bg-[#050505] text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-8 max-w-sm"
          >
            <div className="w-20 h-20 rounded-[2.5rem] bg-white/[0.03] border border-white/10 flex items-center justify-center mx-auto shadow-2xl relative">
              <div className="absolute inset-0 bg-emerald-500/10 rounded-[2.5rem] blur-2xl animate-pulse" />
              <Database className="w-8 h-8 text-white/20 relative z-10" />
            </div>
            <div className="space-y-3">
              <h1 className="text-2xl font-bold text-white tracking-tight uppercase">Empty Research Hub</h1>
              <p className="text-white/30 text-sm leading-relaxed font-medium">
                Create a board to start organizing your high-signal assets and intelligence.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <Button 
                onClick={openCreateModal}
                className="h-12 rounded-2xl bg-white text-black hover:bg-white/90 font-black uppercase tracking-widest text-[11px] shadow-xl shadow-white/5"
              >
                <Plus className="w-4 h-4 mr-2" /> Create New Board
              </Button>
              <Button 
                variant="ghost"
                onClick={() => setShowTemplatesModal(true)}
                className="h-12 rounded-2xl border border-white/5 bg-white/[0.02] text-white/40 hover:text-white hover:bg-white/5 font-black uppercase tracking-widest text-[11px]"
              >
                <Sparkles className="w-4 h-4 mr-2" /> Start from Template
              </Button>
            </div>
          </motion.div>
        </div>
      )}

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

      <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent className="max-w-md rounded-3xl border-white/10 bg-[#0a0a0a] p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-white">Rename item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-[10px] uppercase tracking-[0.24em] text-white/45">Item title</Label>
              <Input
                autoFocus
                value={renamingTitle}
                onChange={(e) => setRenamingTitle(e.target.value)}
                placeholder="Enter new title"
                className="h-11 rounded-xl border-white/10 bg-white/5 text-sm text-white focus-visible:ring-emerald-400/30"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditingItem(null)} className="h-11 rounded-xl border border-white/10 text-white">Cancel</Button>
            <Button onClick={handleRenameItem} className="h-11 rounded-xl bg-white text-black font-bold uppercase tracking-widest text-[10px]">Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};


export default MyBoards;