import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { ActiveView } from '@/lib/types';
import { searchAll, SearchResult } from '@/services/searchService';
import { cn } from '@/lib/utils';
import { Search, X, FileText, Columns, MessageSquare, Hash, Filter, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

type FilterType = 'all' | 'note' | 'file' | 'board' | 'conversation';

const TYPE_CONFIG: Record<FilterType, { label: string; icon: any; color: string }> = {
  all: { label: 'All', icon: Search, color: 'text-white/50' },
  note: { label: 'Notes', icon: FileText, color: 'text-amber-400' },
  file: { label: 'Files', icon: Columns, color: 'text-blue-400' },
  board: { label: 'Boards', icon: Hash, color: 'text-violet-400' },
  conversation: { label: 'AI Chats', icon: MessageSquare, color: 'text-emerald-400' },
};

interface SmartSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: ActiveView) => void;
}

export function SmartSearch({ isOpen, onClose, onNavigate }: SmartSearchProps) {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults([]);
      setActiveFilter('all');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [isOpen]);

  const doSearch = useCallback(async (q: string) => {
    if (!user || q.length < 2) { setResults([]); return; }
    setIsLoading(true);
    const r = await searchAll(user.id, q);
    setResults(r);
    setIsLoading(false);
    setSelectedIndex(0);
  }, [user]);

  useEffect(() => {
    clearTimeout(searchTimeout.current);
    if (!query.trim()) { setResults([]); return; }
    searchTimeout.current = setTimeout(() => doSearch(query), 300);
    return () => clearTimeout(searchTimeout.current);
  }, [query, doSearch]);

  const filtered = activeFilter === 'all'
    ? results
    : results.filter(r => r.type === activeFilter);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, filtered.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)); }
    if (e.key === 'Enter' && filtered[selectedIndex]) handleOpen(filtered[selectedIndex]);
    if (e.key === 'Escape') onClose();
  };

  const handleOpen = (result: SearchResult) => {
    const typeMap: Record<string, ActiveView> = { note: 'notes', file: 'files', board: 'boards', conversation: 'chat' };
    onNavigate(typeMap[result.type] || 'dashboard');
    onClose();
  };

  function highlightMatch(text: string, q: string): React.ReactNode {
    if (!q || q.length < 2) return text;
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark className="bg-amber-400/30 text-amber-200 rounded-sm">{text.slice(idx, idx + q.length)}</mark>
        {text.slice(idx + q.length)}
      </>
    );
  }

  const countsPerType = results.reduce((acc, r) => {
    acc[r.type] = (acc[r.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex"
          onClick={e => e.target === e.currentTarget && onClose()}
        >
          {/* Blurred backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

          {/* Slide-in panel from right */}
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="absolute right-0 top-0 h-full w-full max-w-md bg-[#0d0d0d] border-l border-white/10 shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="p-5 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                  {isLoading ? (
                    <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 animate-spin" />
                  ) : (
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  )}
                  <input
                    ref={inputRef}
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Search everything..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-[13px] text-white placeholder:text-white/20 outline-none focus:border-white/20 transition-colors"
                  />
                </div>
                <button
                  onClick={onClose}
                  className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Type filters */}
              {results.length > 0 && (
                <div className="flex gap-1.5 mt-3 flex-wrap">
                  {(Object.entries(TYPE_CONFIG) as [FilterType, typeof TYPE_CONFIG[FilterType]][]).map(([key, conf]) => {
                    const count = key === 'all' ? results.length : countsPerType[key] || 0;
                    if (key !== 'all' && count === 0) return null;
                    return (
                      <button
                        key={key}
                        onClick={() => setActiveFilter(key)}
                        className={cn(
                          "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                          activeFilter === key
                            ? "bg-white/10 text-white"
                            : "text-white/30 hover:text-white/60 hover:bg-white/5"
                        )}
                      >
                        <conf.icon className={cn("w-3 h-3", conf.color)} />
                        {conf.label}
                        <span className="text-white/30">({count})</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto scrollbar-hide">
              {!query ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center mb-4">
                    <Search className="w-6 h-6 text-white/20" />
                  </div>
                  <p className="text-[13px] font-bold text-white/30">Search everything</p>
                  <p className="text-[11px] text-white/15 mt-1">Notes, files, boards, AI chats</p>
                  <div className="flex items-center gap-2 mt-4">
                    <kbd className="text-[9px] bg-white/5 border border-white/10 text-white/30 px-2 py-1 rounded-md font-bold">Cmd</kbd>
                    <span className="text-white/20 text-[10px]">+</span>
                    <kbd className="text-[9px] bg-white/5 border border-white/10 text-white/30 px-2 py-1 rounded-md font-bold">⇧F</kbd>
                  </div>
                </div>
              ) : filtered.length === 0 && !isLoading ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <p className="text-[13px] text-white/30">No results for</p>
                  <p className="text-[15px] font-bold text-white mt-1">"{query}"</p>
                </div>
              ) : (
                <div className="p-3 space-y-1">
                  <AnimatePresence mode="popLayout">
                    {filtered.map((result, i) => {
                      const conf = TYPE_CONFIG[result.type as FilterType] || TYPE_CONFIG.all;
                      const isSelected = i === selectedIndex;
                      return (
                        <motion.button
                          key={result.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.98 }}
                          transition={{ delay: i * 0.03 }}
                          onClick={() => handleOpen(result)}
                          onMouseEnter={() => setSelectedIndex(i)}
                          className={cn(
                            "w-full text-left flex items-start gap-3 p-3 rounded-xl transition-all",
                            isSelected ? "bg-white/[0.07]" : "hover:bg-white/[0.04]"
                          )}
                        >
                          <div className={cn("w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-xl shrink-0")}>
                            {result.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-[13px] font-semibold text-white truncate">
                                {highlightMatch(result.title, query)}
                              </p>
                              <span className={cn("text-[8px] font-black uppercase tracking-widest shrink-0", conf.color)}>
                                {result.type}
                              </span>
                            </div>
                            {result.snippet && (
                              <p className="text-[11px] text-white/35 mt-0.5 line-clamp-1">
                                {highlightMatch(result.snippet, query)}
                              </p>
                            )}
                            <p className="text-[9px] text-white/20 mt-1">
                              {formatDistanceToNow(new Date(result.created_at), { addSuffix: true })}
                            </p>
                          </div>
                        </motion.button>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Footer */}
            {filtered.length > 0 && (
              <div className="p-3 border-t border-white/[0.04]">
                <p className="text-[9px] text-white/20 text-center">
                  {filtered.length} result{filtered.length !== 1 ? 's' : ''} · Press ↵ to open
                </p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
