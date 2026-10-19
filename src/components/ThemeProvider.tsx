'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { playHapticSound } from '@/lib/sound';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('tgt_theme') as Theme | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    playHapticSound('toggle');
    const nextTheme = theme === 'dark' ? 'light' : 'dark';

    const updateDomTheme = () => {
      setTheme(nextTheme);
      localStorage.setItem('tgt_theme', nextTheme);
      document.documentElement.setAttribute('data-theme', nextTheme);
    };

    if (typeof document !== 'undefined' && 'startViewTransition' in document) {
      (document as unknown as { startViewTransition: (cb: () => void) => void }).startViewTransition(updateDomTheme);
    } else {
      updateDomTheme();
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <div style={{ visibility: mounted ? 'visible' : 'hidden' }}>{children}</div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
