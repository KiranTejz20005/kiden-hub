import React, { useState, useEffect, useCallback } from 'react';
import { Search, Loader2, Youtube, Library, Filter, ChevronDown, PlusCircle, Sparkles } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { VideoCard } from './VideoCard';
import { 
  addVideoToLibrary, 
  getUserVideos, 
  deleteVideo, 
  updateVideoPosition, 
  updateVideoTag,
  isVideoInLibrary
} from '@/services/videoService';
import { useAuth } from '@/hooks/useAuth';

const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY || import.meta.env.REACT_APP_YOUTUBE_API_KEY;

export const YouTubeSearchLibrary = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [userVideos, setUserVideos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLibraryLoading, setIsLibraryLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [librarySearch, setLibrarySearch] = useState('');

  const fetchLibrary = useCallback(async () => {
    if (!user) return;
    setIsLibraryLoading(true);
    const { data, error } = await getUserVideos(user.id);
    if (error) {
      toast.error('Failed to load library');
    } else {
      setUserVideos(data || []);
    }
    setIsLibraryLoading(false);
  }, [user]);

  useEffect(() => {
    fetchLibrary();
  }, [fetchLibrary]);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    if (!YOUTUBE_API_KEY) {
      toast.error('YouTube API Key missing');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(searchQuery)}&type=video&maxResults=12&key=${YOUTUBE_API_KEY}`
      );
      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message);
      }

      const videos = data.items.map((item: any) => {
        const initials = item.snippet.channelTitle.substring(0, 2).toUpperCase();
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F'];
        const bgColor = colors[Math.floor(Math.random() * colors.length)];
        
        return {
          id: item.id.videoId,
          title: item.snippet.title,
          channel_name: item.snippet.channelTitle,
          channel_avatar: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='${bgColor.replace('#', '%23')}' width='100' height='100'/%3E%3Ctext x='50' y='55' text-anchor='middle' font-size='40' font-weight='bold' fill='white'%3E${initials}%3C/text%3E%3C/svg%3E`,
          thumbnail_url: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
          video_id: item.id.videoId,
          published_at: item.snippet.publishedAt,
          duration_seconds: 0
        };
      });
      
      // Sort by published date (most recent first)
      videos.sort((a: any, b: any) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());
      
      setSearchResults(videos);
    } catch (error: any) {
      toast.error(`Search failed: ${error.message}`);
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const addToLibrary = async (video: any) => {
    if (!user) return;
    
    const exists = await isVideoInLibrary(user.id, video.id);
    if (exists) {
      toast.error('Already in library');
      return;
    }

    const { error } = await addVideoToLibrary(user.id, video);
    if (error) {
      toast.error('Failed to add to library');
    } else {
      toast.success('Added to library');
      fetchLibrary();
    }
  };

  const deleteFromLibrary = async (videoId: string) => {
    const { error } = await deleteVideo(videoId);
    if (error) {
      toast.error('Failed to delete');
    } else {
      toast.success('Deleted from library');
      setUserVideos(prev => prev.filter(v => v.id !== videoId));
    }
  };

  const handleUpdateTag = async (videoId: string, tag: string) => {
    const { error } = await updateVideoTag(videoId, tag);
    if (error) {
      toast.error('Failed to update tag');
    } else {
      toast.success(`Tag updated to ${tag}`);
      setUserVideos(prev => prev.map(v => v.id === videoId ? { ...v, subject_tag: tag } : v));
    }
  };

  const moveVideo = useCallback((dragIndex: number, hoverIndex: number) => {
    setUserVideos((prevVideos) => {
      const newVideos = [...prevVideos];
      const draggedVideo = newVideos[dragIndex];
      newVideos.splice(dragIndex, 1);
      newVideos.splice(hoverIndex, 0, draggedVideo);
      
      // Update positions in background
      updateVideoPosition(draggedVideo.id, hoverIndex);
      return newVideos;
    });
  }, []);

  const filteredVideos = userVideos
    .filter(v => {
      const matchesSearch = (v.title || '').toLowerCase().includes(librarySearch.toLowerCase());
      const matchesTag = selectedFilter === 'All' || v.subject_tag === selectedFilter;
      return matchesSearch && matchesTag;
    })
    .sort((a, b) => {
      // Sort by created_at or published_at (most recent first)
      const dateA = new Date(a.created_at || a.published_at || 0).getTime();
      const dateB = new Date(b.created_at || b.published_at || 0).getTime();
      return dateB - dateA;
    });

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex flex-col gap-10 py-6 w-full max-w-[1600px] mx-auto">
        
        {/* Search Section */}
        <section className="space-y-8">
          <div className="flex flex-col items-center text-center gap-4 max-w-2xl mx-auto mb-4">
            <div className="w-16 h-16 rounded-3xl bg-red-500/10 flex items-center justify-center text-red-500 shadow-xl shadow-red-500/10 border border-red-500/20">
              <Youtube className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tight text-foreground">Explore Knowledge</h1>
              <p className="text-muted-foreground text-lg mt-2">Find the best educational videos and save them to your personal research library.</p>
            </div>
          </div>

          <form onSubmit={handleSearch} className="relative group max-w-4xl mx-auto w-full">
            <div className="absolute -inset-1 bg-gradient-to-r from-red-500 to-orange-600 rounded-3xl blur opacity-10 group-hover:opacity-20 transition duration-1000 group-focus-within:opacity-30"></div>
            <div className="relative flex gap-3 p-2 bg-card/40 backdrop-blur-3xl border border-white/5 rounded-[2rem] shadow-2xl">
              <div className="relative flex-1">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/50" />
                <Input 
                  placeholder="Search concepts, topics, or creators..." 
                  className="pl-14 h-14 bg-transparent border-none text-lg focus-visible:ring-0 placeholder:text-muted-foreground/40"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button 
                type="submit"
                disabled={isLoading}
                className="px-10 rounded-2xl bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-black transition-all flex items-center gap-3 shadow-xl shadow-red-500/20 active:scale-95 disabled:opacity-60"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                Discover
              </button>
            </div>
          </form>

          {searchResults.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6"
            >
              <AnimatePresence>
                {searchResults.map((video, idx) => (
                  <VideoCard 
                    key={video.id} 
                    item={video} 
                    index={idx} 
                    onAdd={addToLibrary}
                    onFollow={() => {}}
                    isFollowing={false}
                    onClick={() => {}}
                    playlists={[]}
                    onAddToPlaylist={() => {}}
                    isInLibrary={userVideos.some(v => v && v.video_id === video.id)}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </section>

        {/* Library Section */}
        <section className="space-y-8 pt-12 border-t border-white/5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20 shadow-lg shadow-emerald-500/5">
                <Library className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">My Study Library</h2>
                <p className="text-sm text-muted-foreground">Manage and organize your curated learning materials</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                <Input 
                  placeholder="Filter library..." 
                  className="pl-11 h-10 w-56 bg-secondary/30 border-white/5 rounded-xl text-xs focus:bg-secondary/50 transition-all"
                  value={librarySearch}
                  onChange={(e) => setLibrarySearch(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-1.5 bg-secondary/30 p-1.5 rounded-2xl border border-white/5">
                {['All', 'Math', 'Science', 'Programming', 'Design', 'Other'].map(tag => (
                  <button
                    key={tag}
                    onClick={() => setSelectedFilter(tag)}
                    className={cn(
                      "px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                      selectedFilter === tag 
                        ? "bg-emerald-500 text-white shadow-xl shadow-emerald-500/20 scale-105" 
                        : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                    )}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {isLibraryLoading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-4 text-muted-foreground">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <p className="text-sm font-bold uppercase tracking-widest animate-pulse">Syncing Library...</p>
            </div>
          ) : filteredVideos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
              {filteredVideos.map((video, index) => (
                <VideoCard
                  key={video.id}
                  item={{...video, id: video.video_id}}
                  index={index}
                  onAdd={() => {}}
                  onFollow={() => {}}
                  isFollowing={false}
                  onClick={() => {}}
                  playlists={[]}
                  onAddToPlaylist={() => {}}
                  isInLibrary={true}
                  isDraggable={true}
                  onMove={moveVideo}
                  onDelete={() => deleteFromLibrary(video.id)}
                  onUpdateTag={(tag) => handleUpdateTag(video.id, tag)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-32 gap-6 text-center border-2 border-dashed border-white/5 rounded-[3rem] bg-secondary/5">
              <div className="w-20 h-20 rounded-3xl bg-secondary/20 flex items-center justify-center text-muted-foreground/20">
                <Library className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-muted-foreground">Your library is empty</h3>
                <p className="text-sm text-muted-foreground/60 max-w-xs mx-auto leading-relaxed">
                  Start your journey by searching for educational content above and adding it to your curated library.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </DndProvider>
  );
};
