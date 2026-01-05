import { motion, AnimatePresence } from 'framer-motion';
import { Profile, Workspace, ActiveView } from '@/lib/types';
import { useWorkspace } from '@/hooks/useWorkspace';
import WorkspaceManager from './WorkspaceManager';
import CollectionsManager from './CollectionsManager';
import WorkspaceCollaborators from './WorkspaceCollaborators';
import SettingsPanel from './SettingsPanel';
import kidenLogo from '@/assets/kiden-logo.png';
import {
  LayoutDashboard,
  Lightbulb,
  Mic,
  MessageSquare,
  FileText,
  Timer,
  LayoutTemplate,
  LogOut,
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
  Wifi,
  WifiOff,
  Moon,
  Rocket,
  CheckSquare,
  Folder,
  BarChart
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
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

const navItems = [
  { id: 'command', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'analytics', label: 'Analytics', icon: BarChart },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'projects', label: 'Projects', icon: Folder },
  { id: 'ideas', label: 'Ideas', icon: Lightbulb },
  { id: 'voice', label: 'Voice Notes', icon: Mic },
  { id: 'chat', label: 'AI Chat', icon: MessageSquare },
  { id: 'notebook', label: 'Notebook', icon: FileText },
  { id: 'journal', label: 'Journal', icon: BookOpen },
  { id: 'books', label: 'Books', icon: Library },
  { id: 'habits', label: 'Habits', icon: Target },
  { id: 'resolutions', label: 'Resolutions', icon: Rocket },
  { id: 'spotify', label: 'Music', icon: Music },
  { id: 'leetcode', label: 'LeetCode', icon: Code2 },
  { id: 'templates', label: 'Templates', icon: LayoutTemplate },
] as const;

