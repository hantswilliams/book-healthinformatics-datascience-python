'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import type { Chapter, User } from '@/types';

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

interface SidebarProps {
  books: Book[];
  user?: User | null;
  loading?: boolean;
  className?: string;
  onClose?: () => void;
}

export default function Sidebar({ books, user, loading, className = '', onClose }: SidebarProps) {
  const pathname = usePathname();
  const [expandedBooks, setExpandedBooks] = useState<Set<string>>(new Set());

  // Auto-expand book that contains current chapter
  useEffect(() => {
    if (books.length > 0 && pathname.startsWith('/chapter/')) {
      const currentChapterId = pathname.split('/').pop();
      const bookWithCurrentChapter = books.find(book => 
        book.chapters.some(chapter => chapter.id === currentChapterId)
      );
      if (bookWithCurrentChapter) {
        setExpandedBooks(new Set([bookWithCurrentChapter.id]));
      }
    }
  }, [books, pathname]);

  const toggleBook = (bookId: string) => {
    const newExpanded = new Set(expandedBooks);
    if (newExpanded.has(bookId)) {
      newExpanded.delete(bookId);
    } else {
      newExpanded.add(bookId);
    }
    setExpandedBooks(newExpanded);
  };

  return (
    <div className={`w-64 bg-white shadow-lg ${className}`}>
      <div className="p-6 bg-indigo-600 relative">
        <h2 className="text-2xl font-bold text-white">Health Informatics</h2>
        <p className="text-indigo-200 text-sm mt-1">Interactive Learning Platform</p>
        
        {/* Close button for mobile */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white hover:text-indigo-200 lg:hidden"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <nav className="mt-6">
        {/* Mobile navigation links */}
        <div className="px-4 pb-4 border-b border-gray-200 lg:hidden">
          <Link
            href="/"
            onClick={onClose}
            className="flex items-center px-4 py-3 text-zinc-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors duration-200"
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="font-medium">Home</span>
          </Link>
          <Link
            href="/progress"
            onClick={onClose}
            className="flex items-center px-4 py-3 mt-2 text-zinc-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors duration-200"
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="font-medium">Progress</span>
          </Link>
          <Link
            href="/resources"
            onClick={onClose}
            className="flex items-center px-4 py-3 mt-2 text-zinc-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors duration-200"
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span className="font-medium">Resources</span>
          </Link>
          {user?.role === 'admin' && (
            <Link
              href="/admin"
              onClick={onClose}
              className="flex items-center px-4 py-3 mt-2 text-orange-700 hover:bg-orange-50 hover:text-orange-800 rounded-lg transition-colors duration-200"
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="font-medium">Admin Panel</span>
            </Link>
          )}
        </div>
        
        {/* Books and Chapters navigation */}
        <div className="px-4 pt-4 lg:pt-0">
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-10 bg-gray-200 rounded mb-2"></div>
                  <div className="ml-4 space-y-2">
                    <div className="h-8 bg-gray-100 rounded"></div>
                    <div className="h-8 bg-gray-100 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : books.length > 0 ? (
            <div className="space-y-2">
              {books.map((book) => {
                const isExpanded = expandedBooks.has(book.id);
                
                return (
                  <div key={book.id} className="mb-4">
                    {/* Book Header */}
                    <button
                      onClick={() => toggleBook(book.id)}
                      className="w-full flex items-center justify-between px-3 py-2 text-left rounded-lg hover:bg-gray-50 transition-colors duration-200"
                    >
                      <div className="flex items-center">
                        <span className="text-lg mr-2">📚</span>
                        <div>
                          <div className="font-semibold text-zinc-900 text-sm">{book.title}</div>
                          <div className="text-xs text-zinc-500">{book.chapters.length} chapters</div>
                        </div>
                      </div>
                      <svg
                        className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${
                          isExpanded ? 'rotate-90' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>

                    {/* Chapters */}
                    {isExpanded && (
                      <div className="ml-6 mt-2 space-y-1">
                        {book.chapters.map((chapter) => {
                          const href = `/chapter/${chapter.id}`;
                          const isActive = pathname === href;
                          
                          return (
                            <Link
                              key={chapter.id}
                              href={href}
                              onClick={onClose}
                              className={`flex items-center px-2 py-2 rounded-md text-sm transition-colors duration-200 ${
                                isActive
                                  ? 'bg-indigo-100 text-indigo-700 font-medium'
                                  : 'text-zinc-600 hover:bg-gray-100 hover:text-zinc-900'
                              }`}
                            >
                              <span className="text-base mr-2">{chapter.emoji}</span>
                              <span className="truncate">{chapter.title}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-zinc-400 text-4xl mb-2">📚</div>
              <p className="text-zinc-500 text-sm">No books available</p>
              <p className="text-zinc-400 text-xs mt-1">Contact your administrator</p>
            </div>
          )}
        </div>
      </nav>
    </div>
  );
}