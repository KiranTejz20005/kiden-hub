import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Plus, ExternalLink, Share2, 
  MessageSquare, Heart, Bookmark, 
  TrendingUp, FileText, ChevronRight, Play,
  Download, ListPlus, Flame, Eye, Sparkles, Youtube,
  Loader2, Save, Trash2, ArrowLeft, Send
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { nvidiaService } from '@/services/nvidia-service';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { toggleFavorite, updateNotes, deleteVideo, isVideoInLibrary, addVideoToLibrary } from '@/services/videoService';

interface VideoPlayerModalProps {
  video: any;
  isOpen: boolean;
  onClose: () => void;
  onAdd?: (video: any) => void;
  playlists?: any[];
  onAddToPlaylist?: (videoId: string, playlistId: string) => void;
}

const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY || import.meta.env.REACT_APP_YOUTUBE_API_KEY;

export const VideoPlayerModal = ({ video, isOpen, onClose, onAdd, playlists = [], onAddToPlaylist }: VideoPlayerModalProps) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [insights, setInsights] = useState<{ summary: string; points: string[] } | null>(null);
  const [notes, setNotes] = useState(video?.personal_notes || '');
  const [isFavorite, setIsFavorite] = useState(video?.is_favorite || false);
  const [isSaved, setIsSaved] = useState(false);
  const [relatedVideos, setRelatedVideos] = useState<any[]>([]);
  const [isLoadingRelated, setIsLoadingRelated] = useState(false);
  const [activeTab, setActiveTab] = useState<'insights' | 'notes'>('insights');
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  // Sync state with video prop
  useEffect(() => {
    if (video) {
      setNotes(video.personal_notes || '');
      setIsFavorite(video.is_favorite || false);
      checkSavedStatus();
      fetchRelatedVideos();
    }
  }, [video?.id]);

  const checkSavedStatus = async () => {
    if (!video) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const saved = await isVideoInLibrary(user.id, video.video_id || video.id);
      setIsSaved(saved);
    }
  };

  const fetchRelatedVideos = async () => {
    if (!video || !YOUTUBE_API_KEY) return;
    setIsLoadingRelated(true);
    try {
      const videoId = video.video_id || video.id;
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&relatedToVideoId=${videoId}&type=video&maxResults=5&key=${YOUTUBE_API_KEY}`
      );
      const data = await response.json();
      if (data.items) {
        setRelatedVideos(data.items.map((item: any) => ({
          id: item.id.videoId,
          title: item.snippet.title,
          thumbnail: item.snippet.thumbnails.medium?.url,
          channel: item.snippet.channelTitle,
          published_at: item.snippet.publishedAt
        })));
      }
    } catch (err) {
      console.error('Failed to fetch related videos:', err);
    } finally {
      setIsLoadingRelated(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!video?.id) return;
    const newStatus = !isFavorite;
    setIsFavorite(newStatus);
    const { error } = await toggleFavorite(video.id, newStatus);
    if (error) {
      toast.error('Failed to update favorite status');
      setIsFavorite(!newStatus);
    } else {
      toast.success(newStatus ? 'Added to favorites' : 'Removed from favorites');
    }
  };

  const handleSaveNotes = async () => {
    if (!video?.id) return;
    setIsSavingNotes(true);
    const { error } = await updateNotes(video.id, notes);
    if (error) {
      toast.error('Failed to save notes');
    } else {
      toast.success('Notes saved successfully');
    }
    setIsSavingNotes(false);
  };

  const handleToggleSave = async () => {
    if (!video) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (isSaved) {
      const { error } = await deleteVideo(video.id);
      if (!error) {
        setIsSaved(false);
        toast.success('Removed from library');
      }
    } else {
      const { error } = await addVideoToLibrary(user.id, video);
      if (!error) {
        setIsSaved(true);
        toast.success('Added to library');
      }
    }
  };

  const handleShare = () => {
    const url = video.video_url || `https://youtube.com/watch?v=${video.video_id || video.id}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard');
  };

  const handleFetchIntelligence = async () => {
    setAnalyzing(true);
    try {
      const prompt = `Analyze this video content and provide a concise summary and 3 key insights.
      Title: ${video.title}
      Description: ${video.description}
      
      Format as JSON: { "summary": "...", "points": ["...", "...", "..."] }`;

      const response = await nvidiaService.chat(prompt);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        setInsights({ summary: data.summary, points: data.points });
        toast.success('AI Analysis Complete');
      }
    } catch (err) {
      console.error('AI Analysis failed:', err);
      toast.error('AI analysis failed. Check API keys.');
    } finally {
      setAnalyzing(false);
    }
  };

  if (!video) return null;

  const videoId = video.video_id || video.id;
  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/95 backdrop-blur-md"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            className="relative w-full max-w-7xl h-full max-h-[95vh] bg-[#0A0A0A] border border-white/10 rounded-[2.5rem] shadow-2xl flex flex-col md:flex-row overflow-hidden"
          >
            {/* Left Column: Player & Info */}
            <div className="flex-1 flex flex-col overflow-y-auto scrollbar-hide">
              {/* Header / Back */}
              <div className="flex items-center justify-between p-6 bg-gradient-to-b from-black/50 to-transparent">
                <button 
                  onClick={onClose}
                  className="group flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                  <span className="font-bold text-sm uppercase tracking-widest">Back to Library</span>
                </button>
                <div className="flex items-center gap-2">
                  <button onClick={handleShare} className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 transition-all border border-white/5" title="Share Link">
                    <Share2 className="w-5 h-5" />
                  </button>
                  <button onClick={handleToggleFavorite} className={cn("p-3 rounded-2xl transition-all border border-white/5", isFavorite ? "bg-red-500/20 text-red-500 border-red-500/20" : "bg-white/5 hover:bg-white/10")} title="Favorite">
                    <Heart className={cn("w-5 h-5", isFavorite && "fill-current")} />
                  </button>
                  <button onClick={handleToggleSave} className={cn("px-6 py-3 rounded-2xl font-black text-sm transition-all flex items-center gap-2", isSaved ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-white text-black hover:bg-emerald-500 hover:text-white")} title={isSaved ? "Remove from Library" : "Add to Library"}>
                    {isSaved ? <Bookmark className="w-4 h-4 fill-current" /> : <Plus className="w-4 h-4" />}
                    {isSaved ? 'Saved' : 'Save'}
                  </button>
                </div>
              </div>

              {/* Video Player Section */}
              <div className="px-6">
                <div className="relative aspect-video rounded-3xl overflow-hidden bg-black shadow-2xl border border-white/5">
                  <iframe 
                    src={embedUrl}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>

              {/* Video Info */}
              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-red-500 text-[10px] font-black uppercase tracking-[0.2em]">
                    <Youtube className="w-3.5 h-3.5" /> Study Intelligence
                  </div>
                  <h1 className="text-3xl font-black leading-tight text-white">{video.title}</h1>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2">
                    <span className="font-bold text-white">{video.channel_name || video.channel}</span>
                    <span>•</span>
                    <span>{video.view_count || video.views} views</span>
                    <span>•</span>
                    <span>{formatDistanceToNow(new Date(video.published_at || Date.now()), { addSuffix: true })}</span>
                  </div>
                </div>

                <div className="p-6 rounded-3xl bg-white/5 border border-white/5">
                  <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap line-clamp-4 hover:line-clamp-none transition-all">
                    {video.description || "No description available for this study material."}
                  </p>
                </div>

                {/* Related Content */}
                <div className="space-y-6 pt-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-black uppercase tracking-widest text-white flex items-center gap-3">
                      <Sparkles className="w-5 h-5 text-emerald-400" />
                      Related Discovery
                    </h3>
                  </div>
                  
                  {isLoadingRelated ? (
                    <div className="flex items-center gap-3 text-muted-foreground animate-pulse">
                      <Loader2 className="w-4 h-4 animate-spin" /> Fetching similar insights...
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {relatedVideos.map(rv => (
                        <div key={rv.id} className="group flex gap-4 p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all cursor-pointer">
                          <div className="w-32 aspect-video rounded-xl overflow-hidden shrink-0">
                            <img src={rv.thumbnail} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                          </div>
                          <div className="flex flex-col justify-center min-w-0">
                            <h4 className="text-xs font-bold line-clamp-2 leading-snug group-hover:text-emerald-400 transition-colors">{rv.title}</h4>
                            <p className="text-[10px] text-muted-foreground mt-1 truncate">{rv.channel}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Intelligence & Notes */}
            <div className="w-full md:w-[450px] border-l border-white/5 bg-black/40 flex flex-col">
              {/* Tabs */}
              <div className="flex p-6 border-b border-white/5 gap-4">
                <button 
                  onClick={() => setActiveTab('insights')}
                  className={cn("flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all", activeTab === 'insights' ? "bg-white text-black shadow-xl" : "text-muted-foreground hover:bg-white/5")}
                >
                  Intelligence
                </button>
                <button 
                  onClick={() => setActiveTab('notes')}
                  className={cn("flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all", activeTab === 'notes' ? "bg-white text-black shadow-xl" : "text-muted-foreground hover:bg-white/5")}
                >
                  Personal Notes
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 scrollbar-hide">
                <AnimatePresence mode="wait">
                  {activeTab === 'insights' ? (
                    <motion.div 
                      key="insights"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-8"
                    >
                      {!insights && !analyzing && (
                        <div className="flex flex-col items-center justify-center py-12 text-center space-y-6">
                          <div className="w-16 h-16 rounded-[2rem] bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                            <Zap className="w-8 h-8" />
                          </div>
                          <div className="space-y-2">
                            <h3 className="font-black text-lg">AI Smart Analysis</h3>
                            <p className="text-xs text-muted-foreground leading-relaxed px-6">
                              Unlock hidden insights and key takeaways from this video using Kiden AI.
                            </p>
                          </div>
                          <button 
                            onClick={handleFetchIntelligence}
                            className="px-10 py-4 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-500/20 transition-all active:scale-95 flex items-center gap-3"
                          >
                            <Sparkles className="w-4 h-4" />
                            Analyze Now
                          </button>
                        </div>
                      )}

                      {analyzing && (
                        <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
                          <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
                          <p className="text-xs font-black uppercase tracking-widest animate-pulse text-emerald-400">Processing Stream Data...</p>
                        </div>
                      )}

                      {insights && (
                        <div className="space-y-10">
                          <div className="space-y-4">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 flex items-center gap-2">
                              <FileText className="w-3.5 h-3.5" /> Executive Summary
                            </h4>
                            <p className="text-sm text-muted-foreground leading-loose italic border-l-2 border-emerald-500/30 pl-4 bg-emerald-500/5 py-2 rounded-r-xl">
                              "{insights.summary}"
                            </p>
                          </div>

                          <div className="space-y-6">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 flex items-center gap-2">
                              <TrendingUp className="w-3.5 h-3.5" /> Critical Insights
                            </h4>
                            <div className="space-y-4">
                              {insights.points.map((p, i) => (
                                <div key={i} className="flex gap-4 group">
                                  <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center shrink-0 text-white font-black text-xs group-hover:bg-emerald-500 group-hover:text-black transition-all">
                                    {i + 1}
                                  </div>
                                  <p className="text-[13px] text-muted-foreground leading-relaxed pt-1.5">{p}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="notes"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="h-full flex flex-col gap-6"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 flex items-center gap-2">
                          <Edit3 className="w-3.5 h-3.5" /> Your Annotations
                        </h3>
                        {video?.id && (
                          <button 
                            onClick={handleSaveNotes}
                            disabled={isSavingNotes}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-black font-black text-[10px] uppercase transition-all disabled:opacity-50"
                          >
                            {isSavingNotes ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                            Save
                          </button>
                        )}
                      </div>
                      
                      {video?.id ? (
                        <textarea 
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Start jotting down key takeaways, timestamps, or your own research notes..."
                          className="flex-1 w-full bg-white/5 border border-white/5 rounded-3xl p-6 text-sm text-foreground focus:ring-1 focus:ring-emerald-500/50 outline-none scrollbar-hide resize-none leading-relaxed placeholder:text-muted-foreground/30 min-h-[300px]"
                        />
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 opacity-40">
                          <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center">
                            <Lock className="w-8 h-8" />
                          </div>
                          <p className="text-xs font-bold leading-relaxed px-12 uppercase tracking-widest">
                            Save this video to your library to unlock personal annotations.
                          </p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const Edit3 = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
);

const Lock = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
);
