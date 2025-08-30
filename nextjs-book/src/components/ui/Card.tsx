import { ReactNode, ElementType } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg' | 'none';
  hover?: boolean;
  as?: ElementType;
}

const paddingMap = {
  none: '',
  sm: 'p-3 sm:p-4',
  md: 'p-5 sm:p-6',
  lg: 'p-6 sm:p-8'
};

export function Card({ children, className = '', padding = 'md', hover = false, as: Tag = 'div' }: CardProps) {
  return (
    <Tag
      className={[
        'rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white/70 dark:bg-zinc-800/70 backdrop-blur-sm shadow-sm',
        hover ? 'transition hover:shadow-md hover:border-indigo-200/70 dark:hover:border-indigo-400/70' : '',
        paddingMap[padding],
        className
      ].join(' ')}
    >
      {children}
    </Tag>
  );
}

interface StatCardProps {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  className?: string;
}

export function StatCard({ label, value, icon, className = '' }: StatCardProps) {
  return (
    <Card padding="md" className={className}>
      <div className="flex items-center gap-4">
        {icon && <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400">{icon}</div>}
        <div className="min-w-0">
          <p className="truncate text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{label}</p>
          <p className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-100">{value}</p>
        </div>
      </div>
    </Card>
  );
}

interface BadgeProps {
  children: ReactNode;
  tone?: 'neutral' | 'success' | 'info' | 'warning' | 'danger' | 'indigo' | 'purple';
  subtle?: boolean;
  className?: string;
}

const toneClasses: Record<string, { solid: string; subtle: string }> = {
  neutral: { solid: 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900', subtle: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300' },
  success: { solid: 'bg-emerald-600 text-white', subtle: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300' },
  info: { solid: 'bg-sky-600 text-white', subtle: 'bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300' },
  warning: { solid: 'bg-amber-500 text-white', subtle: 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300' },
  danger: { solid: 'bg-rose-600 text-white', subtle: 'bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300' },
  indigo: { solid: 'bg-indigo-600 text-white', subtle: 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300' },
  purple: { solid: 'bg-violet-600 text-white', subtle: 'bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300' }
};

export function Badge({ children, tone = 'indigo', subtle = true, className = '' }: BadgeProps) {
  const styles = subtle ? toneClasses[tone].subtle : toneClasses[tone].solid;
  return (
    <span className={['inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', styles, className].join(' ')}>
      {children}
    </span>
  );
}

export default Card;
