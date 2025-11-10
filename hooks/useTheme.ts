import { useState, useEffect, useCallback } from 'react';

export type Theme = 'light' | 'dark' | 'system';

const themes: Theme[] = ['light', 'dark', 'system'];

const getInitialTheme = (): Theme => {
  if (typeof window === 'undefined') {
    return 'system'; // Default for SSR
  }
  const storedTheme = localStorage.getItem('theme');
  if (storedTheme === 'light' || storedTheme === 'dark' || storedTheme === 'system') {
    return storedTheme;
  }
  return 'system'; // Default to system if nothing is stored
};

const applyTheme = (theme: Theme) => {
    const root = document.documentElement;
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    if (isDark) {
        root.classList.add('dark');
    } else {
        root.classList.remove('dark');
    }
};

export const useTheme = (): [Theme, () => void] => {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem('theme', theme);
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
        if (localStorage.getItem('theme') === 'system') {
            applyTheme('system');
        }
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [theme]);

  const cycleTheme = useCallback(() => {
    setTheme(prevTheme => {
        const currentIndex = themes.indexOf(prevTheme);
        const nextIndex = (currentIndex + 1) % themes.length;
        return themes[nextIndex];
    });
  }, []);

  return [theme, cycleTheme];
};