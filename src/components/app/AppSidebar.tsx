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
  LogOut
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

type ActiveView = 'command' | 'ideas' | 'voice' | 'chat' | 'notebook' | 'focus' | 'templates';

interface AppSidebarProps {
  activeView: ActiveView;
  onViewChange: (view: ActiveView) => void;
  profile: Profile | null;
}

const navItems = [
  { id: 'command', label: 'COMMAND CENTER', icon: LayoutDashboard },
  { id: 'ideas', label: 'IDEA BAR', icon: Lightbulb },
  { id: 'voice', label: 'LIVE LINK', icon: Mic },
  { id: 'chat', label: 'AI CHAT', icon: MessageSquare },
  { id: 'notebook', label: 'NOTEBOOK', icon: FileText },
  { id: 'templates', label: 'TEMPLATES', icon: LayoutTemplate },
] as const;

const AppSidebar = ({ activeView, onViewChange, profile }: AppSidebarProps) => {
  const { signOut } = useAuth();

  return (
    <aside className="w-56 bg-card border-r border-border flex flex-col h-screen">
      {/* Logo */}
      <div className="p-4 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-2">
          <img src={kidenLogo} alt="Kiden" className="w-8 h-8 rounded-lg" />
          <span className="font-serif text-lg italic text-foreground">kiden</span>
        </div>
        <button className="text-muted-foreground hover:text-foreground">
          <LayoutDashboard className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => (
          <motion.button
            key={item.id}
            onClick={() => onViewChange(item.id as ActiveView)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
              activeView === item.id
                ? 'bg-foreground text-background'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}
          >
            <item.icon className="w-4 h-4" />
            <span className="tracking-wide">{item.label}</span>
          </motion.button>
        ))}
      </nav>

      {/* Workspace section */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
          <span className="tracking-widest">WORKSPACE</span>
          <Plus className="w-4 h-4 cursor-pointer hover:text-foreground" />
        </div>
      </div>

      {/* User section */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-sm text-primary">
              {profile?.display_name?.[0]?.toUpperCase() || '?'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-foreground truncate">
              {profile?.display_name || 'User'}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={signOut}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
};

export default AppSidebar;