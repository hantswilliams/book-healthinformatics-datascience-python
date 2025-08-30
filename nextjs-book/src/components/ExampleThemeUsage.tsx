/**
 * Example component showing how to use the new centralized theme system
 * 
 * This demonstrates the different ways to apply themes:
 * 1. Using theme utility hooks
 * 2. Using pre-built component styles
 * 3. Using CSS custom properties directly
 */

'use client';

import { useThemeClasses, buildComponentClasses, componentStyles, quickStyles } from '@/lib/theme-utils';
import { useThemeValues } from '@/lib/theme-utils';

export default function ExampleThemeUsage() {
  // Hook to get theme utility classes
  const themeClasses = useThemeClasses();
  
  // Hook to get raw theme values (for inline styles when needed)
  const themeValues = useThemeValues();

  return (
    <div className={componentStyles.pageContainer}>
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        
        {/* Example 1: Using quick styles */}
        <div>
          <h1 className={quickStyles.pageHeader}>Theme System Examples</h1>
          <p className={quickStyles.pageDescription}>
            This page demonstrates the new centralized theme configuration system.
          </p>
        </div>

        {/* Example 2: Using component builder functions */}
        <div className={buildComponentClasses.card('p-6')}>
          <h2 className={componentStyles.heading.h2}>Card with Theme-aware Styling</h2>
          <p className={themeClasses.text.muted}>
            This card automatically adapts to light/dark themes using our centralized configuration.
          </p>
          
          {/* Theme-aware buttons */}
          <div className="flex gap-4 mt-4">
            <button className={buildComponentClasses.button.primary('px-4 py-2 rounded-lg')}>
              Primary Button
            </button>
            <button className={buildComponentClasses.button.secondary('px-4 py-2 rounded-lg border')}>
              Secondary Button
            </button>
          </div>
        </div>

        {/* Example 3: Using direct theme classes */}
        <div className={`${themeClasses.card} p-6 rounded-xl`}>
          <h3 className={themeClasses.text.primary + ' text-xl font-semibold mb-4'}>
            Text Color Examples
          </h3>
          <div className="space-y-2">
            <p className={themeClasses.text.primary}>Primary text color</p>
            <p className={themeClasses.text.secondary}>Secondary text color</p>
            <p className={themeClasses.text.muted}>Muted text color</p>
            <p className={themeClasses.text.subtle}>Subtle text color</p>
          </div>
        </div>

        {/* Example 4: Using CSS custom properties directly */}
        <div 
          style={{ 
            background: 'var(--card-background)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-primary)'
          }}
          className="p-6 rounded-xl"
        >
          <h3 className="text-xl font-semibold mb-4">Using CSS Custom Properties</h3>
          <p style={{ color: 'var(--color-muted)' }}>
            This approach is useful when you need dynamic inline styles or can't use Tailwind classes.
          </p>
          
          <div className="mt-4 p-3 rounded" style={{ background: 'var(--code-inline-bg)' }}>
            <code style={{ color: 'var(--code-inline-text)' }}>
              background: var(--card-background);
            </code>
          </div>
        </div>

        {/* Example 5: Interactive elements */}
        <div className={quickStyles.cardContainer}>
          <h3 className={componentStyles.heading.h3 + ' mb-4'}>Interactive Elements</h3>
          <div className="space-y-3">
            <a href="#" className={componentStyles.link}>
              This is a themed link
            </a>
            <div>
              <input 
                type="text" 
                placeholder="Themed input field"
                className={buildComponentClasses.input('w-full px-3 py-2 rounded border')}
              />
            </div>
          </div>
        </div>

        {/* Example 6: Code blocks */}
        <div className={themeClasses.card + ' p-6 rounded-xl'}>
          <h3 className={componentStyles.heading.h3 + ' mb-4'}>Code Examples</h3>
          
          <p className={themeClasses.text.muted + ' mb-4'}>
            Inline code: <code className={themeClasses.codeInline + ' px-1 py-0.5 rounded text-sm'}>
              const theme = useTheme()
            </code>
          </p>
          
          <pre className={themeClasses.codeBlock + ' p-4 rounded-lg overflow-x-auto'}>
            <code>
{`// Example theme configuration usage
const themeClasses = useThemeClasses();

return (
  <div className={themeClasses.card}>
    <h1 className={themeClasses.text.primary}>
      Theme-aware component
    </h1>
  </div>
);`}
            </code>
          </pre>
        </div>

        {/* Example 7: Current theme info */}
        <div className={buildComponentClasses.card('p-6')}>
          <h3 className={componentStyles.heading.h3 + ' mb-4'}>Current Theme Values</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong className={themeClasses.text.primary}>Primary Color:</strong>
              <div className={themeClasses.text.muted}>{themeValues.colors.primary}</div>
            </div>
            <div>
              <strong className={themeClasses.text.primary}>Background:</strong>
              <div className={themeClasses.text.muted}>{themeValues.colors.background}</div>
            </div>
            <div>
              <strong className={themeClasses.text.primary}>Surface:</strong>
              <div className={themeClasses.text.muted}>{themeValues.colors.surface}</div>
            </div>
            <div>
              <strong className={themeClasses.text.primary}>Border:</strong>
              <div className={themeClasses.text.muted}>{themeValues.colors.border}</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

/*
How to migrate existing components:

BEFORE (scattered dark: classes):
<div className="bg-white dark:bg-zinc-800 text-gray-900 dark:text-white border border-gray-200 dark:border-zinc-700">
  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Title</h1>
  <p className="text-gray-600 dark:text-zinc-300">Description</p>
</div>

AFTER (centralized theme):
<div className={buildComponentClasses.card()}>
  <h1 className={componentStyles.heading.h1}>Title</h1>
  <p className={themeClasses.text.muted}>Description</p>
</div>

OR using CSS custom properties:
<div className="bg-[var(--card-background)] text-[var(--color-primary)] border-[var(--color-border)]">
  <h1 className="text-2xl font-bold text-[var(--color-primary)]">Title</h1>
  <p className="text-[var(--color-muted)]">Description</p>
</div>

Benefits:
1. Single source of truth for all colors/themes
2. Easy to modify themes by changing config file
3. Better consistency across components
4. TypeScript support for theme values
5. Easier maintenance and updates
*/