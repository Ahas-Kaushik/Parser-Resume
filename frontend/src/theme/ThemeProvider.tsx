import { createContext, useContext, useEffect, useMemo, useState } from 'react';

type ThemeKey = 'classic' | 'minimal';
interface ThemeContextValue {
  theme: ThemeKey;
  setTheme: (t: ThemeKey) => void;
  toggleTheme: () => void;
}
const ThemeContext = createContext<ThemeContextValue>({ theme: 'classic', setTheme: () => {}, toggleTheme: () => {} });
export function useTheme() { return useContext(ThemeContext); }

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeKey>('classic');

  useEffect(() => {
    const saved = localStorage.getItem('app-theme') as ThemeKey | null;
    setThemeState(saved === 'minimal' || saved === 'classic' ? saved : 'classic');
  }, []);

  useEffect(() => {
    localStorage.setItem('app-theme', theme);
    const root = document.documentElement;
    if (theme === 'minimal') {
      root.setAttribute('data-theme', 'minimal');
      root.classList.remove('classic-gradient');
    } else {
      root.removeAttribute('data-theme');
      root.classList.add('classic-gradient');
    }
    document.body.style.backgroundColor = 'var(--color-bg)';
  }, [theme]);
  
  const value = useMemo(() => ({
    theme,
    setTheme: (t: ThemeKey) => setThemeState(t),
    toggleTheme: () => setThemeState(t => (t === 'classic' ? 'minimal' : 'classic')),
  }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}