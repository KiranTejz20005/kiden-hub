import { useState, useEffect, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Brain, X, Sparkles, Send, Filter, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const categories = ['neural', 'creative', 'logic', 'project'] as const;
type Category = typeof categories[number];

interface Idea {
  id: string;
  content: string;
  category: Category;
  created_at: string;
  user_id: string;
  is_processed: boolean | null;
  note_id: string | null;
}

const categoryColors: Record<Category, string> = {
  neural: 'from-violet-500 to-purple-600',
  creative: 'from-amber-500 to-orange-500',
  logic: 'from-cyan-500 to-blue-500',
  project: 'from-emerald-500 to-teal-500'
};

const categoryIcons: Record<Category, string> = {
  neural: '🧠',
  creative: '🎨',
  logic: '⚡',
  project: '📁'
};

// Memoized idea item for performance
const IdeaItem = memo(({
  idea,
  onDelete
}: {
  idea: Idea;
  onDelete: (id: string) => void;
}) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 20, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, x: -50, scale: 0.9 }}
    transition={{ duration: 0.2 }}
    className="bg-card border border-border rounded-xl p-4 flex items-start gap-4 group relative overflow-hidden hover:shadow-lg transition-shadow"
  >
    <div className={cn(
      "absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b",
      categoryColors[idea.category]
    )} />

    <div className="flex-1 pl-2">
      <p className="text-foreground leading-relaxed">{idea.content}</p>
      <div className="flex items-center gap-3 mt-3">
        <span className={cn(
          "text-xs px-3 py-1 rounded-full bg-gradient-to-r text-white flex items-center gap-1",
          categoryColors[idea.category]
        )}>
          {categoryIcons[idea.category]} {idea.category}
        </span>
        <span className="text-xs text-muted-foreground">
          {new Date(idea.created_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </span>
      </div>
    </div>
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={() => onDelete(idea.id)}
      className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive p-2 rounded-lg hover:bg-destructive/10"
    >
      <X className="w-4 h-4" />
    </motion.button>
  </motion.div>
));

IdeaItem.displayName = 'IdeaItem';

