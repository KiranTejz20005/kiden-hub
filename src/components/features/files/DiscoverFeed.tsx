import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  RefreshCw, Search, Play, Award, Plus, ExternalLink,
  TrendingUp, X, Loader2, List, Trash2, GripVertical,
  Edit2, Link as LinkIcon, Globe, Twitter, BookOpen
} from 'lucide-react';
import { VirtuosoGrid } from 'react-virtuoso';
import { Reorder } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

import {
  fetchContentByCategory, scrapeAllPremiumChannels,
  normalizeContentPiece, searchContent
} from '@/services/discoverService';
import { nvidiaService } from '@/services/nvidia-service';
import { 
  addVideoToLibrary, getUserVideos, 
  deleteVideo, batchUpdatePositions 
} from '@/services/videoService';
import { 
  getPlaylists, createPlaylist, deletePlaylist, addVideoToPlaylist, 
  getPlaylistVideos, removeVideoFromPlaylist, updatePlaylist, Playlist 
} from '@/services/playlistService';
import { logActivity } from '@/services/activityService';
import { fetchRSS, saveRSSItem } from '@/services/rssService';
import { VideoPlayerModal } from './VideoPlayerModal';
import { VideoCard } from './VideoCard';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const CATEGORIES = ['All','Tech','Coding','Productivity','Startups','Education','Science',
  'Self-Improvement','Business','Design','Philosophy','Content creation','Videography'];

const SORT_OPTIONS = [
  { value: 'trending', label: 'Trending' },
  { value: 'recent',   label: 'Recent'   },
  { value: 'popular',  label: 'Popular'  },
] as const;

type SortValue = typeof SORT_OPTIONS[number]['value'];

