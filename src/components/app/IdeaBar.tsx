import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Idea } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Brain, X, Sparkles, Send, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const categories = ['neural', 'creative', 'logic', 'project'] as const;
type Category = typeof categories[number];

const categoryColors: Record<Category, string> = {
  neural: 'from-violet to-purple-600',
  creative: 'from-amber to-orange-500',
  logic: 'from-cyan to-blue-500',
  project: 'from-primary to-accent'
};

const categoryIcons: Record<Category, string> = {
  neural: '🧠',
  creative: '🎨',
  logic: '⚡',
  project: '📁'
};

const IdeaBar = () => {
  const { user } = useAuth();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [newIdea, setNewIdea] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category>('neural');
  const [filterCategory, setFilterCategory] = useState<Category | 'all'>('all');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) fetchIdeas();
  }, [user]);

  const fetchIdeas = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('ideas')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) setIdeas(data as Idea[]);
  };

  const storeIdea = async () => {
    if (!newIdea.trim() || !user) return;
    setLoading(true);

    const { error } = await supabase.from('ideas').insert({
      user_id: user.id,
      content: newIdea.trim(),
      category: selectedCategory,
    });

    if (error) {
      toast.error('Failed to store idea');
    } else {
      toast.success('Idea captured!');
      setNewIdea('');
      fetchIdeas();
    }
    setLoading(false);
  };

  const deleteIdea = async (id: string) => {
    const { error } = await supabase.from('ideas').delete().eq('id', id);
    if (!error) setIdeas(prev => prev.filter(i => i.id !== id));
  };

  const filteredIdeas = filterCategory === 'all' ? ideas : ideas.filter(i => i.category === filterCategory);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1 }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4 md:p-8 max-w-4xl mx-auto pt-16 lg:pt-8"
    >
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            <Brain className="w-8 h-8 text-primary" />
          </motion.div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Neural Backlog</h1>
        </div>
        <p className="text-sm text-primary tracking-wider flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          IDEA BAR ACTIVE
        </p>
      </motion.div>

      {/* Input Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card border border-border rounded-2xl p-4 mb-8 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-primary/5 to-transparent rounded-full blur-2xl" />
        
        {/* Category selector */}
        <div className="flex flex-wrap gap-2 mb-4">
          {categories.map((cat) => (
            <motion.button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2",
                selectedCategory === cat
                  ? `bg-gradient-to-r ${categoryColors[cat]} text-white shadow-lg`
                  : 'bg-secondary text-muted-foreground hover:text-foreground'
              )}
            >
              <span>{categoryIcons[cat]}</span>
              {cat.toUpperCase()}
            </motion.button>
          ))}
        </div>

        {/* Input */}
        <div className="flex gap-3">
          <Input
            value={newIdea}
            onChange={(e) => setNewIdea(e.target.value)}
            placeholder="Capture a fleeting thought..."
            className="flex-1 bg-secondary/50 border-none text-foreground placeholder:text-muted-foreground h-12"
            onKeyDown={(e) => e.key === 'Enter' && storeIdea()}
          />
          <Button
            onClick={storeIdea}
            disabled={loading || !newIdea.trim()}
            className={cn(
              "h-12 px-6 rounded-xl gap-2 bg-gradient-to-r",
              categoryColors[selectedCategory]
            )}
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">STORE</span>
          </Button>
        </div>
      </motion.div>

      {/* Filter Tabs */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex flex-wrap items-center gap-2 mb-6"
      >
        <Filter className="w-4 h-4 text-muted-foreground" />
        <button
          onClick={() => setFilterCategory('all')}
          className={cn(
            "px-4 py-2 rounded-full text-sm transition-all",
            filterCategory === 'all'
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-muted-foreground hover:text-foreground'
          )}
        >
          ALL ({ideas.length})
        </button>
        {categories.map((cat) => {
          const count = ideas.filter(i => i.category === cat).length;
          return (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={cn(
                "px-4 py-2 rounded-full text-sm transition-all flex items-center gap-1",
                filterCategory === cat
                  ? 'bg-secondary text-foreground ring-1 ring-primary/30'
                  : 'bg-secondary/50 text-muted-foreground hover:text-foreground'
              )}
            >
              {categoryIcons[cat]} {count}
            </button>
          );
        })}
      </motion.div>

      {/* Ideas List */}
      <AnimatePresence mode="popLayout">
        {filteredIdeas.length > 0 ? (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-3"
          >
            {filteredIdeas.map((idea) => (
              <motion.div
                key={idea.id}
                variants={itemVariants}
                exit={{ opacity: 0, x: -50, scale: 0.9 }}
                layout
                whileHover={{ scale: 1.01, x: 4 }}
                className="bg-card border border-border rounded-xl p-4 flex items-start gap-4 group relative overflow-hidden"
              >
                <div className={cn(
                  "absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b",
                  categoryColors[idea.category as Category]
                )} />
                
                <div className="flex-1 pl-2">
                  <p className="text-foreground">{idea.content}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs px-2 py-1 rounded bg-secondary text-muted-foreground flex items-center gap-1">
                      {categoryIcons[idea.category as Category]} {idea.category}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(idea.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => deleteIdea(idea.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive p-2"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Brain className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
            </motion.div>
            <h3 className="text-xl text-muted-foreground mb-2">The Backlog is Dormant</h3>
            <p className="text-sm text-muted-foreground/60">
              Awaiting high-value neural sequences.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default IdeaBar;
