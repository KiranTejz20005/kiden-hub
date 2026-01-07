import { motion, AnimatePresence } from 'framer-motion';
import { Profile, ActiveView } from '@/lib/types';
import { useWorkspace } from '@/hooks/useWorkspace';
import WorkspaceManager from './WorkspaceManager';
import CollectionsManager from './CollectionsManager';
import WorkspaceCollaborators from './WorkspaceCollaborators';
import SettingsPanel from './SettingsPanel';
import kidenLogo from "@/assets/kiden-logo.jpg";
import {
  LayoutDashboard,
  Lightbulb,
  MessageSquare,
  FileText,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Library,
  Target,
  Music,
  Code2,
  Sparkles,
  Crown,
  CheckSquare,
  Folder,
  BarChart,
  LogOut,
  Settings
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface AppSidebarProps {
  activeView: ActiveView;
  onViewChange: (view: ActiveView) => void;
  profile: Profile | null;
  onProfileUpdate?: () => void;
}

// 1. Consolidated Nav Items
const navItems = [
  { id: 'command', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'analytics', label: 'Analytics', icon: BarChart },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'projects', label: 'Projects', icon: Folder },
  { id: 'notebook', label: 'Notebook', icon: FileText },
  { id: 'ideas', label: 'Capture & Ideas', icon: Lightbulb },
  // Journal removed per request
  // { id: 'journal', label: 'Journal', icon: BookOpen },
  { id: 'chat', label: 'Kiden Assist', icon: MessageSquare }, // Renamed
  { id: 'habits', label: 'Habits', icon: Target },
  { id: 'books', label: 'Library', icon: Library },
  { id: 'leetcode', label: 'Skills', icon: Code2 },
  // Hidden Music & Voice to streamline per request
] as const;

