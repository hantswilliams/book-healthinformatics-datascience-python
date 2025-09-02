'use client';

import { useState, useEffect } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';
import { useSupabase } from '@/lib/SupabaseProvider';
import type { User, Chapter } from '@/types';

interface Book {
  id: string;
  slug: string;
  title: string;
  description?: string;
  difficulty: string;
  isPublished: boolean;
  order: number;
  accessType: string;
  chapters: Chapter[];
}

interface ResponsiveLayoutProps {
  chapters: Chapter[];
  children: React.ReactNode;
}

export default function ResponsiveLayout({ chapters, children }: ResponsiveLayoutProps) {
  const { user: supabaseUser, userProfile } = useSupabase();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Transform Supabase user to match existing User interface
  const user = userProfile ? {
    id: supabaseUser?.id || '',
    username: userProfile.username || '',
    email: userProfile.email || '',
    firstName: userProfile.first_name || '',
    lastName: userProfile.last_name || '',
    role: userProfile.role as 'OWNER' | 'ADMIN' | 'INSTRUCTOR' | 'LEARNER',
    organizationId: userProfile.organization_id || '',
    organizationSlug: '', // We'll need to get this from organization data
    organizationName: '',  // We'll need to get this from organization data
    createdAt: new Date(userProfile.joined_at || ''),
    updatedAt: new Date(userProfile.updated_at || userProfile.joined_at || '')
  } : null;

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  useEffect(() => {
    if (userProfile) {
      fetchUserBooks();
    } else {
      setLoading(false);
    }
  }, [userProfile?.id]); // Only depend on the user ID to prevent infinite loops

  const fetchUserBooks = async () => {
    try {
      const response = await fetch('/api/user-books');
      if (response.ok) {
        const data = await response.json();
        setBooks(data.books || []);
      } else {
        console.error('Failed to fetch user books - HTTP', response.status);
        setBooks([]);
      }
    } catch (error) {
      console.error('Error fetching user books:', error);
      setBooks([]); // Set empty array on error to prevent UI issues
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen bg-white ">
      {user ? (
        <>
          {/* Mobile sidebar backdrop */}
          {isSidebarOpen && (
            <div 
              className="fixed inset-0 bg-gray-600 bg-opacity-75 z-40 lg:hidden"
              onClick={closeSidebar}
            />
          )}

          {/* Desktop layout */}
          <div className="flex h-screen">
            {/* Sidebar */}
            <Sidebar 
              books={books}
              loading={loading}
              className={`
                fixed inset-y-0 left-0 z-50 lg:static lg:translate-x-0 lg:z-auto
                transform transition-transform duration-300 ease-in-out
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                lg:block
              `}
              onClose={closeSidebar}
            />
            
            {/* Main content area */}
            <div className="flex-1 flex flex-col min-w-0">
              <Header 
                onToggleSidebar={toggleSidebar}
                isSidebarOpen={isSidebarOpen}
              />
              
              <div className="flex-1 overflow-auto bg-white ">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
                  {children}
                </div>
              </div>
        <Footer />
            </div>
          </div>
        </>
      ) : (
        <>
          <Header user={user} />
          <div className="flex-1 overflow-auto bg-white ">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
              {children}
            </div>
          </div>
      <Footer />
        </>
      )}
    </div>
  );
}