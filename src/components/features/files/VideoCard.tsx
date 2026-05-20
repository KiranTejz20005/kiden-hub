import React from 'react';
import { motion } from 'framer-motion';
import { 
  Play, Eye, Award, Plus, ExternalLink, 
  UserCheck, UserPlus, List, Trash2, ChevronDown 
} from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { normalizeContentPiece } from '@/services/discoverService';
import { safeFormatDate } from '@/lib/safe-parse';

const fmt = (n: number) => n >= 1e6 ? (n/1e6).toFixed(1)+'M' : n >= 1e3 ? (n/1e3).toFixed(0)+'K' : String(n);

interface VideoCardProps {
  item: any;
  onAdd: (item: any) => void;
  onFollow: (item: any) => void;
  isFollowing: boolean;
  onClick: (item: any) => void;
  playlists: any[];
  onAddToPlaylist: (playlistId: string, item: any) => void;
  isInLibrary?: boolean;
  onDelete?: (id: string) => void;
  onUpdateTag?: (tag: string) => void;
}

export const VideoCard = React.memo(({ 
  item, 
  onAdd, 
  onFollow, 
  isFollowing, 
  onClick, 
  playlists, 
  onAddToPlaylist,
  isInLibrary = false,
  onDelete,
  onUpdateTag
}: VideoCardProps) => {
  // Guard against undefined/null items - return null instead of crashing
  if (!item) {
    return null;
  }

  try {
    const v = normalizeContentPiece(item);
    
    // Additional safety check - if normalization failed and v is unusable, skip rendering
    if (!v || typeof v !== 'object') {
      return null;
    }

    const displayDate = v.created_at || v.published_at;
    const isAddedTime = !!v.created_at;

    const timeAgo = safeFormatDate(
      displayDate,
      (date) => {
        const distance = formatDistanceToNow(date, { addSuffix: true }).replace('about ', '');
        return isAddedTime ? `${distance} added` : distance;
      },
      'recently'
    );

    // Safe access to virality and outlier scores with defaults
    const viralityScore = Number(v.virality_score || item.virality_score) || 0;
    const outlierScore = Number(v.outlier_score || item.outlier_score) || 0;
    const qualityScore = Number(v.quality_score || item.quality_score) || 0;

    return (
      <motion.div 
        layout 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        className="group flex flex-col bg-card/40 backdrop-blur-md border border-white/5 rounded-3xl overflow-hidden hover:border-emerald-500/20 hover:shadow-2xl hover:shadow-emerald-500/5 transition-all duration-300 h-full"
      >
        {/* Header */}
        <div className="p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <img 
              src={v.channel_avatar} 
              alt={v.channel_name} 
              className="w-8 h-8 rounded-full bg-white/5 shrink-0 object-cover border border-white/10"
              onError={(e) => {
                // Fallback: Create avatar with initials if image fails to load
                const target = e.target as HTMLImageElement;
                const initials = v.channel_name?.substring(0, 2).toUpperCase() || '?';
                const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F'];
                const bgColor = colors[Math.floor(Math.random() * colors.length)];
                target.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='${bgColor.replace('#', '%23')}' width='100' height='100'/%3E%3Ctext x='50' y='55' text-anchor='middle' font-size='40' font-weight='bold' fill='white'%3E${initials}%3C/text%3E%3C/svg%3E`;
              }}
            />
            <div className="min-w-0">
              <p className="text-[13px] font-bold truncate">{v.channel_name}</p>
              <p className="text-[11px] text-muted-foreground">{timeAgo}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 shrink-0">
            {isInLibrary && onUpdateTag && (
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <button className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[9px] font-black border border-emerald-500/20 hover:bg-emerald-500/20 transition-all flex items-center gap-1 uppercase tracking-widest cursor-pointer select-none">
                    {item.subject_tag || 'Uncategorized'}
                    <ChevronDown className="w-2.5 h-2.5 opacity-60" />
                  </button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content className="bg-card border border-border/50 rounded-2xl p-1.5 min-w-[130px] shadow-2xl z-50 animate-in fade-in zoom-in duration-200">
                    {['Math', 'Science', 'Programming', 'Design', 'Other'].map(tag => (
                      <DropdownMenu.Item 
                        key={tag} 
                        onSelect={() => onUpdateTag?.(tag)}
                        className="p-2 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-emerald-500/10 hover:text-emerald-400 transition-all cursor-pointer outline-none"
                      >
                        {tag}
                      </DropdownMenu.Item>
                    ))}
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            )}

            {!isInLibrary ? (
              <button 
                onClick={(e) => { e.stopPropagation(); onAdd(item); }}
                className="p-2 rounded-xl text-muted-foreground hover:bg-emerald-500/10 hover:text-emerald-400 transition-all"
                title="Add to Library"
              >
                <Plus className="w-4 h-4"/>
              </button>
            ) : (
              onDelete && (
                <button 
                  onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                  className="p-2 rounded-xl text-muted-foreground hover:bg-rose-500/10 hover:text-rose-400 transition-all"
                  title="Delete from Library"
                >
                  <Trash2 className="w-4 h-4"/>
                </button>
              )
            )}
          </div>
        </div>

        <div className="px-4 pb-2">
          <h3 className="text-[14px] font-medium leading-relaxed line-clamp-2 min-h-[40px]">{v.title}</h3>
        </div>

        {/* Thumbnail */}
        <div 
          className="relative aspect-video mx-4 mb-4 rounded-2xl overflow-hidden bg-black/40 cursor-pointer" 
          onClick={() => onClick(item)}
        >
          <img 
            src={v.high_res_thumbnail || v.thumbnail_url} 
            alt={v.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
          />
          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/50 flex items-center justify-center transition-colors">
            <Play className="w-10 h-10 text-white opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300"/>
          </div>
          {qualityScore >= 70 && (
            <div className="absolute top-2 left-2 px-2 py-1 rounded-lg bg-primary text-white text-[9px] font-bold uppercase tracking-widest flex items-center gap-1 shadow-lg">
              <Award className="w-3 h-3"/> Premium
            </div>
          )}
          <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/80 text-[10px] font-bold text-white backdrop-blur-sm">
            {Math.floor(v.duration_seconds/60)}:{String(v.duration_seconds%60).padStart(2,'0')}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 pb-4 mt-auto flex flex-col gap-3">
          <div className="flex items-center justify-between text-muted-foreground text-[12px]">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5"/> {fmt(v.view_count)}</span>
              <span className="px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 text-[10px] font-bold" title="Virality Score">
                {viralityScore.toFixed(1)}x
              </span>
              {outlierScore > 1.5 && (
                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold animate-pulse" title="Outlier Score">
                  🔥 {outlierScore.toFixed(1)}x
                </span>

              )}
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
            <p className="text-[10px] text-primary/80 italic line-clamp-2 leading-relaxed">“{item.ai_summary}”</p>
          </div>
        )}
      </div>
    </motion.div>
  );
  } catch (err) {
    console.error("VideoCard render error:", err);
    return null;
  }
});

VideoCard.displayName = 'VideoCard';
