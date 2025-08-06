'use client';

import Link from "next/link";
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { chapters } from '@/data/chapters';

interface Book {
  id: string;
  slug: string;
  title: string;
  description?: string;
  difficulty: string;
  isPublished: boolean;
  order: number;
  accessType: string;
  chapters: { id: string; title: string; emoji: string }[];
}

export default function Home() {
  const { data: session } = useSession();
  const [userBooks, setUserBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session?.user) {
      fetchUserBooks();
    }
  }, [session]);

  const fetchUserBooks = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/user-books');
      if (response.ok) {
        const data = await response.json();
        setUserBooks(data.books || []);
      }
    } catch (error) {
      console.error('Error fetching user books:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-zinc-900 mb-4">
          🐍 Python Learning for Healthcare
        </h1>
        <p className="text-xl text-zinc-600 max-w-2xl mx-auto">
          Master Python programming for healthcare data analysis with interactive lessons, 
          real-world examples, and hands-on coding exercises.
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-3 gap-8 mb-12">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
            <span className="text-2xl">🖥️</span>
          </div>
          <h3 className="text-lg font-semibold text-zinc-900 mb-2">Interactive Editor</h3>
          <p className="text-zinc-600">
            Write and execute Python code directly in your browser with Monaco Editor and Pyodide.
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
            <span className="text-2xl">🏥</span>
          </div>
          <h3 className="text-lg font-semibold text-zinc-900 mb-2">Healthcare Focus</h3>
          <p className="text-zinc-600">
            Learn Python specifically for healthcare data analysis, medical informatics, and clinical research.
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
            <span className="text-2xl">📊</span>
          </div>
          <h3 className="text-lg font-semibold text-zinc-900 mb-2">Real Examples</h3>
          <p className="text-zinc-600">
            Work with real healthcare datasets and learn industry-standard libraries like Pandas.
          </p>
        </div>
      </div>

      {/* Learning Path Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <h2 className="text-2xl font-bold text-zinc-900 mb-6">Learning Path</h2>
        
        {session?.user ? (
          // Show books for logged-in users
          <div className="space-y-6">
            {loading ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="flex items-center p-4 border border-gray-200 rounded-lg">
                      <div className="w-12 h-12 bg-gray-200 rounded-lg mr-4"></div>
                      <div className="flex-1">
                        <div className="h-5 bg-gray-200 rounded mb-2"></div>
                        <div className="h-3 bg-gray-100 rounded w-3/4"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : userBooks.length > 0 ? (
              userBooks.map((book) => (
                <div key={book.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* Book Header */}
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">📚</span>
                        <div>
                          <h3 className="font-bold text-zinc-900">{book.title}</h3>
                          <p className="text-sm text-zinc-600 mt-1">{book.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          book.difficulty === 'BEGINNER' ? 'bg-green-100 text-green-800' :
                          book.difficulty === 'INTERMEDIATE' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {book.difficulty}
                        </span>
                        <span className="text-sm text-zinc-500">{book.chapters.length} chapters</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Chapters */}
                  <div className="p-4">
                    <div className="grid gap-2">
                      {book.chapters.slice(0, 3).map((chapter) => (
                        <Link
                          key={chapter.id}
                          href={`/chapter/${chapter.id}`}
                          className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                        >
                          <span className="text-lg mr-3">{chapter.emoji}</span>
                          <span className="font-medium text-zinc-900">{chapter.title}</span>
                          <svg
                            className="ml-auto w-4 h-4 text-zinc-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      ))}
                      {book.chapters.length > 3 && (
                        <div className="text-center py-2">
                          <span className="text-sm text-zinc-500">
                            +{book.chapters.length - 3} more chapters
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <div className="text-zinc-400 text-4xl mb-2">📚</div>
                <p className="text-zinc-500">No books available</p>
                <p className="text-zinc-400 text-sm mt-1">Contact your administrator for access</p>
              </div>
            )}
          </div>
        ) : (
          // Show chapters for non-logged-in users (preview)
          <div className="space-y-4">
            {chapters.map((chapter) => (
              <Link
                key={chapter.id}
                href="/login"
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-colors duration-200"
              >
                <span className="text-2xl mr-4">{chapter.emoji}</span>
                <div>
                  <h3 className="font-semibold text-zinc-900">{chapter.title}</h3>
                  <p className="text-sm text-zinc-600 mt-1">
                    {chapter.id === 'chapter1' 
                      ? 'Learn Python basics with healthcare examples'
                      : 'Analyze healthcare data with Pandas and Python'
                    }
                  </p>
                </div>
                <div className="ml-auto flex items-center">
                  <span className="text-sm text-indigo-600 mr-2">Sign in to access</span>
                  <svg
                    className="w-5 h-5 text-zinc-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Get Started Section */}
      <div className="text-center mt-12">
        <p className="text-zinc-600 mb-6">Ready to start your healthcare data science journey?</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/register"
            className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors duration-200"
          >
            Create Account
            <svg
              className="ml-2 w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center px-6 py-3 bg-white text-indigo-600 font-medium rounded-lg border border-indigo-600 hover:bg-indigo-50 transition-colors duration-200"
          >
            Sign In
          </Link>
        </div>
        
        {/* Demo Accounts */}
        <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-lg font-medium text-blue-900 mb-3">Try Demo Accounts</h3>
          <div className="grid md:grid-cols-4 gap-4 text-sm">
            <div className="bg-white p-3 rounded border">
              <p className="font-medium text-zinc-900">Student Account</p>
              <p className="text-zinc-600">Email: student1@healthinformatics.com</p>
              <p className="text-zinc-600">Password: password123</p>
            </div>
            <div className="bg-white p-3 rounded border">
              <p className="font-medium text-zinc-900">Instructor Account</p>
              <p className="text-zinc-600">Email: instructor@healthinformatics.com</p>
              <p className="text-zinc-600">Password: password123</p>
            </div>
            <div className="bg-white p-3 rounded border">
              <p className="font-medium text-zinc-900">Admin Account</p>
              <p className="text-zinc-600">Email: admin@admin.com</p>
              <p className="text-zinc-600">Password: 123456</p>
            </div>
            <div className="bg-white p-3 rounded border border-orange-200 bg-orange-50">
              <p className="font-medium text-orange-900">Super Admin</p>
              <p className="text-orange-700">Email: admin@admin.com</p>
              <p className="text-orange-700">Password: 123456</p>
              <p className="text-xs text-orange-600 mt-1">Full platform access</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
