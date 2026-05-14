import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type ThemeType = 'emerald' | 'sapphire' | 'amethyst' | 'ruby' | 'amber' | 'midnight';

export type ModeType = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  mode: ModeType;
  setMode: (mode: ModeType) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setThemeState] = useState<ThemeType>('emerald');
  const [mode, setModeState] = useState<ModeType>('dark');
  const { user } = useAuth();

  // Load theme from localStorage and then from Supabase profile
   useEffect(() => {
    const savedTheme = localStorage.getItem('kiden-hub-theme') as ThemeType;
    const savedMode = localStorage.getItem('kiden-hub-mode') as ModeType;
    
    if (savedTheme) {
      setThemeState(savedTheme);
      applyTheme(savedTheme, savedMode || 'dark');
    }
    
    if (savedMode) {
      setModeState(savedMode);
    }

    if (user) {
      const fetchProfileSettings = async () => {
        const { data } = await supabase
          .from('profiles')
          .select('theme, notification_settings')
          .eq('user_id', user.id)
          .maybeSingle();
        
        // Use notification_settings.mode as a fallback if we don't have a dedicated mode column yet
        const profileMode = (data as any)?.notification_settings?.mode as ModeType;

        if (data?.theme) {
          setThemeState(data.theme as ThemeType);
          applyTheme(data.theme as ThemeType, profileMode || savedMode || 'dark');
        }
        if (profileMode) {
          setModeState(profileMode);
        }
      };
      fetchProfileSettings();
    }
  }, [user]);

  const applyTheme = (t: ThemeType, m: ModeType) => {
    const root = window.document.documentElement;
    
    // Handle Mode (Dark/Light)
    root.classList.remove('light', 'dark');
    if (m === 'system') {
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.add(systemDark ? 'dark' : 'light');
    } else {
      root.classList.add(m);
    }

    // Handle Accents
    root.classList.remove('theme-sapphire', 'theme-amethyst', 'theme-ruby', 'theme-amber', 'theme-midnight');
    if (t !== 'emerald') {
      root.classList.add(`theme-${t}`);
    }
  };

  const setTheme = async (t: ThemeType) => {
    setThemeState(t);
    applyTheme(t, mode);
    localStorage.setItem('kiden-hub-theme', t);

    if (user) {
      await supabase
        .from('profiles')
        .update({ theme: t })
        .eq('user_id', user.id);
    }
  };

  const setMode = async (m: ModeType) => {
    setModeState(m);
    applyTheme(theme, m);
    localStorage.setItem('kiden-hub-mode', m);

    if (user) {
      // Store in notification_settings as a temporary persistent store if 'mode' column doesn't exist
      const { data: profile } = await supabase.from('profiles').select('notification_settings').eq('user_id', user.id).single();
      const settings = { ...(profile?.notification_settings || {}), mode: m };
      await supabase
        .from('profiles')
        .update({ notification_settings: settings })
        .eq('user_id', user.id);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, mode, setMode }}>
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
