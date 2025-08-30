/**
 * Centralized Theme Configuration
 * 
 * This file defines all color schemes and styling tokens for light and dark modes.
 * Instead of scattered dark: classes throughout components, we centralize theme definitions here.
 */

export interface ThemeConfig {
  colors: {
    // Text colors
    primary: string;       // Main headings, important text
    secondary: string;     // Subheadings, secondary text
    muted: string;         // Descriptions, captions
    subtle: string;        // Placeholder, very light text
    
    // Background colors
    background: string;    // Main page background
    surface: string;       // Cards, panels
    surfaceHover: string;  // Card hover states
    
    // Border colors
    border: string;        // Default borders
    borderLight: string;   // Light borders
    
    // Interactive colors
    interactive: string;        // Links, buttons
    interactiveHover: string;   // Hover states
    interactiveActive: string;  // Active states
    
    // Status colors (these remain consistent across themes)
    success: string;
    warning: string;
    error: string;
    info: string;
  };
  
  // Component-specific styling
  components: {
    header: {
      background: string;
      border: string;
      text: string;
      backdropBlur: string;
    };
    sidebar: {
      background: string;
      border: string;
      text: string;
      textMuted: string;
      hover: string;
    };
    card: {
      background: string;
      border: string;
      shadow: string;
    };
    button: {
      primary: {
        background: string;
        backgroundHover: string;
        text: string;
      };
      secondary: {
        background: string;
        backgroundHover: string;
        text: string;
        border: string;
      };
    };
    input: {
      background: string;
      border: string;
      text: string;
      placeholder: string;
    };
    code: {
      inline: {
        background: string;
        text: string;
      };
      block: {
        background: string;
        text: string;
      };
    };
  };
}

// Light theme configuration
export const lightTheme: ThemeConfig = {
  colors: {
    primary: 'rgb(24 24 27)',        // zinc-900
    secondary: 'rgb(39 39 42)',      // zinc-800  
    muted: 'rgb(82 82 91)',          // zinc-600
    subtle: 'rgb(113 113 122)',      // zinc-500
    
    background: 'rgb(255 255 255)',   // white
    surface: 'rgb(255 255 255)',      // white
    surfaceHover: 'rgb(244 244 245)', // zinc-100
    
    border: 'rgb(228 228 231)',       // zinc-200
    borderLight: 'rgb(244 244 245)',  // zinc-100
    
    interactive: 'rgb(79 70 229)',       // indigo-600
    interactiveHover: 'rgb(67 56 202)',  // indigo-700
    interactiveActive: 'rgb(55 48 163)', // indigo-800
    
    success: 'rgb(34 197 94)',   // green-500
    warning: 'rgb(245 158 11)',  // amber-500
    error: 'rgb(239 68 68)',     // red-500
    info: 'rgb(59 130 246)',     // blue-500
  },
  
  components: {
    header: {
      background: 'rgba(255, 255, 255, 0.7)',
      border: 'rgba(228, 228, 231, 0.7)', // zinc-200/70
      text: 'rgb(24 24 27)', // zinc-900
      backdropBlur: 'blur(8px)',
    },
    sidebar: {
      background: 'rgba(255, 255, 255, 0.9)',
      border: 'rgb(228 228 231)', // zinc-200
      text: 'rgb(24 24 27)', // zinc-900
      textMuted: 'rgb(82 82 91)', // zinc-600
      hover: 'rgb(244 244 245)', // zinc-100
    },
    card: {
      background: 'rgb(255 255 255)',
      border: 'rgb(228 228 231)', // zinc-200
      shadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    },
    button: {
      primary: {
        background: 'rgb(79 70 229)', // indigo-600
        backgroundHover: 'rgb(67 56 202)', // indigo-700
        text: 'rgb(255 255 255)',
      },
      secondary: {
        background: 'rgb(255 255 255)',
        backgroundHover: 'rgb(244 244 245)', // zinc-100
        text: 'rgb(24 24 27)', // zinc-900
        border: 'rgb(228 228 231)', // zinc-200
      },
    },
    input: {
      background: 'rgb(255 255 255)',
      border: 'rgb(228 228 231)', // zinc-200
      text: 'rgb(24 24 27)', // zinc-900
      placeholder: 'rgb(113 113 122)', // zinc-500
    },
    code: {
      inline: {
        background: 'rgb(244 244 245)', // zinc-100
        text: 'rgb(39 39 42)', // zinc-800
      },
      block: {
        background: 'rgb(39 39 42)', // zinc-800
        text: 'rgb(244 244 245)', // zinc-100
      },
    },
  },
};

