'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Chapter } from '@/types';

interface SidebarProps {
  chapters: Chapter[];
  className?: string;
  onClose?: () => void;
}

export default function Sidebar({ chapters, className = '', onClose }: SidebarProps) {
  const pathname = usePathname();

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
            className="flex items-center px-4 py-3 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors duration-200"
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="font-medium">Home</span>
          </Link>
          <Link
            href="/progress"
            onClick={onClose}
            className="flex items-center px-4 py-3 mt-2 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors duration-200"
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="font-medium">Progress</span>
          </Link>
          <Link
            href="/resources"
            onClick={onClose}
            className="flex items-center px-4 py-3 mt-2 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors duration-200"
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span className="font-medium">Resources</span>
          </Link>
        </div>
        
        {/* Chapter navigation */}
        <div className="px-4 pt-4 lg:pt-0">
          {chapters.map((chapter) => {
            const href = `/chapter/${chapter.id}`;
            const isActive = pathname === href;
            
            return (
              <Link
                key={chapter.id}
                href={href}
                onClick={onClose}
                className={`flex items-center px-4 py-3 mt-2 text-gray-700 rounded-lg transition-colors duration-200 ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-600 border-r-2 border-indigo-600'
                    : 'hover:bg-indigo-50 hover:text-indigo-600'
                }`}
              >
                <span className="text-lg mr-3">{chapter.emoji}</span>
                <span className="font-medium">{chapter.title}</span>
              </Link>
            );
          })}
          
          {chapters.length === 0 && (
            <Link
              href="/chapter/chapter1"
              onClick={onClose}
              className="flex items-center px-4 py-3 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors duration-200"
            >
              <span className="text-lg mr-3">📚</span>
              <span className="font-medium">Chapter 1</span>
            </Link>
          )}
        </div>
      </nav>
    </div>
  );
}