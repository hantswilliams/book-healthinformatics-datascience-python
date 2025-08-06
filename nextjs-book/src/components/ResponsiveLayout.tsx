'use client';

import { useState, useEffect } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
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
  user?: User | null;
  chapters: Chapter[];
  children: React.ReactNode;
}

export default function ResponsiveLayout({ user, chapters, children }: ResponsiveLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  useEffect(() => {
    if (user) {
      fetchUserBooks();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchUserBooks = async () => {
    try {
      const response = await fetch('/api/user-books');
      if (response.ok) {
        const data = await response.json();
        setBooks(data.books || []);
      }
    } catch (error) {
      console.error('Error fetching user books:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen bg-gray-50">
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
              user={user}
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
                user={user} 
                onToggleSidebar={toggleSidebar}
                isSidebarOpen={isSidebarOpen}
              />
              
              <div className="flex-1 overflow-auto bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
                  {children}
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          <Header user={user} />
          <div className="flex-1 overflow-auto bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
              {children}
            </div>
          </div>
        </>
      )}
    </div>
  );
}