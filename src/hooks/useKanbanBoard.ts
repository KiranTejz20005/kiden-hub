import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import {
  DEFAULT_KANBAN_COLUMNS,
  KANBAN_MARKER_TITLE,
  isKanbanMarkerContent,
  normalizeKanbanData,
  toMarkerContent,
  type KanbanBoardData,
  type KanbanCard,
  type KanbanColumnDef,
} from '@/lib/kanban';

/**
 * Single source of truth for kanban persistence.
 *
 * A kanban board is a normal `research_boards` row plus one marker row in
 * `research_board_items` whose jsonb `content` holds `{ kanban, columns, cards }`.
 * Everything lives in Postgres — this module never touches localStorage.
 */

export interface KanbanBoardRef {
  id: string;
  title: string;
  emoji: string;
}

type MarkerRow = { id: string; board_id: string };

const SAVE_DEBOUNCE_MS = 600;

/* ── Low-level row helpers ─────────────────────────────────────────────── */

export async function findMarkerRow(boardId: string): Promise<MarkerRow | null> {
  const { data, error } = await supabase
    .from('research_board_items')
    .select('id, board_id, content')
    .eq('board_id', boardId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  const row = ((data ?? []) as unknown as Array<{ id: string; board_id: string; content: unknown }>)
    .find(r => isKanbanMarkerContent(r.content));
  return row ? { id: row.id, board_id: row.board_id } : null;
}

/** Creates the marker row for a board that has none yet. */
export async function createMarkerRow(
  boardId: string,
  userId: string,
  data: KanbanBoardData = { columns: DEFAULT_KANBAN_COLUMNS, cards: [] },
): Promise<MarkerRow> {
  const { data: row, error } = await supabase
    .from('research_board_items')
    .insert([
      {
        board_id: boardId,
        user_id: userId,
        type: 'note',
        title: KANBAN_MARKER_TITLE,
        // `content` is jsonb at runtime; the generated types still say `string`.
        content: toMarkerContent(data) as unknown as string,
      },
    ])
    .select('id, board_id')
    .single();

  if (error) throw error;
  return row as unknown as MarkerRow;
}

/** Writes `{ columns, cards }` into the marker row. Throws on failure. */
export async function saveKanban(markerId: string, data: KanbanBoardData): Promise<void> {
  const { error } = await supabase
    .from('research_board_items')
    .update({
      content: toMarkerContent(data) as unknown as string,
      updated_at: new Date().toISOString(),
    })
    .eq('id', markerId);

  if (error) throw error;
}

/* ── Board discovery / provisioning ────────────────────────────────────── */

/** In-flight provisioning is shared so a double mount cannot create two boards. */
const provisionCache = new Map<string, Promise<KanbanBoardRef & { markerId: string }>>();

/**
 * Returns the user's kanban board, creating it (and its marker row) on first
 * use. Reuses an existing kanban board whenever one exists.
 */
export function findOrCreateKanbanBoard(userId: string) {
  const cached = provisionCache.get(userId);
  if (cached) return cached;

  const promise = (async (): Promise<KanbanBoardRef & { markerId: string }> => {
    // 1. Locate an existing marker row — try the jsonb operator first, then fall
    //    back to a client-side scan if the column is not jsonb on this database.
    let marker: { id: string; board_id: string } | null = null;

    const { data: indexed, error: indexError } = await supabase
      .from('research_board_items')
      .select('id, board_id, content')
      .eq('user_id', userId)
      .contains('content', JSON.stringify({ kanban: true }))
      .limit(1);

    if (!indexError && indexed && indexed.length > 0) {
      const row = indexed[0] as unknown as { id: string; board_id: string; content: unknown };
      if (isKanbanMarkerContent(row.content)) {
        marker = { id: row.id, board_id: row.board_id };
      }
    } else {
      const { data: all, error: scanError } = await supabase
        .from('research_board_items')
        .select('id, board_id, content')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (scanError) throw scanError;
      const row = ((all ?? []) as unknown as Array<{ id: string; board_id: string; content: unknown }>)
        .find(r => isKanbanMarkerContent(r.content));
      if (row) marker = { id: row.id, board_id: row.board_id };
    }

    if (marker) {
      const { data: board } = await supabase
        .from('research_boards' as any)
        .select('*')
        .eq('id', marker.board_id)
        .maybeSingle();

      if (board) {
        const b = board as unknown as { id: string; title: string; emoji: string };
        return { id: b.id, title: b.title, emoji: b.emoji, markerId: marker.id };
      }

      // The board was deleted but the marker row survived — clean it up and
      // provision a fresh board rather than failing to load forever.
      await supabase.from('research_board_items').delete().eq('id', marker.id);
    }

    // 2. Nothing found — provision a board + marker in one go.
    const { data: created, error: createError } = await supabase
      .from('research_boards' as any)
      .insert([{ user_id: userId, title: KANBAN_MARKER_TITLE, emoji: '🗂️' }])
      .select('id, title, emoji')
      .single();

    if (createError) throw createError;

    const board = created as unknown as { id: string; title: string; emoji: string };
    const createdMarker = await createMarkerRow(board.id, userId);

    return { id: board.id, title: board.title, emoji: board.emoji, markerId: createdMarker.id };
  })().catch(err => {
    // Failed provisioning must not be memoised — the next mount retries.
    provisionCache.delete(userId);
    throw err;
  });

  provisionCache.set(userId, promise);
  return promise;
}

/** Drops the memoised board (used after a board is deleted). */
export function forgetKanbanBoard(userId?: string | null) {
  if (userId) provisionCache.delete(userId);
  else provisionCache.clear();
}

/* ── React controller ──────────────────────────────────────────────────── */

export interface UseKanbanBoardOptions {
  /** Load this board instead of finding/creating the default kanban board. */
  boardId?: string | null;
  /** Look the board up (creating it if needed) on mount. Defaults to true. */
  autoProvision?: boolean;
  /** Called after a board was provisioned so the caller can refresh its list. */
  onBoardReady?: (board: KanbanBoardRef) => void;
}

export interface UseKanbanBoardResult {
  ready: boolean;
  saving: boolean;
  error: string | null;
  board: KanbanBoardRef | null;
  columns: KanbanColumnDef[];
  cards: KanbanCard[];
  /** Merge a change into the board and schedule a debounced write to Postgres. */
  update: (patch: Partial<KanbanBoardData>) => void;
  /** Re-read from Postgres, discarding any pending local write. */
  refresh: () => Promise<void>;
}

export function useKanbanBoard(options: UseKanbanBoardOptions = {}): UseKanbanBoardResult {
  const { boardId = null, autoProvision = true, onBoardReady } = options;
  const { user } = useAuth();

  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [board, setBoard] = useState<KanbanBoardRef | null>(null);
  const [data, setData] = useState<KanbanBoardData>({
    columns: DEFAULT_KANBAN_COLUMNS,
    cards: [],
  });

  const markerIdRef = useRef<string | null>(null);
  const dataRef = useRef<KanbanBoardData>(data);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const onBoardReadyRef = useRef(onBoardReady);
  onBoardReadyRef.current = onBoardReady;

  dataRef.current = data;

  const flush = useCallback(async () => {
    const markerId = markerIdRef.current;
    if (!markerId) return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    setSaving(true);
    try {
      await saveKanban(markerId, dataRef.current);
      setError(null);
    } catch (err) {
      console.error('[kanban] Failed to save:', err);
      const message = err instanceof Error ? err.message : 'Failed to save board';
      setError(message);
      toast.error('Failed to save board changes');
    } finally {
      if (mountedRef.current) setSaving(false);
    }
  }, []);

  const update = useCallback(
    (patch: Partial<KanbanBoardData>) => {
      const next: KanbanBoardData = {
        columns: patch.columns ?? dataRef.current.columns,
        cards: patch.cards ?? dataRef.current.cards,
      };
      dataRef.current = next;
      setData(next);

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => { void flush(); }, SAVE_DEBOUNCE_MS);
    },
    [flush],
  );

  const load = useCallback(async () => {
    if (!user) {
      setReady(true);
      return;
    }

    setReady(false);
    setError(null);

    try {
      let resolvedBoardId = boardId;
      let markerId: string | null = null;
      let resolvedBoard: KanbanBoardRef | null = null;

      if (autoProvision) {
        const found = await findOrCreateKanbanBoard(user.id);
        markerId = found.markerId;
        resolvedBoard = { id: found.id, title: found.title, emoji: found.emoji };
        resolvedBoardId = found.id;
        onBoardReadyRef.current?.(resolvedBoard);
      } else if (resolvedBoardId) {
        const { data: row, error: boardError } = await supabase
          .from('research_boards' as any)
          .select('*')
          .eq('id', resolvedBoardId)
          .single();
        if (boardError) throw boardError;
        const b = row as unknown as { id: string; title: string; emoji: string };
        resolvedBoard = { id: b.id, title: b.title, emoji: b.emoji };
        markerId = await ensureMarker(resolvedBoardId, user.id);
      }

      markerIdRef.current = markerId;

      if (markerId) {
        const { data: row, error: markerError } = await supabase
          .from('research_board_items')
          .select('content')
          .eq('id', markerId)
          .single();

        if (markerError) throw markerError;
        const loaded = normalizeKanbanData((row as unknown as { content: unknown }).content);
        dataRef.current = loaded;
        setData(loaded);
      }

      setBoard(resolvedBoard);
    } catch (err) {
      console.error('[kanban] Failed to load board:', err);
      const message = err instanceof Error ? err.message : 'Failed to load board';
      setError(message);
      toast.error('Failed to load kanban board');
    } finally {
      if (mountedRef.current) setReady(true);
    }
  }, [user, boardId, autoProvision]);

  async function ensureMarker(targetBoardId: string, userId: string): Promise<string> {
    const existing = await findMarkerRow(targetBoardId);
    if (existing) return existing.id;
    const created = await createMarkerRow(targetBoardId, userId);
    return created.id;
  }

  useEffect(() => {
    mountedRef.current = true;
    void load();
    return () => {
      mountedRef.current = false;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      // Never lose the last keystroke when the view unmounts.
      void flush();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load]);

  return {
    ready,
    saving,
    error,
    board,
    columns: data.columns,
    cards: data.cards,
    update,
    refresh: load,
  };
}
