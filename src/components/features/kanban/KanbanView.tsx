import { useCallback } from 'react';
import { RefreshCw, Loader2, AlertTriangle } from 'lucide-react';
import { KanbanBoard } from '@/components/features/kanban/KanbanBoard';
import { useKanbanBoard } from '@/hooks/useKanbanBoard';

/**
 * The standalone "Kanban Board" view.
 *
 * Backed entirely by Supabase: it finds (or provisions) the user's kanban board
 * and reads/writes the `{ kanban, columns, cards }` marker row. No localStorage.
 */
const KanbanView = ({ onBoardsChange }: { onBoardsChange?: () => void }) => {
  const boardsChangeRef = useCallback(() => { onBoardsChange?.(); }, [onBoardsChange]);

  const {
    ready,
    saving,
    error,
    board,
    columns,
    cards,
    update,
    refresh,
  } = useKanbanBoard({
    autoProvision: true,
    onBoardReady: boardsChangeRef,
  });

  if (!ready) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4 bg-[#181818]">
        <Loader2 className="w-6 h-6 text-white/30 animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">
          Loading board
        </p>
      </div>
    );
  }

  if (error && !board) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4 bg-[#181818] px-6 text-center">
        <AlertTriangle className="w-6 h-6 text-red-400/70" />
        <p className="text-sm text-white/60 max-w-sm">{error}</p>
        <button
          type="button"
          onClick={() => { void refresh(); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Try again
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col min-h-0 p-4 gap-2">
      {error && board && (
        <div className="flex items-center justify-between gap-3 px-4 py-2 rounded-xl border border-red-500/30 bg-red-500/10 shrink-0">
          <span className="text-[11px] font-bold text-red-300">{error}</span>
          <button
            type="button"
            onClick={() => { void refresh(); }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <RefreshCw className="w-3 h-3" /> Reload
          </button>
        </div>
      )}

      <div className="flex-1 min-h-0 flex flex-col w-full">
        <KanbanBoard
          columns={columns}
          cards={cards}
          onBoardChange={(next) => update({ columns: next.columns, cards: next.cards })}
          title={board?.title ?? 'Kanban Board'}
          saving={saving}
        />
      </div>
    </div>
  );
};

export default KanbanView;
