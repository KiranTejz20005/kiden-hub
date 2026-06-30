import { useDraggable } from '@dnd-kit/core';
import { format } from 'date-fns';
import { Clock, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DraggableEventProps {
  event: any;
  view: string;
  onClick: () => void;
}

export const DraggableEvent = ({ event, view, onClick }: DraggableEventProps) => {
  const isMonth = view === 'month';
  const isAgenda = view === 'agenda';
  
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

  // Render a clean list item for agenda view, no drag styles needed
  if (isAgenda) {
    return (
      <div 
        onClick={onClick}
        className="w-full flex items-center justify-between p-4 rounded-xl border border-white/[0.05] bg-white/[0.01] hover:bg-white/[0.03] transition-all cursor-pointer group"
      >
        <div className="flex items-center gap-4">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] shrink-0" />
          <div>
            <h4 className="text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors">
              {event.title}
            </h4>
            {event.location && (
              <div className="flex items-center gap-1.5 mt-1 text-[11px] text-white/40">
                <MapPin className="w-3 h-3" />
                <span>{event.location}</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-white/40">
          <Clock className="w-3.5 h-3.5" />
          <span>
            {format(new Date(event.start_time), 'h:mm a')} - {format(new Date(event.end_time), 'h:mm a')}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        "group cursor-grab active:cursor-grabbing rounded-lg border text-left transition-all relative overflow-hidden h-full w-full select-none",
        isDragging && "opacity-40 z-50 ring-2 ring-emerald-500 shadow-2xl scale-[1.02]",
        isMonth 
          ? "px-2 py-1 bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20" 
          : "px-3 py-2 bg-emerald-500/15 border-emerald-500/30 hover:border-emerald-500/50 hover:bg-emerald-500/20 z-10 shadow-lg shadow-emerald-500/5"
      )}
    >
      <div className="flex items-start gap-2 h-full">
        {!isMonth && (
          <div className="w-1 self-stretch bg-emerald-500 rounded-full shrink-0" />
        )}
        <div className="flex-1 min-w-0 flex flex-col justify-between h-full">
          <p className={cn(
            "font-semibold leading-tight truncate text-white",
            isMonth ? "text-[10px]" : "text-[11.5px]"
          )}>
            {event.title}
          </p>
          {!isMonth && (
            <div className="flex items-center gap-1.5 mt-1 opacity-55 text-[9.5px] text-white/80 font-medium">
              <Clock className="w-3 h-3 text-emerald-400" />
              {format(new Date(event.start_time), 'h:mm a')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
