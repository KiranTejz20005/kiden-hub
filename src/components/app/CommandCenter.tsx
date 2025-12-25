import { motion } from 'framer-motion';
import { Profile } from '@/lib/types';
import { useWorkspace } from '@/hooks/useWorkspace';
import { 
  Search, Plus, Sparkles, Clock, Globe, Folder, ArrowRight, Zap, 
  FileText, Calendar, TrendingUp, Play, Brain, Lightbulb, Target
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface CommandCenterProps {
  profile: Profile | null;
  totalFocusMinutes: number;
  onEnterFocus: () => void;
  onNewThought: () => void;
  onAIAssistant: () => void;
}

const CommandCenter = ({
  profile,
  totalFocusMinutes,
  onEnterFocus,
  onNewThought,
  onAIAssistant
}: CommandCenterProps) => {
  const { collections, activeWorkspace } = useWorkspace();
  const displayName = profile?.display_name || 'there';
  const hours = Math.floor(totalFocusMinutes / 60);
  const mins = totalFocusMinutes % 60;

  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good morning' : currentHour < 17 ? 'Good afternoon' : 'Good evening';

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const quickActions = [
    { 
      id: 'new-thought', 
      label: 'New Thought', 
      description: 'Capture an idea',
      icon: Lightbulb, 
      gradient: 'from-amber-500 to-orange-600',
      onClick: onNewThought 
    },
    { 
      id: 'ai-chat', 
      label: 'AI Assistant', 
      description: 'Ask Kiden anything',
      icon: Brain, 
      gradient: 'from-violet-500 to-purple-600',
      onClick: onAIAssistant 
    },
    { 
      id: 'focus', 
      label: 'Focus Mode', 
      description: 'Deep work session',
      icon: Target, 
      gradient: 'from-emerald-500 to-teal-600',
      onClick: onEnterFocus 
    },
  ];

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="min-h-screen p-4 md:p-8 lg:p-12 max-w-7xl mx-auto"
    >
      {/* Header Section */}
      <motion.header variants={itemVariants} className="mb-8 md:mb-12 pt-12 lg:pt-0">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div>
            <motion.p 
              className="text-sm text-muted-foreground mb-2 flex items-center gap-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              {greeting}
            </motion.p>
            <motion.h1 
              className="text-4xl md:text-5xl lg:text-6xl font-serif text-foreground"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {displayName}
              <span className="text-muted-foreground/40">.</span>
            </motion.h1>
            {activeWorkspace && (
              <motion.p 
                className="text-muted-foreground mt-2 flex items-center gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                Working in <span className="text-foreground font-medium">{activeWorkspace.icon} {activeWorkspace.name}</span>
              </motion.p>
            )}
          </div>

          <motion.div 
            variants={itemVariants}
            className="w-full lg:w-96"
          >
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors z-10" />
              <Input
                placeholder="Search notes, ideas, or ask AI..."
                className="pl-12 bg-card/80 backdrop-blur-sm border-border/50 h-14 rounded-2xl focus:ring-2 focus:ring-primary/30 transition-all text-base relative"
              />
              <kbd className="absolute right-4 top-1/2 -translate-y-1/2 hidden md:inline-flex h-6 items-center gap-1 rounded-md border border-border bg-secondary px-2 text-xs text-muted-foreground z-10">
                ⌘K
              </kbd>
            </div>
          </motion.div>
        </div>
      </motion.header>

      {/* Quick Actions Grid */}
      <motion.section variants={itemVariants} className="mb-8 md:mb-12">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {quickActions.map((action, index) => (
            <motion.button
              key={action.id}
              variants={itemVariants}
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
              onClick={action.onClick}
              className={cn(
                "relative group p-6 rounded-3xl overflow-hidden",
                "bg-gradient-to-br",
                action.gradient,
                "text-white shadow-xl transition-all duration-300"
              )}
              style={{ 
                boxShadow: `0 20px 40px -12px rgba(${index === 0 ? '245,158,11' : index === 1 ? '139,92,246' : '16,185,129'}, 0.35)` 
              }}
            >
              {/* Animated background */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.2),transparent_50%)]" />
              
              <div className="relative z-10 flex flex-col items-center text-center gap-3">
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center"
                >
                  <action.icon className="w-7 h-7" />
                </motion.div>
                <div>
                  <p className="font-semibold text-lg">{action.label}</p>
                  <p className="text-white/70 text-sm">{action.description}</p>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </motion.section>

      {/* Stats and Collections Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Focus Stats */}
        <motion.div 
          variants={itemVariants}
          className="lg:col-span-1"
        >
          <motion.div 
            whileHover={{ scale: 1.01 }}
            className="h-full bg-gradient-to-br from-card to-card/80 border border-border/50 rounded-3xl p-6 relative overflow-hidden"
          >
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-accent/10 to-transparent rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Lifetime Focus</p>
                  <p className="text-sm text-foreground font-medium">Deep work time</p>
                </div>
              </div>
              
              <div className="mb-6">
                <motion.p 
                  className="text-5xl font-bold text-foreground tracking-tight"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3, type: "spring" }}
                >
                  {hours > 0 ? (
                    <>
                      {hours}<span className="text-2xl text-muted-foreground">h</span>{' '}
                      {mins}<span className="text-2xl text-muted-foreground">m</span>
                    </>
                  ) : (
                    <>
                      {totalFocusMinutes}<span className="text-2xl text-muted-foreground"> min</span>
                    </>
                  )}
                </motion.p>
                <p className="text-sm text-muted-foreground mt-1">
                  Every minute builds your focus muscle
                </p>
              </div>
              
              <Button
                onClick={onEnterFocus}
                className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground rounded-xl h-12 gap-2 font-medium group"
              >
                <Play className="w-4 h-4 group-hover:scale-110 transition-transform" />
                Start Focus Session
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -ml-2 group-hover:ml-0 transition-all" />
              </Button>
            </div>
          </motion.div>
        </motion.div>

        {/* Recent Activity & Collections */}
        <motion.div 
          variants={itemVariants}
          className="lg:col-span-2 space-y-6"
        >
          {/* Collections */}
          <div className="bg-card border border-border/50 rounded-3xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                  <Folder className="w-4 h-4 text-muted-foreground" />
                </div>
                <h2 className="font-semibold text-foreground">Collections</h2>
              </div>
              <motion.button 
                whileHover={{ scale: 1.1, rotate: 90 }} 
                whileTap={{ scale: 0.9 }}
                className="w-8 h-8 rounded-lg bg-secondary hover:bg-primary/10 flex items-center justify-center transition-colors"
              >
                <Plus className="w-4 h-4 text-muted-foreground hover:text-primary" />
              </motion.button>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {collections.length > 0 ? (
                collections.slice(0, 4).map((collection, i) => (
                  <motion.div
                    key={collection.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    whileHover={{ scale: 1.03, y: -2 }}
                    className="group bg-secondary/50 hover:bg-secondary border border-border/50 rounded-2xl p-4 cursor-pointer transition-all"
                  >
                    <div className="w-12 h-12 rounded-xl bg-background/80 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                      <span className="text-2xl">{collection.icon || '📁'}</span>
                    </div>
                    <p className="font-medium text-foreground truncate text-sm">{collection.name}</p>
                    <p className="text-xs text-muted-foreground">{collection.item_count || 0} items</p>
                  </motion.div>
                ))
              ) : (
                <>
                  {[
                    { name: 'Research', icon: Globe, color: 'text-blue-500' },
                    { name: 'Personal', icon: FileText, color: 'text-green-500' },
                    { name: 'Projects', icon: Folder, color: 'text-amber-500' },
                    { name: 'Archive', icon: Calendar, color: 'text-purple-500' },
                  ].map((item, i) => (
                    <motion.div
                      key={item.name}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                      whileHover={{ scale: 1.03, y: -2 }}
                      className="group bg-secondary/50 hover:bg-secondary border border-border/50 rounded-2xl p-4 cursor-pointer transition-all"
                    >
                      <div className="w-12 h-12 rounded-xl bg-background/80 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                        <item.icon className={cn("w-6 h-6", item.color)} />
                      </div>
                      <p className="font-medium text-foreground text-sm">{item.name}</p>
                      <p className="text-xs text-muted-foreground">0 items</p>
                    </motion.div>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* Quick Stats Row */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Notes', value: '0', icon: FileText, trend: '+0 today' },
              { label: 'Ideas', value: '0', icon: Lightbulb, trend: 'Capture one!' },
              { label: 'Focus Sessions', value: '0', icon: Zap, trend: 'Start now' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                className="bg-card border border-border/50 rounded-2xl p-4 text-center hover:border-primary/30 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-secondary mx-auto mb-2 flex items-center justify-center">
                  <stat.icon className="w-5 h-5 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="text-[10px] text-primary mt-1">{stat.trend}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default CommandCenter;