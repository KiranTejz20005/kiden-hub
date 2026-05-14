import { useState, useRef } from 'react';
import { 
  Share2, Link as LinkIcon, Star, MoreVertical, 
  Trash2, Copy, Move, Save, FileText, ChevronRight,
  User, Calendar, Clock, Image as ImageIcon, Smile,
  Plus, X, Maximize, Minimize, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Note, Profile } from '@/lib/types';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface NoteHeaderProps {
  note: Note;
  profile: Profile | null;
  onUpdate: (updates: Partial<Note>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onToggleFavorite: () => void;
  onCopyLink: () => void;
}

const NoteHeader = ({
  note,
  profile,
  onUpdate,
  onDelete,
  onDuplicate,
  onToggleFavorite,
  onCopyLink
}: NoteHeaderProps) => {
  const [isChangingCover, setIsChangingCover] = useState(false);
  const [isRepositioning, setIsRepositioning] = useState(false);
  const coverRef = useRef<HTMLDivElement>(null);

  const handleIconSelect = async (emoji: string) => {
    onUpdate({ icon: emoji });
  };

  const handleRemoveCover = () => {
    onUpdate({ cover_image: null });
  };

  const handleCoverSelect = (url: string) => {
    onUpdate({ cover_image: url });
    setIsChangingCover(false);
  };

  return (
    <div className="flex flex-col w-full">
      {/* ── Breadcrumbs & Actions ── */}
      <div className="h-14 flex items-center justify-between px-6 bg-background/50 backdrop-blur-md sticky top-0 z-40 border-b border-border/10">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground/90">
          <span className="hover:text-foreground cursor-pointer transition-colors">Workspace</span>
          <ChevronRight className="w-3 h-3 opacity-50" />
          <span className="hover:text-foreground cursor-pointer transition-colors">Notes</span>
          <ChevronRight className="w-3 h-3 opacity-50" />
          <div className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer text-foreground font-bold">
            {note.icon || '📝'}
            <span className="truncate max-w-[200px]">{note.title || 'Untitled'}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 mr-4 text-[10px] text-muted-foreground/80 font-bold uppercase tracking-widest">
            {note.word_count || 0} Words · {Math.ceil((note.word_count || 0) / 200)} Min Read
          </div>

          <Button variant="ghost" size="sm" className="h-8 rounded-lg gap-2 text-[11px] font-bold uppercase tracking-wider hover:bg-white/5" onClick={() => toast.info('Share panel coming soon')}>
            <Share2 className="w-3.5 h-3.5" /> Share
          </Button>

          <div className="w-px h-4 bg-border/20" />

          <div className="flex items-center gap-1">
            <button 
              onClick={onCopyLink}
              className="p-2 rounded-lg hover:bg-white/5 text-muted-foreground transition-all"
              title="Copy Link"
            >
              <LinkIcon className="w-4 h-4" />
            </button>
            <button 
              onClick={onToggleFavorite}
              className={cn("p-2 rounded-lg hover:bg-white/5 transition-all", note.is_favorite ? "text-amber-400" : "text-muted-foreground")}
              title="Favorite"
            >
              <Star className="w-4 h-4" fill={note.is_favorite ? "currentColor" : "none"} />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-2 rounded-lg hover:bg-white/5 text-muted-foreground transition-all"><MoreVertical className="w-4 h-4" /></button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={onDuplicate}><Copy className="w-4 h-4 mr-2" /> Duplicate Note</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onUpdate({ is_full_width: !note.is_full_width })}>
                  {note.is_full_width ? <Minimize className="w-4 h-4 mr-2" /> : <Maximize className="w-4 h-4 mr-2" />}
                  {note.is_full_width ? 'Default Width' : 'Full Width'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsChangingCover(true)}><ImageIcon className="w-4 h-4 mr-2" /> Change Cover</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onDelete} className="text-destructive"><Trash2 className="w-4 h-4 mr-2" /> Delete Note</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* ── Cover Image ── */}
      <div 
        ref={coverRef}
        className={cn(
          "relative w-full overflow-hidden transition-all duration-500",
          note.cover_image ? "h-[30vh] min-h-[200px] max-h-[400px]" : "h-20"
        )}
      >
        {note.cover_image ? (
          <>
            <img 
              src={note.cover_image} 
              alt="Note Cover" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent opacity-0 hover:opacity-100 transition-opacity flex items-start justify-end p-6 gap-2">
              <Button size="sm" variant="secondary" className="h-8 rounded-lg bg-black/40 backdrop-blur-md border-white/10 hover:bg-black/60 text-[10px] font-bold uppercase tracking-wider" onClick={() => setIsChangingCover(true)}>
                Change Cover
              </Button>
              <Button size="sm" variant="secondary" className="h-8 rounded-lg bg-black/40 backdrop-blur-md border-white/10 hover:bg-black/60 text-[10px] font-bold uppercase tracking-wider" onClick={handleRemoveCover}>
                Remove
              </Button>
            </div>
          </>
        ) : (
          <div className="w-full h-full group">
            <button 
              onClick={() => setIsChangingCover(true)}
              className="absolute bottom-4 left-6 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
            >
              <ImageIcon className="w-3.5 h-3.5" /> Add Cover
            </button>
          </div>
        )}
      </div>

      {/* ── Page Header Content ── */}
      <div className={cn(
        "relative mx-auto transition-all duration-500",
        note.is_full_width ? "w-full px-12" : "max-w-4xl w-full px-12 md:px-20"
      )}>
        {/* Icon Picker Anchor */}
        <div className="absolute -top-12 left-12 md:left-20">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-24 h-24 rounded-3xl bg-secondary/80 backdrop-blur-md border-4 border-background flex items-center justify-center text-5xl shadow-2xl hover:scale-105 transition-all group">
                {note.icon || '📝'}
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity">
                  <Smile className="w-8 h-8 text-white" />
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="p-2 grid grid-cols-6 gap-1 w-72">
              {['📝', '💡', '🚀', '🧠', '📚', '🎯', '⚡', '🔬', '🌍', '🛠️', '🔥', '💎'].map(emoji => (
                <button key={emoji} onClick={() => handleIconSelect(emoji)} className="w-10 h-10 flex items-center justify-center text-xl hover:bg-white/10 rounded-lg transition-colors">
                  {emoji}
                </button>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="mt-16 space-y-6">
          <div className="space-y-4">
            <input
              value={note.title || ''}
              onChange={(e) => onUpdate({ title: e.target.value })}
              className="w-full bg-transparent border-none focus:outline-none text-4xl font-bold tracking-tight text-white placeholder:text-white/20 transition-all"
              placeholder="Untitled Note"
            />
            
            {/* Metadata Row */}
            <div className="flex flex-wrap items-center gap-6 py-4 border-y border-border/5">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                  {profile?.display_name?.charAt(0) || 'U'}
                </div>
                <span className="text-[11px] font-bold text-muted-foreground/80">{profile?.display_name || 'System User'}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground/70">
                <Calendar className="w-3.5 h-3.5" />
                <span className="text-[10px] font-medium uppercase tracking-wider">{format(new Date(note.created_at), 'MMM d, yyyy')}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground/70">
                <Clock className="w-3.5 h-3.5" />
                <span className="text-[10px] font-medium uppercase tracking-wider">Last Edited {format(new Date(note.updated_at), 'h:mm a')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cover Picker Modal */}
      {isChangingCover && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
          <div className="w-full max-w-2xl bg-[#0A0A0A] border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Select Cover Image</h2>
              <button onClick={() => setIsChangingCover(false)} className="p-2 rounded-full hover:bg-white/5 text-muted-foreground"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 grid grid-cols-2 md:grid-cols-3 gap-4 h-[400px] overflow-y-auto">
              {[
                'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80',
                'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&q=80',
                'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80',
                'https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&q=80',
                'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&q=80',
                'https://images.unsplash.com/photo-1426604966848-d7adac402bdb?auto=format&fit=crop&q=80'
              ].map(url => (
                <button 
                  key={url} 
                  onClick={() => handleCoverSelect(url)}
                  className="relative aspect-video rounded-xl overflow-hidden hover:scale-105 transition-all group border border-white/5"
                >
                  <img src={url} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NoteHeader;
