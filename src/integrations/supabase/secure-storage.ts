/**
 * Custom storage adapter for Supabase that prioritizes security
 * Attempts to use sessionStorage first, falls back to a memory-based storage
 * to avoid exposing sensitive tokens to XSS attacks via localStorage
 */

export class SecureStorageAdapter implements Storage {
  private memoryStorage: Record<string, string> = {};
  private useSessionStorage: boolean;

  constructor() {
    // Try to use sessionStorage if available (cleared when tab closes)
    // Fall back to memory-only if sessionStorage is unavailable
    try {
      const test = '__storage_test__';
      sessionStorage.setItem(test, test);
      sessionStorage.removeItem(test);
      this.useSessionStorage = true;
    } catch {
      console.warn('[SecureStorage] sessionStorage unavailable, using memory-only storage. Tokens will be lost on page reload.');
      this.useSessionStorage = false;
    }
  }

  get length(): number {
    if (this.useSessionStorage) {
      return sessionStorage.length;
    }
    return Object.keys(this.memoryStorage).length;
  }

  clear(): void {
    if (this.useSessionStorage) {
      sessionStorage.clear();
    } else {
      this.memoryStorage = {};
    }
  }

  getItem(key: string): string | null {
    if (this.useSessionStorage) {
      return sessionStorage.getItem(key);
    }
    return this.memoryStorage[key] ?? null;
  }

  key(index: number): string | null {
    if (this.useSessionStorage) {
      return sessionStorage.key(index);
    }
    const keys = Object.keys(this.memoryStorage);
    return keys[index] ?? null;
  }

  removeItem(key: string): void {
    if (this.useSessionStorage) {
      sessionStorage.removeItem(key);
    } else {
      delete this.memoryStorage[key];
    }
  }

  setItem(key: string, value: string): void {
    if (this.useSessionStorage) {
      sessionStorage.setItem(key, value);
    } else {
      this.memoryStorage[key] = value;
    }
  }
}

// Export singleton instance
export const secureStorage = new SecureStorageAdapter();
