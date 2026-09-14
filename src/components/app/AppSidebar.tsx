import { motion, AnimatePresence } from 'framer-motion';
import { Profile, ActiveView } from '@/lib/types';
import GlobalSearch from './GlobalSearch';
import {
  LayoutDashboard,
  MessageSquare,
  FileText,
  Calendar,
  Plus,
  ChevronDown,
  LogOut,
  Settings,
  Columns,
  Trash2,
  Flame,
  Target,
  CreditCard
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AppSidebarProps {
  activeView: ActiveView;
  onViewChange: (view: ActiveView) => void;
  profile: Profile | null;
  onProfileUpdate?: () => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  boards: any[];
  selectedBoard: any | null;
  onBoardSelect: (board: any) => void;
  onBoardsUpdate?: () => void;
}

const mainNavItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'files', label: 'Asset Library', icon: Columns },
  { id: 'chat', label: 'AI Assistant', icon: MessageSquare },
  { id: 'notes', label: 'Notes Taking', icon: FileText },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'focus', label: 'Focus Timer', icon: Flame },
  { id: 'habits', label: 'Habit Tracker', icon: Target },
  { id: 'boards', label: 'My Boards', icon: Columns, canCreate: true },
] as const;

const AppSidebar = ({ 
  activeView, 
  onViewChange, 
  profile, 
  isCollapsed, 
  boards,
  selectedBoard,
  onBoardSelect,
  onBoardsUpdate
}: AppSidebarProps) => {
  const { signOut } = useAuth();
  const [showSearch, setShowSearch] = useState(false);
  const [isBoardsExpanded, setIsBoardsExpanded] = useState(true);

  const handleDeleteBoard = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Delete this board?')) {return;}
    try {
      const { error } = await supabase.from('research_boards' as any).delete().eq('id', id);
      if (error) {throw error;}
      toast.success('Board removed');
      if (selectedBoard?.id === id) {
        onBoardSelect(null as any);
      }
      if (onBoardsUpdate) {onBoardsUpdate();}
    } catch (err) {
      toast.error('Failed to delete board');
    }
  };

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setShowSearch((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => { document.removeEventListener("keydown", down); };
  }, []);

  return (
    <TooltipProvider delayDuration={0}>
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? 60 : 240 }}
        className={cn(
          "sticky top-0 h-screen flex flex-col shrink-0 transition-all duration-300 ease-in-out z-[50]",
          "bg-card dark:bg-[#0a0a0a] border-r border-border/80 dark:border-white/[0.03] text-muted-foreground"
        )}
      >
        {/* Workspace Switcher Area */}
        <div className={cn("px-4 py-4 mb-2", isCollapsed && "flex justify-center px-0")}>
          {!isCollapsed ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <motion.button 
                  whileHover={{ backgroundColor: "rgba(120,120,120,0.06)" }}
                  className="flex items-center justify-between w-full p-2 rounded-xl transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary dark:bg-gradient-to-br dark:from-white/20 dark:to-white/5 dark:text-white flex items-center justify-center text-[11px] font-black shrink-0 shadow-sm border border-primary/20 dark:border-white/10">
                      K
                    </div>
                    <span className="text-[14px] font-semibold text-foreground truncate tracking-tight">
                      Kiden Hub
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-transform duration-200" />
                </motion.button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                className="w-64 bg-popover border-border/80 dark:border-white/[0.06] text-popover-foreground rounded-2xl p-2 shadow-2xl backdrop-blur-xl" 
                align="start"
                side="right"
                sideOffset={12}
              >
                <div className="px-3 py-3 mb-1">
                   <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 dark:text-white/30 mb-2">Workspace</p>
                   <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary dark:bg-white/10 dark:text-white flex items-center justify-center text-xs font-bold border border-primary/20 dark:border-white/10">K</div>
                     <div className="flex flex-col">
                       <span className="text-[13px] font-semibold text-foreground">Kiden Hub</span>
                       <span className="text-[10px] text-muted-foreground dark:text-white/30">Personal Workspace</span>
                     </div>
                   </div>
                </div>
                <DropdownMenuSeparator className="bg-border/60 dark:bg-white/[0.03] my-1.5" />
                <DropdownMenuItem 
                  onClick={() => { onViewChange('settings'); }}
                  className="flex items-center gap-2.5 px-3 py-2.5 cursor-pointer hover:bg-muted/70 dark:hover:bg-white/[0.05] rounded-xl transition-all text-[13px] font-medium group"
                >
                  <Settings className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-center gap-2.5 px-3 py-2.5 cursor-pointer hover:bg-muted/70 dark:hover:bg-white/[0.05] rounded-xl transition-all text-[13px] font-medium group">
                  <CreditCard className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  Billing
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border/60 dark:bg-white/[0.03] my-1.5" />
                <DropdownMenuItem 
                  onClick={signOut}
                  className="flex items-center gap-2.5 px-3 py-2.5 cursor-pointer hover:bg-rose-500/10 text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-400 rounded-xl transition-all text-[13px] font-medium group"
                >
                  <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <motion.div 
              whileHover={{ scale: 1.1 }}
              className="w-7 h-7 rounded-lg bg-primary/10 text-primary dark:bg-gradient-to-br dark:from-white/20 dark:to-white/5 dark:text-white flex items-center justify-center text-[11px] font-black border border-primary/20 dark:border-white/10 cursor-pointer shadow-sm"
            >
              K
            </motion.div>
          )}
        </div>

        <ScrollArea className="flex-1">
          <div className="px-3 py-2">
            {/* Main Pages */}
            <div className="space-y-1">
              {mainNavItems.map((item) => {
                const isActive = activeView === item.id;
                
                return (
                  <div key={item.id} className="space-y-0.5">
                    <motion.div
                      whileHover={{ backgroundColor: "rgba(120,120,120,0.06)" }}
                      onClick={() => { onViewChange(item.id as ActiveView); }}
                      className={cn(
                        "w-full h-9 flex items-center gap-3 px-3 relative group transition-all rounded-xl cursor-pointer",
                        isActive 
                          ? "text-primary dark:text-white bg-primary/10 dark:bg-white/5 font-semibold shadow-sm dark:shadow-none" 
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/60 dark:hover:bg-white/[0.03]",
                        isCollapsed && "justify-center px-0"
                      )}
                    >
                      {isActive && (
                        <motion.div 
                          layoutId="active-nav"
                          className="absolute left-1 top-2 bottom-2 w-[3px] bg-primary dark:bg-white rounded-full" 
                        />
                      )}
                      <item.icon className={cn(
                        "w-4 h-4 transition-all duration-300",
                        isActive 
                          ? "text-primary dark:text-white scale-110" 
                          : "text-muted-foreground group-hover:text-foreground dark:text-[var(--text-tertiary)] dark:group-hover:text-white group-hover:scale-110"
                      )} />
                      {!isCollapsed && (
                        <span className="text-[13px] font-medium flex-1 text-left tracking-tight">
                          {item.label}
                        </span>
                      )}
                      
                      {item.id === 'boards' && !isCollapsed && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onViewChange('boards');
                            }}
                            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/80 dark:hover:bg-white/10 transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                          <motion.div
                            animate={{ rotate: isBoardsExpanded ? 0 : -90 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsBoardsExpanded(!isBoardsExpanded);
                            }}
                            className="p-1 hover:bg-muted/80 dark:hover:bg-white/10 rounded-md transition-colors cursor-pointer"
                          >
                            <ChevronDown className="w-3 h-3 text-muted-foreground" />
                          </motion.div>
                        </div>
                      )}
                    </motion.div>

                    {/* Inline Boards List under 'My Boards' */}
                    {item.id === 'boards' && !isCollapsed && boards.length > 0 && (
                      <AnimatePresence>
                        {isBoardsExpanded && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2, ease: "easeInOut" }}
                            className="overflow-hidden mt-1 mb-3 space-y-0.5"
                          >
                            {boards.map((board) => (
                              <motion.button
                                key={board.id}
                                whileHover={{ x: 4, backgroundColor: "rgba(120,120,120,0.05)" }}
                                onClick={() => { onBoardSelect(board); }}
                                className={cn(
                                  "w-full h-8 flex items-center gap-3 px-8 rounded-lg transition-all group",
                                  selectedBoard?.id === board.id 
                                    ? "text-primary dark:text-white font-semibold bg-primary/10 dark:bg-white/5" 
                                    : "text-muted-foreground hover:text-foreground"
                                )}
                              >
                                <span className="text-[14px] opacity-70 group-hover:opacity-100 transition-opacity">
                                  {board.emoji || '🔬'}
                                </span>
                                <span className="text-[12px] truncate flex-1">{board.title}</span>
                                <button 
                                  onClick={(e) => handleDeleteBoard(e, board.id)}
                                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-rose-500/20 text-muted-foreground hover:text-rose-500 rounded-md transition-all"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </motion.button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </ScrollArea>

        {/* Sidebar Footer */}
        <div className={cn(
          "p-3.5 border-t border-border/80 dark:border-white/[0.03] flex items-center justify-between gap-2 bg-card/95 dark:bg-[#0d0d0d]/50 backdrop-blur-md",
          isCollapsed && "flex-col py-6"
        )}>
          {!isCollapsed && profile && (
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="relative shrink-0">
                <div className="w-8 h-8 rounded-full bg-secondary dark:bg-gradient-to-tr dark:from-white/10 dark:to-white/5 border border-border dark:border-white/10 flex items-center justify-center overflow-hidden shadow-sm">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[10px] font-bold text-foreground">{profile.display_name?.charAt(0) || profile.full_name?.charAt(0) || 'U'}</span>
                  )}
                </div>
                <div className={cn(
                  "absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-card dark:border-[#0a0a0a]",
                  profile.status === 'online' || !profile.status ? "bg-emerald-500" :
                  profile.status === 'away' ? "bg-amber-500" : "bg-gray-400"
                )} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[13px] font-semibold text-foreground truncate tracking-tight">
                  {profile.display_name || profile.full_name || 'User'}
                </span>
                <span className="text-[10px] text-muted-foreground/70 dark:text-white/30 truncate uppercase tracking-widest font-bold">
                  {profile.status || 'online'}
                </span>
              </div>
            </div>
          )}
          
          <div className={cn("flex items-center gap-1.5", isCollapsed && "flex-col")}>
            <ThemeToggle variant="icon" />

            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  onClick={() => { onViewChange('settings'); }}
                  className="w-9 h-9 flex items-center justify-center rounded-xl bg-secondary/60 hover:bg-secondary text-muted-foreground hover:text-foreground border border-border/60 dark:border-white/10 transition-all shadow-sm group"
                >
                  <Settings className="w-4 h-4 group-hover:rotate-45 transition-transform" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Settings</TooltipContent>
            </Tooltip>
          </div>
        </div>

        <GlobalSearch 
          open={showSearch} 
          onOpenChange={setShowSearch} 
          onViewChange={onViewChange} 
        />
      </motion.aside>
    </TooltipProvider>
  );
};

export default AppSidebar;