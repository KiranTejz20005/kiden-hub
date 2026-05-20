import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { ActiveView } from '@/lib/types';
import { searchAll, SearchResult } from '@/services/searchService';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, FileText, MessageSquare, Calendar, Columns,
  Flame, Target, Upload, FilePlus, Zap, ArrowRight, Clock,
  Search, Hash, Settings, LogOut, Command
} from 'lucide-react';

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  category: string;
  action: () => void;
  shortcut?: string;
}

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onViewChange: (view: ActiveView) => void;
  onSignOut?: () => void;
}

const NAV_COMMANDS = (onViewChange: (v: ActiveView) => void): CommandItem[] => [
  { id: 'nav-dashboard', label: 'Dashboard', description: 'Go to overview', icon: <LayoutDashboard className="w-4 h-4" />, category: 'Navigate', action: () => onViewChange('dashboard') },
  { id: 'nav-notes', label: 'Notes', description: 'Open notes editor', icon: <FileText className="w-4 h-4" />, category: 'Navigate', action: () => onViewChange('notes') },
  { id: 'nav-chat', label: 'AI Assistant', description: 'Start AI conversation', icon: <MessageSquare className="w-4 h-4" />, category: 'Navigate', action: () => onViewChange('chat') },
  { id: 'nav-files', label: 'Asset Library', description: 'Manage files', icon: <Columns className="w-4 h-4" />, category: 'Navigate', action: () => onViewChange('files') },
  { id: 'nav-calendar', label: 'Calendar', description: 'View schedule', icon: <Calendar className="w-4 h-4" />, category: 'Navigate', action: () => onViewChange('calendar') },
  { id: 'nav-focus', label: 'Focus Timer', description: 'Pomodoro sessions', icon: <Flame className="w-4 h-4" />, category: 'Navigate', action: () => onViewChange('focus') },
  { id: 'nav-habits', label: 'Habit Tracker', description: 'Track daily habits', icon: <Target className="w-4 h-4" />, category: 'Navigate', action: () => onViewChange('habits') },
  { id: 'nav-boards', label: 'My Boards', description: 'Research boards', icon: <Hash className="w-4 h-4" />, category: 'Navigate', action: () => onViewChange('boards') },
  { id: 'nav-settings', label: 'Settings', description: 'App preferences', icon: <Settings className="w-4 h-4" />, category: 'Navigate', action: () => onViewChange('settings') },
];

const RECENT_KEY = 'kiden_recent_commands';
const MAX_RECENT = 4;

function getRecentCommands(): string[] {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch { return []; }
}

function addRecentCommand(id: string) {
  const recent = getRecentCommands().filter(r => r !== id);
  recent.unshift(id);
  localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
}

