import React, { useState, useEffect, useCallback } from 'react';
import { Search, Loader2, Youtube, Library, Filter, ChevronDown, PlusCircle } from 'lucide-react';
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

      const videos = data.items.map((item: any) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        channel: item.snippet.channelTitle,
        thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
        url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        duration: '', // Duration requires a separate API call for video details
        views: ''
      }));

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

  const handleDelete = async (videoId: string) => {
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

  const filteredVideos = userVideos.filter(v => {
    const matchesSearch = v.title.toLowerCase().includes(librarySearch.toLowerCase());
    const matchesTag = selectedFilter === 'All' || v.subject_tag === selectedFilter;
    return matchesSearch && matchesTag;
  });

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex flex-col gap-8 p-6 max-w-7xl mx-auto">
        
        {/* Search Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500">
              <Youtube className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Search YouTube</h2>
              <p className="text-sm text-muted-foreground">Find study materials and add them to your library</p>
            </div>
          </div>

          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search for videos (e.g. Physics for Beginners)..." 
                className="pl-10 h-11 bg-secondary/30 border-border/40"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button 
              type="submit"
              disabled={isLoading}
              className="px-6 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold transition-all flex items-center gap-2"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Search
            </button>
          </form>

          {searchResults.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <AnimatePresence>
                {searchResults.map((video, idx) => (
                  <VideoCard 
                    key={video.id} 
                    video={video} 
                    index={idx} 
                    onAdd={addToLibrary}
                    isInLibrary={userVideos.some(v => v.video_id === video.id)}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </section>

        <div className="h-px bg-border/40 w-full" />

        {/* Library Section */}
        <section className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-500">
                <Library className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">My Study Library</h2>
                <p className="text-sm text-muted-foreground">Organize your saved videos with drag and drop</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input 
                  placeholder="Filter library..." 
                  className="pl-9 h-9 w-40 bg-secondary/30 border-border/40 text-xs"
                  value={librarySearch}
                  onChange={(e) => setLibrarySearch(e.target.value)}
                />
              </div>
              
              <div className="flex items-center bg-secondary/40 rounded-lg p-0.5 border border-border/40">
                {['All', 'Math', 'Science', 'Programming'].map(filter => (
                  <button 
                    key={filter} 
                    onClick={() => setSelectedFilter(filter)}
                    className={cn(
                      "px-3 py-1.5 rounded-md text-[10px] font-bold transition-all",
                      selectedFilter === filter ? "bg-background shadow-sm text-teal-400" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {isLibraryLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin" />
              <p>Loading your library...</p>
            </div>
          ) : filteredVideos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center border border-dashed border-border/40 rounded-3xl bg-secondary/5">
              <div className="w-16 h-16 rounded-2xl bg-secondary/30 flex items-center justify-center">
                <PlusCircle className="w-8 h-8 text-muted-foreground/50" />
              </div>
              <div>
                <p className="font-semibold text-muted-foreground">Your library is empty</p>
                <p className="text-sm text-muted-foreground/60">Add videos from search to get started</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredVideos.map((video, idx) => (
                <VideoCard 
                  key={video.id} 
                  video={video} 
                  index={idx} 
                  isLibraryItem 
                  onDelete={handleDelete}
                  onUpdateTag={handleUpdateTag}
                  onMove={moveVideo}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </DndProvider>
  );
};
