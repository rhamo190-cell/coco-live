import { createContext, useContext, ReactNode } from 'react';
import colors from '@/constants/colors';

interface ThemeContextValue {
  colors: typeof colors.dark;
  radius: number;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const value = {
    colors: colors.dark,
    radius: colors.radius,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
