import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Idea } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Brain, X, List } from 'lucide-react';
import { toast } from 'sonner';

const categories = ['neural', 'creative', 'logic', 'project'] as const;
type Category = typeof categories[number];

const IdeaBar = () => {
  const { user } = useAuth();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [newIdea, setNewIdea] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category>('neural');
  const [filterCategory, setFilterCategory] = useState<Category | 'all'>('all');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchIdeas();
    }
  }, [user]);

  const fetchIdeas = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('ideas')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching ideas:', error);
    } else {
      setIdeas(data as Idea[]);
    }
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
      console.error(error);
    } else {
      toast.success('Idea captured!');
      setNewIdea('');
      fetchIdeas();
    }
    setLoading(false);
  };

  const deleteIdea = async (id: string) => {
    const { error } = await supabase.from('ideas').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete idea');
    } else {
      setIdeas((prev) => prev.filter((i) => i.id !== id));
    }
  };

  const filteredIdeas = filterCategory === 'all'
    ? ideas
    : ideas.filter((i) => i.category === filterCategory);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-1">NEURAL BACKLOG</h1>
        <p className="text-sm text-primary tracking-wider">IDEA BAR ACTIVE</p>
      </div>

      {/* Input Section */}
      <div className="bg-card border border-border rounded-2xl p-4 mb-8">
        <div className="flex flex-wrap gap-3 mb-4">
          {/* Category selector */}
          <div className="flex bg-secondary rounded-full p-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm transition-colors ${
                  selectedCategory === cat
                    ? 'bg-amber-600 text-white'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {cat.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="flex-1 flex gap-3">
            <Input
              value={newIdea}
              onChange={(e) => setNewIdea(e.target.value)}
              placeholder="Capture a fleeting sequence..."
              className="flex-1 bg-transparent border-none text-foreground placeholder:text-muted-foreground"
              onKeyDown={(e) => e.key === 'Enter' && storeIdea()}
            />
            <Button
              onClick={storeIdea}
              disabled={loading || !newIdea.trim()}
              variant="outline"
              className="border-amber-600 text-amber-600 hover:bg-amber-600/10"
            >
              STORE IDEA
            </Button>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <button
          onClick={() => setFilterCategory('all')}
          className={`px-4 py-2 rounded-full text-sm ${
            filterCategory === 'all'
              ? 'bg-amber-600 text-white'
              : 'bg-secondary text-muted-foreground hover:text-foreground'
          }`}
        >
          ALL THOUGHTS
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-4 py-2 rounded-full text-sm ${
              filterCategory === cat
                ? 'bg-secondary text-foreground'
                : 'bg-secondary/50 text-muted-foreground hover:text-foreground'
            }`}
          >
            {cat.toUpperCase()}
          </button>
        ))}
        <span className="ml-auto text-sm text-muted-foreground">
          TOTAL INDEXED: {ideas.length}
        </span>
      </div>

      {/* Ideas List */}
      <AnimatePresence mode="popLayout">
        {filteredIdeas.length > 0 ? (
          <div className="space-y-3">
            {filteredIdeas.map((idea) => (
              <motion.div
                key={idea.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-card border border-border rounded-xl p-4 flex items-start gap-4 group"
              >
                <div className="flex-1">
                  <p className="text-foreground">{idea.content}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs px-2 py-1 rounded bg-secondary text-muted-foreground uppercase">
                      {idea.category}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(idea.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => deleteIdea(idea.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Brain className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
            <h3 className="text-xl text-muted-foreground mb-2">THE BACKLOG IS DORMANT.</h3>
            <p className="text-sm text-muted-foreground/60">
              Awaiting high-value neural sequences.
            </p>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default IdeaBar;