import { motion, AnimatePresence } from 'framer-motion';
import { Profile, ActiveView } from '@/lib/types';
import SettingsPanel from './SettingsPanel';
import GlobalSearch from './GlobalSearch';
import {
  LayoutDashboard,
  MessageSquare,
  FileText,
  Search,
  Compass,
  Plus,
  Copy,
  ChevronDown,
  LogOut,
  Settings,
  Columns,
  MoreHorizontal,
  ChevronLeft,
  ExternalLink,
  CreditCard,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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
  { id: 'boards', label: 'My Boards', icon: Columns },
] as const;

const AppSidebar = ({ 
  activeView, 
  onViewChange, 
  profile, 
  onProfileUpdate, 
  isCollapsed, 
  setIsCollapsed,
  boards,
  selectedBoard,
  onBoardSelect,
  onBoardsUpdate
}: AppSidebarProps) => {
  const { user, signOut } = useAuth();
  const [showSettings, setShowSettings] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [isBoardsExpanded, setIsBoardsExpanded] = useState(true);

  const handleDeleteBoard = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Delete this board?')) return;
    try {
      const { error } = await supabase.from('research_boards' as any).delete().eq('id', id);
      if (error) throw error;
      toast.success('Board removed');
      if (onBoardsUpdate) onBoardsUpdate();
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
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <TooltipProvider delayDuration={0}>
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? 60 : 240 }}
        className={cn(
          "sticky top-0 h-screen flex flex-col shrink-0 transition-all duration-300 ease-in-out z-[50]",
          "bg-[#0a0a0a] border-r border-white/[0.03] text-[var(--text-secondary)]"
        )}
      >
        {/* Workspace Switcher Area */}
        <div className={cn("px-4 py-4 mb-2", isCollapsed && "flex justify-center px-0")}>
          {!isCollapsed ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <motion.button 
                  whileHover={{ backgroundColor: "rgba(255,255,255,0.03)" }}
                  className="flex items-center justify-between w-full p-2 rounded-xl transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center text-[11px] font-black text-white shrink-0 shadow-lg border border-white/10">
                      K
                    </div>
                    <span className="text-[14px] font-semibold text-[var(--text-primary)] truncate tracking-tight">
                      Kiden Hub
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-[var(--text-tertiary)] group-hover:text-[var(--text-secondary)] transition-transform duration-200" />
                </motion.button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                className="w-64 bg-[#161616] border-white/[0.06] text-[var(--text-primary)] rounded-2xl p-2 shadow-2xl backdrop-blur-xl" 
                align="start"
                side="right"
                sideOffset={12}
              >
                <div className="px-3 py-3 mb-1">
                   <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-2">Workspace</p>
                   <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-xs font-bold text-white border border-white/10">K</div>
                     <div className="flex flex-col">
                       <span className="text-[13px] font-semibold">Kiden Hub</span>
                       <span className="text-[10px] text-white/30">Personal Workspace</span>
                     </div>
                   </div>
                </div>
                <DropdownMenuSeparator className="bg-white/[0.03] my-1.5" />
                <DropdownMenuItem 
                  onClick={() => setShowSettings(true)}
                  className="flex items-center gap-2.5 px-3 py-2.5 cursor-pointer hover:bg-white/[0.05] rounded-xl transition-all text-[13px] font-medium group"
                >
                  <Settings className="w-4 h-4 text-[var(--text-tertiary)] group-hover:text-white transition-colors" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-center gap-2.5 px-3 py-2.5 cursor-pointer hover:bg-white/[0.05] rounded-xl transition-all text-[13px] font-medium group">
                  <CreditCard className="w-4 h-4 text-[var(--text-tertiary)] group-hover:text-white transition-colors" />
                  Billing
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/[0.03] my-1.5" />
                <DropdownMenuItem 
                  onClick={signOut}
                  className="flex items-center gap-2.5 px-3 py-2.5 cursor-pointer hover:bg-rose-500/10 text-rose-400 hover:text-rose-400 rounded-xl transition-all text-[13px] font-medium group"
                >
                  <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <motion.div 
              whileHover={{ scale: 1.1 }}
              className="w-7 h-7 rounded-lg bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center text-[11px] font-black text-white border border-white/10 cursor-pointer shadow-xl"
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
                    <motion.button
                      whileHover={{ backgroundColor: "rgba(255,255,255,0.03)" }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => onViewChange(item.id as ActiveView)}
                      className={cn(
                        "w-full h-9 flex items-center gap-3 px-3 relative group transition-all rounded-xl",
                        isActive ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
                        isCollapsed && "justify-center px-0"
                      )}
                    >
                      {isActive && (
                        <motion.div 
                          layoutId="active-nav"
                          className="absolute left-1 top-2 bottom-2 w-[3px] bg-white rounded-full" 
                        />
                      )}
                      <item.icon className={cn(
                        "w-4 h-4 transition-all duration-300",
                        isActive ? "text-white scale-110" : "text-[var(--text-tertiary)] group-hover:text-white group-hover:scale-110"
                      )} />
                      {!isCollapsed && (
                        <span className="text-[13px] font-medium flex-1 text-left tracking-tight">
                          {item.label}
                        </span>
                      )}
                      
                      {item.id === 'boards' && !isCollapsed && (
                        <motion.div
                          animate={{ rotate: isBoardsExpanded ? 0 : -90 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsBoardsExpanded(!isBoardsExpanded);
                          }}
                          className="p-1 hover:bg-white/10 rounded-md transition-colors cursor-pointer"
                        >
                          <ChevronDown className="w-3 h-3 text-[var(--text-tertiary)]" />
                        </motion.div>
                      )}
                    </motion.button>

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
                                whileHover={{ x: 4, backgroundColor: "rgba(255,255,255,0.02)" }}
                                onClick={() => onBoardSelect(board)}
                                className={cn(
                                  "w-full h-8 flex items-center gap-3 px-8 rounded-lg transition-all group",
                                  selectedBoard?.id === board.id 
                                    ? "text-white font-semibold" 
                                    : "text-white/40 hover:text-white"
                                )}
                              >
                                <span className="text-xs transition-transform group-hover:scale-125">
                                  {board.emoji || '📁'}
                                </span>
                                <span className="text-[12px] truncate flex-1">{board.title}</span>
                                <button 
                                  onClick={(e) => handleDeleteBoard(e, board.id)}
                                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-rose-500/20 text-white/20 hover:text-rose-400 rounded-md transition-all"
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
          "p-4 border-t border-white/[0.03] flex items-center justify-between gap-2 bg-[#0d0d0d]/50 backdrop-blur-md",
          isCollapsed && "flex-col py-6"
        )}>
          {!isCollapsed && profile && (
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="relative shrink-0">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-white/10 to-white/5 border border-white/10 flex items-center justify-center overflow-hidden shadow-lg">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[10px] font-bold">{profile.display_name?.charAt(0) || profile.full_name?.charAt(0) || 'U'}</span>
                  )}
                </div>
                <div className={cn(
                  "absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border-2 border-[#0a0a0a]",
                  profile.status === 'online' || !profile.status ? "bg-emerald-500" :
                  profile.status === 'away' ? "bg-amber-500" : "bg-gray-500"
                )} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[13px] font-semibold text-[var(--text-primary)] truncate tracking-tight">
                  {profile.display_name || profile.full_name || 'User'}
                </span>
                <span className="text-[10px] text-white/30 truncate uppercase tracking-widest font-bold">
                  {profile.status || 'online'}
                </span>
              </div>
            </div>
          )}
          
          <div className={cn("flex items-center gap-1", isCollapsed && "flex-col")}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  onClick={() => setShowSettings(true)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-[var(--text-tertiary)] hover:text-white transition-all group"
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
        <SettingsPanel 
          profile={profile} 
          onProfileUpdate={onProfileUpdate || (() => {})} 
          isOpen={showSettings} 
          onOpenChange={setShowSettings} 
        />
      </motion.aside>
    </TooltipProvider>
  );
};

export default AppSidebar;