import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Edit3, Eye, Users } from 'lucide-react';

interface Collaborator {
  id: string;
  email: string;
  displayName: string;
  avatarColor: string;
  status: 'viewing' | 'editing';
  lastSeen: number;
  cursor?: { x: number; y: number };
}

interface CollaborativePresenceProps {
  noteId: string;
  isEditing?: boolean;
}

// Generate consistent color from string
const stringToColor = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = hash % 360;
  return `hsl(${hue}, 70%, 60%)`;
};

// Simple throttle function
function throttle<T extends (...args: any[]) => void>(fn: T, ms: number): T {
  let lastCall = 0;
  return ((...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= ms) {
      lastCall = now;
      fn(...args);
    }
  }) as T;
}

const CollaborativePresence = ({ noteId, isEditing = false }: CollaborativePresenceProps) => {
  const { user } = useAuth();
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const updatePresence = useCallback((cursorPosition?: { x: number; y: number }) => {
    if (!channelRef.current || !user) return;
    
    channelRef.current.track({
      email: user.email,
      displayName: user.user_metadata?.display_name || user.email?.split('@')[0],
      status: isEditing ? 'editing' : 'viewing',
      lastSeen: Date.now(),
      cursor: cursorPosition
    });
  }, [user, isEditing]);

  useEffect(() => {
    if (!user || !noteId) return;

    const channelName = `note-presence-${noteId}`;
    
    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    channelRef.current = channel;

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const activeCollaborators: Collaborator[] = [];
        
        Object.entries(state).forEach(([userId, presences]) => {
          if (userId !== user.id && presences.length > 0) {
            const presence = presences[0] as any;
            activeCollaborators.push({
              id: userId,
              email: presence.email || 'Anonymous',
              displayName: presence.displayName || presence.email?.split('@')[0] || 'User',
              avatarColor: stringToColor(presence.email || userId),
              status: presence.status || 'viewing',
              lastSeen: presence.lastSeen || Date.now(),
              cursor: presence.cursor,
            });
          }
        });
        
        // Filter out stale users (> 30 seconds)
        const activeUsers = activeCollaborators.filter(u => Date.now() - u.lastSeen < 30000);
        setCollaborators(activeUsers);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        setCollaborators(prev => prev.filter(c => c.id !== key));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          
          await channel.track({
            email: user.email,
            displayName: user.user_metadata?.display_name || user.email?.split('@')[0],
            status: isEditing ? 'editing' : 'viewing',
            lastSeen: Date.now(),
          });
        }
      });

    // Heartbeat to keep presence alive
    const interval = setInterval(() => {
      updatePresence();
    }, 5000);

    return () => {
      clearInterval(interval);
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [user, noteId]);

  // Update our status when editing state changes
  useEffect(() => {
    if (!user || !noteId || !isConnected) return;
    updatePresence();
  }, [isEditing, user, noteId, isConnected, updatePresence]);

  // Track mouse movement for cursor position
  useEffect(() => {
    if (!isConnected) return;

    const handleMouseMove = (e: MouseEvent) => {
      const editor = document.querySelector('[data-block-editor]');
      if (!editor) return;

      const rect = editor.getBoundingClientRect();
      if (
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom
      ) {
        updatePresence({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        });
      }
    };

    const throttledMove = throttle(handleMouseMove, 50);
    document.addEventListener('mousemove', throttledMove);

    return () => {
      document.removeEventListener('mousemove', throttledMove);
    };
  }, [isConnected, updatePresence]);

  if (collaborators.length === 0) return null;

  return (
    <TooltipProvider delayDuration={0}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-1"
      >
        {/* Collaborator avatars */}
        <div className="flex items-center -space-x-2">
          <AnimatePresence mode="popLayout">
            {collaborators.slice(0, 4).map((collaborator, index) => (
              <Tooltip key={collaborator.id}>
                <TooltipTrigger asChild>
                  <motion.div
                    initial={{ opacity: 0, scale: 0, x: -10 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0, x: -10 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                      "relative w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white ring-2 ring-background cursor-pointer",
                      "hover:ring-primary transition-all hover:z-10"
                    )}
                    style={{ 
                      backgroundColor: collaborator.avatarColor,
                      zIndex: collaborators.length - index 
                    }}
                  >
                    {collaborator.displayName[0].toUpperCase()}
                    
                    {/* Status indicator */}
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className={cn(
                        "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background",
                        collaborator.status === 'editing' ? 'bg-amber-500' : 'bg-green-500'
                      )}
                    />
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="flex items-center gap-2">
                  <span className="font-medium">{collaborator.displayName}</span>
                  <span className="text-muted-foreground flex items-center gap-1 text-xs">
                    {collaborator.status === 'editing' ? (
                      <>
                        <Edit3 className="w-3 h-3" />
                        Editing
                      </>
                    ) : (
                      <>
                        <Eye className="w-3 h-3" />
                        Viewing
                      </>
                    )}
                  </span>
                </TooltipContent>
              </Tooltip>
            ))}
          </AnimatePresence>
          
          {/* More collaborators indicator */}
          {collaborators.length > 4 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-xs font-medium text-muted-foreground ring-2 ring-background"
                >
                  +{collaborators.length - 4}
                </motion.div>
              </TooltipTrigger>
              <TooltipContent>
                {collaborators.slice(4).map(c => c.displayName).join(', ')}
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Active collaborators label */}
        <motion.div 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-full bg-secondary/50 text-xs text-muted-foreground"
        >
          <Users className="w-3 h-3" />
          <span>
            {collaborators.length} {collaborators.length === 1 ? 'collaborator' : 'collaborators'}
          </span>
        </motion.div>
      </motion.div>

      {/* Remote Cursors Overlay */}
      {collaborators.map((collab) => 
        collab.cursor && (
          <motion.div
            key={`cursor-${collab.id}`}
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: 1,
              x: collab.cursor.x,
              y: collab.cursor.y
            }}
            transition={{ type: 'spring', damping: 30, stiffness: 400 }}
            className="fixed pointer-events-none z-50"
            style={{
              left: 0,
              top: 0,
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M5 3L19 12L12 13L9 20L5 3Z"
                fill={collab.avatarColor}
                stroke="white"
                strokeWidth="2"
              />
            </svg>
            <div 
              className="absolute left-4 top-4 px-2 py-1 rounded text-xs text-white whitespace-nowrap shadow-lg"
              style={{ backgroundColor: collab.avatarColor }}
            >
              {collab.displayName}
            </div>
          </motion.div>
        )
      )}
    </TooltipProvider>
  );
};

export default CollaborativePresence;
