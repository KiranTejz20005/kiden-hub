import { motion } from 'framer-motion';
import { Profile } from '@/lib/types';
import kidenLogo from '@/assets/kiden-logo.png';
import {
  LayoutDashboard,
  Lightbulb,
  Mic,
  MessageSquare,
  FileText,
  Timer,
  LayoutTemplate,
  Plus,
  LogOut,
  Menu,
  X,
  ChevronLeft
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { cn } from '@/lib/utils';

type ActiveView = 'command' | 'ideas' | 'voice' | 'chat' | 'notebook' | 'focus' | 'templates';

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
  { id: 'templates', label: 'TEMPLATES', icon: LayoutTemplate },
] as const;

const AppSidebar = ({ activeView, onViewChange, profile }: AppSidebarProps) => {
  const { signOut } = useAuth();
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
          width: isCollapsed ? 72 : 224
        }}
        className={cn(
          "fixed lg:relative z-40 h-screen bg-card border-r border-border flex flex-col transition-all duration-300",
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

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
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

        {/* Workspace section */}
        {!isCollapsed && (
          <div className="p-4 border-t border-border">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
              <span className="tracking-widest">WORKSPACE</span>
              <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }}>
                <Plus className="w-4 h-4 cursor-pointer hover:text-foreground transition-colors" />
              </motion.button>
            </div>
          </div>
        )}

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