const IdeaBar = () => {
  const { user } = useAuth();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [newIdea, setNewIdea] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category>('neural');
  const [filterCategory, setFilterCategory] = useState<Category | 'all'>('all');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Fetch ideas
  const fetchIdeas = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('ideas')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching ideas:', error);
      toast.error('Failed to load ideas');
    } else if (data) {
      const mappedIdeas: Idea[] = data.map(item => ({
        ...item,
        category: item.category as Category
      }));
      setIdeas(mappedIdeas);
    }
    setInitialLoading(false);
  }, [user]);

  // Initial fetch
  useEffect(() => {
    if (user) fetchIdeas();
  }, [user, fetchIdeas]);

  // Real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('ideas-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ideas',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newIdea = {
              ...payload.new,
              category: payload.new.category as Category
            } as Idea;
            setIdeas(prev => [newIdea, ...prev.filter(i => i.id !== newIdea.id)]);
          } else if (payload.eventType === 'DELETE') {
            setIdeas(prev => prev.filter(i => i.id !== payload.old.id));
          } else if (payload.eventType === 'UPDATE') {
            setIdeas(prev => prev.map(i =>
              i.id === payload.new.id
                ? { ...payload.new, category: payload.new.category as Category } as Idea
                : i
            ));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Store idea with optimistic update
  const storeIdea = async () => {
    if (!newIdea.trim() || !user || loading) return;

    setLoading(true);
    const tempId = crypto.randomUUID();
    const optimisticIdea: Idea = {
      id: tempId,
      content: newIdea.trim(),
      category: selectedCategory,
      created_at: new Date().toISOString(),
      user_id: user.id,
      is_processed: false,
      note_id: null
    };

    // Optimistic update
    setIdeas(prev => [optimisticIdea, ...prev]);
    setNewIdea('');

    const { data, error } = await supabase.from('ideas').insert({
      user_id: user.id,
      content: optimisticIdea.content,
      category: selectedCategory,
    }).select().single();

    if (error) {
      // Rollback on error
      setIdeas(prev => prev.filter(i => i.id !== tempId));
      setNewIdea(optimisticIdea.content);
      toast.error('Failed to store idea');
    } else if (data) {
      // Replace temp with real
      setIdeas(prev => prev.map(i =>
        i.id === tempId
          ? { ...data, category: data.category as Category }
          : i
      ));
      toast.success('Idea captured!', {
        icon: categoryIcons[selectedCategory]
      });
    }
    setLoading(false);
  };

  // Delete idea
  const deleteIdea = useCallback(async (id: string) => {
    const ideaToDelete = ideas.find(i => i.id === id);

    // Optimistic delete
    setIdeas(prev => prev.filter(i => i.id !== id));

    const { error } = await supabase.from('ideas').delete().eq('id', id);

    if (error) {
      // Rollback on error
      if (ideaToDelete) {
        setIdeas(prev => [ideaToDelete, ...prev]);
      }
      toast.error('Failed to delete idea');
    }
  }, [ideas]);

  const filteredIdeas = filterCategory === 'all'
    ? ideas
    : ideas.filter(i => i.category === filterCategory);

  const getCategoryCount = (cat: Category) => ideas.filter(i => i.category === cat).length;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto pt-16 lg:pt-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 xs:mb-8"
      >
        <div className="flex items-center gap-2 xs:gap-3 mb-2">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            <Brain className="w-6 h-6 xs:w-8 xs:h-8 text-primary" />
          </motion.div>
          <h1 className="text-xl xs:text-2xl md:text-3xl font-bold text-foreground">Neural Backlog</h1>
        </div>
        <p className="text-xs xs:text-sm text-primary tracking-wider flex items-center gap-2">
          <Sparkles className="w-3 h-3 xs:w-4 xs:h-4" />
          Capture fleeting thoughts before they vanish
        </p>
      </motion.div>

      {/* Input Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card border border-border rounded-2xl p-4 md:p-6 mb-8 relative overflow-hidden shadow-lg"
      >
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-2xl pointer-events-none" />

        {/* Category selector */}
        <div className="flex flex-wrap gap-1.5 xs:gap-2 mb-4">
          {categories.map((cat) => (
            <motion.button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={cn(
                "px-2 xs:px-3 py-1.5 xs:py-2 rounded-full text-xs xs:text-sm font-medium transition-all flex items-center gap-1.5",
                selectedCategory === cat
                  ? `bg-gradient-to-r ${categoryColors[cat]} text-white shadow-lg`
                  : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80'
              )}
            >
              <span>{categoryIcons[cat]}</span>
              <span className="hidden xs:inline">{cat.toUpperCase()}</span>
              <span className="xs:hidden">{cat.slice(0, 3).toUpperCase()}</span>
            </motion.button>
          ))}
        </div>

        {/* Input */}
        <div className="flex gap-3">
          <Input
            value={newIdea}
            onChange={(e) => setNewIdea(e.target.value)}
            placeholder="Capture a fleeting thought..."
            className="flex-1 bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground h-12 text-base"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                storeIdea();
              }
            }}
            disabled={loading}
          />
          <Button
            onClick={storeIdea}
            disabled={loading || !newIdea.trim()}
            className={cn(
              "h-12 px-6 rounded-xl gap-2 bg-gradient-to-r text-white shadow-lg hover:shadow-xl transition-all",
              categoryColors[selectedCategory]
            )}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">STORE</span>
          </Button>
        </div>
      </motion.div>

      {/* Filter Tabs */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex flex-wrap items-center gap-1.5 xs:gap-2 mb-6"
      >
        <Filter className="w-3 h-3 xs:w-4 xs:h-4 text-muted-foreground" />
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setFilterCategory('all')}
          className={cn(
            "px-2 xs:px-4 py-1.5 xs:py-2 rounded-full text-xs xs:text-sm transition-all font-medium",
            filterCategory === 'all'
              ? 'bg-primary text-primary-foreground shadow-md'
              : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80'
          )}
        >
          ALL ({ideas.length})
        </motion.button>
        {categories.map((cat) => (
          <motion.button
            key={cat}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setFilterCategory(cat)}
            className={cn(
              "px-2 xs:px-4 py-1.5 xs:py-2 rounded-full text-xs xs:text-sm transition-all flex items-center gap-1 font-medium",
              filterCategory === cat
                ? `bg-gradient-to-r ${categoryColors[cat]} text-white shadow-md`
                : 'bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary'
            )}
          >
            {categoryIcons[cat]} <span className="hidden xs:inline">{getCategoryCount(cat)}</span>
          </motion.button>
        ))}
      </motion.div>

      {/* Ideas List */}
      {initialLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          {filteredIdeas.length > 0 ? (
            <motion.div className="space-y-3">
              {filteredIdeas.map((idea) => (
                <IdeaItem key={idea.id} idea={idea} onDelete={deleteIdea} />
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
              <h3 className="text-xl text-muted-foreground mb-2">
                {filterCategory === 'all' ? 'The Backlog is Dormant' : `No ${filterCategory} ideas yet`}
              </h3>
              <p className="text-sm text-muted-foreground/60">
                {filterCategory === 'all'
                  ? 'Awaiting high-value neural sequences.'
                  : 'Start capturing ideas in this category.'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
};

export default IdeaBar;