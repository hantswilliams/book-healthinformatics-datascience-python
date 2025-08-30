/**
 * Theme utility functions and hooks
 * 
 * Provides helper functions for easier theme usage in components
 */

import { useTheme } from './ThemeProvider';
import { themeClasses, type ThemeConfig } from './theme-config';

// Hook to get theme-aware class names
export const useThemeClasses = () => {
  const { themeConfig } = useTheme();
  
  return {
    // Direct access to utility classes
    ...themeClasses,
    
    // Helper functions for common patterns
    text: {
      primary: themeClasses.textPrimary,
      secondary: themeClasses.textSecondary,
      muted: themeClasses.textMuted,
      subtle: themeClasses.textSubtle,
      interactive: themeClasses.textInteractive,
    },
    
    bg: {
      background: themeClasses.bgBackground,
      surface: themeClasses.bgSurface,
      surfaceHover: themeClasses.bgSurfaceHover,
      interactive: themeClasses.bgInteractive,
      interactiveHover: themeClasses.bgInteractiveHover,
    },
    
    border: {
      default: themeClasses.borderDefault,
      light: themeClasses.borderLight,
    },
    
    // Component utilities
    components: {
      header: themeClasses.header,
      sidebar: {
        base: themeClasses.sidebar,
        muted: themeClasses.sidebarMuted,
        hover: themeClasses.sidebarHover,
      },
      card: themeClasses.card,
      button: {
        primary: themeClasses.buttonPrimary,
      },
      code: {
        inline: themeClasses.codeInline,
        block: themeClasses.codeBlock,
      },
    },
  };
};

// Hook to get raw theme values (for inline styles when needed)
export const useThemeValues = () => {
  const { themeConfig } = useTheme();
  
  return {
    colors: themeConfig.colors,
    components: themeConfig.components,
  };
};

// Utility function to combine theme classes with additional classes
export const cn = (...classes: (string | undefined | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};

// Theme-aware component class builders
export const buildComponentClasses = {
  // Header component
  header: (additionalClasses?: string) => {
    return cn(themeClasses.header, additionalClasses);
  },
  
  // Sidebar component
  sidebar: (additionalClasses?: string) => {
    return cn(themeClasses.sidebar, additionalClasses);
  },
  
  // Card component
  card: (additionalClasses?: string) => {
    return cn(themeClasses.card, additionalClasses);
  },
  
  // Button components
  button: {
    primary: (additionalClasses?: string) => {
      return cn(themeClasses.buttonPrimary, additionalClasses);
    },
    secondary: (additionalClasses?: string) => {
      return cn(
        'bg-[var(--card-background)] hover:bg-[var(--color-surface-hover)] text-[var(--color-primary)] border-[var(--color-border)]',
        additionalClasses
      );
    },
  },
  
  // Input component
  input: (additionalClasses?: string) => {
    return cn(
      'bg-[var(--card-background)] border-[var(--color-border)] text-[var(--color-primary)] placeholder:text-[var(--color-muted)]',
      additionalClasses
    );
  },
  
  // Text variants
  text: {
    primary: (additionalClasses?: string) => cn(themeClasses.textPrimary, additionalClasses),
    secondary: (additionalClasses?: string) => cn(themeClasses.textSecondary, additionalClasses),
    muted: (additionalClasses?: string) => cn(themeClasses.textMuted, additionalClasses),
    subtle: (additionalClasses?: string) => cn(themeClasses.textSubtle, additionalClasses),
  },
};

// Pre-built component style objects
export const componentStyles = {
  // Common page layouts
  pageContainer: 'min-h-screen bg-[var(--color-background)]',
  contentContainer: 'bg-[var(--color-background)] text-[var(--color-primary)]',
  
  // Common headings
  heading: {
    h1: 'text-3xl font-bold text-[var(--color-primary)]',
    h2: 'text-2xl font-semibold text-[var(--color-primary)]',
    h3: 'text-xl font-semibold text-[var(--color-primary)]',
  },
  
  // Common text
  text: {
    body: 'text-[var(--color-primary)]',
    muted: 'text-[var(--color-muted)]',
    caption: 'text-sm text-[var(--color-muted)]',
  },
  
  // Common interactive elements
  link: 'text-[var(--color-interactive)] hover:text-[var(--color-interactive-hover)]',
  
  // Loading and empty states
  loading: 'text-[var(--color-muted)]',
  emptyState: 'text-center text-[var(--color-muted)]',
};

// Quick access to frequently used combinations
export const quickStyles = {
  pageHeader: cn(componentStyles.heading.h1, 'mb-2'),
  pageDescription: cn(componentStyles.text.caption, 'mb-8'),
  cardContainer: cn(themeClasses.card, 'p-6 rounded-xl shadow-sm'),
  sectionTitle: cn(componentStyles.heading.h2, 'mb-6'),
};