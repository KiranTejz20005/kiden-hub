import { motion, AnimatePresence } from 'framer-motion';
import { Profile, ActiveView } from '@/lib/types';
import GlobalSearch from './GlobalSearch';
import {
  Home,
  Library,
  Compass,
  Box,
  Send,
  MessageSquare,
  FileText,
  Columns3,
  Calendar,
  Flame,
  Target,
  Plus,
  ChevronRight,
  ChevronDown,
  LogOut,
  Settings,
  Trash2,
  CreditCard,
  PanelLeftClose,
  PanelLeftOpen,
  GraduationCap,
  Store,
  ChevronsUpDown,
  LayoutGrid,
  Sparkles,
  UserPlus,
  HelpCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { forgetKanbanBoard } from '@/hooks/useKanbanBoard';
import { formatDistanceToNow } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface AppSidebarProps {
  activeView: ActiveView;
  onViewChange: (view: ActiveView) => void;
  profile: Profile | null;
  onProfileUpdate?: () => void;
  isCollapsed: boolean;
  setIsCollapsed: (v: boolean) => void;
  boards: any[];
  selectedBoard: any | null;
  onBoardSelect: (board: any) => void;
  onBoardsUpdate?: () => void;
  onCreateBoard?: () => void;
}

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Home',         icon: Home        },
  { id: 'files',     label: 'Library',      icon: Library     },
  { id: 'chat',      label: 'Chat',         icon: MessageSquare },
  { id: 'notes',     label: 'Notes Taking', icon: FileText    },
  { id: 'kanban',    label: 'Kanban Board', icon: Columns3    },
  { id: 'calendar',  label: 'Calendar',     icon: Calendar    },
  { id: 'focus',     label: 'Focus Timer',  icon: Flame       },
  { id: 'habits',    label: 'Habit Tracker',icon: Target      },
] as const;

