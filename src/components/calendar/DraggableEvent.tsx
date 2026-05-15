import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DraggableEventProps {
  event: any;
  view: string;
  onClick: () => void;
}

export const DraggableEvent = ({ event, view, onClick }: DraggableEventProps) => {
  const isMonth = view === 'month';
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: event.id,
    data: {
      event,
      type: 'event'
    }
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      layoutId={`event-${event.id}`}
      whileHover={{ scale: isMonth ? 1.02 : 1 }}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onMouseDown={(e) => {
        e.stopPropagation();
      }}
      className={cn(
        "group cursor-grab active:cursor-grabbing rounded-md border text-left transition-all relative overflow-hidden h-full w-full",
        isDragging && "opacity-50 z-50 ring-2 ring-emerald-500 shadow-2xl",
        isMonth 
          ? "px-1.5 py-0.5 bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20" 
          : "px-2 py-1 bg-emerald-500/15 border-emerald-500/30 hover:ring-2 ring-emerald-500/20 z-10 shadow-lg shadow-emerald-500/5"
      )}
    >
      <div className="flex items-center gap-1.5 overflow-hidden">
        {!isMonth && (
           <div className="w-1 h-full absolute left-0 top-0 bg-emerald-500 rounded-l-md" />
        )}
        <p className={cn(
          "font-semibold truncate",
          isMonth ? "text-[9px] text-emerald-500" : "text-[11px] text-white"
        )}>
          {event.title}
        </p>
      </div>
      {!isMonth && (
        <div className="flex items-center gap-2 mt-0.5 opacity-40 text-[9px] text-white font-medium">
          <Clock className="w-2.5 h-2.5" />
          {format(new Date(event.start_time), 'HH:mm')}
        </div>
      )}
      
      {/* Resize Handle (Placeholder for now) */}
      {!isMonth && (
        <div className="absolute bottom-0 left-0 right-0 h-1.5 cursor-ns-resize hover:bg-emerald-500/50 transition-colors" />
      )}
    </motion.div>
  );
};
