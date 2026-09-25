/**
 * Kanban domain model.
 *
 * Everything here is pure: types, defaults and the normalisation used to read
 * the board back out of the `research_board_items` marker row. All persistence
 * lives in `@/hooks/useKanbanBoard` so there is exactly one place that talks to
 * Supabase for kanban data — nothing is stored in localStorage.
 */

export interface KanbanCard {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  tags: string[];
  assignee?: string;
  dueDate?: string;
}

/** A column/category. `id` is the stable key cards reference via `card.status`. */
export interface KanbanColumnDef {
  id: string;
  label: string;
  color: string;
  icon: string;
  wipLimit?: number;
}

export interface KanbanBoardData {
  columns: KanbanColumnDef[];
  cards: KanbanCard[];
}

export const CARD_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;
export type CardPriority = (typeof CARD_PRIORITIES)[number];

export const DEFAULT_KANBAN_COLUMNS: KanbanColumnDef[] = [
  { id: 'backlog', label: 'Backlog', color: 'text-muted-foreground', icon: '📋' },
  { id: 'todo', label: 'To Do', color: 'text-blue-400', icon: '📝', wipLimit: 5 },
  { id: 'in-progress', label: 'In Progress', color: 'text-amber-400', icon: '⚡', wipLimit: 3 },
  { id: 'review', label: 'Review', color: 'text-purple-400', icon: '🔍', wipLimit: 2 },
  { id: 'done', label: 'Done', color: 'text-emerald-400', icon: '✅' },
];

/** Rotation used when the user creates a new category. */
export const COLUMN_ACCENTS = [
  'text-blue-400',
  'text-amber-400',
  'text-purple-400',
  'text-emerald-400',
  'text-rose-400',
  'text-cyan-400',
  'text-fuchsia-400',
  'text-lime-400',
];

export const COLUMN_ICONS = ['📋', '📝', '⚡', '🔍', '✅', '🚀', '🧪', '🛠️'];

/** Title of the marker row that flags a board as a kanban board. */
export const KANBAN_MARKER_TITLE = 'Kanban Board';

export const PRIORITY_LABELS: Record<CardPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

/** `content` is jsonb, but older rows (and manual imports) may come back as text. */
export function parseContent(content: unknown): Record<string, unknown> {
  if (!content) return {};
  if (typeof content === 'string') {
    try {
      const parsed = JSON.parse(content);
      return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
    } catch {
      return {};
    }
  }
  return typeof content === 'object' ? (content as Record<string, unknown>) : {};
}

/** Rows written by the kanban template — never shown in the masonry grid. */
export function isKanbanMarkerContent(content: unknown): boolean {
  return parseContent(content).kanban === true;
}

function sanitizeColumn(raw: unknown): KanbanColumnDef | null {
  if (!raw || typeof raw !== 'object') return null;
  const c = raw as Record<string, unknown>;
  const id = typeof c.id === 'string' && c.id.trim() ? c.id.trim() : '';
  const label = typeof c.label === 'string' && c.label.trim() ? c.label.trim() : '';
  if (!id || !label) return null;

  return {
    id,
    label,
    color: typeof c.color === 'string' && c.color ? c.color : 'text-muted-foreground',
    icon: typeof c.icon === 'string' && c.icon ? c.icon : '📋',
    ...(typeof c.wipLimit === 'number' && c.wipLimit > 0 ? { wipLimit: c.wipLimit } : {}),
  };
}

function sanitizeCard(raw: unknown): KanbanCard | null {
  if (!raw || typeof raw !== 'object') return null;
  const c = raw as Record<string, unknown>;
  const title = typeof c.title === 'string' ? c.title.trim() : '';
  if (!title) return null;

  const priority = CARD_PRIORITIES.includes(c.priority as CardPriority)
    ? (c.priority as CardPriority)
    : 'medium';

  return {
    id: typeof c.id === 'string' && c.id ? c.id : newId(),
    title,
    description: typeof c.description === 'string' ? c.description : '',
    status: typeof c.status === 'string' && c.status ? c.status : '',
    priority,
    tags: Array.isArray(c.tags) ? c.tags.filter((t): t is string => typeof t === 'string') : [],
    ...(typeof c.assignee === 'string' ? { assignee: c.assignee } : {}),
    ...(typeof c.dueDate === 'string' ? { dueDate: c.dueDate } : {}),
  };
}

/**
 * Reads a board out of the marker row, falling back to the defaults for any
 * legacy row that predates stored columns. Cards whose column no longer exists
 * are re-homed to the first column so nothing can ever disappear from the UI.
 */
export function normalizeKanbanData(content: unknown): KanbanBoardData {
  const raw = parseContent(content);

  const columns =
    Array.isArray(raw.columns) && raw.columns.length > 0
      ? (raw.columns.map(sanitizeColumn).filter((c): c is KanbanColumnDef => c !== null))
      : DEFAULT_KANBAN_COLUMNS;

  const cards =
    Array.isArray(raw.cards)
      ? (raw.cards.map(sanitizeCard).filter((c): c is KanbanCard => c !== null))
      : [];

  if (columns.length === 0) {
    return { columns: DEFAULT_KANBAN_COLUMNS, cards };
  }

  const ids = new Set(columns.map(c => c.id));
  const firstId = columns[0].id;
  const repaired = cards.map(card => (ids.has(card.status) ? card : { ...card, status: firstId }));

  return { columns, cards: repaired };
}

/** Stable, collision-free column id derived from its label. */
export function slugifyColumnId(label: string, taken: Iterable<string> = []): string {
  const takenSet = new Set(taken);
  const base =
    label
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'column';

  if (!takenSet.has(base)) return base;

  let n = 2;
  while (takenSet.has(`${base}-${n}`)) n += 1;
  return `${base}-${n}`;
}

/** Collision-free id for a card (monotonic guard even if `randomUUID` misbehaves). */
let idSequence = 0;
export function newId(): string {
  idSequence += 1;
  const suffix = idSequence.toString(36);
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${crypto.randomUUID()}-${suffix}`;
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}-${suffix}`;
}

/** The payload persisted into the marker row. */
export function toMarkerContent(data: KanbanBoardData): Record<string, unknown> {
  return { kanban: true, columns: data.columns, cards: data.cards };
}
