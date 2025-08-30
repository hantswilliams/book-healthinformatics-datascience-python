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
  const theme: ThemeName = 'dark'; // Force dark mode for testing
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      // Always apply dark theme
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add('dark');
      
      // Apply CSS custom properties for dark theme
      const themeConfig = themes.dark;
      const customProperties = generateCSSCustomProperties(themeConfig);
      
      // Set CSS custom properties on document root
      Object.entries(customProperties).forEach(([property, value]) => {
        document.documentElement.style.setProperty(property, value);
      });
    }
  }, [mounted]);

  // Disable theme toggling for now
  const toggleTheme = () => {
    // No-op for testing purposes
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      toggleTheme, 
      themeConfig: themes.dark
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
      theme: 'dark' as ThemeName,
      toggleTheme: () => {},
      themeConfig: themes.dark
    };
  }
  return context;
}