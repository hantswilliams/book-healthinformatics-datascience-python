'use client';

import Script from 'next/script';

export function ThemeScript() {
  return (
    <Script
      id="theme-script"
      strategy="beforeInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          (function() {
            // Force light mode
            document.body.classList.add('light');
            localStorage.setItem('theme', 'light');
          })();
        `,
      }}
    />
  );
}