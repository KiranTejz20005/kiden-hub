import { describe, it, expect, vi } from 'vitest';
import { cn, debounce, throttle, retryWithBackoff, formatBytes, formatNumber, safeJsonParse, safeJsonStringify, deepClone, deepMerge, isEmpty } from './utils';

describe('cn', () => {
  it('should merge class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('should handle conditional classes', () => {
    expect(cn('base', false && 'hidden', 'visible')).toBe('base visible');
  });

  it('should handle tailwind merges', () => {
    expect(cn('px-4', 'px-2')).toBe('px-2');
  });
});

describe('debounce', () => {
  it('should debounce function calls', async () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced();
    debounced();
    debounced();

    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });
});

describe('throttle', () => {
  it('should throttle function calls', async () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const throttled = throttle(fn, 100);

    throttled();
    throttled();
    throttled();

    expect(fn).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(100);
    throttled();
    expect(fn).toHaveBeenCalledTimes(2);

    vi.useRealTimers();
  });
});

describe('retryWithBackoff', () => {
  it('should retry on failure and eventually succeed', async () => {
    let attempts = 0;
    const fn = vi.fn().mockImplementation(() => {
      attempts++;
      if (attempts < 3) return Promise.reject(new Error('fail'));
      return Promise.resolve('success');
    });

    const result = await retryWithBackoff(fn, { maxRetries: 3, initialDelay: 10 });
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should throw after max retries', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('always fail'));
    await expect(retryWithBackoff(fn, { maxRetries: 2, initialDelay: 10 })).rejects.toThrow('always fail');
    expect(fn).toHaveBeenCalledTimes(3);
  });
});

describe('formatBytes', () => {
  it('should format 0 bytes', () => {
    expect(formatBytes(0)).toBe('0 Bytes');
  });

  it('should format kilobytes', () => {
    expect(formatBytes(1024)).toBe('1 KB');
  });

  it('should format megabytes', () => {
    expect(formatBytes(1048576)).toBe('1 MB');
  });
});

describe('formatNumber', () => {
  it('should format number with commas', () => {
    expect(formatNumber(1000)).toBe('1,000');
  });

  it('should format large numbers', () => {
    expect(formatNumber(1000000)).toBe('1,000,000');
  });
});

describe('safeJsonParse', () => {
  it('should parse valid JSON', () => {
    expect(safeJsonParse('{"a":1}', {})).toEqual({ a: 1 });
  });

  it('should return fallback for invalid JSON', () => {
    expect(safeJsonParse('invalid', { fallback: true })).toEqual({ fallback: true });
  });
});

describe('safeJsonStringify', () => {
  it('should stringify valid objects', () => {
    expect(safeJsonStringify({ a: 1 })).toBe('{"a":1}');
  });

  it('should handle circular references', () => {
    const obj: Record<string, unknown> = { a: 1 };
    obj.self = obj;
    expect(safeJsonStringify(obj)).toBe('{}');
  });
});

describe('deepClone', () => {
  it('should deeply clone an object', () => {
    const obj = { a: 1, b: { c: 2 } };
    const clone = deepClone(obj);
    expect(clone).toEqual(obj);
    expect(clone).not.toBe(obj);
    expect(clone.b).not.toBe(obj.b);
  });

  it('should handle null', () => {
    expect(deepClone(null)).toBeNull();
  });

  it('should handle dates', () => {
    const date = new Date();
    const clone = deepClone(date);
    expect(clone).toEqual(date);
    expect(clone).not.toBe(date);
  });
});

describe('deepMerge', () => {
  it('should merge objects deeply', () => {
    const target: Record<string, any> = { a: 1, b: { c: 2 } };
    const source: Record<string, any> = { b: { d: 3 }, e: 4 };
    const result = deepMerge(target, source);
    expect(result).toEqual({ a: 1, b: { c: 2, d: 3 }, e: 4 });
  });

  it('should not mutate target', () => {
    const target: Record<string, any> = { a: 1 };
    const source: Record<string, any> = { b: 2 };
    const result = deepMerge(target, source);
    expect(target).toEqual({ a: 1 });
    expect(result).toEqual({ a: 1, b: 2 });
  });
});

describe('isEmpty', () => {
  it('should return true for null/undefined', () => {
    expect(isEmpty(null)).toBe(true);
    expect(isEmpty(undefined)).toBe(true);
  });

  it('should return true for empty arrays', () => {
    expect(isEmpty([])).toBe(true);
  });

  it('should return true for empty objects', () => {
    expect(isEmpty({})).toBe(true);
  });

  it('should return false for non-empty values', () => {
    expect(isEmpty([1])).toBe(false);
    expect(isEmpty({ a: 1 })).toBe(false);
  });
});