export default function AppSidebar({
  activeView,
  onViewChange,
  profile,
  isCollapsed,
  setIsCollapsed,
  boards,
  selectedBoard,
  onBoardSelect,
  onBoardsUpdate,
  onCreateBoard,
}: AppSidebarProps) {
  const { user, signOut } = useAuth();
  const [showSearch, setShowSearch] = useState(false);
  const [conversations, setConversations] = useState<any[]>([]);
  const [boardsExpanded, setBoardsExpanded] = useState(true);
  const [chatExpanded, setChatExpanded] = useState(true);

  /* Short date formatter for sidebar items */
  const formatShortDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      if (diffMins < 1) return 'now';
      if (diffMins < 60) return `${diffMins}m`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays < 7) return `${diffDays}d`;
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  /* Fetch user recent chats for nested sidebar list */
  const fetchConversations = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('conversations')
        .select('id, title, last_message_at')
        .eq('user_id', user.id)
        .order('last_message_at', { ascending: false })
        .limit(6);
      if (data) setConversations(data);
    } catch { /* silent */ }
  }, [user]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations, activeView]);

  /* Keyboard shortcuts */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key === 'b') { e.preventDefault(); setIsCollapsed(!isCollapsed); }
      if (mod && e.key === 'k') { e.preventDefault(); setShowSearch(p => !p); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isCollapsed, setIsCollapsed]);

  const handleDeleteBoard = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Delete this board?')) return;
    try {
      await supabase.from('research_board_items').delete().eq('board_id', id);
      await supabase.from('research_boards' as any).delete().eq('id', id);
      forgetKanbanBoard();
      toast.success('Board removed');
      if (selectedBoard?.id === id) onBoardSelect(null as any);
      onBoardsUpdate?.();
    } catch { toast.error('Failed to delete board'); }
  };

  /* User Menu Dropdown */
  const UserMenu = ({ side, align }: { side: 'top'|'right'; align: 'start'|'end' }) => (
    <DropdownMenuContent
      side={side} align={align} sideOffset={10}
      className="w-64 bg-[#202020] border border-[#2a2a2a] rounded-2xl p-1.5 shadow-2xl z-[200]"
    >
      <div
        onClick={() => onViewChange('dashboard')}
        className="flex items-center justify-between px-2.5 py-2 rounded-xl hover:bg-white/[0.06] cursor-pointer group"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-[11px] font-bold border border-white/10 shrink-0 text-white">
            {profile?.display_name?.[0] || profile?.full_name?.[0] || 'K'}
          </div>
          <span className="text-[12px] font-medium text-white truncate">
            {(profile?.display_name || profile?.full_name || 'Kiran Teja')}&apos;s workspace
          </span>
        </div>
        <ChevronRight className="w-3.5 h-3.5 text-white/30 shrink-0" />
      </div>
      <DropdownMenuSeparator className="bg-white/[0.06] my-1" />
      {[
        { label: 'Settings',            icon: Settings,    action: () => onViewChange('settings') },
        { label: 'View plans',           icon: CreditCard,  action: () => toast.info('Pro plan active') },
        { label: 'Trash',               icon: Trash2,      action: () => toast.info('Trash is empty'), right: true },
      ].map(({ label, icon: Icon, action, right }) => (
        <DropdownMenuItem key={label} onClick={action}
          className="flex items-center justify-between px-2.5 py-2 rounded-xl text-[12px] font-medium text-white/80 hover:text-white hover:bg-white/[0.06] cursor-pointer"
        >
          <span className="flex items-center gap-2.5"><Icon className="w-4 h-4 text-white/40" />{label}</span>
          {right && <ChevronRight className="w-3.5 h-3.5 text-white/30" />}
        </DropdownMenuItem>
      ))}
      <DropdownMenuSeparator className="bg-white/[0.06] my-1" />
      {[
        { label: 'Join the Discord',     icon: MessageSquare, action: () => window.open('https://discord.gg', '_blank') },
        { label: 'Apps & extras',        icon: LayoutGrid,    action: () => toast.info('Apps catalog'), right: true },
        { label: 'Refer Eden, earn 20%', icon: Sparkles,      action: () => toast.success('Link copied!'), emerald: true },
      ].map(({ label, icon: Icon, action, right, emerald }) => (
        <DropdownMenuItem key={label} onClick={action}
          className="flex items-center justify-between px-2.5 py-2 rounded-xl text-[12px] font-medium text-white/80 hover:text-white hover:bg-white/[0.06] cursor-pointer"
        >
          <span className="flex items-center gap-2.5">
            <Icon className={cn("w-4 h-4", emerald ? "text-emerald-400" : "text-white/40")} />{label}
          </span>
          {right && <ChevronRight className="w-3.5 h-3.5 text-white/30" />}
        </DropdownMenuItem>
      ))}
      <DropdownMenuSeparator className="bg-white/[0.06] my-1" />
      <DropdownMenuItem onClick={() => toast.info('Multi-account coming soon')}
        className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-[12px] font-medium text-white/80 hover:text-white hover:bg-white/[0.06] cursor-pointer"
      >
        <UserPlus className="w-4 h-4 text-white/40" /> Add another account
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => toast.info('support@kidenhub.com')}
        className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-[12px] font-medium text-white/80 hover:text-white hover:bg-white/[0.06] cursor-pointer"
      >
        <HelpCircle className="w-4 h-4 text-white/40" /> Help &amp; support
      </DropdownMenuItem>
      <DropdownMenuItem onClick={signOut}
        className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-[12px] font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 cursor-pointer"
      >
        <LogOut className="w-4 h-4" /> Sign out
      </DropdownMenuItem>
    </DropdownMenuContent>
  );

  return (
    <TooltipProvider delayDuration={400}>
      {/* Floating expand button when sidebar is completely closed (Reference 2) */}
      <AnimatePresence>
        {isCollapsed && (
          <motion.button
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.15 }}
            type="button"
            onClick={() => setIsCollapsed(false)}
            className="fixed bottom-4 left-4 z-[100] w-9 h-9 rounded-xl bg-[#202020] border border-[#333333]/50 hover:bg-[#242424] text-white/50 hover:text-white flex items-center justify-center shadow-2xl transition-all cursor-pointer group"
            title="Expand sidebar (Ctrl+B)"
          >
            <PanelLeftOpen className="w-4 h-4" />
          </motion.button>
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{
          width: isCollapsed ? 0 : 290,
          padding: isCollapsed ? 0 : 8,
          opacity: isCollapsed ? 0 : 1,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="h-screen shrink-0 flex flex-col z-[50] select-none overflow-hidden"
      >
        <div className="flex flex-col w-full h-full rounded-2xl bg-[#1c1c1c] border border-[#2a2a2a] overflow-hidden shadow-xl">

          {/* ── Search / Create Top Button ── */}
          <div className="px-2 pt-2.5 pb-1.5 shrink-0">
            {isCollapsed ? (
              <div className="flex justify-center">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => setShowSearch(true)}
                      className="w-9 h-8 flex items-center justify-center rounded-lg bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.06] text-white/60 hover:text-white transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="text-xs">Create or search</TooltipContent>
                </Tooltip>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowSearch(true)}
                className="w-full h-9 flex items-center justify-between px-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.07] text-white/70 hover:text-white transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <Plus className="w-3.5 h-3.5 text-white/50 group-hover:text-white transition-colors" />
                  <span className="text-[13px] font-semibold">Create or search</span>
                </div>
                <kbd className="text-[10px] text-white/30 bg-white/[0.06] border border-white/[0.08] px-1.5 py-0.5 rounded font-mono">
                  Ctrl K
                </kbd>
              </button>
            )}
          </div>

          {/* ── Main Navigation List ── */}
          <ScrollArea className="flex-1 min-h-0">
            <div className={cn('px-2 py-1.5 flex flex-col', isCollapsed ? 'items-center gap-1' : 'gap-0.5')}>

              {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
                const isActive = activeView === id;
                if (isCollapsed) {
                  return (
                    <Tooltip key={id}>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={() => onViewChange(id as ActiveView)}
                          className={cn(
                            'w-9 h-9 flex items-center justify-center rounded-lg transition-colors cursor-pointer',
                            isActive ? 'bg-white/[0.08] text-white' : 'text-white/40 hover:text-white hover:bg-white/[0.05]'
                          )}
                        >
                          <Icon className="w-4 h-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="text-xs">{label}</TooltipContent>
                    </Tooltip>
                  );
                }

                return (
                  <div key={id} className="flex flex-col w-full">
                    <button
                      type="button"
                      onClick={() => onViewChange(id as ActiveView)}
                      className={cn(
                        'w-full flex items-center justify-between px-3 py-2 rounded-xl text-[13px] font-semibold transition-colors cursor-pointer text-left group',
                        isActive
                          ? 'bg-white/[0.08] text-white'
                          : 'text-white/60 hover:text-white hover:bg-white/[0.05]'
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-white' : 'text-white/45')} />
                        <span className="truncate leading-none">{label}</span>
                      </div>
                      {id === 'chat' && conversations.length > 0 && (
                        <div
                          onClick={(e) => { e.stopPropagation(); setChatExpanded(p => !p); }}
                          className="p-1 rounded hover:bg-white/10 text-white/40 hover:text-white transition-colors shrink-0"
                          title="Toggle chat history"
                        >
                          <ChevronDown className={cn('w-3.5 h-3.5 transition-transform duration-200', chatExpanded ? '' : '-rotate-90')} />
                        </div>
                      )}
                    </button>

                    {/* Nested chat items under Chat */}
                    <AnimatePresence>
                      {id === 'chat' && chatExpanded && conversations.length > 0 && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          className="pl-5 pr-1 py-1 space-y-0.5 overflow-hidden"
                        >
                          {conversations.map(conv => (
                            <button
                              key={conv.id}
                              type="button"
                              onClick={() => onViewChange('chat')}
                              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[12px] font-medium text-white/50 hover:text-white hover:bg-white/[0.04] transition-colors cursor-pointer text-left group"
                            >
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-white/30 shrink-0 group-hover:bg-white" />
                                <span className="truncate max-w-[140px]">{conv.title}</span>
                              </div>
                              <span className="text-[10.5px] text-white/40 shrink-0 font-normal pl-1.5 font-mono">
                                {formatShortDate(conv.last_message_at)}
                              </span>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}

              {/* ── Boards Section ── */}
              {!isCollapsed && (
                <div className="mt-4">
                  <p className="px-3 pb-1.5 text-[10.5px] font-semibold text-white/30 uppercase tracking-widest">
                    Boards
                  </p>

                  {/* My Space row */}
                  <div
                    onClick={() => { onViewChange('boards'); onBoardSelect(null); }}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer group transition-colors',
                      activeView === 'boards' && !selectedBoard
                        ? 'bg-white/[0.08] text-white'
                        : 'text-white/60 hover:text-white hover:bg-white/[0.05]'
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <LayoutGrid className={cn('w-4 h-4 shrink-0', activeView === 'boards' && !selectedBoard ? 'text-white' : 'text-white/45')} />
                      <span className="text-[13px] font-semibold truncate">My Space</span>
                    </div>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={e => { e.stopPropagation(); onViewChange('boards'); onCreateBoard?.(); }}
                        className="p-1 rounded-md text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Boards list */}
                  {boards.length > 0 && (
                    <div className="pl-6 pr-1 pt-1 space-y-0.5">
                      {boards.map(board => {
                        const sel = activeView === 'boards' && selectedBoard?.id === board.id;
                        return (
                          <div
                            key={board.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => { onBoardSelect(board); onViewChange('boards'); }}
                            className={cn(
                              'w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[12px] font-medium transition-colors cursor-pointer group',
                              sel ? 'bg-white/[0.07] text-white font-semibold' : 'text-white/50 hover:text-white hover:bg-white/[0.04]'
                            )}
                          >
                            <span className="text-xs shrink-0">{board.emoji || '🔬'}</span>
                            <span className="truncate flex-1">{board.title}</span>
                            <button
                              type="button"
                              onClick={e => handleDeleteBoard(e, board.id)}
                              className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-white/30 hover:text-rose-400 hover:bg-rose-500/15 transition-all"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>

          {/* ── Profile / Footer Bar ── */}
          {isCollapsed ? (
            <div className="border-t border-white/[0.06] py-2 flex flex-col items-center gap-1.5 shrink-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="w-7 h-7 rounded-full bg-[#2a2a2a] border border-white/10 flex items-center justify-center text-[10px] font-bold text-white hover:scale-105 transition-transform outline-none cursor-pointer"
                  >
                    {profile?.display_name?.[0] || profile?.full_name?.[0] || 'K'}
                  </button>
                </DropdownMenuTrigger>
                <UserMenu side="right" align="end" />
              </DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => setIsCollapsed(false)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/[0.07] text-white/40 hover:text-white transition-colors cursor-pointer"
                  >
                    <PanelLeftOpen className="w-3.5 h-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="text-xs">Expand sidebar (Ctrl+B)</TooltipContent>
              </Tooltip>
            </div>
          ) : (
            <div className="h-11 border-t border-white/[0.06] flex items-center justify-between px-3 shrink-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-2 px-1.5 py-1 rounded-lg hover:bg-white/[0.06] transition-colors cursor-pointer group text-left outline-none max-w-[140px]"
                  >
                    <div className="w-5 h-5 rounded-full bg-[#2a2a2a] border border-white/10 flex items-center justify-center text-[9px] font-bold text-white shrink-0">
                      {profile?.display_name?.[0] || profile?.full_name?.[0] || 'K'}
                    </div>
                    <span className="text-[12px] font-semibold text-white/80 truncate group-hover:text-white transition-colors">
                      {profile?.display_name || profile?.full_name || 'Kiran Teja'}
                    </span>
                    <ChevronsUpDown className="w-3 h-3 text-white/40 shrink-0" />
                  </button>
                </DropdownMenuTrigger>
                <UserMenu side="top" align="start" />
              </DropdownMenu>

              <div className="flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" onClick={() => setIsCollapsed(true)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/[0.07] text-white/40 hover:text-white transition-colors cursor-pointer">
                      <PanelLeftClose className="w-3.5 h-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">Collapse (Ctrl+B)</TooltipContent>
                </Tooltip>
              </div>
            </div>
          )}
        </div>

        <GlobalSearch open={showSearch} onOpenChange={setShowSearch} onViewChange={onViewChange} />
      </motion.aside>
    </TooltipProvider>
  );
}