import { createContext, useContext } from 'react';

export type AppTheme = 'light' | 'dark';

export type ThemeContextValue = Readonly<{
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  toggleTheme: () => void;
}>;

export const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  setTheme: () => {},
  toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);
