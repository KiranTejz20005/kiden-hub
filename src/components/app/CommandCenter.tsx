import { motion } from 'framer-motion';
import { Profile } from '@/lib/types';
import { useWorkspace } from '@/hooks/useWorkspace';
import { Search, Plus, Monitor, Sparkles, Clock, Globe, Folder, ArrowRight, Zap, Target } from 'lucide-react';
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
  const { collections } = useWorkspace();
  const displayName = profile?.display_name || 'there';
  const hours = Math.floor(totalFocusMinutes / 60);
  const mins = totalFocusMinutes % 60;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="p-4 md:p-8 max-w-6xl mx-auto"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8 md:mb-12 pt-12 lg:pt-0">
        <div>
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-primary text-sm tracking-widest mb-2 flex items-center gap-2"
          >
            <Target className="w-4 h-4" />
            COMMAND CENTER
          </motion.p>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-serif text-4xl md:text-5xl lg:text-6xl text-foreground italic"
          >
            Welcome back,
            <br />
            <span className="text-gradient-primary">{displayName}</span>
          </motion.h1>
        </div>

        <motion.div 
          variants={itemVariants}
          className="w-full md:w-96"
        >
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Search notes, files, or ideas..."
              className="pl-12 bg-card border-border h-12 rounded-xl focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
        </motion.div>
      </motion.div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Action Cards */}
        <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* New Thought */}
            <motion.button
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
              onClick={onNewThought}
              className="aspect-square rounded-3xl bg-gradient-to-br from-primary to-accent flex flex-col items-center justify-center gap-3 text-primary-foreground shadow-xl shadow-primary/20 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <motion.div
                animate={{ rotate: [0, 90, 0] }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Plus className="w-8 h-8" />
              </motion.div>
              <span className="text-sm font-medium tracking-wider">NEW THOUGHT</span>
            </motion.button>

            {/* AI Assistant */}
            <motion.button
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
              onClick={onAIAssistant}
              className="aspect-square rounded-3xl bg-gradient-to-br from-violet to-purple-600 flex flex-col items-center justify-center gap-3 text-white shadow-xl shadow-violet/20 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Sparkles className="w-8 h-8" />
              </motion.div>
              <span className="text-sm font-medium tracking-wider">AI ASSISTANT</span>
            </motion.button>

            {/* Flow State */}
            <motion.button
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
              onClick={onEnterFocus}
              className="aspect-square rounded-3xl bg-card border border-border flex flex-col items-center justify-center gap-3 text-foreground hover:border-primary/50 transition-colors group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <Zap className="w-8 h-8 group-hover:text-primary transition-colors" />
              <span className="text-sm font-medium tracking-wider">FLOW STATE</span>
            </motion.button>
          </div>

          {/* Focus Archive */}
          <motion.div variants={itemVariants}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm tracking-widest text-muted-foreground font-medium">FOCUS ARCHIVE</h2>
              <button className="text-sm text-primary hover:underline flex items-center gap-1 group">
                Full History
                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
            <div className="bg-card border border-dashed border-border rounded-2xl p-8 text-center hover:border-primary/30 transition-colors">
              <Clock className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground">No sessions recorded yet.</p>
              <p className="text-sm text-muted-foreground/60 mt-1">Start a focus session to track your productivity.</p>
            </div>
          </motion.div>
        </motion.div>

        {/* Right Column */}
        <motion.div variants={itemVariants} className="space-y-6">
          {/* Lifetime Focus */}
          <motion.div 
            whileHover={{ scale: 1.01 }}
            className="bg-card border border-border rounded-2xl p-6 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
            
            <p className="text-primary text-xs tracking-widest mb-2 flex items-center gap-2 relative">
              <Clock className="w-4 h-4" />
              LIFETIME FOCUS
            </p>
            <p className="font-serif text-4xl text-foreground mb-1 relative">
              {hours > 0 ? `${hours}h ${mins}m` : `${totalFocusMinutes} min`}
            </p>
            <p className="text-sm text-muted-foreground mb-4 relative">
              Every session counts towards your unified intelligence.
            </p>
            <Button
              onClick={onEnterFocus}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl gap-2 group"
            >
              ENTER FLOW
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>

          {/* Collections */}
          <motion.div variants={itemVariants}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs tracking-widest text-muted-foreground font-medium">COLLECTIONS</h2>
              <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }}>
                <Plus className="w-4 h-4 text-muted-foreground hover:text-foreground" />
              </motion.button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {collections.length > 0 ? (
                collections.slice(0, 4).map((collection, i) => (
                  <motion.div
                    key={collection.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    className="bg-card border border-border rounded-2xl p-4 cursor-pointer hover:border-primary/30 transition-all"
                  >
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center mb-3">
                      <span className="text-lg">{collection.icon}</span>
                    </div>
                    <p className="font-medium text-foreground truncate">{collection.name}</p>
                    <p className="text-xs text-muted-foreground">{collection.item_count} ITEMS</p>
                  </motion.div>
                ))
              ) : (
                <>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="bg-card border border-border rounded-2xl p-4 cursor-pointer hover:border-primary/30 transition-all"
                  >
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center mb-3">
                      <Globe className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <p className="font-medium text-foreground">Research</p>
                    <p className="text-xs text-muted-foreground">0 ITEMS</p>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="bg-card border border-border rounded-2xl p-4 cursor-pointer hover:border-primary/30 transition-all"
                  >
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center mb-3">
                      <Folder className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <p className="font-medium text-foreground">Personal</p>
                    <p className="text-xs text-muted-foreground">0 ITEMS</p>
                  </motion.div>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default CommandCenter;