const AppSidebar = ({ activeView, onViewChange, profile, onProfileUpdate }: AppSidebarProps) => {
  const { user, signOut } = useAuth();
  const { workspaces, activeWorkspace, activeCollection, setActiveWorkspace, setActiveCollection } = useWorkspace();
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleViewChange = (view: ActiveView) => {
    onViewChange(view);
    setIsOpen(false);
  };

  const isWorkspaceOwner = activeWorkspace?.user_id === user?.id;

  return (
    <TooltipProvider delayDuration={0}>
      <>
        {/* Mobile toggle button */}
        <Button
          variant="ghost"
          size="icon"
          className="fixed top-4 left-4 z-50 lg:hidden bg-background/80 backdrop-blur-xl border border-border shadow-lg"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>

        {/* Mobile overlay */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setIsOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Sidebar */}
        <motion.aside
          initial={false}
          animate={{
            x: isOpen ? 0 : (typeof window !== 'undefined' && window.innerWidth < 1024) ? -300 : 0,
            width: isCollapsed ? 80 : 280
          }}
          transition={{ type: "spring", stiffness: 400, damping: 40 }}
          className={cn(
            "fixed lg:relative z-40 h-screen flex flex-col",
            "bg-card border-r border-border", // Simplified background
            "lg:translate-x-0"
          )}
        >
          {/* Logo Header */}
          <div className={cn(
            "p-4 flex items-center border-b border-border/50",
            isCollapsed ? "justify-center" : "justify-between"
          )}>
            <motion.div
              className="flex items-center gap-3"
              whileHover={{ scale: 1.02 }}
            >
              <div className="relative">
                <img src={kidenLogo} alt="Kiden" className="w-10 h-10 rounded-xl shadow-lg" />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center ring-2 ring-card">
                  <Sparkles className="w-2.5 h-2.5 text-primary-foreground" />
                </div>
              </div>
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                  >
                    <span className="font-serif text-xl font-bold text-foreground">
                      kiden
                    </span>
                    <p className="text-[10px] text-muted-foreground -mt-0.5">Your second brain</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {!isCollapsed && (
              <Button
                variant="ghost"
                size="icon"
                className="hidden lg:flex w-8 h-8 hover:bg-secondary"
                onClick={() => setIsCollapsed(true)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Expand button when collapsed */}
          {isCollapsed && (
            <Button
              variant="ghost"
              size="icon"
              className="hidden lg:flex w-full h-10 rounded-none border-b border-border/50 hover:bg-secondary"
              onClick={() => setIsCollapsed(false)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}

          <ScrollArea className="flex-1">
            {/* Navigation */}
            <nav className="p-3 space-y-1">
              {navItems.map((item, index) => {
                const isActive = activeView === item.id;

                return (
                  <Tooltip key={item.id}>
                    <TooltipTrigger asChild>
                      <motion.button
                        onClick={() => handleViewChange(item.id as ActiveView)}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        whileHover={{ x: isCollapsed ? 0 : 4 }}
                        whileTap={{ scale: 0.98 }}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 relative overflow-hidden group",
                          isCollapsed && "justify-center px-2",
                          isActive
                            ? 'bg-primary text-primary-foreground shadow-sm font-medium'
                            : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                        )}
                      >
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                          isActive
                            ? 'bg-primary-foreground/20 text-primary-foreground'
                            : 'bg-secondary/50 group-hover:bg-secondary'
                        )}>
                          <item.icon className="w-4 h-4" />
                        </div>

                        <AnimatePresence>
                          {!isCollapsed && (
                            <motion.span
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="font-medium tracking-wide"
                            >
                              {item.label}
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </motion.button>
                    </TooltipTrigger>
                    {isCollapsed && (
                      <TooltipContent side="right" className="font-medium">
                        {item.label}
                      </TooltipContent>
                    )}
                  </Tooltip>
                );
              })}
            </nav>

            <Separator className="mx-3 bg-border/50" />

            {/* Workspace & Collections */}
            <div className="p-3 space-y-4">
              <WorkspaceManager
                activeWorkspace={activeWorkspace}
                onWorkspaceChange={setActiveWorkspace}
                isCollapsed={isCollapsed}
              />

              {activeWorkspace && (
                <>
                  {/* Workspace badge for shared workspaces */}
                  {!isWorkspaceOwner && !isCollapsed && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20"
                    >
                      <Crown className="w-4 h-4 text-primary" />
                      <span className="text-xs text-primary font-medium">Shared Workspace</span>
                    </motion.div>
                  )}

                  {!isCollapsed && (
                    <CollectionsManager
                      workspace={activeWorkspace}
                      activeCollection={activeCollection}
                      onCollectionChange={setActiveCollection}
                      isCollapsed={isCollapsed}
                    />
                  )}

                  <Separator className="bg-border/50" />

                  <WorkspaceCollaborators
                    workspaceId={activeWorkspace.id}
                    workspaceOwnerId={activeWorkspace.user_id}
                    workspaceName={activeWorkspace.name}
                    isCollapsed={isCollapsed}
                  />
                </>
              )}
            </div>
          </ScrollArea>

          {/* User section */}
          <div className={cn(
            "p-4 border-t border-border/50 bg-secondary/30",
            isCollapsed && "p-2"
          )}>
            <motion.div
              className={cn(
                "flex items-center gap-3",
                isCollapsed && "flex-col"
              )}
              whileHover={{ scale: 1.01 }}
            >
              <div className="relative">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/40 to-accent/40 flex items-center justify-center ring-2 ring-primary/20 shadow-lg overflow-hidden"
                >
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm font-bold text-primary">
                      {profile?.display_name?.[0]?.toUpperCase() || '?'}
                    </span>
                  )}
                </motion.div>
                {/* Status indicator */}
                <div className={cn(
                  "absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-card",
                  profile?.status === 'online' && 'bg-green-500',
                  profile?.status === 'away' && 'bg-amber-500',
                  profile?.status === 'dnd' && 'bg-red-500',
                  profile?.status === 'offline' && 'bg-muted-foreground',
                  !profile?.status && 'bg-green-500'
                )} />
              </div>

              <AnimatePresence>
                {!isCollapsed && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 min-w-0"
                  >
                    <p className="text-sm font-semibold text-foreground truncate">
                      {profile?.display_name || 'User'}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 capitalize">
                      <span className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        profile?.status === 'online' && 'bg-green-500 animate-pulse',
                        profile?.status === 'away' && 'bg-amber-500',
                        profile?.status === 'dnd' && 'bg-red-500',
                        profile?.status === 'offline' && 'bg-muted-foreground',
                        !profile?.status && 'bg-green-500 animate-pulse'
                      )} />
                      {profile?.status === 'dnd' ? 'Do Not Disturb' : (profile?.status || 'Online')}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Settings Button */}
              {onProfileUpdate && (
                <SettingsPanel
                  profile={profile}
                  onProfileUpdate={onProfileUpdate}
                  isCollapsed={isCollapsed}
                />
              )}

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={signOut}
                    className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-destructive/10 rounded-xl"
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Sign out</TooltipContent>
              </Tooltip>
            </motion.div>
          </div>
        </motion.aside>
      </>
    </TooltipProvider>
  );
};

export default AppSidebar;