import { motion } from 'framer-motion';
import { Profile, Collection } from '@/lib/types';
import { Search, Plus, Monitor, Sparkles, Clock, Globe, Folder } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface CommandCenterProps {
  profile: Profile | null;
  totalFocusMinutes: number;
  collections: Collection[];
  onEnterFocus: () => void;
  onNewThought: () => void;
  onAIAssistant: () => void;
}

const CommandCenter = ({
  profile,
  totalFocusMinutes,
  collections,
  onEnterFocus,
  onNewThought,
  onAIAssistant
}: CommandCenterProps) => {
  const displayName = profile?.display_name || 'there';

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-12">
        <div>
          <p className="text-primary text-sm tracking-widest mb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            COMMAND CENTER
          </p>
          <h1 className="font-serif text-5xl md:text-6xl text-foreground italic">
            Welcome back,
            <br />
            {displayName}
          </h1>
        </div>

        <div className="hidden md:block w-96">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search notes, files, or ideas..."
              className="pl-12 bg-card border-border h-12 rounded-xl"
            />
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Action Cards */}
        <div className="lg:col-span-2">
          <div className="grid grid-cols-3 gap-4 mb-8">
            {/* New Thought */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onNewThought}
              className="aspect-square rounded-3xl bg-primary flex flex-col items-center justify-center gap-3 text-primary-foreground"
            >
              <Plus className="w-8 h-8" />
              <span className="text-sm font-medium tracking-wider">NEW THOUGHT</span>
            </motion.button>

            {/* AI Assistant */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onAIAssistant}
              className="aspect-square rounded-3xl bg-violet-600 flex flex-col items-center justify-center gap-3 text-white"
            >
              <Monitor className="w-8 h-8" />
              <span className="text-sm font-medium tracking-wider">AI ASSISTANT</span>
            </motion.button>

            {/* Flow State */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onEnterFocus}
              className="aspect-square rounded-3xl bg-card border border-border flex flex-col items-center justify-center gap-3 text-foreground"
            >
              <Sparkles className="w-8 h-8" />
              <span className="text-sm font-medium tracking-wider">FLOW STATE</span>
            </motion.button>
          </div>

          {/* Focus Archive */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm tracking-widest text-muted-foreground">FOCUS ARCHIVE</h2>
              <button className="text-sm text-primary hover:underline">Full History</button>
            </div>
            <div className="bg-card border border-border rounded-2xl p-8 text-center border-dashed">
              <Clock className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground">No sessions recorded yet.</p>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Lifetime Focus */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <p className="text-primary text-xs tracking-widest mb-2 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              LIFETIME FOCUS
            </p>
            <p className="font-serif text-4xl text-foreground mb-2">
              {totalFocusMinutes} Mins
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Your journey to peak performance is persistent. Every session counts towards
              your unified intelligence.
            </p>
            <Button
              onClick={onEnterFocus}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl"
            >
              ENTER FLOW
            </Button>
          </div>

          {/* Collections */}
          <div>
            <h2 className="text-xs tracking-widest text-muted-foreground mb-4">COLLECTIONS</h2>
            <div className="grid grid-cols-2 gap-3">
              {collections.length > 0 ? (
                collections.slice(0, 4).map((collection) => (
                  <div
                    key={collection.id}
                    className="bg-card border border-border rounded-2xl p-4"
                  >
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center mb-3">
                      <Globe className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <p className="font-medium text-foreground">{collection.name}</p>
                    <p className="text-xs text-muted-foreground">{collection.item_count} ITEMS</p>
                  </div>
                ))
              ) : (
                <>
                  <div className="bg-card border border-border rounded-2xl p-4">
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center mb-3">
                      <Globe className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <p className="font-medium text-foreground">Research</p>
                    <p className="text-xs text-muted-foreground">0 ITEMS</p>
                  </div>
                  <div className="bg-card border border-border rounded-2xl p-4">
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center mb-3">
                      <Folder className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <p className="font-medium text-foreground">Personal</p>
                    <p className="text-xs text-muted-foreground">0 ITEMS</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandCenter;