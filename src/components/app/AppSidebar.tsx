import { motion } from 'framer-motion';
import { Profile } from '@/lib/types';
import { useWorkspace } from '@/hooks/useWorkspace';
import WorkspaceManager from './WorkspaceManager';
import CollectionsManager from './CollectionsManager';
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
  BookOpen,
  Library,
  Target,
  Music
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

type ActiveView = 'command' | 'ideas' | 'voice' | 'chat' | 'notebook' | 'focus' | 'templates' | 'journal' | 'books' | 'habits' | 'spotify';

interface AppSidebarProps {
  activeView: ActiveView;
  onViewChange: (view: ActiveView) => void;
  profile: Profile | null;
}

const navItems = [
  { id: 'command', label: 'COMMAND', icon: LayoutDashboard },
  { id: 'ideas', label: 'IDEAS', icon: Lightbulb },
  { id: 'voice', label: 'VOICE', icon: Mic },
  { id: 'chat', label: 'AI CHAT', icon: MessageSquare },
  { id: 'notebook', label: 'NOTEBOOK', icon: FileText },
  { id: 'journal', label: 'JOURNAL', icon: BookOpen },
  { id: 'books', label: 'BOOKS', icon: Library },
  { id: 'habits', label: 'HABITS', icon: Target },
  { id: 'spotify', label: 'SPOTIFY', icon: Music },
  { id: 'templates', label: 'TEMPLATES', icon: LayoutTemplate },
] as const;

const AppSidebar = ({ activeView, onViewChange, profile }: AppSidebarProps) => {
  const { signOut } = useAuth();
  const { activeWorkspace, activeCollection, setActiveWorkspace, setActiveCollection } = useWorkspace();
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleViewChange = (view: ActiveView) => {
    onViewChange(view);
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile toggle button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden bg-card/80 backdrop-blur-sm"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </Button>

      {/* Mobile overlay */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ 
          x: isOpen ? 0 : (typeof window !== 'undefined' && window.innerWidth < 1024) ? -300 : 0,
          width: isCollapsed ? 72 : 260
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={cn(
          "fixed lg:relative z-40 h-screen bg-card border-r border-border flex flex-col",
          "lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className={cn(
          "p-4 flex items-center border-b border-border",
          isCollapsed ? "justify-center" : "justify-between"
        )}>
          <motion.div 
            className="flex items-center gap-2"
            whileHover={{ scale: 1.02 }}
          >
            <img src={kidenLogo} alt="Kiden" className="w-8 h-8 rounded-lg" />
            {!isCollapsed && (
              <motion.span 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="font-serif text-lg italic text-foreground"
              >
                kiden
              </motion.span>
            )}
          </motion.div>
          
          {!isCollapsed && (
            <Button
              variant="ghost"
              size="icon"
              className="hidden lg:flex w-8 h-8"
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
            className="hidden lg:flex w-full h-10 rounded-none border-b border-border"
            onClick={() => setIsCollapsed(false)}
          >
            <Menu className="w-4 h-4" />
          </Button>
        )}

        <ScrollArea className="flex-1">
          {/* Navigation */}
          <nav className="p-2 space-y-1">
            {navItems.map((item, index) => (
              <motion.button
                key={item.id}
                onClick={() => handleViewChange(item.id as ActiveView)}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.02, x: 4 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200",
                  isCollapsed && "justify-center px-2",
                  activeView === item.id
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                )}
              >
                <item.icon className={cn("w-5 h-5", isCollapsed && "w-6 h-6")} />
                {!isCollapsed && (
                  <span className="tracking-wide font-medium">{item.label}</span>
                )}
              </motion.button>
            ))}
          </nav>

          {/* Workspace & Collections */}
          <div className="p-4 space-y-6">
            <WorkspaceManager
              activeWorkspace={activeWorkspace}
              onWorkspaceChange={setActiveWorkspace}
              isCollapsed={isCollapsed}
            />
            
            {!isCollapsed && activeWorkspace && (
              <CollectionsManager
                workspace={activeWorkspace}
                activeCollection={activeCollection}
                onCollectionChange={setActiveCollection}
                isCollapsed={isCollapsed}
              />
            )}
          </div>
        </ScrollArea>

        {/* User section */}
        <div className={cn(
          "p-4 border-t border-border",
          isCollapsed && "p-2"
        )}>
          <div className={cn(
            "flex items-center gap-3",
            isCollapsed && "flex-col"
          )}>
            <motion.div 
              whileHover={{ scale: 1.1 }}
              className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center ring-2 ring-primary/20"
            >
              <span className="text-sm font-bold text-primary">
                {profile?.display_name?.[0]?.toUpperCase() || '?'}
              </span>
            </motion.div>
            
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {profile?.display_name || 'User'}
                </p>
                <p className="text-xs text-muted-foreground">Pro Plan</p>
              </div>
            )}
            
            <Button
              variant="ghost"
              size="icon"
              onClick={signOut}
              className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-destructive/10"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </motion.aside>
    </>
  );
};

export default AppSidebar;
