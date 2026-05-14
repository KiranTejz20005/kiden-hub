import React, { useState, useEffect, useCallback } from 'react';
import { 
  CommandDialog, 
  CommandInput, 
  CommandList, 
  CommandEmpty, 
  CommandGroup, 
  CommandItem 
} from '@/components/ui/command';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { FileText, Columns, MessageSquare, Search, File, Layout } from 'lucide-react';
import { ActiveView } from '@/lib/types';

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onViewChange: (view: ActiveView) => void;
}

const GlobalSearch = ({ open, onOpenChange, onViewChange }: GlobalSearchProps) => {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{
    files: any[];
    boards: any[];
    notes: any[];
  }>({ files: [], boards: [], notes: [] });
  const [loading, setLoading] = useState(false);

  const fetchResults = useCallback(async (searchQuery: string) => {
    if (!user || searchQuery.length < 2) {
      setResults({ files: [], boards: [], notes: [] });
      return;
    }

    setLoading(true);
    try {
      // Search Files
      const { data: files } = await supabase
        .from('files')
        .select('*')
        .eq('user_id', user.id)
        .ilike('name', `%${searchQuery}%`)
        .limit(5);

      // Search Boards
      const { data: boards } = await supabase
        .from('research_boards' as any)
        .select('*')
        .eq('user_id', user.id)
        .ilike('title', `%${searchQuery}%`)
        .limit(5);

      // Search Notes
      const { data: notes } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', user.id)
        .or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`)
        .limit(5);

      setResults({
        files: files || [],
        boards: boards || [],
        notes: notes || []
      });
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchResults(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, fetchResults]);

  const handleSelect = (type: 'file' | 'board' | 'nav' | 'note', id: string) => {
    onOpenChange(false);
    if (type === 'nav') {
      onViewChange(id as ActiveView);
    } else if (type === 'file') {
      onViewChange('files');
    } else if (type === 'board') {
      onViewChange('boards');
    } else if (type === 'note') {
      onViewChange('notes');
    }
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <div className="bg-[var(--bg-3)] border-b border-white/[0.05]">
        <CommandInput 
          placeholder="Search documents, boards, and tools..." 
          value={query}
          onValueChange={setQuery}
          className="border-none focus:ring-0"
        />
      </div>
      <CommandList className="bg-[var(--bg-3)] text-[var(--text-primary)] scrollbar-hide">
        <CommandEmpty className="py-12 text-center text-sm text-[var(--text-tertiary)]">
          {loading ? 'Searching...' : 'No results found.'}
        </CommandEmpty>
        
        {results.files.length > 0 && (
          <CommandGroup heading="Documents">
            {results.files.map((file) => (
              <CommandItem
                key={file.id}
                onSelect={() => handleSelect('file', file.id)}
                className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/[0.05] rounded-lg"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[13px] font-medium">{file.name}</span>
                  <span className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">
                    {file.type || 'Unknown'} • {(file.size / 1024).toFixed(0)} KB
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {results.notes.length > 0 && (
          <CommandGroup heading="Notes">
            {results.notes.map((note) => (
              <CommandItem
                key={note.id}
                onSelect={() => handleSelect('note', note.id)}
                className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/[0.05] rounded-lg"
              >
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[13px] font-medium">{note.title || 'Untitled Note'}</span>
                  <span className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">Note</span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {results.boards.length > 0 && (
          <CommandGroup heading="Research Boards">
            {results.boards.map((board) => (
              <CommandItem
                key={board.id}
                onSelect={() => handleSelect('board', board.id)}
                className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/[0.05] rounded-lg"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                  <Layout className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[13px] font-medium">{board.title}</span>
                  <span className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">Board</span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandGroup heading="Quick Navigation">
          <CommandItem onSelect={() => handleSelect('nav', 'dashboard')} className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/[0.05] rounded-lg">
            <Search className="w-4 h-4 text-[var(--text-tertiary)]" />
            <span className="text-[13px]">Go to Dashboard</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect('nav', 'chat')} className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/[0.05] rounded-lg">
            <MessageSquare className="w-4 h-4 text-[var(--text-tertiary)]" />
            <span className="text-[13px]">Open AI Assistant</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect('nav', 'files')} className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/[0.05] rounded-lg">
            <File className="w-4 h-4 text-[var(--text-tertiary)]" />
            <span className="text-[13px]">Asset Library</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};

export default GlobalSearch;