// Dark theme configuration
export const darkTheme: ThemeConfig = {
  colors: {
    primary: 'rgb(255 255 255)',        // white
    secondary: 'rgb(244 244 245)',      // zinc-100
    muted: 'rgb(212 212 216)',          // zinc-300
    subtle: 'rgb(161 161 170)',         // zinc-400
    
    background: 'rgb(9 9 11)',          // zinc-950
    surface: 'rgb(39 39 42)',           // zinc-800
    surfaceHover: 'rgb(63 63 70)',      // zinc-700
    
    border: 'rgb(63 63 70)',            // zinc-700
    borderLight: 'rgb(82 82 91)',       // zinc-600
    
    interactive: 'rgb(129 140 248)',       // indigo-400
    interactiveHover: 'rgb(165 180 252)',  // indigo-300
    interactiveActive: 'rgb(196 181 253)', // violet-300
    
    success: 'rgb(34 197 94)',   // green-500
    warning: 'rgb(245 158 11)',  // amber-500
    error: 'rgb(239 68 68)',     // red-500
    info: 'rgb(59 130 246)',     // blue-500
  },
  
  components: {
    header: {
      background: 'rgba(39, 39, 42, 0.7)', // zinc-800/70
      border: 'rgba(63, 63, 70, 0.7)', // zinc-700/70
      text: 'rgb(255 255 255)',
      backdropBlur: 'blur(8px)',
    },
    sidebar: {
      background: 'rgba(39, 39, 42, 0.9)', // zinc-800/90
      border: 'rgb(63 63 70)', // zinc-700
      text: 'rgb(255 255 255)',
      textMuted: 'rgb(212 212 216)', // zinc-300
      hover: 'rgb(63 63 70)', // zinc-700
    },
    card: {
      background: 'rgb(39 39 42)', // zinc-800
      border: 'rgb(63 63 70)', // zinc-700
      shadow: '0 1px 2px 0 rgb(0 0 0 / 0.3)',
    },
    button: {
      primary: {
        background: 'rgb(79 70 229)', // indigo-600
        backgroundHover: 'rgb(67 56 202)', // indigo-700
        text: 'rgb(255 255 255)',
      },
      secondary: {
        background: 'rgb(39 39 42)', // zinc-800
        backgroundHover: 'rgb(63 63 70)', // zinc-700
        text: 'rgb(255 255 255)',
        border: 'rgb(63 63 70)', // zinc-700
      },
    },
    input: {
      background: 'rgb(39 39 42)', // zinc-800
      border: 'rgb(63 63 70)', // zinc-700
      text: 'rgb(255 255 255)',
      placeholder: 'rgb(161 161 170)', // zinc-400
    },
    code: {
      inline: {
        background: 'rgb(63 63 70)', // zinc-700
        text: 'rgb(212 212 216)', // zinc-300
      },
      block: {
        background: 'rgb(24 24 27)', // zinc-900
        text: 'rgb(244 244 245)', // zinc-100
      },
    },
  },
};

// Export current themes
export const themes = {
  light: lightTheme,
  dark: darkTheme,
} as const;

export type ThemeName = keyof typeof themes;

// Utility function to get current theme
export const getTheme = (themeName: ThemeName): ThemeConfig => {
  return themes[themeName];
};

