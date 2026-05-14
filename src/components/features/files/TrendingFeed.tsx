import React, { useState, useEffect } from 'react';
import { 
  Plus, ExternalLink, Play, Clock, Eye, 
  Flame, Award, CheckCircle2, RefreshCw, Filter, 
  LayoutGrid, LayoutList, Share2, MoreHorizontal,
  Twitter, Youtube, BookOpen, Instagram, Linkedin,
  ChevronRight, AlertCircle, TrendingUp, UserPlus, UserCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'react-hot-toast';
import { addVideoToLibrary, getUserVideos } from '@/services/videoService';
import { fetchPremiumTrendingVideos } from '@/services/premiumTrendingService';
import { useAuth } from '@/hooks/useAuth';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { VideoPlayerModal } from './VideoPlayerModal';

// --- Discovery Card Component ---
const DiscoveryCard = ({ video, onAdd, isFollowing, onFollow, onClick }: { 
  video: any, 
  onAdd: (v: any) => void,
  isFollowing: boolean,
  onFollow: (v: any) => void,
  onClick: (v: any) => void
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const formatCount = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(0) + 'K';
    return num.toString();
  };

  const timeAgo = formatDistanceToNow(new Date(video.published_at), { addSuffix: true }).replace('about ', '');

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative flex flex-col bg-[#111111] border border-white/5 rounded-3xl overflow-hidden hover:border-white/10 transition-all duration-300"
    >
      <div className="p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-white/5 shrink-0">
            <img src={video.channel_avatar} alt="avatar" className="w-full h-full object-cover" />
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-bold truncate leading-none">{video.channel_name}</p>
            <p className="text-[11px] text-muted-foreground mt-1">{timeAgo}</p>
          </div>
        </div>
        <button 
          onClick={() => onFollow(video)}
          className={cn(
            "p-2 rounded-xl transition-all",
            isFollowing ? "text-primary bg-primary/10" : "text-muted-foreground hover:bg-white/5"
          )}
        >
          {isFollowing ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
        </button>
      </div>

      <div className="px-4 pb-2">
        <h3 className="text-[14px] font-medium leading-relaxed line-clamp-2 mb-3">
          {video.title}
        </h3>
      </div>

      <div 
        className="relative aspect-video mx-4 mb-4 rounded-2xl overflow-hidden bg-black/40 cursor-pointer"
        onClick={() => onClick(video)}
      >
        <img 
          src={video.high_res_thumbnail || video.thumbnail_url} 
          alt={video.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
           <Play className="w-10 h-10 text-white opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300" />
        </div>
        
        {video.quality_score > 0.75 && (
          <div className="absolute top-2 left-2 px-2 py-1 rounded-lg bg-primary text-white text-[9px] font-black uppercase tracking-widest flex items-center gap-1 shadow-lg shadow-primary/20 backdrop-blur-md">
            <Award className="w-3 h-3" /> Premium Pick
          </div>
        )}

        <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/80 text-[10px] font-bold text-white">
           {Math.floor(video.duration_seconds / 60)}:{(video.duration_seconds % 60).toString().padStart(2, '0')}
        </div>
      </div>

      <div className="px-4 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-4 text-muted-foreground text-[12px]">
           <span className="flex items-center gap-1.5"><Eye className="w-3.5 h-3.5" /> {formatCount(video.view_count)}</span>
           <div className="px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-500 text-[10px] font-black">
              {video.virality_score.toFixed(1)}x
           </div>
        </div>
        <div className="flex items-center gap-1">
           <button 
             onClick={() => onAdd(video)} 
             className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-white/5 transition-all text-[11px] font-bold"
           >
             <Plus className="w-4 h-4" />
           </button>
           <button 
             onClick={() => onClick(video)} 
             className="p-1.5 rounded-xl hover:bg-white/5 transition-all"
           >
             <ExternalLink className="w-4 h-4 text-muted-foreground" />
           </button>
        </div>
      </div>
    </motion.div>
  );
};

// --- Main Trending/Discovery Feed Component ---
export const TrendingFeed = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'Discover' | 'Creators' | 'My Lists'>('Discover');
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [videos, setVideos] = useState<any[]>([]);
  const [myList, setMyList] = useState<any[]>([]);
  const [follows, setFollows] = useState<string[]>([]);
  const [followedCreators, setFollowedCreators] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [visibleCategories, setVisibleCategories] = useState(['All', 'Tech', 'Productivity', 'Startups', 'Education', 'Science', 'Self-improvement', 'Business', 'Design', 'Philosophy', 'Videography']);

  const ADD_CATEGORIES = ['Economics', 'Politics', 'Content creation', 'Spirituality', 'Public speaking', 'Health & Fitness'];

  useEffect(() => {
    if (activeTab === 'Discover') fetchVideos();
    else if (activeTab === 'My Lists') fetchMyList();
    else if (activeTab === 'Creators') fetchFollowedCreators();
    
    if (user) fetchFollows();
  }, [selectedCategory, activeTab, user]);

  const fetchFollows = async () => {
    if (!user) return;
    const { data } = await supabase.from('user_follows').select('channel_id').eq('user_id', user.id);
    setFollows(data?.map(f => f.channel_id) || []);
  };

  const fetchVideos = async () => {
    setIsLoading(true);
    try {
      // Order by quality_score but with a limit that allows for variety
      let query = supabase.from('premium_trending_videos').select('*').order('quality_score', { ascending: false });
      
      if (selectedCategory !== 'All') {
        const catMap: Record<string,string> = { 
          'Tech': 'Technology', 
          'Productivity': 'Productivity', 
          'Self-improvement': 'Self-Improvement',
          'Education': 'Education',
          'Science': 'Science',
          'Business': 'Business',
          'Design': 'Design',
          'Philosophy': 'Philosophy',
          'Startups': 'Startups',
          'Content creation': 'Content creation',
          'Public speaking': 'Public speaking',
          'Videography': 'Videography',
          'Economics': 'Economics',
          'Politics': 'Politics',
          'Spirituality': 'Spirituality',
          'Health & Fitness': 'Health & Fitness'
        };
        query = query.eq('category', catMap[selectedCategory] || selectedCategory);
      }
      
      // Increased limit for more diversity
      const { data, error } = await query.limit(100);
      if (error) throw error;
      
      // Shuffle slightly if it's "All" to show different creators on top
      let results = data || [];
      if (selectedCategory === 'All') {
        results = [...results].sort(() => Math.random() - 0.5).slice(0, 40);
      }
      
      setVideos(results);
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
  };

  const fetchMyList = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data, error } = await getUserVideos(user.id);
      if (error) throw error;
      
      // Transform to match discovery card format
      setMyList(data?.map(v => ({
        ...v,
        video_id: v.video_id,
        thumbnail_url: v.thumbnail_url,
        channel_name: v.channel_name,
        // Fallback for missing fields in library schema
        channel_id: v.channel_id || 'unknown', 
        duration_seconds: typeof v.duration === 'string' ? parseInt(v.duration) : v.duration,
        view_count: parseInt(v.view_count || '0'),
        published_at: v.created_at,
        virality_score: 1.0,
        quality_score: 1.0,
        channel_avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${v.channel_name}`
      })) || []);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load your list");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFollowedCreators = async () => {
    if (!user) return;
    setIsLoading(true);
    const { data } = await supabase.from('user_follows').select('*').eq('user_id', user.id);
    setFollowedCreators(data || []);
    setIsLoading(false);
  };

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    const tid = toast.loading("Discovery engine searching...");
    try {
      await fetchPremiumTrendingVideos();
      await fetchVideos();
      toast.success("Discoveries synced!", { id: tid });
    } catch (e: any) { toast.error(e.message, { id: tid }); } finally { setIsRefreshing(false); }
  };

  const handleAdd = async (video: any) => {
    if (!user) return;
    const { error } = await addVideoToLibrary(user.id, {
      id: video.video_id,
      title: video.title,
      channel: video.channel_name,
      thumbnail: video.high_res_thumbnail || video.thumbnail_url,
      url: video.video_url,
      duration: video.duration_seconds,
      views: video.view_count
    });
    if (error) toast.error('Already in library');
    else {
      toast.success('Added to library');
      if (activeTab === 'My Lists') fetchMyList();
    }
  };

  const handleFollow = async (video: any) => {
    if (!user) return;
    const isCurrentlyFollowing = follows.includes(video.channel_id);
    
    if (isCurrentlyFollowing) {
      await supabase.from('user_follows').delete().eq('user_id', user.id).eq('channel_id', video.channel_id);
      setFollows(prev => prev.filter(id => id !== video.channel_id));
      toast.success(`Unfollowed ${video.channel_name}`);
    } else {
      await supabase.from('user_follows').insert({
        user_id: user.id,
        channel_id: video.channel_id,
        channel_name: video.channel_name,
        channel_avatar: video.channel_avatar
      });
      setFollows(prev => [...prev, video.channel_id]);
      toast.success(`Following ${video.channel_name}`);
    }
    if (activeTab === 'Creators') fetchFollowedCreators();
  };

  const handleAddCategory = (cat: string) => {
    if (!visibleCategories.includes(cat)) {
      setVisibleCategories([...visibleCategories, cat]);
    }
    setSelectedCategory(cat);
  };

  return (
    <div className="flex flex-col gap-6 py-4 h-full overflow-y-auto pr-4 scrollbar-hide">
      {/* Header Tabs */}
      <div className="flex items-center gap-8 mb-2">
        {['Discover', 'Creators', 'My Lists'].map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={cn(
              "text-2xl font-bold pb-1 transition-all",
              activeTab === tab ? "text-white border-b-2 border-white" : "text-muted-foreground/40 hover:text-muted-foreground"
            )}
          >
            {tab}
          </button>
        ))}
        <div className="ml-auto">
          <button onClick={handleRefresh} className="p-2 rounded-lg hover:bg-white/5 text-muted-foreground transition-all">
             <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
          </button>
        </div>
      </div>

      {activeTab === 'Discover' && (
        <>
          {/* Category Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {visibleCategories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-[12px] font-medium border transition-all",
                  selectedCategory === cat ? "bg-primary text-white border-primary" : "bg-[#111111] text-muted-foreground border-white/5 hover:border-white/10"
                )}
              >
                {cat}
              </button>
            ))}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="px-4 py-1.5 rounded-full bg-[#111111] text-muted-foreground border border-white/5 text-[12px] font-medium hover:border-white/10 transition-all flex items-center gap-1">
                   <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 bg-[#111111] border-white/5 p-2 rounded-2xl">
                 <p className="px-2 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Add a Pillar</p>
                 {ADD_CATEGORIES.map(cat => (
                   <DropdownMenuItem key={cat} onClick={() => handleAddCategory(cat)} className="rounded-xl py-2 cursor-pointer hover:bg-white/5">
                      <span className="text-[13px] font-medium">{cat}</span>
                   </DropdownMenuItem>
                 ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => <div key={i} className="aspect-[4/5] bg-white/5 rounded-3xl animate-pulse" />)}
            </div>
          ) : videos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center border-2 border-dashed border-white/5 rounded-[2.5rem] bg-white/[0.02]">
               <TrendingUp className="w-12 h-12 text-white/10 mb-6" />
               <h3 className="text-xl font-bold">Engine ready to sync</h3>
               <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto">Initialize discovery to see the latest premium content.</p>
               <button onClick={handleRefresh} className="mt-8 px-10 py-3 rounded-full bg-primary text-white font-black text-sm hover:scale-105 transition-transform">Initialize Discovery</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
              <AnimatePresence>
                {videos.map((video) => (
                  <DiscoveryCard 
                    key={video.id} 
                    video={video} 
                    onAdd={handleAdd} 
                    isFollowing={follows.includes(video.channel_id)} 
                    onFollow={handleFollow}
                    onClick={(v) => setSelectedVideo(v)}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </>
      )}

      {activeTab === 'Creators' && (
        <div className="flex flex-col gap-8 py-4">
           {followedCreators.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-32 text-center text-muted-foreground">
                <UserPlus className="w-12 h-12 opacity-10 mb-4" />
                <p>You aren't following any creators yet.</p>
             </div>
           ) : (
             <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                {followedCreators.map(c => (
                  <div key={c.channel_id} className="flex flex-col items-center gap-3 p-6 rounded-[2rem] bg-[#111111] border border-white/5 hover:border-white/10 transition-all text-center">
                     <img src={c.channel_avatar} className="w-16 h-16 rounded-full" alt="avatar" />
                     <p className="text-sm font-bold truncate w-full">{c.channel_name}</p>
                     <button 
                       onClick={() => handleFollow({ channel_id: c.channel_id, channel_name: c.channel_name })}
                       className="px-4 py-1.5 rounded-full bg-primary/10 text-primary text-[11px] font-bold"
                     >
                       Following
                     </button>
                  </div>
                ))}
             </div>
           )}
        </div>
      )}

      {activeTab === 'My Lists' && (
        <div className="flex flex-col gap-6 py-4">
           {myList.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-32 text-center text-muted-foreground">
                <Plus className="w-12 h-12 opacity-10 mb-4" />
                <p>Your list is empty. Click + on any video to add it here.</p>
             </div>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
               {myList.map(v => (
                 <DiscoveryCard 
                   key={v.id} 
                   video={v} 
                   onAdd={handleAdd} 
                   isFollowing={follows.includes(v.channel_id)} 
                   onFollow={handleFollow}
                   onClick={(v) => setSelectedVideo(v)}
                 />
               ))}
             </div>
           )}
        </div>
      )}

      {/* Video Player Modal */}
      <VideoPlayerModal 
        isOpen={!!selectedVideo} 
        video={selectedVideo} 
        onClose={() => setSelectedVideo(null)}
        onAdd={handleAdd}
      />
    </div>
  );
};
