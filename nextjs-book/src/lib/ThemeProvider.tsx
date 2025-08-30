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
  const [theme, setTheme] = useState<ThemeName>('dark'); // Default to dark since landing page is dark
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check for saved theme preference or default to system preference
    const savedTheme = localStorage.getItem('theme') as ThemeName;
    if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
      setTheme(savedTheme);
    } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
      setTheme('light');
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('theme', theme);
      
      // Apply theme classes to document root
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(theme);
      
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
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
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
      theme: 'dark' as ThemeName,
      toggleTheme: () => {},
      themeConfig: themes.dark
    };
  }
  return context;
}