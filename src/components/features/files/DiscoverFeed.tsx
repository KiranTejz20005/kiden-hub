import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  RefreshCw, Search, Play, Eye, Award, Plus, ExternalLink,
  UserCheck, UserPlus, TrendingUp, X, Loader2, List, Trash2, GripVertical,
  MoreVertical, Edit2
} from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Reorder } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  fetchContentByCategory, scrapeAllPremiumChannels,
  normalizeContentPiece, searchContent
} from '@/services/discoverService';
import { 
  addVideoToLibrary, getUserVideos, updateVideoPosition, 
  deleteVideo, batchUpdatePositions 
} from '@/services/videoService';
import { 
  getPlaylists, createPlaylist, deletePlaylist, addVideoToPlaylist, 
  getPlaylistVideos, removeVideoFromPlaylist, updatePlaylist, Playlist 
} from '@/services/playlistService';
import { logActivity } from '@/services/activityService';
import { VideoPlayerModal } from './VideoPlayerModal';

const CATEGORIES = ['All','Tech','Coding','Productivity','Startups','Education','Science',
  'Self-Improvement','Business','Design','Philosophy','Content creation','Videography'];

const SORT_OPTIONS = [
  { value: 'trending', label: 'Trending' },
  { value: 'recent',   label: 'Recent'   },
  { value: 'popular',  label: 'Popular'  },
];

const fmt = (n: number) => n >= 1e6 ? (n/1e6).toFixed(1)+'M' : n >= 1e3 ? (n/1e3).toFixed(0)+'K' : String(n);