export function CommandPalette({ open, onOpenChange, onViewChange, onSignOut }: CommandPaletteProps) {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>();

  const allNavCommands = NAV_COMMANDS(onViewChange);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setSearchResults([]);
      setRecentIds(getRecentCommands());
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const doSearch = useCallback(async (q: string) => {
    if (!user || q.length < 2) { setSearchResults([]); return; }
    setIsSearching(true);
    const results = await searchAll(user.id, q);
    setSearchResults(results.slice(0, 8));
    setIsSearching(false);
  }, [user]);

  useEffect(() => {
    clearTimeout(searchTimeout.current);
    if (query.startsWith('>')) {
      // Command mode — no external search
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    searchTimeout.current = setTimeout(() => doSearch(query), 250);
    return () => clearTimeout(searchTimeout.current);
  }, [query, doSearch]);

  // Build displayed commands
  const filterStr = query.startsWith('>') ? query.slice(1).trim().toLowerCase() : query.toLowerCase();
  const filteredNav = allNavCommands.filter(c =>
    !query || c.label.toLowerCase().includes(filterStr) || (c.description || '').toLowerCase().includes(filterStr)
  );

  // Recent commands
  const recentCommands = recentIds
    .map(id => allNavCommands.find(c => c.id === id))
    .filter(Boolean) as CommandItem[];

  // Group: recent | search results | nav
  type DisplayItem = { type: 'command'; item: CommandItem } | { type: 'result'; item: SearchResult };

  const displayItems: DisplayItem[] = [];
  if (!query) {
    recentCommands.forEach(c => displayItems.push({ type: 'command', item: c }));
    filteredNav.slice(0, 5).forEach(c => {
      if (!recentCommands.find(r => r.id === c.id)) displayItems.push({ type: 'command', item: c });
    });
  } else if (query.startsWith('>')) {
    filteredNav.forEach(c => displayItems.push({ type: 'command', item: c }));
  } else {
    searchResults.forEach(r => displayItems.push({ type: 'result', item: r }));
    filteredNav.slice(0, 4).forEach(c => displayItems.push({ type: 'command', item: c }));
  }

  const totalItems = displayItems.length;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(i => (i + 1) % Math.max(1, totalItems)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(i => (i - 1 + Math.max(1, totalItems)) % Math.max(1, totalItems)); }
    if (e.key === 'Enter' && displayItems[selectedIndex]) {
      handleSelect(displayItems[selectedIndex]);
    }
    if (e.key === 'Escape') onOpenChange(false);
  };

  const handleSelect = (item: DisplayItem) => {
    if (item.type === 'command') {
      addRecentCommand(item.item.id);
      item.item.action();
    } else {
      // Navigate to the right view based on result type
      const typeMap: Record<string, ActiveView> = { note: 'notes', file: 'files', board: 'boards', conversation: 'chat' };
      onViewChange(typeMap[item.item.type] || 'dashboard');
    }
    onOpenChange(false);
  };

  const typeViewMap: Record<string, ActiveView> = { note: 'notes', file: 'files', board: 'boards', conversation: 'chat' };

  const getResultColor = (type: string) => {
    const m: Record<string, string> = { note: 'text-amber-400', file: 'text-blue-400', board: 'text-violet-400', conversation: 'text-emerald-400' };
    return m[type] || 'text-white/40';
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh] px-4"
          onClick={e => e.target === e.currentTarget && onOpenChange(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => onOpenChange(false)} />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ type: "spring", damping: 25, stiffness: 400 }}
            className="relative w-full max-w-xl bg-[#0d0d0d] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Search Input */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.06]">
              {isSearching ? (
                <div className="w-4 h-4 border-[1.5px] border-white/20 border-t-white/60 rounded-full animate-spin shrink-0" />
              ) : (
                <Search className="w-4 h-4 text-white/30 shrink-0" />
              )}
              <input
                ref={inputRef}
                value={query}
                onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
                onKeyDown={handleKeyDown}
                placeholder='Search or type ">" for commands...'
                className="flex-1 bg-transparent text-[14px] text-white placeholder:text-white/20 outline-none"
              />
              <kbd className="text-[9px] font-bold text-white/20 px-1.5 py-0.5 rounded-md bg-white/5 border border-white/[0.06]">ESC</kbd>
            </div>

            {/* Results */}
            <div className="max-h-[50vh] overflow-y-auto py-2 scrollbar-hide">
              {displayItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-white/20">
                  <Command className="w-6 h-6 mb-2" />
                  <p className="text-[12px]">No results for "{query}"</p>
                  <p className="text-[10px] mt-1 text-white/10">Try typing {">"} for commands</p>
                </div>
              ) : (
                <>
                  {/* Group headers logic */}
                  {!query && recentCommands.length > 0 && (
                    <div className="px-3 pb-1">
                      <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-white/25 mb-1 flex items-center gap-1.5">
                        <Clock className="w-3 h-3" />
                        Recent
                      </p>
                    </div>
                  )}
                  {displayItems.map((item, i) => {
                    const isSelected = i === selectedIndex;
                    // Header between recent and all
                    const showAllHeader = !query && i === recentCommands.length && recentCommands.length > 0;
                    const showSearchHeader = query && !query.startsWith('>') && item.type === 'result' && i === 0 && searchResults.length > 0;
                    const showNavHeader = query && !query.startsWith('>') && item.type === 'command' && (i === 0 || displayItems[i-1]?.type === 'result');

                    return (
                      <div key={item.type === 'command' ? item.item.id : item.item.id + '-res'}>
                        {showAllHeader && (
                          <p className="px-3 pb-1 pt-2 text-[9px] font-bold uppercase tracking-[0.25em] text-white/25">
                            All Commands
                          </p>
                        )}
                        {showSearchHeader && (
                          <p className="px-3 pb-1 text-[9px] font-bold uppercase tracking-[0.25em] text-white/25">
                            Search Results
                          </p>
                        )}
                        {showNavHeader && (
                          <p className="px-3 pb-1 pt-1 text-[9px] font-bold uppercase tracking-[0.25em] text-white/25">
                            Navigate
                          </p>
                        )}
                        <motion.button
                          onClick={() => handleSelect(item)}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-2.5 transition-all text-left",
                            isSelected ? "bg-white/[0.07]" : "hover:bg-white/[0.04]"
                          )}
                        >
                          <div className={cn(
                            "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-[16px]",
                            item.type === 'command'
                              ? "bg-white/5 text-white/50"
                              : "bg-white/5"
                          )}>
                            {item.type === 'command' ? item.item.icon : item.item.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={cn(
                              "text-[13px] font-medium truncate",
                              isSelected ? "text-white" : "text-white/70"
                            )}>
                              {item.type === 'command' ? item.item.label : item.item.title}
                            </p>
                            {(item.type === 'command' ? item.item.description : item.item.snippet) && (
                              <p className="text-[11px] text-white/30 truncate">
                                {item.type === 'command' ? item.item.description : item.item.snippet}
                              </p>
                            )}
                          </div>
                          {item.type === 'result' && (
                            <span className={cn("text-[9px] font-bold uppercase tracking-wider shrink-0", getResultColor(item.item.type))}>
                              {item.item.type}
                            </span>
                          )}
                          {isSelected && <ArrowRight className="w-3.5 h-3.5 text-white/40 shrink-0" />}
                        </motion.button>
                      </div>
                    );
                  })}
                </>
              )}
            </div>

            {/* Footer hint */}
            <div className="px-4 py-2.5 border-t border-white/[0.04] flex items-center gap-4 text-[9px] text-white/20">
              <span className="flex items-center gap-1"><kbd className="font-bold bg-white/5 px-1 rounded">↑↓</kbd> navigate</span>
              <span className="flex items-center gap-1"><kbd className="font-bold bg-white/5 px-1 rounded">↵</kbd> select</span>
              <span className="flex items-center gap-1"><kbd className="font-bold bg-white/5 px-1 rounded">&gt;</kbd> commands</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
