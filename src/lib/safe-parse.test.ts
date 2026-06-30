import { describe, it, expect } from 'vitest';
import {
  safeParseDate,
  safeFormatDate,
  safeParseJSON,
  safeAccess,
  safeNumberFormat,
  safeStringFormat,
  safeNormalizeContentPiece,
} from './safe-parse';

describe('safeParseDate', () => {
  it('should parse valid date strings', () => {
    const result = safeParseDate('2024-01-15');
    expect(result.getFullYear()).toBe(2024);
  });

  it('should return fallback for invalid dates', () => {
    const fallback = new Date('2020-01-01');
    const result = safeParseDate('not-a-date', fallback);
    expect(result).toBe(fallback);
  });

  it('should return fallback for null', () => {
    const result = safeParseDate(null);
    expect(result).toBeInstanceOf(Date);
  });
});

describe('safeFormatDate', () => {
  it('should format valid dates', () => {
    const formatter = (d: Date) => d.getFullYear().toString();
    expect(safeFormatDate('2024-01-15', formatter)).toBe('2024');
  });

  it('should return fallback for invalid dates', () => {
    const formatter = (d: Date) => d.getFullYear().toString();
    expect(safeFormatDate(null, formatter, 'N/A')).toBe('N/A');
  });
});

describe('safeParseJSON', () => {
  it('should parse valid JSON', () => {
    expect(safeParseJSON('{"a":1}', {})).toEqual({ a: 1 });
  });

  it('should return fallback for null/undefined', () => {
    expect(safeParseJSON(null, [])).toEqual([]);
    expect(safeParseJSON(undefined, [])).toEqual([]);
  });

  it('should return fallback for invalid JSON', () => {
    expect(safeParseJSON('invalid', {})).toEqual({});
  });
});

describe('safeAccess', () => {
  it('should access nested properties', () => {
    const obj = { a: { b: { c: 42 } } };
    expect(safeAccess(obj, 'a.b.c', 0)).toBe(42);
  });

  it('should return fallback for missing paths', () => {
    expect(safeAccess({}, 'a.b.c', 'default')).toBe('default');
  });
});

describe('safeNumberFormat', () => {
  it('should parse numbers', () => {
    expect(safeNumberFormat(42)).toBe(42);
    expect(safeNumberFormat('42')).toBe(42);
  });

  it('should return fallback for invalid values', () => {
    expect(safeNumberFormat(null)).toBe(0);
    expect(safeNumberFormat('not-a-number')).toBe(0);
  });
});

describe('safeStringFormat', () => {
  it('should convert to string', () => {
    expect(safeStringFormat(42)).toBe('42');
    expect(safeStringFormat('hello')).toBe('hello');
  });

  it('should return fallback for null/undefined', () => {
    expect(safeStringFormat(null)).toBe('');
    expect(safeStringFormat(undefined)).toBe('');
  });
});

describe('safeNormalizeContentPiece', () => {
  it('should normalize valid content', () => {
    const result = safeNormalizeContentPiece({
      id: '123',
      title: 'Test Video',
      description: 'A test',
      published_at: '2024-01-15',
      view_count: 1000,
    });

    expect(result.id).toBe('123');
    expect(result.title).toBe('Test Video');
    expect(result.view_count).toBe(1000);
  });

  it('should provide fallbacks for missing fields', () => {
    const result = safeNormalizeContentPiece({});
    expect(result.id).toBe('unknown');
    expect(result.title).toBe('Untitled');
    expect(result.view_count).toBe(0);
  });
});
