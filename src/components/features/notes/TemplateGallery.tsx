import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Sparkles, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  content: any;
}

const SYSTEM_TEMPLATES: Template[] = [
  {
    id: 'daily-journal',
    name: 'Daily Journal',
    description: 'Reflect on your day with structured prompts for wins, challenges, and gratitude.',
    category: 'Personal',
    icon: '📔',
    content: {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: `Daily Journal — ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}` }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '🌅 Morning Intention' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Today I intend to...' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '✅ Today\'s Top 3 Priorities' }] },
        { type: 'taskList', content: [
          { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Priority 1' }] }] },
          { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Priority 2' }] }] },
          { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Priority 3' }] }] },
        ]},
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '🌇 Evening Reflection' }] },
        { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'What went well?' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '' }] },
        { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'What could be improved?' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '' }] },
        { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: '🙏 Gratitude' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'I am grateful for...' }] },
      ]
    }
  },
  {
    id: 'meeting-notes',
    name: 'Meeting Notes',
    description: 'Capture meeting context, decisions made, and clear action items with owners.',
    category: 'Work',
    icon: '🤝',
    content: {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Meeting Notes' }] },
        { type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'bold' }], text: 'Date:' }, { type: 'text', text: ` ${new Date().toLocaleDateString()}` }] },
        { type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'bold' }], text: 'Attendees:' }, { type: 'text', text: ' ' }] },
        { type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'bold' }], text: 'Objective:' }, { type: 'text', text: ' ' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '📋 Agenda' }] },
        { type: 'bulletList', content: [
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Item 1' }] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Item 2' }] }] },
        ]},
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '📝 Notes & Decisions' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '⚡ Action Items' }] },
        { type: 'taskList', content: [
          { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: '[ Owner ] Action item description' }] }] },
        ]},
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '🔗 Next Steps' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Next meeting: ' }] },
      ]
    }
  },
  {
    id: 'research-plan',
    name: 'Research Plan',
    description: 'Structure your research with hypotheses, methodology, sources, and findings.',
    category: 'Research',
    icon: '🔬',
    content: {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Research Plan' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '🎯 Research Question' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'What question are you trying to answer?' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '💡 Hypothesis' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'My hypothesis is that...' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '🔍 Methodology' }] },
        { type: 'bulletList', content: [
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Step 1' }] }] },
        ]},
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '📚 Sources & References' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '📊 Findings' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '🏁 Conclusion' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '' }] },
      ]
    }
  },
  {
    id: 'project-brief',
    name: 'Project Brief',
    description: 'Define project scope, goals, stakeholders, timeline, and success metrics.',
    category: 'Work',
    icon: '📊',
    content: {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Project Brief' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '🎯 Project Overview' }] },
        { type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'bold' }], text: 'Project Name:' }, { type: 'text', text: ' ' }] },
        { type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'bold' }], text: 'Owner:' }, { type: 'text', text: ' ' }] },
        { type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'bold' }], text: 'Start Date:' }, { type: 'text', text: ' ' }] },
        { type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'bold' }], text: 'Target Date:' }, { type: 'text', text: ' ' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '🔥 Problem Statement' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'We are solving...' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '✅ Goals & Success Metrics' }] },
        { type: 'bulletList', content: [
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Goal 1' }] }] },
        ]},
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '🚧 Scope' }] },
        { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'In scope' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '' }] },
        { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Out of scope' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '⚠️ Risks & Mitigations' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '' }] },
      ]
    }
  },
  {
    id: 'brainstorm',
    name: 'Brainstorm Session',
    description: 'Capture all ideas freely, then organize into themes and prioritize.',
    category: 'Creative',
    icon: '⚡',
    content: {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Brainstorm: ' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '🌪️ Dump Zone — All Ideas Welcome' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'No filtering. Write everything that comes to mind.' }] },
        { type: 'bulletList', content: [
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Idea 1' }] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Idea 2' }] }] },
        ]},
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '🗂️ Themes & Clusters' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Group related ideas here.' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '⭐ Top Ideas to Explore' }] },
        { type: 'taskList', content: [
          { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Best idea' }] }] },
        ]},
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '🚀 Next Actions' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '' }] },
      ]
    }
  },
  {
    id: 'weekly-review',
    name: 'Weekly Review',
    description: 'Reflect on your week: wins, learnings, and intentions for next week.',
    category: 'Personal',
    icon: '📅',
    content: {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: `Week of ${new Date().toLocaleDateString()}` }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '🏆 Wins This Week' }] },
        { type: 'bulletList', content: [
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Win 1' }] }] },
        ]},
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '📚 What I Learned' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '⚠️ Challenges & What I\'d Do Differently' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '🎯 Focus for Next Week' }] },
        { type: 'taskList', content: [
          { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Main goal' }] }] },
        ]},
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '💡 Ideas & Backlog' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '' }] },
      ]
    }
  },
];

const CATEGORIES = ['All', 'Personal', 'Work', 'Research', 'Creative'];

const CATEGORY_COLORS: Record<string, string> = {
  Personal: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
  Work: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  Research: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
  Creative: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
};

interface TemplateGalleryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: Template) => void;
}

export function TemplateGallery({ isOpen, onClose, onSelectTemplate }: TemplateGalleryProps) {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [preview] = useState<Template | null>(null);

  const filtered = SYSTEM_TEMPLATES.filter(t => {
    const matchQuery = query === '' || t.name.toLowerCase().includes(query.toLowerCase()) || t.description.toLowerCase().includes(query.toLowerCase());
    const matchCat = activeCategory === 'All' || t.category === activeCategory;
    return matchQuery && matchCat;
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
          onClick={e => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="bg-[#0d0d0d] border border-white/10 rounded-3xl w-full max-w-3xl max-h-[80vh] overflow-hidden shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h2 className="text-[15px] font-bold text-white">Template Gallery</h2>
                  <p className="text-[11px] text-white/30">{SYSTEM_TEMPLATES.length} templates available</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search + Filters */}
            <div className="p-4 border-b border-white/5 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search templates..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-[13px] text-white placeholder:text-white/20 outline-none focus:border-white/20 transition-colors"
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={cn(
                      "px-3 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all",
                      activeCategory === cat
                        ? "bg-white/15 text-white"
                        : "text-white/30 hover:text-white/60 hover:bg-white/5"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <p className="text-white/20 text-sm">No templates match "{query}"</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filtered.map((template, i) => (
                    <motion.button
                      key={template.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      onClick={() => onSelectTemplate(template)}
                      className={cn(
                        "group text-left p-4 rounded-2xl border transition-all hover:border-white/15 hover:bg-white/[0.04]",
                        preview?.id === template.id
                          ? "border-white/20 bg-white/[0.05]"
                          : "border-white/[0.06] bg-white/[0.02]"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{template.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-[13px] font-bold text-white truncate">{template.name}</h3>
                            <span className={cn(
                              "text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md border",
                              CATEGORY_COLORS[template.category] || "text-white/30 bg-white/5 border-white/10"
                            )}>
                              {template.category}
                            </span>
                          </div>
                          <p className="text-[11px] text-white/40 leading-relaxed line-clamp-2">{template.description}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/60 group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
