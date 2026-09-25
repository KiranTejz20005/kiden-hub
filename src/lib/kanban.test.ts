import { describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_KANBAN_COLUMNS,
  isKanbanMarkerContent,
  newId,
  normalizeKanbanData,
  parseContent,
  slugifyColumnId,
  toMarkerContent,
} from './kanban';

describe('parseContent', () => {
  it('returns an empty object for empty input', () => {
    expect(parseContent(undefined)).toEqual({});
    expect(parseContent(null)).toEqual({});
    expect(parseContent('')).toEqual({});
  });

  it('parses a jsonb row that came back as a string', () => {
    expect(parseContent('{"kanban":true,"cards":[]}')).toEqual({ kanban: true, cards: [] });
  });

  it('tolerates malformed json', () => {
    expect(parseContent('{not json')).toEqual({});
    expect(parseContent(42)).toEqual({});
  });

  it('passes objects through untouched', () => {
    const value = { kanban: true };
    expect(parseContent(value)).toBe(value);
  });
});

describe('isKanbanMarkerContent', () => {
  it('detects the marker row', () => {
    expect(isKanbanMarkerContent({ kanban: true, cards: [] })).toBe(true);
    expect(isKanbanMarkerContent('{"kanban":true}')).toBe(true);
  });

  it('ignores ordinary board items', () => {
    expect(isKanbanMarkerContent({ type: 'note', content: [] })).toBe(false);
    expect(isKanbanMarkerContent(undefined)).toBe(false);
    expect(isKanbanMarkerContent({ kanban: 'yes' })).toBe(false);
  });
});

describe('normalizeKanbanData', () => {
  it('falls back to the default categories for a legacy row', () => {
    const result = normalizeKanbanData({ kanban: true, cards: [] });
    expect(result.columns).toEqual(DEFAULT_KANBAN_COLUMNS);
    expect(result.cards).toEqual([]);
  });

  it('returns defaults when content is empty', () => {
    expect(normalizeKanbanData(undefined).columns).toEqual(DEFAULT_KANBAN_COLUMNS);
  });

  it('keeps stored categories', () => {
    const result = normalizeKanbanData({
      kanban: true,
      columns: [{ id: 'icebox', label: 'Icebox', color: 'text-blue-400', icon: '🧊' }],
      cards: [],
    });
    expect(result.columns).toHaveLength(1);
    expect(result.columns[0].id).toBe('icebox');
  });

  it('drops malformed categories instead of crashing', () => {
    const result = normalizeKanbanData({
      kanban: true,
      columns: [
        { id: 'ok', label: 'OK' },
        { id: '', label: 'no id' },
        'nonsense',
        null,
      ],
      cards: [],
    });
    expect(result.columns.map(c => c.id)).toEqual(['ok']);
  });

  it('falls back to the default categories when every stored one is invalid', () => {
    const result = normalizeKanbanData({ kanban: true, columns: ['junk'], cards: [] });
    expect(result.columns).toEqual(DEFAULT_KANBAN_COLUMNS);
  });

  it('re-homes cards whose category was deleted', () => {
    const result = normalizeKanbanData({
      kanban: true,
      columns: [{ id: 'kept', label: 'Kept' }],
      cards: [{ id: 'c1', title: 'Orphan', status: 'removed-category' }],
    });
    expect(result.cards[0].status).toBe('kept');
  });

  it('drops cards without a title and fills in defaults', () => {
    const result = normalizeKanbanData({
      kanban: true,
      columns: [{ id: 'a', label: 'A' }],
      cards: [{ title: '   ' }, { title: 'Survives' }],
    });
    expect(result.cards).toHaveLength(1);
    expect(result.cards[0].title).toBe('Survives');
    expect(result.cards[0].priority).toBe('medium');
    expect(result.cards[0].tags).toEqual([]);
  });

  it('normalises an unknown priority and non-array tags', () => {
    const result = normalizeKanbanData({
      kanban: true,
      columns: [{ id: 'a', label: 'A' }],
      cards: [{ id: 'c1', title: 'T', priority: 'extreme', tags: ['ok', 3] }],
    });
    expect(result.cards[0].priority).toBe('medium');
    expect(result.cards[0].tags).toEqual(['ok']);
  });

  it('round-trips through toMarkerContent', () => {
    const source = { columns: DEFAULT_KANBAN_COLUMNS, cards: [] };
    const roundTripped = normalizeKanbanData(toMarkerContent(source));
    expect(roundTripped.columns).toEqual(DEFAULT_KANBAN_COLUMNS);
    expect(toMarkerContent(source)).toMatchObject({ kanban: true });
  });
});

describe('slugifyColumnId', () => {
  it('slugifies a label', () => {
    expect(slugifyColumnId('In Progress')).toBe('in-progress');
    expect(slugifyColumnId('  Done!!  ')).toBe('done');
  });

  it('never returns an empty id', () => {
    expect(slugifyColumnId('!!!')).toBe('column');
    expect(slugifyColumnId('')).toBe('column');
  });

  it('avoids collisions with existing ids', () => {
    expect(slugifyColumnId('To Do', ['to-do'])).toBe('to-do-2');
    expect(slugifyColumnId('To Do', ['to-do', 'to-do-2'])).toBe('to-do-3');
  });
});

describe('newId', () => {
  it('produces distinct ids', () => {
    const seen = new Set(Array.from({ length: 25 }, () => newId()));
    expect(seen.size).toBe(25);
  });
});

describe('DEFAULT_KANBAN_COLUMNS', () => {
  it('has unique ids and labels', () => {
    const ids = DEFAULT_KANBAN_COLUMNS.map(c => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    const labels = DEFAULT_KANBAN_COLUMNS.map(c => c.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it('is not mutated by normalisation', () => {
    const before = JSON.stringify(DEFAULT_KANBAN_COLUMNS);
    normalizeKanbanData({ kanban: true, cards: [{ id: 'x', title: 'T', status: 'ghost' }] });
    expect(JSON.stringify(DEFAULT_KANBAN_COLUMNS)).toBe(before);
  });
});

describe('slugify under a mocked uuid', () => {
  it('does not depend on crypto', () => {
    const spy = vi.spyOn(Math, 'random').mockReturnValue(0.5);
    expect(slugifyColumnId('Review')).toBe('review');
    spy.mockRestore();
  });
});
