import React, { createContext, useContext, useEffect, useRef } from 'react';

interface VisibilityContextType {
  isStale: boolean;
  lastActive: number;
}

const VisibilityContext = createContext<VisibilityContextType | undefined>(undefined);

const STALE_THRESHOLD = 5 * 60 * 1000; // 5 minutes

export const VisibilityManager: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const lastActiveRef = useRef<number>(Date.now());
  const [isStale, setIsStale] = React.useState(false);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        lastActiveRef.current = Date.now();
      } else {
        const now = Date.now();
        const awayDuration = now - lastActiveRef.current;
        
        if (awayDuration > STALE_THRESHOLD) {
          console.log(`[VisibilityManager] Tab was away for ${Math.round(awayDuration / 1000)}s. Marking data as stale.`);
          setIsStale(true);
          // Emit a controlled event for components that need manual refreshing
          window.dispatchEvent(new CustomEvent('app-data-stale', { detail: { awayDuration } }));
        } else {
          setIsStale(false);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => { document.removeEventListener('visibilitychange', handleVisibilityChange); };
  }, []);

  return (
    <VisibilityContext.Provider value={{ isStale, lastActive: lastActiveRef.current }}>
      {children}
    </VisibilityContext.Provider>
  );
};

export const useVisibility = () => {
  const context = useContext(VisibilityContext);
  if (!context) {throw new Error('useVisibility must be used within a VisibilityManager');}
  return context;
};
