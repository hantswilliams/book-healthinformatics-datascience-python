'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { themes, type ThemeName, generateCSSCustomProperties } from './theme-config';

interface ThemeContextType {
  theme: ThemeName;
  toggleTheme: () => void;
  themeConfig: typeof themes[ThemeName];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeName>('light'); // Force light mode
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Force light mode - ignore saved preferences
    setTheme('light');
    localStorage.setItem('theme', 'light');
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('theme', theme);
      
      // Apply theme classes to body only if not already applied
      if (!document.body.classList.contains(theme)) {
        document.body.classList.remove('light', 'dark');
        document.body.classList.add(theme);
      }
      
      // Apply CSS custom properties
      const themeConfig = themes[theme];
      const customProperties = generateCSSCustomProperties(themeConfig);
      
      // Set CSS custom properties on document root
      Object.entries(customProperties).forEach(([property, value]) => {
        document.documentElement.style.setProperty(property, value);
      });
    }
  }, [theme, mounted]);

  const toggleTheme = () => {
    // Force light mode - disable toggle
    setTheme('light');
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      toggleTheme, 
      themeConfig: themes[theme]
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    // Return a default context during SSR or when outside provider
    return {
      theme: 'light' as ThemeName,
      toggleTheme: () => {},
      themeConfig: themes.light
    };
  }
  return context;
}