// ── Video Card ──────────────────────────────────────────────────────────────
const VideoCard = ({ item, onAdd, onFollow, isFollowing, onClick, playlists, onAddToPlaylist }: any) => {
  const v = normalizeContentPiece(item);
  const timeAgo = formatDistanceToNow(new Date(v.published_at), { addSuffix: true }).replace('about ','');

  return (
    <motion.div layout initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
      className="group flex flex-col bg-card border border-border/30 rounded-3xl overflow-hidden hover:border-primary/20 transition-all duration-300">
      {/* Header */}
      <div className="p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <img src={v.channel_avatar} alt="" className="w-8 h-8 rounded-full bg-white/5 shrink-0 object-cover" />
          <div className="min-w-0">
            <p className="text-[13px] font-bold truncate">{v.channel_name}</p>
            <p className="text-[11px] text-muted-foreground">{timeAgo}</p>
          </div>
        </div>
        <button onClick={() => onFollow(item)}
          className={cn('p-2 rounded-xl transition-all', isFollowing ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:bg-white/5')}>
          {isFollowing ? <UserCheck className="w-4 h-4"/> : <UserPlus className="w-4 h-4"/>}
        </button>
      </div>

      <div className="px-4 pb-2">
        <h3 className="text-[14px] font-medium leading-relaxed line-clamp-2">{item.title}</h3>
      </div>

      {/* Thumbnail */}
      <div className="relative aspect-video mx-4 mb-4 rounded-2xl overflow-hidden bg-black/40 cursor-pointer" onClick={() => onClick(item)}>
        <img src={v.high_res_thumbnail || v.thumbnail_url} alt={item.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/50 flex items-center justify-center transition-colors">
          <Play className="w-10 h-10 text-white opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300"/>
        </div>
        {item.quality_score >= 70 && (
          <div className="absolute top-2 left-2 px-2 py-1 rounded-lg bg-primary text-white text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
            <Award className="w-3 h-3"/> Premium
          </div>
        )}
        <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/80 text-[10px] font-bold text-white">
          {Math.floor(v.duration_seconds/60)}:{String(v.duration_seconds%60).padStart(2,'0')}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 pb-4 flex flex-col gap-3">
        <div className="flex items-center justify-between text-muted-foreground text-[12px]">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5"/> {fmt(v.view_count)}</span>
            <span className="px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 text-[10px] font-black" title="Virality Score">
              {item.virality_score.toFixed(1)}x
            </span>
            {item.outlier_score > 1.5 && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-black animate-pulse" title="Outlier Score: Performing significantly better than creator average">
                🔥 {item.outlier_score.toFixed(1)}x Signal
              </span>
            )}
            <span className="px-1.5 py-0.5 rounded-md bg-white/5 text-[9px] font-bold uppercase">{item.category}</span>
          </div>
          
          <div className="flex gap-1">
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button className="p-1.5 rounded-xl hover:bg-white/5 transition-all outline-none">
                  <Plus className="w-4 h-4 text-muted-foreground"/>
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content className="bg-card border border-border/50 rounded-2xl p-2 min-w-[180px] shadow-2xl z-50 animate-in fade-in zoom-in duration-200">
                  <DropdownMenu.Item onSelect={() => onAdd(item)} className="p-2 rounded-xl text-xs font-bold hover:bg-primary/10 hover:text-primary transition-all cursor-pointer outline-none flex items-center gap-2">
                    <Award className="w-3.5 h-3.5"/> Add to Library
                  </DropdownMenu.Item>
                  {playlists.length > 0 && <DropdownMenu.Separator className="h-px bg-white/5 my-1" />}
                  {playlists.map((p: any) => (
                    <DropdownMenu.Item key={p.id} onSelect={() => onAddToPlaylist(p.id, item)} className="p-2 rounded-xl text-[11px] hover:bg-white/5 transition-all cursor-pointer outline-none flex items-center gap-2">
                      <List className="w-3.5 h-3.5 opacity-50"/> {p.name}
                    </DropdownMenu.Item>
                  ))}
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
            <button onClick={() => onClick(item)} className="p-1.5 rounded-xl hover:bg-white/5 transition-all">
              <ExternalLink className="w-4 h-4 text-muted-foreground"/>
            </button>
          </div>
        </div>
        
        {item.ai_summary && (
          <div className="p-2 rounded-xl bg-primary/5 border border-primary/10">
            <p className="text-[10px] text-primary/80 italic line-clamp-2">“{item.ai_summary}”</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// ── Main Feed ───────────────────────────────────────────────────────────────
export const DiscoverFeed = () => {
  const { user } = useAuth();
  const [tab, setTab]       = useState<'Discover'|'My Lists'>('Discover');
  const [category, setCat]  = useState('All');
  const [sort, setSort]     = useState<'trending'|'recent'|'popular'>('trending');
  const [items, setItems]   = useState<any[]>([]);
  const [myList, setMyList] = useState<any[]>([]);
  const [follows, setFollows] = useState<string[]>([]);
  const [loading, setLoading]   = useState(true);
  const [scraping, setScraping] = useState(false);
  const [progress, setProgress] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [cursor, setCursor] = useState<{ lastValue: any; lastId: string } | undefined>();
  const cursorRef = useRef<{ lastValue: any; lastId: string } | undefined>();
  const [hasMore, setHasMore] = useState(true);
  const [loadingMyList, setLoadingMyList] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [activePlaylist, setActivePlaylist] = useState<string | 'all'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);

  const fetchMyList = useCallback(async () => {
    if (!user) return;
    setLoadingMyList(true);
    
    let items = [];
    if (activePlaylist === 'all') {
      const { data } = await getUserVideos(user.id);
      items = data || [];
    } else {
      const { data } = await getPlaylistVideos(activePlaylist);
      items = data?.map((d: any) => ({ ...d.user_study_videos, playlist_item_id: d.id })) || [];
    }

    // Apply sorting to My List if not drag-ordering
    if (sort === 'recent') {
      items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sort === 'popular') {
      items.sort((a, b) => (Number(b.view_count) || 0) - (Number(a.view_count) || 0));
    } else if (sort === 'trending') {
      items.sort((a, b) => (b.virality_score || 0) - (a.virality_score || 0));
    }
    
    setMyList(items);
    setLoadingMyList(false);
  }, [user, activePlaylist, sort]);

  const fetchPlaylists = useCallback(async () => {
    if (!user) return;
    const { data } = await getPlaylists(user.id);
    if (data) setPlaylists(data);
  }, [user]);

  useEffect(() => {
    if (tab === 'My Lists') {
      fetchMyList();
      fetchPlaylists();
    }
  }, [tab, fetchMyList, fetchPlaylists]);

  const loadItems = useCallback(async (reset = false) => {
    if (loading && !reset) return;
    setLoading(true);
    
    try {
      const currentCursor = reset ? undefined : cursorRef.current;
      const { items: data, nextCursor } = await fetchContentByCategory(category, 24, currentCursor, sort);
      
      if (reset) { 
        setItems(data); 
      } else { 
        setItems(prev => {
          const existingIds = new Set(prev.map(i => i.id));
          const uniqueNew = data.filter(i => !existingIds.has(i.id));
          return [...prev, ...uniqueNew];
        }); 
      }
      
      cursorRef.current = nextCursor;
      setCursor(nextCursor);
      setHasMore(!!nextCursor);
    } catch (err) {
      console.error('Load items failed:', err);
    } finally {
      setLoading(false);
    }
  }, [category, sort]);

  useEffect(() => { loadItems(true); }, [category, sort]);

  // Search logic
  useEffect(() => {
    if (tab !== 'Discover') return;
    
    const handler = setTimeout(async () => {
      if (!searchQuery.trim()) {
        if (isSearching) {
          setIsSearching(false);
          loadItems(true);
        }
        return;
      }

      setIsSearching(true);
      setLoading(true);
      try {
        const results = await searchContent(searchQuery, category);
        setItems(results);
        setHasMore(false); // Search results are usually single-page for now
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(handler);
  }, [searchQuery, category, tab]);

  useEffect(() => {
    if (!user) return;
    supabase.from('user_follows').select('channel_id').eq('user_id', user.id)
      .then(({ data }) => setFollows(data?.map(f => f.channel_id) || []));
  }, [user]);

  // Infinite scroll
  useEffect(() => {
    if (!sentinel.current) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting && hasMore && !loading) loadItems(); }, { threshold: 0.1 });
    obs.observe(sentinel.current);
    return () => obs.disconnect();
  }, [sentinel, hasMore, loading, loadItems]);

  const handleScrape = async () => {
    if (scraping) return;
    setScraping(true);
    setProgress('Starting discovery engine...');
    const tid = toast.loading('Discovery engine running...');
    try {
      await scrapeAllPremiumChannels((msg) => setProgress(msg));
      await loadItems(true);
      toast.success('Discovery complete!', { id: tid });
    } catch (e: any) { toast.error(e.message, { id: tid }); }
    finally { setScraping(false); setProgress(''); }
  };

  const handleAdd = async (item: any) => {
    if (!user) return;
    const v = normalizeContentPiece(item);
    
    // 1. Add to Library
    const { data: libData, error: libError } = await addVideoToLibrary(user.id, {
      id: v.video_id, title: item.title, channel: v.channel_name,
      thumbnail: v.high_res_thumbnail || v.thumbnail_url,
      url: v.video_url, duration: v.duration_seconds, views: v.view_count
    });

    // 2. If in a specific playlist, add to that too
    if (activePlaylist !== 'all') {
      // Find the ID in library (either from libData or existing)
      let dbId = libData?.id;
      if (!dbId) {
        const { data: existing } = await supabase.from('user_study_videos')
          .select('id').eq('user_id', user.id).eq('video_id', v.video_id).maybeSingle();
        dbId = existing?.id;
      }
      
      if (dbId) {
        await addVideoToPlaylist(activePlaylist, dbId);
      }
    }

    if (libError && activePlaylist === 'all') {
      toast.error('Already in library');
    } else {
      logActivity(user.id, 'add_to_library', item.title, 'video');
      toast.success('Saved to list ✓');
      fetchMyList();
    }
  };

  const handleCreatePlaylist = async () => {
    if (!user || !newPlaylistName.trim()) return;
    const { data, error } = await createPlaylist(user.id, newPlaylistName);
    if (error) {
      toast.error('Failed to create playlist');
    } else {
      toast.success('Playlist created');
      setNewPlaylistName('');
      setShowCreateModal(false);
      fetchPlaylists();
    }
  };

  const handleRenamePlaylist = async (id: string, currentName: string) => {
    const newName = prompt('New playlist name:', currentName);
    if (!newName || newName === currentName) return;
    const { error } = await updatePlaylist(id, { name: newName });
    if (!error) {
      toast.success('Playlist renamed');
      fetchPlaylists();
    }
  };

  const handleAddToPlaylist = async (playlistId: string, item: any) => {
    if (!user) return;
    
    // First ensure it's in library
    const v = normalizeContentPiece(item);
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
  };

  const handleDeletePlaylist = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this playlist?')) return;
    const { error } = await deletePlaylist(id);
    if (!error) {
      toast.success('Playlist deleted');
      if (activePlaylist === id) setActivePlaylist('all');
      fetchPlaylists();
    }
  };

  const handleRemoveFromList = async (item: any) => {
    if (activePlaylist === 'all') {
      const { error } = await deleteVideo(item.id);
      if (!error) {
        setMyList(p => p.filter(v => v.id !== item.id));
        toast.success(`Removed ${item.title}`);
      }
    } else {
      const { error } = await removeVideoFromPlaylist(activePlaylist, item.id);
      if (!error) {
        setMyList(p => p.filter(v => v.id !== item.id));
        toast.success(`Removed from playlist`);
      }
    }
  };

  const handleReorder = async (newOrder: any[]) => {
    setMyList(newOrder);
    const updates = newOrder.map((item, idx) => ({ id: item.id, position: idx }));
    await batchUpdatePositions(updates);
  };

  const handleFollow = async (item: any) => {
    if (!user) return;
    const v = normalizeContentPiece(item);
    const already = follows.includes(v.channel_id);
    if (already) {
      await supabase.from('user_follows').delete().eq('user_id', user.id).eq('channel_id', v.channel_id);
      setFollows(p => p.filter(id => id !== v.channel_id));
      toast.success(`Unfollowed ${v.channel_name}`);
    } else {
      await supabase.from('user_follows').insert({ user_id: user.id, channel_id: v.channel_id, channel_name: v.channel_name, channel_avatar: v.channel_avatar });
      logActivity(user.id, 'follow_creator', v.channel_name, 'creator');
      setFollows(p => [...p, v.channel_id]);
      toast.success(`Following ${v.channel_name}`);
    }
  };

  return (
    <div className="flex flex-col gap-5 py-4 h-full overflow-y-auto scrollbar-hide pr-1">
      {/* Tabs + Search + Refresh */}
      <div className="flex flex-col md:flex-row md:items-center gap-6">
        <div className="flex items-center gap-6">
          {(['Discover','My Lists'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={cn('text-2xl font-bold pb-1 transition-all', tab===t ? 'text-foreground border-b-2 border-primary' : 'text-muted-foreground/40 hover:text-muted-foreground')}>
              {t}
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
              className="w-full bg-card border border-border/50 rounded-2xl pl-11 pr-10 py-2.5 text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
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
          {/* Sort */}
          <select value={sort} onChange={e => setSort(e.target.value as any)}
            className="bg-card border border-border text-xs text-muted-foreground rounded-xl px-3 py-1.5 focus:outline-none focus:border-primary/50">
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <button onClick={handleScrape} disabled={scraping}
            className="p-2 rounded-xl hover:bg-card text-muted-foreground transition-all disabled:opacity-50">
            <RefreshCw className={cn('w-4 h-4', scraping && 'animate-spin')}/>
          </button>
        </div>
      </div>

      {tab === 'Discover' && (
        <>
          {/* Category Pills */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setCat(cat)}
                className={cn('px-4 py-1.5 rounded-full text-[12px] font-medium border transition-all',
              category===cat ? 'bg-primary text-white border-primary' : 'bg-card text-muted-foreground border-border/30 hover:border-primary/30')}>
                {cat}
              </button>
            ))}
          </div>

          {/* Progress */}
          {scraping && progress && (
            <div className="text-xs text-teal-400 font-medium animate-pulse px-1">{progress}</div>
          )}

          {/* Grid */}
          {loading && items.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {[...Array(8)].map((_,i) => <div key={i} className="aspect-[4/5] bg-white/5 rounded-3xl animate-pulse"/>)}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center border-2 border-dashed border-white/5 rounded-[2.5rem]">
              <TrendingUp className="w-12 h-12 text-white/10 mb-6"/>
              <h3 className="text-xl font-bold">Engine ready to sync</h3>
              <p className="text-sm text-muted-foreground mt-2 max-w-xs">Click Initialize to fetch 200+ high-quality videos from 50+ premium channels.</p>
              <button onClick={handleScrape} disabled={scraping}
                className="mt-8 px-10 py-3 rounded-full bg-white text-black font-black text-sm hover:scale-105 transition-transform disabled:opacity-60 flex items-center gap-2">
                {scraping ? <><Loader2 className="w-4 h-4 animate-spin"/> Fetching...</> : 'Initialize Discovery'}
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pb-4">
                <AnimatePresence>
                  {items.map((item, idx) => (
                    <VideoCard key={`${item.id}-${idx}`} item={item}
                      onAdd={handleAdd} onFollow={handleFollow}
                      playlists={playlists} onAddToPlaylist={handleAddToPlaylist}
                      isFollowing={follows.includes(normalizeContentPiece(item).channel_id)}
                      onClick={setSelected}/>
                  ))}
                </AnimatePresence>
              </div>
              {/* Infinite scroll sentinel */}
              <div ref={sentinel} className="h-8 flex items-center justify-center">
                {loading && <Loader2 className="w-5 h-5 animate-spin text-muted-foreground"/>}
                {!hasMore && items.length > 0 && (
                  <p className="text-xs text-muted-foreground">All content loaded · {items.length} items</p>
                )}
              </div>
            </>
          )}
        </>
      )}

      {tab === 'My Lists' && (
        <div className="flex flex-col gap-6">
          {/* Playlist Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
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
                  <button onClick={(e) => { e.stopPropagation(); handleRenamePlaylist(p.id, p.name); }} className="p-1 rounded-md hover:bg-white/10 text-muted-foreground hover:text-white">
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button onClick={(e) => handleDeletePlaylist(p.id, e)} className="p-1 rounded-md hover:bg-rose-500/20 text-muted-foreground hover:text-rose-400">
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
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
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
                  className="flex-1 bg-white/5 border border-border/50 rounded-xl px-4 py-2 outline-none focus:border-primary transition-all"
                />
                <button 
                  onClick={handleCreatePlaylist}
                  className="px-6 py-2 rounded-xl bg-primary text-primary-foreground font-bold hover:opacity-90 transition-all"
                >
                  Create
                </button>
                <button 
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl hover:bg-white/5 transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )}

          {loadingMyList ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary"/>
            </div>
          ) : myList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center border-2 border-dashed border-white/5 rounded-[2.5rem]">
              <List className="w-12 h-12 text-white/10 mb-6"/>
              <h3 className="text-xl font-bold">Your list is empty</h3>
              <p className="text-sm text-muted-foreground mt-2 max-w-xs">Start adding videos from the Discover tab to build your custom learning library.</p>
            </div>
          ) : (
            <Reorder.Group axis="y" values={myList} onReorder={handleReorder} className="space-y-3">
              {myList.map((item) => (
                <Reorder.Item 
                  key={item.id} 
                  value={item}
                  whileDrag={{ scale: 1.02, boxShadow: "0 20px 50px rgba(0,0,0,0.5)", zIndex: 50 }}
                  className="group flex items-center gap-4 bg-card border border-border/30 p-4 rounded-[1.5rem] hover:border-primary/30 cursor-default"
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
        </div>
      )}

      <VideoPlayerModal isOpen={!!selected} video={selected ? normalizeContentPiece(selected) : null}
        onClose={() => setSelected(null)} onAdd={handleAdd}/>
    </div>
  );
};
