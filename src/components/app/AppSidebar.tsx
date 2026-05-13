import { motion, AnimatePresence } from 'framer-motion';
import { Profile, ActiveView } from '@/lib/types';
import SettingsPanel from './SettingsPanel';
import kidenLogo from "@/assets/kiden-logo-green.jpg";
import {
  LayoutDashboard,
  MessageSquare,
  FileText,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Folder,
  LogOut,
  Settings,
  Zap,
  Users,
  Columns
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface AppSidebarProps {
  activeView: ActiveView;
  onViewChange: (view: ActiveView) => void;
  profile: Profile | null;
  onProfileUpdate?: () => void;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'files', label: 'Asset Library', icon: Folder },
  { id: 'chat', label: 'AI Assistant', icon: MessageSquare },
  { id: 'notes', label: 'Smart Notes', icon: FileText },
  { id: 'boards', label: 'Research Boards', icon: Columns },
  { id: 'team', label: 'Collaborators', icon: Users },
  { id: 'settings', label: 'Preferences', icon: Settings },
] as const;

const AppSidebar = ({ activeView, onViewChange, profile, onProfileUpdate }: AppSidebarProps) => {
  const { user, signOut } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleViewChange = (view: ActiveView) => {
    onViewChange(view);
    setIsMobileOpen(false);
  };

  const sidebarVariants = {
    open: { width: 280, x: 0, transition: { type: "spring", stiffness: 300, damping: 30 } },
    collapsed: { width: 88, x: 0, transition: { type: "spring", stiffness: 300, damping: 30 } },
    mobileClosed: { x: "-100%", width: 280, transition: { type: "spring", stiffness: 300, damping: 30 } },
    mobileOpen: { x: 0, width: 280, transition: { type: "spring", stiffness: 300, damping: 30 } }
  };

  const getCurrentVariant = () => {
    if (isMobile) return isMobileOpen ? "mobileOpen" : "mobileClosed";
    return isCollapsed ? "collapsed" : "open";
  };

  return (
    <TooltipProvider delayDuration={0}>
      {isMobile && (
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "fixed top-4 left-4 z-[70] bg-[#050505]/80 backdrop-blur-xl border border-white/10 shadow-xl rounded-xl",
            isMobileOpen && "hidden"
          )}
          onClick={() => setIsMobileOpen(true)}
        >
          <Menu className="w-5 h-5 text-white" />
        </Button>
      )}

      <AnimatePresence>
        {isMobile && isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[65]"
            onClick={() => setIsMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={getCurrentVariant()}
        variants={sidebarVariants}
        className={cn(
          "fixed inset-y-0 left-0 z-[75] flex flex-col h-full bg-[#050505]/95 backdrop-blur-2xl border-r border-white/5",
          !isMobile && "sticky top-0 h-screen shadow-none border-r border-white/5"
        )}
      >
        {/* Header */}
        <div className={cn(
          "h-20 flex items-center px-6 border-b border-white/5 shrink-0",
          isCollapsed && !isMobile ? "justify-center px-2" : "justify-between"
        )}>
          <div className="flex items-center gap-4 overflow-hidden whitespace-nowrap">
            <motion.div 
              whileHover={{ rotate: [0, -10, 10, 0] }}
              className="relative shrink-0"
            >
              <div className="w-10 h-10 rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                <img src={kidenLogo} alt="Logo" className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center ring-2 ring-[#050505] shadow-lg">
                <Sparkles className="w-2.5 h-2.5 text-white" />
              </div>
            </motion.div>

            <AnimatePresence>
              {(!isCollapsed || isMobile) && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, width: 0 }}
                  className="flex flex-col"
                >
                  <span className="font-black text-xl tracking-tighter text-white">Kiden Hub</span>
                  <span className="text-[10px] font-bold text-primary uppercase tracking-widest leading-none">Intelligence V1.0</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {!isMobile && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </Button>
          )}
          {isMobile && (
            <Button variant="ghost" size="icon" onClick={() => setIsMobileOpen(false)} className="text-white hover:bg-white/5">
              <X className="w-5 h-5" />
            </Button>
          )}
        </div>

        {/* Main Navigation */}
        <ScrollArea className="flex-1 px-4 py-6">
          <div className="space-y-2">
            {navItems.map((item) => {
              const isActive = activeView === item.id;

              return (
                <Tooltip key={item.id}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      onClick={() => handleViewChange(item.id as ActiveView)}
                      className={cn(
                        "w-full flex items-center justify-start gap-4 h-12 px-4 rounded-2xl transition-all duration-300 group relative overflow-hidden border border-transparent",
                        isActive
                          ? "bg-primary/10 text-primary border-primary/20 shadow-[0_0_20px_rgba(var(--primary),0.1)]"
                          : "text-gray-500 hover:bg-white/5 hover:text-white",
                        isCollapsed && !isMobile && "justify-center px-0 h-14"
                      )}
                    >
                      <div className={cn(
                        "p-1.5 rounded-lg transition-all duration-300",
                        isActive ? "bg-primary text-white shadow-lg" : "group-hover:text-white"
                      )}>
                        <item.icon className={cn("w-5 h-5 shrink-0", isActive ? "" : "group-hover:scale-110")} />
                      </div>

                      {(!isCollapsed || isMobile) && (
                        <span className={cn(
                          "font-bold text-sm tracking-tight transition-all duration-300",
                          isActive ? "translate-x-1" : "group-hover:translate-x-1"
                        )}>
                          {item.label}
                        </span>
                      )}

                      {/* Active Indicator Glow */}
                      {isActive && (
                        <motion.div
                          layoutId="active-pill"
                          className="absolute left-0 w-1 h-6 bg-primary rounded-r-full shadow-[0_0_10px_rgba(var(--primary),1)]"
                        />
                      )}
                    </Button>
                  </TooltipTrigger>
                  {isCollapsed && !isMobile && (
                    <TooltipContent side="right" className="font-bold bg-[#161B22] text-white border-white/10 px-4 py-2 rounded-xl">
                      {item.label}
                    </TooltipContent>
                  )}
                </Tooltip>
              )
            })}
          </div>
        </ScrollArea>

        {/* User Profile */}
        <div className="p-6 border-t border-white/5 bg-white/[0.02]">
          <div className={cn("flex items-center gap-4", isCollapsed && !isMobile ? "justify-center" : "")}>
            <div className="relative shrink-0">
              <div className="w-11 h-11 rounded-2xl bg-gradient-primary flex items-center justify-center text-white font-black border-2 border-white/10 shadow-2xl overflow-hidden ring-4 ring-black/20">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-lg">{profile?.display_name?.[0]?.toUpperCase() || 'U'}</span>
                )}
              </div>
              <div className={cn(
                "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#050505] shadow-lg",
                profile?.status === 'online' || !profile?.status ? "bg-primary" :
                  profile?.status === 'away' ? "bg-amber-500" : "bg-gray-500"
              )} />
            </div>

            {(!isCollapsed || isMobile) && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-white truncate leading-none mb-1">{profile?.display_name || 'User'}</p>
                <div className="flex items-center gap-1.5">
                   <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                   <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-none">Active</p>
                </div>
              </div>
            )}

            {(!isCollapsed || isMobile) && (
              <div className="flex items-center gap-1">
                {onProfileUpdate && (
                  <SettingsPanel
                    profile={profile}
                    onProfileUpdate={onProfileUpdate}
                    isCollapsed={false}
                  />
                )}
                <Button variant="ghost" size="icon" onClick={signOut} className="h-9 w-9 hover:bg-red-500/10 hover:text-red-400 rounded-xl transition-all">
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </motion.aside>
    </TooltipProvider>
  );
};

export default AppSidebar;