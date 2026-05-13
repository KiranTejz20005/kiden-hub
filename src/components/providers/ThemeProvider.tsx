import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type ThemeType = 'emerald' | 'sapphire' | 'amethyst' | 'ruby' | 'amber' | 'midnight';

interface ThemeContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setThemeState] = useState<ThemeType>('emerald');
  const { user } = useAuth();

  // Load theme from localStorage and then from Supabase profile
  useEffect(() => {
    const savedTheme = localStorage.getItem('kiden-hub-theme') as ThemeType;
    if (savedTheme) {
      setThemeState(savedTheme);
      applyTheme(savedTheme);
    }

    if (user) {
      const fetchProfileTheme = async () => {
        const { data } = await supabase
          .from('profiles')
          .select('theme')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (data?.theme) {
          setThemeState(data.theme as ThemeType);
          applyTheme(data.theme as ThemeType);
        }
      };
      fetchProfileTheme();
    }
  }, [user]);

  const applyTheme = (t: ThemeType) => {
    const root = window.document.documentElement;
    // Remove all existing theme classes
    root.classList.remove('theme-sapphire', 'theme-amethyst', 'theme-ruby', 'theme-amber', 'theme-midnight');
    
    // Add new theme class if not default emerald
    if (t !== 'emerald') {
      root.classList.add(`theme-${t}`);
    }
  };

  const setTheme = async (t: ThemeType) => {
    setThemeState(t);
    applyTheme(t);
    localStorage.setItem('kiden-hub-theme', t);

    if (user) {
      await supabase
        .from('profiles')
        .update({ theme: t })
        .eq('user_id', user.id);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