// CSS Custom Properties generator
export const generateCSSCustomProperties = (theme: ThemeConfig): Record<string, string> => {
  return {
    // Color tokens
    '--color-primary': theme.colors.primary,
    '--color-secondary': theme.colors.secondary,
    '--color-muted': theme.colors.muted,
    '--color-subtle': theme.colors.subtle,
    
    '--color-background': theme.colors.background,
    '--color-surface': theme.colors.surface,
    '--color-surface-hover': theme.colors.surfaceHover,
    
    '--color-border': theme.colors.border,
    '--color-border-light': theme.colors.borderLight,
    
    '--color-interactive': theme.colors.interactive,
    '--color-interactive-hover': theme.colors.interactiveHover,
    '--color-interactive-active': theme.colors.interactiveActive,
    
    // Component tokens
    '--header-background': theme.components.header.background,
    '--header-border': theme.components.header.border,
    '--header-text': theme.components.header.text,
    '--header-backdrop-blur': theme.components.header.backdropBlur,
    
    '--sidebar-background': theme.components.sidebar.background,
    '--sidebar-border': theme.components.sidebar.border,
    '--sidebar-text': theme.components.sidebar.text,
    '--sidebar-text-muted': theme.components.sidebar.textMuted,
    '--sidebar-hover': theme.components.sidebar.hover,
    
    '--card-background': theme.components.card.background,
    '--card-border': theme.components.card.border,
    '--card-shadow': theme.components.card.shadow,
    
    '--button-primary-bg': theme.components.button.primary.background,
    '--button-primary-bg-hover': theme.components.button.primary.backgroundHover,
    '--button-primary-text': theme.components.button.primary.text,
    
    '--code-inline-bg': theme.components.code.inline.background,
    '--code-inline-text': theme.components.code.inline.text,
    '--code-block-bg': theme.components.code.block.background,
    '--code-block-text': theme.components.code.block.text,
  };
};

// Utility classes that use CSS custom properties
export const themeClasses = {
  // Text colors
  textPrimary: 'text-[var(--color-primary)]',
  textSecondary: 'text-[var(--color-secondary)]',
  textMuted: 'text-[var(--color-muted)]',
  textSubtle: 'text-[var(--color-subtle)]',
  
  // Background colors
  bgBackground: 'bg-[var(--color-background)]',
  bgSurface: 'bg-[var(--color-surface)]',
  bgSurfaceHover: 'hover:bg-[var(--color-surface-hover)]',
  
  // Border colors
  borderDefault: 'border-[var(--color-border)]',
  borderLight: 'border-[var(--color-border-light)]',
  
  // Interactive colors
  textInteractive: 'text-[var(--color-interactive)]',
  textInteractiveHover: 'hover:text-[var(--color-interactive-hover)]',
  bgInteractive: 'bg-[var(--color-interactive)]',
  bgInteractiveHover: 'hover:bg-[var(--color-interactive-hover)]',
  
  // Component classes
  header: 'bg-[var(--header-background)] border-[var(--header-border)] text-[var(--header-text)] backdrop-blur',
  sidebar: 'bg-[var(--sidebar-background)] border-[var(--sidebar-border)] text-[var(--sidebar-text)]',
  sidebarMuted: 'text-[var(--sidebar-text-muted)]',
  sidebarHover: 'hover:bg-[var(--sidebar-hover)]',
  
  card: 'bg-[var(--card-background)] border-[var(--card-border)] shadow-[var(--card-shadow)]',
  
  buttonPrimary: 'bg-[var(--button-primary-bg)] hover:bg-[var(--button-primary-bg-hover)] text-[var(--button-primary-text)]',
  
  codeInline: 'bg-[var(--code-inline-bg)] text-[var(--code-inline-text)]',
  codeBlock: 'bg-[var(--code-block-bg)] text-[var(--code-block-text)]',
} as const;