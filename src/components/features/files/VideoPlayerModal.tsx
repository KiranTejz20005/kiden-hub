import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Plus, ExternalLink, Share2, 
  MessageSquare, Heart, Bookmark, 
  TrendingUp, FileText, ChevronRight, Play,
  Download, ListPlus, Flame, Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { nvidiaService } from '@/services/nvidia-service';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface VideoPlayerModalProps {
  video: any;
  isOpen: boolean;
  onClose: () => void;
  onAdd: (video: any) => void;
}

export const VideoPlayerModal = ({ video, isOpen, onClose, onAdd }: VideoPlayerModalProps) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [insights, setInsights] = useState<{ summary: string; points: string[] } | null>(null);

  if (!video) return null;

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
        
        // Update DB if this is a global content piece
        if (video.id && !video.user_id) {
          await supabase.from('content_pieces').update({ ai_summary: data.summary }).eq('id', video.id);
        }
        toast.success('AI Analysis Complete');
      }
    } catch (err) {
      console.error('AI Analysis failed:', err);
      toast.error('AI analysis failed. Check API keys.');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/90 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-5xl max-h-[90vh] bg-[#0A0A0A] border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/5 bg-[#0A0A0A]/80 backdrop-blur-xl">
              <div className="flex items-center gap-3">
                 <div className="w-6 h-6 rounded-md bg-red-600 flex items-center justify-center">
                    <Youtube className="w-3.5 h-3.5 text-white" />
                 </div>
                 <h2 className="text-sm font-bold truncate max-w-[200px] sm:max-w-md">{video.title}</h2>
              </div>
              <div className="flex items-center gap-2">
                 <button 
                   onClick={() => onAdd(video)}
                   className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 text-[11px] font-black transition-all border border-white/5"
                 >
                   <Plus className="w-3.5 h-3.5" />
                   Add to board
                 </button>
                 <button 
                   onClick={() => window.open(video.video_url, '_blank')}
                   className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 text-[11px] font-black transition-all"
                 >
                   <ExternalLink className="w-3.5 h-3.5" />
                   Open original
                 </button>
                 <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-all ml-2">
                   <X className="w-5 h-5 text-muted-foreground" />
                 </button>
              </div>
            </div>

            {/* Content Scroll Area */}
            <div className="flex-1 overflow-y-auto scrollbar-hide">
              <div className="flex flex-col lg:flex-row h-full">
                {/* Left Side: Player & Primary Info */}
                <div className="flex-1 p-6 lg:p-8 flex flex-col gap-6 border-r border-white/5">
                  {/* YouTube Embed */}
                  <div className="relative aspect-video w-full rounded-3xl overflow-hidden bg-black shadow-2xl border border-white/5">
                    <iframe
                      src={`https://www.youtube.com/embed/${video.video_id}?autoplay=1`}
                      title={video.title}
                      className="absolute inset-0 w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>

                  {/* Channel & Stats */}
                  <div className="flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <img src={video.channel_avatar} className="w-12 h-12 rounded-full border border-white/10" alt="avatar" />
                        <div>
                          <p className="text-lg font-black">{video.channel_name}</p>
                          <p className="text-xs text-muted-foreground">Published {formatDistanceToNow(new Date(video.published_at), { addSuffix: true })}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 transition-all border border-white/5"><Share2 className="w-5 h-5" /></button>
                        <button className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 transition-all border border-white/5"><Heart className="w-5 h-5" /></button>
                      </div>
                    </div>

                    {/* Stats Pill Bar */}
                    <div className="p-4 rounded-3xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                       <div className="flex items-center gap-6">
                          <div className="flex flex-col gap-1">
                             <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                                <TrendingUp className="w-3 h-3 text-orange-500" /> Virality
                             </div>
                             <p className="text-lg font-black text-orange-500">{video.virality_score?.toFixed(1)}x <span className="text-[10px] text-muted-foreground ml-1">vs average</span></p>
                          </div>
                          <div className="h-8 w-px bg-white/5" />
                          <div className="flex flex-col gap-1">
                             <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                                <Eye className="w-3 h-3 text-teal-500" /> Views
                             </div>
                             <p className="text-lg font-black">{formatCount(video.view_count)}</p>
                          </div>
                          <div className="h-8 w-px bg-white/5" />
                          <div className="flex flex-col gap-1">
                             <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                                <Flame className="w-3 h-3 text-red-500" /> Engagement
                             </div>
                             <p className="text-lg font-black">{(video.engagement_rate * 100).toFixed(1)}%</p>
                          </div>
                       </div>
                    </div>

                    {/* Description Section */}
                    <div className="space-y-4">
                      <h3 className="text-xl font-black">About this video</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                        {video.description || "No description available for this content."}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right Side: Transcript & Extras */}
                <div className="w-full lg:w-96 bg-white/[0.01] p-6 lg:p-8 flex flex-col gap-8">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                       <h3 className="text-[13px] font-black uppercase tracking-[0.2em] text-muted-foreground">Transcript</h3>
                       <button className="flex items-center gap-1 text-[11px] font-bold text-teal-400 hover:underline">
                          <Download className="w-3 h-3" /> Export
                       </button>
                    </div>
                    
                    <div className="p-6 rounded-[2rem] bg-[#0A0A0A] border border-white/5 flex flex-col gap-4">
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                             <Sparkles className={cn("w-5 h-5 text-primary", analyzing && "animate-spin")} />
                          </div>
                          <div>
                             <p className="text-[13px] font-bold">AI Intelligence</p>
                             <p className="text-[11px] text-muted-foreground">Deep analysis powered by NVIDIA</p>
                          </div>
                       </div>
                       
                       {insights ? (
                         <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                           <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
                             <p className="text-[11px] leading-relaxed italic text-primary/90">"{insights.summary}"</p>
                           </div>
                           <ul className="space-y-2">
                             {insights.points.map((p, i) => (
                               <li key={i} className="flex gap-2 text-[11px] text-muted-foreground leading-snug">
                                 <div className="w-1 h-1 rounded-full bg-primary shrink-0 mt-1.5" />
                                 {p}
                               </li>
                             ))}
                           </ul>
                         </div>
                       ) : (
                         <button 
                           onClick={handleFetchIntelligence}
                           disabled={analyzing}
                           className="w-full py-2.5 rounded-2xl bg-white text-black text-[11px] font-black hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                         >
                           {analyzing ? 'Analyzing Content...' : 'Generate AI Insights'}
                         </button>
                       )}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-[13px] font-black uppercase tracking-[0.2em] text-muted-foreground">Quick Tags</h3>
                    <div className="flex flex-wrap gap-2">
                       {['Educational', 'Tech', '2026', 'Future'].map(tag => (
                         <div key={tag} className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 text-[11px] font-medium">#{tag}</div>
                       ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const Youtube = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);
