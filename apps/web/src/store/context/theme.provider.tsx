import { type ReactNode, useCallback, useMemo, useState } from 'react';
import { type AppTheme, ThemeContext } from './theme.context';

const STORAGE_KEY = 'tanchi-theme';
const DEFAULT_THEME: AppTheme = 'dark';

const readStoredTheme = (): AppTheme => {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === 'dark' || stored === 'light' ? stored : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
};

const persistTheme = (theme: AppTheme): void => {
  try {
    window.localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    return;
  }
};

const ThemeProvider = ({ children }: Readonly<{ children: ReactNode }>) => {
  const [theme, setThemeState] = useState<AppTheme>(readStoredTheme);

  const setTheme = useCallback((next: AppTheme) => {
    setThemeState(next);
    persistTheme(next);
  }, []);

  const toggleTheme = useCallback(
    () => setTheme(theme === 'dark' ? 'light' : 'dark'),
    [theme, setTheme],
  );

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme }),
    [theme, setTheme, toggleTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export default ThemeProvider;
