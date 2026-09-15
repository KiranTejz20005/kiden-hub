import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface CacheContextType {
  get: <T>(key: string) => T | null;
  set: <T>(key: string, data: T, ttl?: number) => void;
  invalidate: (key: string) => void;
}

const CacheContext = createContext<CacheContextType | undefined>(undefined);

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

export const CacheProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cache, setCache] = useState<Record<string, CacheEntry<any>>>(() => {
    // Restore from sessionStorage on startup (Layer 4)
    const saved = sessionStorage.getItem('app-cache');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const now = Date.now();
        // Filter out expired entries
        return Object.fromEntries(
          Object.entries(parsed).filter(([_, entry]: [any, any]) => 
            now - entry.timestamp < entry.ttl
          )
        ) as Record<string, CacheEntry<any>>;
      } catch (e) {
        return {};
      }
    }
    return {};
  });

  const cacheRef = React.useRef<Record<string, CacheEntry<any>>>(cache);
  useEffect(() => {
    cacheRef.current = cache;
  }, [cache]);

  // Persist to sessionStorage whenever cache changes
  useEffect(() => {
    sessionStorage.setItem('app-cache', JSON.stringify(cache));
  }, [cache]);

  const get = useCallback(<T,>(key: string): T | null => {
    const entry = cacheRef.current[key];
    if (!entry) {return null;}
    
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      return null; // Expired
    }
    return entry.data as T;
  }, []);

  const set = useCallback(<T,>(key: string, data: T, ttl = DEFAULT_TTL) => {
    setCache(prev => {
      const updated = {
        ...prev,
        [key]: { data, timestamp: Date.now(), ttl },
      };
      cacheRef.current = updated;
      return updated;
    });
  }, []);

  const invalidate = useCallback((key: string) => {
    setCache(prev => {
      const newCache = { ...prev };
      delete newCache[key];
      // Also handle prefix invalidation if needed
      Object.keys(newCache).forEach(k => {
        if (k.startsWith(`${key}:`)) {delete newCache[k];}
      });
      cacheRef.current = newCache;
      return newCache;
    });
  }, []);

  const contextValue = React.useMemo(() => ({ get, set, invalidate }), [get, set, invalidate]);

  return (
    <CacheContext.Provider value={contextValue}>
      {children}
    </CacheContext.Provider>
  );
};

export const useAppCache = () => {
  const context = useContext(CacheContext);
  if (!context) {throw new Error('useAppCache must be used within a CacheProvider');}
  return context;
};
