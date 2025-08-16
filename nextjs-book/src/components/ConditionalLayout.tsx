'use client';

import { usePathname } from 'next/navigation';
import ResponsiveLayout from '@/components/ResponsiveLayout';
import { chapters } from '@/data/chapters';

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export default function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();
  
  // Check if current path is a landing page
  const isLandingPage = pathname?.startsWith('/landing-');
  
  // If it's a landing page, render children directly without the main layout
  if (isLandingPage) {
    return <>{children}</>;
  }
  
  // Otherwise, render with the main ResponsiveLayout
  return (
    <ResponsiveLayout chapters={chapters}>
      {children}
    </ResponsiveLayout>
  );
}