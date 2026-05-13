import { Flame, Plus, ExternalLink, Users, MessageSquare, Play, Clock, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface TrendingVideoCardProps {
  video: any;
  rank: number;
  onAddToLibrary: (video: any) => void;
}

export const TrendingVideoCard: React.FC<TrendingVideoCardProps> = ({ video, rank, onAddToLibrary }) => {
  const formatViews = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(0) + 'K';
    return num.toString();
  };

  const getTimeAgo = (date: string) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true }).replace('about ', '');
    } catch (e) {
      return '';
    }
  };

  const engagementPercent = (video.engagement_rate * 100).toFixed(1);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="group relative bg-card/40 backdrop-blur-md border border-teal-500/20 rounded-2xl overflow-hidden hover:border-teal-500/50 hover:shadow-2xl hover:shadow-teal-500/10 transition-all"
    >
      {/* Rank Badge */}
      <div className="absolute top-3 left-3 z-10 w-8 h-8 rounded-full bg-teal-500/90 text-white flex items-center justify-center font-bold text-sm shadow-lg border border-white/20">
        #{rank}
      </div>
      
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden bg-black/40">
        <img 
          src={video.thumbnail_url} 
          alt={video.title} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        
        {/* Play Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Play className="w-12 h-12 text-white fill-current animate-pulse" />
        </div>

        {/* Virality Badge */}
        <div className="absolute bottom-3 right-3 px-2 py-1 rounded-lg bg-teal-500/90 backdrop-blur-md text-white text-[11px] font-bold flex items-center gap-1.5 shadow-lg border border-white/10">
          <Flame className="w-3.5 h-3.5 fill-current text-orange-400" />
          {video.virality_score.toFixed(0)} pts
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-secondary/60 flex items-center justify-center shrink-0 border border-border/40 overflow-hidden">
             <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${video.channel_name}`} alt="avatar" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold line-clamp-2 leading-tight group-hover:text-teal-400 transition-colors">
              {video.title}
            </h3>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-[11px] text-muted-foreground">
              <span className="font-semibold text-foreground/80">{video.channel_name}</span>
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" /> {formatViews(video.view_count)} views
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" /> {getTimeAgo(video.published_at)}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t border-border/40">
          <button 
            onClick={() => onAddToLibrary(video)}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-secondary/50 hover:bg-teal-500/10 hover:text-teal-400 text-xs font-bold transition-all active:scale-95 border border-transparent hover:border-teal-500/30"
          >
            <Plus className="w-4 h-4" /> Tag
          </button>
          <a 
            href={video.video_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-secondary/50 border border-border/40 hover:border-teal-400 text-muted-foreground hover:text-teal-400 transition-all shadow-sm"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </motion.div>
  );
};
