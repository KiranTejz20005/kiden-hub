import { useState, useEffect, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Brain, X, Sparkles, Send, Filter, Loader2, Mic, MicOff } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { PageLayout } from '@/components/ui/PageLayout';
import { PageHeader } from '@/components/ui/PageHeader';

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
    className="bg-card border border-border rounded-xl p-4 flex items-start gap-4 group relative overflow-hidden hover:shadow-lg transition-all"
  >
    <div className={cn(
      "absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b",
      categoryColors[idea.category]
    )} />

    <div className="flex-1 pl-2">
      <p className="text-foreground leading-relaxed whitespace-pre-wrap">{idea.content}</p>
      <div className="flex items-center gap-3 mt-3">
        <span className={cn(
          "text-[10px] px-2 py-0.5 rounded-full bg-gradient-to-r text-white flex items-center gap-1 shadow-sm",
          categoryColors[idea.category]
        )}>
          {categoryIcons[idea.category]} {idea.category.toUpperCase()}
        </span>
        <span className="text-[10px] text-muted-foreground/60">
          {new Date(idea.created_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric'
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

  // Voice State
  const [isListening, setIsListening] = useState(false);

  // Fetch ideas
  const fetchIdeas = useCallback(async () => {
    if (!user) {
      setInitialLoading(false);
      return;
    }

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
    fetchIdeas();
  }, [user, fetchIdeas]);

  // Real-time subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel('ideas-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ideas', filter: `user_id=eq.${user.id}` }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setIdeas(prev => [{ ...payload.new, category: payload.new.category as Category } as Idea, ...prev]);
        } else if (payload.eventType === 'DELETE') {
          setIdeas(prev => prev.filter(i => i.id !== payload.old.id));
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // Voice Handler
  const toggleVoice = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error("Browser doesn't support speech recognition.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      // Stop logic handled by recognition object usually, but here we simulate toggle for UI
      toast.info("Stopped listening");
    } else {
      setIsListening(true);
      toast.success("Listening... Speak now.");
      // Simulation of voice input filling the box
      setTimeout(() => {
        setNewIdea(prev => prev + " (Voice Capture) This is a simulated captured thought.");
        setIsListening(false);
      }, 3000);
    }
  };

  // Store idea
  const storeIdea = async () => {
    if (!newIdea.trim()) return;
    setLoading(true);

    const tempId = crypto.randomUUID();
    const optimisticIdea: Idea = {
      id: tempId,
      content: newIdea.trim(),
      category: selectedCategory,
      created_at: new Date().toISOString(),
      user_id: user?.id || 'guest',
      is_processed: false,
      note_id: null
    };

    setIdeas(prev => [optimisticIdea, ...prev]);
    setNewIdea('');

    if (user) {
      const { data, error } = await supabase.from('ideas').insert({
        user_id: user.id,
        content: optimisticIdea.content,
        category: selectedCategory,
      }).select().single();

      if (error) {
        setIdeas(prev => prev.filter(i => i.id !== tempId));
        setNewIdea(optimisticIdea.content);
        toast.error('Failed to store idea');
      } else if (data) {
        setIdeas(prev => prev.map(i => i.id === tempId ? { ...data, category: data.category as Category } : i));
      }
    }
    setLoading(false);
    toast.success("Captured!");
  };

  // Delete idea
  const deleteIdea = useCallback(async (id: string) => {
    const ideaToDelete = ideas.find(i => i.id === id);
    setIdeas(prev => prev.filter(i => i.id !== id));

    if (user) {
      const { error } = await supabase.from('ideas').delete().eq('id', id);
      if (error && ideaToDelete) {
        setIdeas(prev => [ideaToDelete, ...prev]);
        toast.error('Failed to delete');
      }
    }
  }, [ideas, user]);

  const filteredIdeas = filterCategory === 'all' ? ideas : ideas.filter(i => i.category === filterCategory);
  const getCategoryCount = (cat: Category) => ideas.filter(i => i.category === cat).length;

  return (
    <PageLayout scrollable className="p-4 md:p-8">
      <PageHeader
        title="Capture & Ideas"
        description="Your Neural Backlog for fleeting thoughts."
      />

      {/* Input Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-4 md:p-6 mb-8 relative overflow-hidden shadow-sm"
      >
        {/* Category selector */}
        <div className="flex flex-wrap gap-2 mb-4">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 border hover:scale-105 active:scale-95",
                selectedCategory === cat
                  ? `bg-gradient-to-r ${categoryColors[cat]} text-white border-transparent shadow-md`
                  : 'bg-background border-border text-muted-foreground hover:text-foreground'
              )}
            >
              <span>{categoryIcons[cat]}</span>
              <span className="capitalize">{cat}</span>
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              value={newIdea}
              onChange={(e) => setNewIdea(e.target.value)}
              placeholder={isListening ? "Listening..." : "Capture a thought..."}
              className={cn(
                "w-full bg-background/50 border-border/50 h-12 text-base pr-12 transition-all",
                isListening && "border-primary ring-1 ring-primary placeholder:text-primary animate-pulse"
              )}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && storeIdea()}
              disabled={loading}
            />
            <Button
              size="icon"
              variant="ghost"
              onClick={toggleVoice}
              className={cn("absolute right-1 top-1 h-10 w-10 text-muted-foreground hover:text-primary", isListening && "text-red-500 hover:text-red-600")}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </Button>
          </div>

          <Button
            onClick={storeIdea}
            disabled={loading || (!newIdea.trim() && !isListening)}
            className={cn(
              "h-12 px-6 rounded-xl gap-2 bg-gradient-to-r text-white shadow-lg hover:shadow-xl transition-all",
              categoryColors[selectedCategory]
            )}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span className="hidden sm:inline">Add</span>
          </Button>
        </div>
      </motion.div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <Filter className="w-4 h-4 text-muted-foreground mr-2" />
        <button
          onClick={() => setFilterCategory('all')}
          className={cn(
            "px-3 py-1.5 rounded-full text-xs transition-all font-medium border",
            filterCategory === 'all'
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-transparent border-border text-muted-foreground hover:border-primary/50'
          )}
        >
          All ({ideas.length})
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs transition-all flex items-center gap-1 font-medium border",
              filterCategory === cat
                ? `bg-secondary text-foreground border-primary`
                : 'bg-transparent border-border text-muted-foreground hover:border-primary/50'
            )}
          >
            {categoryIcons[cat]} <span className="capitalize">{cat}</span> ({getCategoryCount(cat)})
          </button>
        ))}
      </div>

      {/* Ideas List */}
      <div className="flex-1 min-h-0">
        {initialLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin w-8 h-8 text-muted-foreground" /></div>
        ) : filteredIdeas.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredIdeas.map((idea) => (
                <IdeaItem key={idea.id} idea={idea} onDelete={deleteIdea} />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="text-center py-20 opacity-50">
            <Brain className="w-16 h-16 mx-auto mb-4" />
            <p>Buffer empty.</p>
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default IdeaBar;