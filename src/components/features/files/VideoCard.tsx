import React, { useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { Play, Plus, Trash2, Tag, ExternalLink, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface VideoCardProps {
  video: any;
  index: number;
  isLibraryItem?: boolean;
  isInLibrary?: boolean;
  onAdd?: (video: any) => void;
  onDelete?: (id: string) => void;
  onUpdateTag?: (id: string, tag: string) => void;
  onMove?: (dragIndex: number, hoverIndex: number) => void;
}

const SUBJECT_TAGS = ['Math', 'Science', 'History', 'Programming', 'Language', 'Other'];

export const VideoCard: React.FC<VideoCardProps> = ({
  video,
  index,
  isLibraryItem = false,
  isInLibrary = false,
  onAdd,
  onDelete,
  onUpdateTag,
  onMove
}) => {
  const ref = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag({
    type: 'VIDEO_CARD',
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: isLibraryItem,
  });

  const [, drop] = useDrop({
    accept: 'VIDEO_CARD',
    hover(item: { index: number }, monitor) {
      if (!ref.current || !onMove) return;
      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) return;

      onMove(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  if (isLibraryItem) {
    drag(drop(ref));
  }

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "group relative bg-card border border-border/50 rounded-2xl overflow-hidden hover:border-teal-500/30 hover:shadow-lg transition-all",
        isDragging && "opacity-50 border-teal-500/50"
      )}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden bg-black/20">
        <img 
          src={video.thumbnail_url || video.thumbnail} 
          alt={video.title} 
          className="w-full h-full object-cover transition-transform group-hover:scale-105"
        />
        
        {/* Play Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <a 
            href={video.video_url || video.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="w-12 h-12 rounded-full bg-teal-500 text-white flex items-center justify-center shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform"
          >
            <Play className="w-6 h-6 fill-current" />
          </a>
        </div>

        {/* Duration Badge */}
        {video.duration && (
          <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-bold text-white">
            {video.duration}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        <h3 className="text-sm font-semibold line-clamp-2 leading-tight h-10 group-hover:text-teal-400 transition-colors">
          {video.title}
        </h3>
        <p className="text-[11px] text-muted-foreground mt-1 truncate">
          {video.channel_name || video.channel}
        </p>

        {/* Subject Tag Badge */}
        {isLibraryItem && video.subject_tag && (
          <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 text-[10px] font-bold border border-teal-500/20">
            <Tag className="w-3 h-3" />
            {video.subject_tag}
          </div>
        )}

        {/* Actions */}
        <div className="mt-3 flex items-center gap-1.5">
          {!isLibraryItem ? (
            <button
              onClick={() => onAdd?.(video)}
              disabled={isInLibrary}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-bold transition-all",
                isInLibrary 
                  ? "bg-teal-500/10 text-teal-500 cursor-default" 
                  : "bg-secondary/50 hover:bg-teal-500 hover:text-white"
              )}
            >
              {isInLibrary ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              {isInLibrary ? 'In Library' : 'Add to Library'}
            </button>
          ) : (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-secondary/50 hover:bg-secondary text-[11px] font-bold transition-all">
                    <Tag className="w-3.5 h-3.5" /> Tag
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-40">
                  {SUBJECT_TAGS.map(tag => (
                    <DropdownMenuItem 
                      key={tag} 
                      onClick={() => onUpdateTag?.(video.id, tag)}
                      className={cn(video.subject_tag === tag && "text-teal-400 bg-teal-500/10")}
                    >
                      {tag}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <button
                onClick={() => onDelete?.(video.id)}
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
          
          <a
            href={video.video_url || video.url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground transition-all"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </motion.div>
  );
};
