interface LogoMarkProps {
  className?: string;
  variant?: 'brackets' | 'triangle' | 'spark' | 'python';
}

// Small, crisp logo mark variants to sit next to the brand name.
export function LogoMark({ className = 'h-7 w-7', variant = 'brackets' }: LogoMarkProps) {
  switch (variant) {
    case 'triangle':
      return (
        <svg
          className={className}
          viewBox="0 0 32 32"
          role="img"
          aria-label="Interactive Coding"
        >
          <defs>
            <linearGradient id="lg1" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#6366F1" />
              <stop offset="100%" stopColor="#8B5CF6" />
            </linearGradient>
          </defs>
          <rect x="0" y="0" width="32" height="32" rx="8" fill="url(#lg1)" />
          <path
            d="M13 11.5L21 16l-8 4.5v-9z"
            fill="#fff"
            stroke="#fff"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'spark':
      return (
        <svg
          className={className}
            viewBox="0 0 32 32"
            role="img"
            aria-label="Interactive Coding"
        >
          <defs>
            <radialGradient id="rg1" cx="50%" cy="50%" r="65%">
              <stop offset="0%" stopColor="#EEF2FF" />
              <stop offset="100%" stopColor="#6366F1" />
            </radialGradient>
          </defs>
          <rect width="32" height="32" rx="8" fill="#312E81" />
          <g stroke="url(#rg1)" strokeWidth="2" strokeLinecap="round">
            <path d="M16 7v5" />
            <path d="M16 20v5" />
            <path d="M7 16h5" />
            <path d="M20 16h5" />
            <path d="M10.6 10.6l3.3 3.3" />
            <path d="M18.1 18.1l3.3 3.3" />
            <path d="M21.4 10.6l-3.3 3.3" />
            <path d="M13.9 18.1l-3.3 3.3" />
          </g>
          <circle cx="16" cy="16" r="3.2" fill="url(#rg1)" />
        </svg>
      );
    case 'python':
      // Stylized dual-tone pill referencing a "P" abstractly (minimal nod to Python without infringement)
      return (
        <svg
          className={className}
          viewBox="0 0 32 32"
          role="img"
          aria-label="Interactive Coding"
        >
          <defs>
            <linearGradient id="gradP" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#4F46E5" />
              <stop offset="100%" stopColor="#0EA5E9" />
            </linearGradient>
          </defs>
          <rect width="32" height="32" rx="8" fill="#1E1B4B" />
          <path
            d="M12 9h5.2c3 0 5.3 1.9 5.3 4.8 0 2.9-2.3 4.8-5.3 4.8H15v4.4h-3V9zm8.5 4.8c0-1.3-1-2-2.3-2H15v4h3.2c1.3 0 2.3-.7 2.3-2z"
            fill="url(#gradP)"
          />
        </svg>
      );
    case 'brackets':
    default:
      return (
        <svg
          className={className}
          viewBox="0 0 32 32"
          role="img"
          aria-label="Interactive Coding"
        >
          <defs>
            <linearGradient id="grad1" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#6366F1" />
              <stop offset="100%" stopColor="#A855F7" />
            </linearGradient>
          </defs>
          <rect x="0" y="0" width="32" height="32" rx="8" className="fill-indigo-600" />
          <path
            d="M12.5 11.5L8.5 16l4 4.5M19.5 11.5l4 4.5-4 4.5"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <circle cx="16" cy="16" r="3.2" fill="url(#grad1)" />
        </svg>
      );
  }
}

export default LogoMark;