export const DiscoverFeed = () => {
  const { user } = useAuth();
  const [tab, setTab]       = useState<'Discover'|'My Lists'>('Discover');
  const [category, setCat]  = useState('All');
  const [sort, setSort]     = useState<SortValue>('trending');
  const [items, setItems]   = useState<any[]>([]);
  const [myList, setMyList] = useState<any[]>([]);
  const [follows, setFollows] = useState<string[]>([]);
  const [loading, setLoading]   = useState(true);
  const [scraping, setScraping] = useState(false);
  const [progress, setProgress] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const cursorRef = useRef<{ lastValue: any; lastId: string } | undefined>();
  const [hasMore, setHasMore] = useState(true);
  const [loadingMyList, setLoadingMyList] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [activePlaylist, setActivePlaylist] = useState<string | 'all'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showAddUrlModal, setShowAddUrlModal] = useState(false);
  const [urlToAdd, setUrlToAdd] = useState('');
  const [isAddingUrl, setIsAddingUrl] = useState(false);

  // ── Callbacks ─────────────────────────────────────────────────────────────

  const fetchMyList = useCallback(async () => {
    if (!user) return;
    setLoadingMyList(true);
    
    try {
      let items = [];
      if (activePlaylist === 'all') {
        const { data } = await getUserVideos(user.id);
        items = data || [];
      } else {
        const { data } = await getPlaylistVideos(activePlaylist);
        items = data?.map((d: any) => ({ ...d.user_study_videos, playlist_item_id: d.id })) || [];
      }

      // Apply sorting
      if (sort === 'recent') {
        items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      } else if (sort === 'popular') {
        items.sort((a, b) => (Number(b.view_count) || 0) - (Number(a.view_count) || 0));
      } else if (sort === 'trending') {
        items.sort((a, b) => (b.virality_score || 0) - (a.virality_score || 0));
      }
      
      setMyList(items);
    } catch (err) {
      console.error('Fetch My List failed:', err);
    } finally {
      setLoadingMyList(false);
    }
  }, [user, activePlaylist, sort]);

  const fetchPlaylists = useCallback(async () => {
    if (!user) return;
    const { data } = await getPlaylists(user.id);
    if (data) setPlaylists(data);
  }, [user]);

  const loadItems = useCallback(async (reset = false) => {
    if (loading && !reset) return;
    setLoading(true);
    
    try {
      const currentCursor = reset ? undefined : cursorRef.current;
      const { items: data, nextCursor } = await fetchContentByCategory(category, 24, currentCursor, sort);
      
      // Filter out any null/undefined items before setting state
      const validData = (data || []).filter(item => item && typeof item === 'object' && item.id);
      
      if (reset) { 
        setItems(validData); 
      } else { 
        setItems(prev => {
          const existingIds = new Set(prev.map(i => i.id));
          const uniqueNew = validData.filter(i => !existingIds.has(i.id));
          return [...prev, ...uniqueNew];
        }); 
      }
      
      cursorRef.current = nextCursor;
      setHasMore(!!nextCursor);
    } catch (err) {
      console.error('Load items failed:', err);
    } finally {
      setLoading(false);
    }
  }, [category, sort, loading]);

  const handleFollow = useCallback(async (item: any) => {
    if (!user) return;
    const v = normalizeContentPiece(item);
    const already = follows.includes(v.channel_id);
    try {
      if (already) {
        await supabase.from('user_follows').delete().eq('user_id', user.id).eq('channel_id', v.channel_id);
        setFollows(p => p.filter(id => id !== v.channel_id));
        toast.success(`Unfollowed ${v.channel_name}`);
      } else {
        await supabase.from('user_follows').insert({ 
          user_id: user.id, 
          channel_id: v.channel_id, 
          channel_name: v.channel_name, 
          channel_avatar: v.channel_avatar 
        });
        logActivity(user.id, 'follow_creator', v.channel_name, 'creator');
        setFollows(p => [...p, v.channel_id]);
        toast.success(`Following ${v.channel_name}`);
      }
    } catch (err) {
      toast.error('Action failed');
    }
  }, [user, follows]);

  const handleAdd = useCallback(async (item: any) => {
    if (!user) return;
    const v = normalizeContentPiece(item);
    
    try {
      const { data: libData, error: libError } = await addVideoToLibrary(user.id, {
        id: v.video_id, title: item.title, channel: v.channel_name,
        thumbnail: v.high_res_thumbnail || v.thumbnail_url,
        url: v.video_url, duration: v.duration_seconds, views: v.view_count
      });

      if (activePlaylist !== 'all') {
        let dbId = libData?.id;
        if (!dbId) {
          const { data: existing } = await supabase.from('user_study_videos')
            .select('id').eq('user_id', user.id).eq('video_id', v.video_id).maybeSingle();
          dbId = existing?.id;
        }
        if (dbId) await addVideoToPlaylist(activePlaylist, dbId);
      }

      if (libError && activePlaylist === 'all') {
        toast.error('Already in library');
      } else {
        logActivity(user.id, 'add_to_library', item.title, 'video');
        toast.success('Saved to list ✓');
        fetchMyList();
      }
    } catch (err) {
      toast.error('Failed to save video');
    }
  }, [user, activePlaylist, fetchMyList]);

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setIsSearching(false);
      loadItems(true);
      return;
    }
    setIsSearching(true);
    setLoading(true);
    try {
      // 1. Generate semantic embedding
      let embedding: number[] | undefined;
      try {
        embedding = await nvidiaService.generateEmbedding(query);
      } catch (err) {
        console.warn('Embedding fallback:', err);
      }

      // 2. Search
      const results = await searchContent(query, category, 40, embedding);
      const normalizedResults = results
        .map(normalizeContentPiece)
        .filter(item => item && typeof item === 'object' && item.id && item.title)
        // Sort by date (most recent first)
        .sort((a, b) => {
          const dateA = new Date(a.published_at || a.created_at || 0).getTime();
          const dateB = new Date(b.published_at || b.created_at || 0).getTime();
          return dateB - dateA;
        });
      setItems(normalizedResults);
      setHasMore(false);
    } catch (err) {
      toast.error('Search failed');
    } finally {
      setIsSearching(false);
      setLoading(false);
    }
  }, [category, sort]);

  const handleReorder = async (newOrder: any[]) => {
    setMyList(newOrder);
    const updates = newOrder.map((item, idx) => ({ id: item.id, position: idx }));
    await batchUpdatePositions(updates);
  };

  const handleAddToPlaylist = useCallback(async (playlistId: string, item: any) => {
    if (!user) return;
    const v = normalizeContentPiece(item);
    try {
      const { data: libraryVideo } = await supabase.from('user_study_videos')
        .select('id').eq('user_id', user.id).eq('video_id', v.video_id).maybeSingle();
      
      let dbId = libraryVideo?.id;
      if (!dbId) {
        const { data } = await addVideoToLibrary(user.id, {
          id: v.video_id, title: item.title, channel: v.channel_name,
          thumbnail: v.high_res_thumbnail || v.thumbnail_url,
          url: v.video_url, duration: v.duration_seconds, views: v.view_count
        });
        dbId = data?.id;
      }

      if (!dbId) return;
      const { error } = await addVideoToPlaylist(playlistId, dbId);
      if (error) {
        toast.error('Already in this playlist');
      } else {
        toast.success('Saved to playlist ✓');
        if (activePlaylist === playlistId) fetchMyList();
      }
    } catch (err) {
      toast.error('Failed to add to playlist');
    }
  }, [user, activePlaylist, fetchMyList]);

  // ── Effects ───────────────────────────────────────────────────────────────

  useEffect(() => {
    if (tab === 'My Lists') {
      fetchMyList();
      fetchPlaylists();
    }
  }, [tab, fetchMyList, fetchPlaylists]);

  useEffect(() => { 
    if (tab === 'Discover' && !isSearching) loadItems(true); 
  }, [category, sort, tab, isSearching]);

  useEffect(() => {
    if (tab !== 'Discover') return;
    
    const handler = setTimeout(async () => {
      handleSearch(searchQuery);
    }, 800);

    return () => clearTimeout(handler);
  }, [searchQuery, category, tab]);

  useEffect(() => {
    if (!user) return;
    supabase.from('user_follows').select('channel_id').eq('user_id', user.id)
      .then(({ data }) => setFollows(data?.map(f => f.channel_id) || []));
  }, [user]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleScrape = async () => {
    if (scraping) return;
    setScraping(true);
    setProgress('Starting discovery engine...');
    const tid = toast.loading('Discovery engine running...');
    try {
      await scrapeAllPremiumChannels((msg) => setProgress(msg));
      await loadItems(true);
      toast.success('Discovery complete!', { id: tid });
    } catch (e: any) { 
      toast.error(e.message, { id: tid }); 
    } finally { 
      setScraping(false); 
      setProgress(''); 
    }
  };

  const handleCreatePlaylist = async () => {
    if (!user || !newPlaylistName.trim()) return;
    const { error } = await createPlaylist(user.id, newPlaylistName);
    if (error) {
      toast.error('Failed to create playlist');
    } else {
      toast.success('Playlist created');
      setNewPlaylistName('');
      setShowCreateModal(false);
      fetchPlaylists();
    }
  };

  const handleRemoveFromList = async (item: any) => {
    const success = activePlaylist === 'all' 
      ? !(await deleteVideo(item.id)).error 
      : !(await removeVideoFromPlaylist(activePlaylist, item.id)).error;

    if (success) {
      setMyList(p => p.filter(v => v.id !== item.id));
      toast.success('Removed successfully');
    }
  };

  const handleAddUrl = async () => {
    if (!urlToAdd.trim() || !user) return;
    setIsAddingUrl(true);
    const tid = toast.loading('Ingesting resource...');
    try {
      if (urlToAdd.includes('rss') || urlToAdd.endsWith('.xml') || urlToAdd.includes('feed')) {
        const items = await fetchRSS(urlToAdd);
        if (items.length > 0) {
          await saveRSSItem(user.id, items[0]);
          toast.success(`Ingested: ${items[0].title}`, { id: tid });
        } else {
          toast.error('No items found in feed', { id: tid });
        }
      } else if (urlToAdd.includes('twitter.com') || urlToAdd.includes('x.com')) {
        // Simple placeholder for X ingestion
        await supabase.from('media_extractions').insert([{
          user_id: user.id,
          title: 'Social Thread',
          source_url: urlToAdd,
          source_type: 'social'
        }]);
        toast.success('Thread saved to library', { id: tid });
      } else if (urlToAdd.includes('youtube.com') || urlToAdd.includes('youtu.be')) {
        toast.error('Please use the regular YouTube discovery for videos', { id: tid });
      } else {
        // Generic Web Page
        await supabase.from('media_extractions').insert([{
          user_id: user.id,
          title: 'Web Resource',
          source_url: urlToAdd,
          source_type: 'web'
        }]);
        toast.success('Link saved to library', { id: tid });
      }
      setUrlToAdd('');
      setShowAddUrlModal(false);
      if (tab === 'My Lists') fetchMyList();
    } catch (err: any) {
      toast.error(err.message, { id: tid });
    } finally {
      setIsAddingUrl(false);
    }
  };

  // ── Effects ──────────────────────────────────────────────────────────────

  const gridComponents = useMemo(() => ({
    List: React.forwardRef(({ style, children, ...props }: any, ref) => (
      <div 
        ref={ref} 
        {...props} 
        style={{ 
          ...style, 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
          gap: '20px',
          paddingBottom: '40px'
        }}
      >
        {children}
      </div>
    )),
    Item: ({ children, ...props }: any) => (
      <div {...props} className="h-full">
        {children}
      </div>
    )
  }), []);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-5 py-4 h-full overflow-hidden pr-1">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center gap-6 shrink-0 px-1">
        <div className="flex items-center gap-6">
          {(['Discover','My Lists'] as const).map(t => (
            <button 
              key={t} 
              onClick={() => setTab(t)}
              className={cn(
                'text-2xl font-bold pb-1 transition-all relative', 
                tab===t ? 'text-foreground' : 'text-muted-foreground/40 hover:text-muted-foreground'
              )}
            >
              {t}
              {tab === t && (
                <motion.div 
                  layoutId="activeTab" 
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" 
                />
              )}
            </button>
          ))}
        </div>

        {tab === 'Discover' && (
          <div className="flex-1 max-w-md relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input 
              type="text"
              placeholder="Search concepts, topics, or creators..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-card border border-border/50 rounded-2xl pl-11 pr-10 py-2.5 text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all shadow-sm"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-white/5 text-muted-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        <div className="ml-auto flex items-center gap-2">
          <select 
            value={sort} 
            onChange={e => setSort(e.target.value as any)}
            className="bg-card border border-border text-xs font-bold text-muted-foreground rounded-xl px-3 py-2 focus:outline-none focus:border-primary/50 cursor-pointer hover:bg-white/5 transition-colors"
          >
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <button 
            onClick={() => setShowAddUrlModal(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all font-bold text-xs"
          >
            <Plus className="w-3.5 h-3.5" /> Ingest URL
          </button>
          <button 
            onClick={handleScrape} 
            disabled={scraping}
            className="p-2 rounded-xl hover:bg-card text-muted-foreground transition-all disabled:opacity-50"
            title="Refresh Discovery Engine"
          >
            <RefreshCw className={cn('w-4 h-4', scraping && 'animate-spin')}/>
          </button>
        </div>
      </div>

      <Dialog open={showAddUrlModal} onOpenChange={setShowAddUrlModal}>
        <DialogContent className="sm:max-w-md bg-[#050505] border-white/10 rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" /> Ingest New Resource
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              Paste a URL to save it to your Asset Library. Supports <span className="text-white font-bold">RSS Feeds</span>, <span className="text-white font-bold">X Threads</span>, and <span className="text-white font-bold">Web Articles</span>.
            </p>
            <div className="relative">
              <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                autoFocus
                placeholder="https://..."
                value={urlToAdd}
                onChange={e => setUrlToAdd(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-primary/50 transition-all"
                onKeyDown={e => e.key === 'Enter' && handleAddUrl()}
              />
            </div>
            <div className="flex gap-2">
              <div className="flex-1 p-3 rounded-xl bg-white/5 border border-white/5 flex flex-col items-center gap-1">
                <BookOpen className="w-4 h-4 text-emerald-400" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase">RSS Feed</span>
              </div>
              <div className="flex-1 p-3 rounded-xl bg-white/5 border border-white/5 flex flex-col items-center gap-1">
                <Twitter className="w-4 h-4 text-blue-400" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase">X Thread</span>
              </div>
              <div className="flex-1 p-3 rounded-xl bg-white/5 border border-white/5 flex flex-col items-center gap-1">
                <Globe className="w-4 h-4 text-teal-400" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Web Link</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowAddUrlModal(false)} className="rounded-xl font-bold">Cancel</Button>
            <Button 
              onClick={handleAddUrl} 
              disabled={isAddingUrl || !urlToAdd.trim()}
              className="rounded-xl font-bold bg-primary hover:bg-primary/90 px-8"
            >
              {isAddingUrl ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Save Resource
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex-1 overflow-hidden min-h-0">
        <AnimatePresence mode="wait">
          {tab === 'Discover' ? (
            <motion.div 
              key="discover"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="h-full flex flex-col gap-4"
            >
              {/* Category Pills */}
              <div className="flex flex-wrap gap-2 shrink-0 pb-4">
                {CATEGORIES.map(cat => (
                  <button 
                    key={cat} 
                    onClick={() => setCat(cat)}
                    className={cn(
                      'px-5 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest border transition-all',
                      category===cat 
                        ? 'bg-emerald-500 text-white border-emerald-500 shadow-xl shadow-emerald-500/20 scale-105' 
                        : 'bg-secondary/30 text-muted-foreground border-white/5 hover:border-emerald-500/30 hover:text-foreground'
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {scraping && progress && (
                <div className="text-[10px] text-teal-400 font-bold uppercase tracking-widest animate-pulse px-1 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                  {progress}
                </div>
              )}

              {loading && items.length === 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 px-1 overflow-hidden">
                  {[...Array(8)].map((_,i) => (
                    <div key={i} className="aspect-[4/5] bg-card border border-border/30 rounded-3xl animate-pulse"/>
                  ))}
                </div>
              ) : items.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-white/5 rounded-[2.5rem] mx-1">
                  <TrendingUp className="w-12 h-12 text-white/10 mb-6"/>
                  <h3 className="text-xl font-bold">Engine ready to sync</h3>
                  <p className="text-sm text-muted-foreground mt-2 max-w-xs leading-relaxed">
                    Access the internet's highest-signal educational content. Synchronize with our premium creators index.
                  </p>
                  <button 
                    onClick={handleScrape} 
                    disabled={scraping}
                    className="mt-8 px-10 py-3 rounded-full bg-white text-black font-black text-sm hover:scale-105 active:scale-95 transition-all disabled:opacity-60 flex items-center gap-2 shadow-xl shadow-white/10"
                  >
                    {scraping ? <><Loader2 className="w-4 h-4 animate-spin"/> Fetching...</> : 'Initialize Discovery'}
                  </button>
                </div>
              ) : (
                <VirtuosoGrid
                  data={items}
                  endReached={() => { if (hasMore && !loading) loadItems(); }}
                  components={gridComponents}
                  style={{ height: '100%', outline: 'none' }}
                  className="scrollbar-hide px-1"
                  itemContent={(index, item) => {
                    // Skip rendering if item is null/undefined
                    if (!item || typeof item !== 'object') {
                      return null;
                    }
                    return (
                      <VideoCard 
                        key={item.id || index} 
                        item={item}
                        onAdd={handleAdd} 
                        onFollow={handleFollow}
                        playlists={playlists} 
                        onAddToPlaylist={handleAddToPlaylist}
                        isFollowing={item && follows.includes(normalizeContentPiece(item).channel_id)}
                        onClick={setSelected}
                      />
                    );
                  }}
                  footer={() => (
                    <div className="h-20 flex items-center justify-center">
                      {loading && <Loader2 className="w-6 h-6 animate-spin text-primary/50"/>}
                      {!hasMore && (
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/30">
                          End of Discovery Index · {items.length} units
                        </p>
                      )}
                    </div>
                  )}
                />
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="mylists"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="h-full flex flex-col gap-6 overflow-y-auto scrollbar-hide px-1"
            >
              {/* My Lists Content */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar shrink-0">
                <button
                  onClick={() => setActivePlaylist('all')}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border",
                    activePlaylist === 'all' 
                      ? "bg-primary/20 border-primary text-primary" 
                      : "bg-card border-border/50 text-muted-foreground hover:border-border hover:text-white"
                  )}
                >
                  All Videos
                </button>
                {playlists.map(p => (
                  <div key={p.id} className="relative group/p">
                    <button
                      onClick={() => setActivePlaylist(p.id)}
                      className={cn(
                        "px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-2 pr-12",
                        activePlaylist === p.id 
                          ? "bg-primary/20 border-primary text-primary" 
                          : "bg-card border-border/50 text-muted-foreground hover:border-border hover:text-white"
                      )}
                    >
                      <List className="w-3 h-3" /> {p.name}
                    </button>
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-0 group-hover/p:opacity-100 transition-all">
                      <button onClick={(e) => { e.stopPropagation(); }} className="p-1 rounded-md hover:bg-white/10 text-muted-foreground hover:text-white">
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); }} className="p-1 rounded-md hover:bg-rose-500/20 text-muted-foreground hover:text-rose-400">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
                <button 
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap bg-white/5 border border-dashed border-border/50 text-muted-foreground hover:text-white hover:border-border transition-all flex items-center gap-2"
                >
                  <Plus className="w-3 h-3" /> New Playlist
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold">
                    {activePlaylist === 'all' ? 'Your Library' : playlists.find(p => p.id === activePlaylist)?.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {activePlaylist === 'all' ? 'All saved videos across your playlists' : 'Manage this playlist\'s content'}
                  </p>
                </div>
              </div>

              {showCreateModal && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-card border border-primary/20 p-6 rounded-[2rem] shadow-2xl"
                >
                  <h4 className="text-lg font-bold mb-4">Create New Playlist</h4>
                  <div className="flex gap-2">
                    <input 
                      autoFocus
                      placeholder="e.g. Machine Learning Deep Dive"
                      value={newPlaylistName}
                      onChange={(e) => setNewPlaylistName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleCreatePlaylist()}
                      className="flex-1 bg-white/5 border border-border/50 rounded-xl px-4 py-2 outline-none focus:border-primary transition-all text-sm"
                    />
                    <button 
                      onClick={handleCreatePlaylist}
                      className="px-6 py-2 rounded-xl bg-primary text-primary-foreground font-black text-xs uppercase tracking-widest hover:opacity-90 transition-all"
                    >
                      Create
                    </button>
                    <button 
                      onClick={() => setShowCreateModal(false)}
                      className="px-4 py-2 rounded-xl hover:bg-white/5 transition-all text-xs font-bold"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              )}

              {loadingMyList ? (
                <div className="flex-1 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-primary/30"/>
                </div>
              ) : myList.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-white/5 rounded-[2.5rem]">
                  <List className="w-12 h-12 text-white/10 mb-6"/>
                  <h3 className="text-xl font-bold">Your list is empty</h3>
                  <p className="text-sm text-muted-foreground mt-2 max-w-xs">Start adding videos from the Discover tab to build your custom learning library.</p>
                </div>
              ) : (
                <Reorder.Group axis="y" values={myList} onReorder={handleReorder} className="space-y-3 pb-20">
                  {myList.map((item) => (
                    <Reorder.Item 
                      key={item.id} 
                      value={item}
                      whileDrag={{ scale: 1.02, boxShadow: "0 20px 50px rgba(0,0,0,0.5)", zIndex: 50 }}
                      className="group flex items-center gap-4 bg-card border border-border/30 p-4 rounded-[1.5rem] hover:border-primary/30 transition-all cursor-default"
                    >
                      <div className="cursor-grab active:cursor-grabbing text-muted-foreground/30 group-hover:text-primary transition-colors">
                        <GripVertical className="w-5 h-5" />
                      </div>
                      
                      <div className="w-32 aspect-video rounded-xl overflow-hidden bg-black/40 shrink-0 relative cursor-pointer" onClick={() => setSelected(item)}>
                        <img src={item.thumbnail_url} alt="" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                          <Play className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="text-[14px] font-bold truncate group-hover:text-primary transition-colors cursor-pointer" onClick={() => setSelected(item)}>{item.title}</h4>
                        <p className="text-[12px] text-muted-foreground mt-1">{item.channel_name} • {Math.floor((item.duration || 0)/60)}m</p>
                      </div>

                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setSelected(item)} title="Preview" className="p-2 rounded-xl hover:bg-white/5 text-muted-foreground hover:text-white transition-all">
                          <ExternalLink className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleRemoveFromList(item)} title="Remove" className="p-2 rounded-xl hover:bg-rose-500/10 text-muted-foreground hover:text-rose-400 transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </Reorder.Item>
                  ))}
                </Reorder.Group>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <VideoPlayerModal 
        isOpen={!!selected} 
        video={selected ? normalizeContentPiece(selected) : null}
        onClose={() => setSelected(null)} 
        onAdd={handleAdd}
      />
    </div>
  );
};