const AppSidebar = ({ activeView, onViewChange, profile, onProfileUpdate }: AppSidebarProps) => {
  const { user, signOut } = useAuth();
  const { activeWorkspace, activeCollection, setActiveCollection } = useWorkspace();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Responsive Check
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile(); // Check on mount
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleViewChange = (view: ActiveView) => {
    onViewChange(view);
    setIsMobileOpen(false);
  };

  const isWorkspaceOwner = activeWorkspace?.user_id === user?.id;

  // Variants for Sidebar Animation
  const sidebarVariants = {
    open: { width: 260, x: 0, transition: { type: "spring", stiffness: 300, damping: 30 } },
    collapsed: { width: 80, x: 0, transition: { type: "spring", stiffness: 300, damping: 30 } },
    mobileClosed: { x: "-100%", width: 280, transition: { type: "spring", stiffness: 300, damping: 30 } },
    mobileOpen: { x: 0, width: 280, transition: { type: "spring", stiffness: 300, damping: 30 } }
  };

  // Determine current interaction state
  const getCurrentVariant = () => {
    if (isMobile) {
      return isMobileOpen ? "mobileOpen" : "mobileClosed";
    }
    return isCollapsed ? "collapsed" : "open";
  };

  return (
    <TooltipProvider delayDuration={0}>
      {/* Mobile Menu Button - Fixed relative to viewport */}
      {isMobile && (
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "fixed top-4 left-4 z-[70] bg-background/80 backdrop-blur-xl border border-border/50 shadow-sm rounded-lg",
            isMobileOpen && "hidden" // Hide when sidebar is open to avoid clash
          )}
          onClick={() => setIsMobileOpen(true)}
        >
          <Menu className="w-5 h-5" />
        </Button>
      )}

      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isMobile && isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[65]"
            onClick={() => setIsMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar Container */}
      <motion.aside
        initial={false}
        animate={getCurrentVariant()}
        variants={sidebarVariants}
        className={cn(
          "fixed inset-y-0 left-0 z-[75] flex flex-col h-full bg-card/95 backdrop-blur-xl border-r border-border shadow-2xl",
          // Desktop positioning: relative to flow, sticky
          !isMobile && "sticky top-0 h-screen shadow-none border-r border-border/50 bg-background/50"
        )}
      >
        {/* Header */}
        <div className={cn(
          "h-16 flex items-center px-4 border-b border-border/50 shrink-0",
          isCollapsed && !isMobile ? "justify-center px-2" : "justify-between"
        )}>
          <div className="flex items-center gap-3 overflow-hidden whitespace-nowrap">
            <div className="relative shrink-0">
              <img src={kidenLogo} alt="Logo" className="w-9 h-9 rounded-xl shadow-sm object-cover" />
              <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-primary rounded-full flex items-center justify-center ring-2 ring-card">
                <Sparkles className="w-2 h-2 text-primary-foreground" />
              </div>
            </div>

            <AnimatePresence>
              {(!isCollapsed || isMobile) && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, width: 0 }}
                  className="flex flex-col"
                >
                  <span className="font-bold text-lg tracking-tight">Kiden Hub</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Collapse Toggle (Desktop Only) */}
          {!isMobile && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </Button>
          )}
          {/* Close Button (Mobile Only) */}
          {isMobile && (
            <Button variant="ghost" size="icon" onClick={() => setIsMobileOpen(false)}>
              <X className="w-5 h-5" />
            </Button>
          )}
        </div>

        {/* Main Navigation */}
        <ScrollArea className="flex-1 px-3 py-4">
          <div className="space-y-1">
            {navItems.map((item) => {
              const isActive = activeView === item.id;

              return (
                <Tooltip key={item.id}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      onClick={() => handleViewChange(item.id as ActiveView)}
                      className={cn(
                        "w-full flex items-center justify-start gap-3 h-10 px-3 rounded-xl transition-all duration-200 group relative overflow-hidden",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90"
                          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                        isCollapsed && !isMobile && "justify-center px-0"
                      )}
                    >
                      <item.icon className={cn("w-5 h-5 shrink-0", isActive ? "animate-pulse" : "group-hover:scale-110 transition-transform")} />

                      {(!isCollapsed || isMobile) && (
                        <span className={cn(
                          "font-medium truncate transition-all duration-300 origin-left text-sm",
                          isActive && "font-semibold"
                        )}>
                          {item.label}
                        </span>
                      )}

                      {/* Active Indicator Stripe (Desktop) */}
                      {isActive && !isCollapsed && !isMobile && (
                        <motion.div
                          layoutId="active-nav"
                          className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary-foreground/20 rounded-l-full"
                        />
                      )}
                    </Button>
                  </TooltipTrigger>
                  {isCollapsed && !isMobile && (
                    <TooltipContent side="right" className="font-medium bg-secondary text-secondary-foreground border-border/50">
                      {item.label}
                    </TooltipContent>
                  )}
                </Tooltip>
              )
            })}
          </div>

          <Separator className="my-4 bg-border/40" />

          {/* Dynamic Content (Workspaces, Collections) */}
          <div className="space-y-4">
            <div className={cn(isCollapsed && !isMobile ? "items-center flex flex-col" : "")}>
              <WorkspaceManager isCollapsed={isCollapsed && !isMobile} />
            </div>

            {activeWorkspace && (
              <>
                {/* Shared Badge */}
                {!isWorkspaceOwner && (!isCollapsed || isMobile) && (
                  <div className="px-2">
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-orange-500/10 text-orange-500 border border-orange-500/20 text-xs font-medium">
                      <Crown className="w-3.5 h-3.5" />
                      <span>Shared Workspace</span>
                    </div>
                  </div>
                )}

                {/* Collections */}
                <div className={cn(isCollapsed && !isMobile ? "items-center flex flex-col" : "")}>
                  <CollectionsManager
                    workspace={activeWorkspace}
                    activeCollection={activeCollection}
                    onCollectionChange={setActiveCollection}
                    isCollapsed={isCollapsed && !isMobile}
                  />
                </div>

                <Separator className="bg-border/40" />

                {/* Members */}
                <div className={cn(isCollapsed && !isMobile ? "items-center flex flex-col" : "")}>
                  <WorkspaceCollaborators
                    workspaceId={activeWorkspace.id}
                    workspaceOwnerId={activeWorkspace.user_id}
                    workspaceName={activeWorkspace.name}
                    isCollapsed={isCollapsed && !isMobile}
                  />
                </div>
              </>
            )}
          </div>
        </ScrollArea>

        {/* Footer / User Profile */}
        <div className="p-4 border-t border-border/50 bg-muted/20">
          <div className={cn("flex items-center gap-3", isCollapsed && !isMobile ? "justify-center" : "")}>
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold ring-2 ring-background border border-white/10 overflow-hidden shadow-lg">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span>{profile?.display_name?.[0]?.toUpperCase() || 'U'}</span>
                )}
              </div>
              {/* Status Dot */}
              <div className={cn(
                "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-background",
                profile?.status === 'online' || !profile?.status ? "bg-green-500" :
                  profile?.status === 'away' ? "bg-yellow-500" : "bg-gray-500"
              )} />
            </div>

            {/* User Info */}
            {(!isCollapsed || isMobile) && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate leading-none mb-1">{profile?.display_name || 'User'}</p>
                <p className="text-xs text-muted-foreground truncate capitalize">{profile?.status || 'Online'}</p>
              </div>
            )}

            {/* Actions */}
            {(!isCollapsed || isMobile) && (
              <div className="flex items-center">
                {onProfileUpdate && (
                  <SettingsPanel
                    profile={profile}
                    onProfileUpdate={onProfileUpdate}
                    isCollapsed={false}
                  />
                )}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={signOut} className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive">
                      <LogOut className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Sign Out</TooltipContent>
                </Tooltip>
              </div>
            )}
          </div>
        </div>
      </motion.aside>
    </TooltipProvider>
  );
};

export default AppSidebar;