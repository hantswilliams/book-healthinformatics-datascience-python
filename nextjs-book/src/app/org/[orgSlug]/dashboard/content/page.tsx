'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useOrgSlug } from '@/lib/useOrgSlug';

interface Chapter {
  id: string;
  title: string;
  emoji: string;
  order: number;
  isPublished: boolean;
  estimatedMinutes?: number;
}

interface Book {
  id: string;
  slug: string;
  title: string;
  description?: string;
  coverImage?: string;
  difficulty: string;
  estimatedHours?: number;
  category: string;
  tags?: string;
  organizationId?: string;
  isPublished: boolean;
  isPublic: boolean;
  order: number;
  chapters: Chapter[];
  accessType: string;
}

export default function ContentManagement() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const orgSlug = useOrgSlug();
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'organization' | 'marketplace'>('all');
  const [publishingBooks, setPublishingBooks] = useState<Set<string>>(new Set());
  const [deletingBooks, setDeletingBooks] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{bookId: string, title: string} | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/login');
      return;
    }

    // Check permissions - OWNER and ADMIN can manage content
    if (!['OWNER', 'ADMIN', 'INSTRUCTOR'].includes(session.user.role)) {
      router.push('/dashboard');
      return;
    }

    fetchBooks();
  }, [session, status, router]);

  const fetchBooks = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/user-books');
      if (!response.ok) {
        throw new Error('Failed to load books');
      }

      const result = await response.json();
      setBooks(result.books || []);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load books');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleBookPublishStatus = async (bookId: string, currentStatus: boolean) => {
    if (publishingBooks.has(bookId)) return;
    
    try {
      setPublishingBooks(prev => new Set([...prev, bookId]));
      const newStatus = !currentStatus;
      
      const response = await fetch(`/api/books/${bookId}/publish`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isPublished: newStatus }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update book status');
      }
      
      // Update the book in the local state
      setBooks(prevBooks => 
        prevBooks.map(book => 
          book.id === bookId 
            ? { ...book, isPublished: newStatus }
            : book
        )
      );
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update book status');
    } finally {
      setPublishingBooks(prev => {
        const newSet = new Set(prev);
        newSet.delete(bookId);
        return newSet;
      });
    }
  };

  const handleDeleteBook = (bookId: string, title: string) => {
    setShowDeleteConfirm({ bookId, title });
  };

  const confirmDeleteBook = async () => {
    if (!showDeleteConfirm) return;
    
    const { bookId } = showDeleteConfirm;
    
    if (deletingBooks.has(bookId)) return;
    
    try {
      setDeletingBooks(prev => new Set([...prev, bookId]));
      
      const response = await fetch(`/api/books/${bookId}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete book');
      }
      
      // Remove the book from the local state
      setBooks(prevBooks => prevBooks.filter(book => book.id !== bookId));
      setShowDeleteConfirm(null);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete book');
    } finally {
      setDeletingBooks(prev => {
        const newSet = new Set(prev);
        newSet.delete(bookId);
        return newSet;
      });
    }
  };

  const cancelDeleteBook = () => {
    setShowDeleteConfirm(null);
  };

  const getFilteredBooks = () => {
    switch (filter) {
      case 'organization':
        return books.filter(book => book.organizationId);
      case 'marketplace':
        return books.filter(book => !book.organizationId);
      default:
        return books;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'BEGINNER': return 'bg-green-100 text-green-800';
      case 'INTERMEDIATE': return 'bg-yellow-100 text-yellow-800';
      case 'ADVANCED': return 'bg-orange-100 text-orange-800';
      case 'EXPERT': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'DATA_SCIENCE': return 'bg-blue-100 text-blue-800';
      case 'MACHINE_LEARNING': return 'bg-purple-100 text-purple-800';
      case 'HEALTHCARE': return 'bg-pink-100 text-pink-800';
      case 'FINANCE': return 'bg-emerald-100 text-emerald-800';
      case 'GEOSPATIAL': return 'bg-teal-100 text-teal-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading content...</p>
        </div>
      </div>
    );
  }

  const filteredBooks = getFilteredBooks();
  const organizationBooks = books.filter(book => book.organizationId);
  const marketplaceBooks = books.filter(book => !book.organizationId);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <nav className="flex" aria-label="Breadcrumb">
                <ol className="inline-flex items-center space-x-1 md:space-x-3">
                  <li className="inline-flex items-center">
                    <Link href={`/org/${orgSlug}/dashboard`} className="text-gray-500 hover:text-zinc-700">
                      Dashboard
                    </Link>
                  </li>
                  <li>
                    <div className="flex items-center">
                      <svg className="flex-shrink-0 h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="ml-1 text-gray-500">Content</span>
                    </div>
                  </li>
                </ol>
              </nav>
              <h1 className="mt-2 text-3xl font-bold text-gray-900">Content Management</h1>
              <p className="mt-1 text-sm text-gray-600">
                Manage your organization's learning content and access to marketplace courses
              </p>
            </div>
            {['OWNER', 'ADMIN'].includes(session?.user.role || '') && (
              <div className="flex gap-3">
                <Link
                  href={`/org/${orgSlug}/dashboard/content/create-enhanced`}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 flex items-center gap-2"
                >
                  <span>🚀</span>
                  Enhanced Builder
                </Link>
                <Link
                  href={`/org/${orgSlug}/dashboard/content/create`}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Upload Files
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-sm text-red-800">{error}</div>
          </div>
        )}

        {/* Stats and Filters */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-blue-600">{books.length}</div>
            <div className="text-sm text-gray-600">Total Courses</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-green-600">{organizationBooks.length}</div>
            <div className="text-sm text-gray-600">Organization Courses</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-purple-600">{marketplaceBooks.length}</div>
            <div className="text-sm text-gray-600">Marketplace Courses</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-orange-600">
              {books.reduce((sum, book) => sum + book.chapters.length, 0)}
            </div>
            <div className="text-sm text-gray-600">Total Chapters</div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setFilter('all')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  filter === 'all'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-zinc-700 hover:border-gray-300'
                }`}
              >
                All Courses ({books.length})
              </button>
              <button
                onClick={() => setFilter('organization')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  filter === 'organization'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-zinc-700 hover:border-gray-300'
                }`}
              >
                Organization Courses ({organizationBooks.length})
              </button>
              <button
                onClick={() => setFilter('marketplace')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  filter === 'marketplace'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-zinc-700 hover:border-gray-300'
                }`}
              >
                Marketplace Courses ({marketplaceBooks.length})
              </button>
            </nav>
          </div>
        </div>

        {/* Books Grid */}
        {filteredBooks.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No courses available</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filter === 'organization' 
                ? 'Create your first organization course or get access to marketplace content.'
                : 'No courses found for the selected filter.'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredBooks.map((book) => (
              <div key={book.id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
                {/* Card Header */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-gray-900 mb-1 truncate" title={book.title}>
                        {book.title}
                      </h3>
                      <div className="flex items-center space-x-2">
                        {book.organizationId ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                            Organization
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                            </svg>
                            Marketplace
                          </span>
                        )}
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                          book.isPublished 
                            ? 'bg-green-100 text-green-800 border-green-200'
                            : 'bg-amber-100 text-amber-800 border-amber-200'
                        }`}>
                          <div className={`w-2 h-2 rounded-full mr-1.5 ${
                            book.isPublished ? 'bg-green-500' : 'bg-amber-500'
                          }`}></div>
                          {book.isPublished ? 'Live' : 'Draft'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="px-6 py-5">
                  {/* Description */}
                  {book.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">
                      {book.description}
                    </p>
                  )}

                  {/* Meta Information */}
                  <div className="flex flex-wrap gap-2 mb-5">
                    <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium border ${getDifficultyColor(book.difficulty)} border-opacity-50`}>
                      <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      {book.difficulty}
                    </span>
                    <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium border ${getCategoryColor(book.category)} border-opacity-50`}>
                      <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      {book.category.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-5">
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-gray-900">{book.chapters.length}</div>
                      <div className="text-xs text-gray-500 font-medium">Chapters</div>
                    </div>
                    {book.estimatedHours && (
                      <div className="bg-gray-50 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-gray-900">{book.estimatedHours}</div>
                        <div className="text-xs text-gray-500 font-medium">Hours</div>
                      </div>
                    )}
                  </div>

                  {/* Chapter Preview */}
                  {book.chapters.length > 0 && (
                    <div className="mb-5">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Recent Chapters</h4>
                      <div className="space-y-2">
                        {book.chapters.slice(0, 2).map((chapter) => (
                          <div key={chapter.id} className="flex items-center p-2 bg-gray-50 rounded-lg">
                            <span className="text-lg mr-2">{chapter.emoji}</span>
                            <span className="text-sm text-zinc-700 font-medium truncate flex-1">{chapter.title}</span>
                            {!chapter.isPublished && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                Draft
                              </span>
                            )}
                          </div>
                        ))}
                        {book.chapters.length > 2 && (
                          <div className="text-xs text-gray-400 text-center py-1">
                            +{book.chapters.length - 2} more chapters
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Access Level */}
                  <div className="mb-5">
                    <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold border ${
                      book.accessType === 'ADMIN' ? 'bg-red-50 text-red-700 border-red-200' :
                      book.accessType === 'WRITE' ? 'bg-orange-50 text-orange-700 border-orange-200' : 
                      'bg-green-50 text-green-700 border-green-200'
                    }`}>
                      <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      {book.accessType} Access
                    </span>
                  </div>
                </div>

                {/* Card Footer - Actions */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                  <div className="flex flex-wrap gap-2">
                    <Link 
                      href={`/book/${book.slug}`}
                      className="inline-flex items-center px-4 py-2 border border-blue-300 text-blue-700 bg-white rounded-lg hover:bg-blue-50 hover:border-blue-400 transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 shadow-sm"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View
                    </Link>
                    {book.organizationId && book.accessType === 'ADMIN' && (
                      <>
                        <button 
                          onClick={() => toggleBookPublishStatus(book.id, book.isPublished)}
                          disabled={publishingBooks.has(book.id)}
                          className={`inline-flex items-center px-4 py-2 border rounded-lg transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm ${
                            book.isPublished 
                              ? 'border-orange-300 text-orange-700 bg-white hover:bg-orange-50 hover:border-orange-400 focus:ring-orange-500' 
                              : 'border-green-300 text-green-700 bg-white hover:bg-green-50 hover:border-green-400 focus:ring-green-500'
                          }`}
                        >
                          {book.isPublished ? (
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L17.878 17.878M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                          {publishingBooks.has(book.id) 
                            ? 'Updating...' 
                            : book.isPublished ? 'Unpublish' : 'Publish'
                          }
                        </button>
                        <button 
                          onClick={() => router.push(`/org/${orgSlug}/dashboard/content/${book.id}/edit`)}
                          className="inline-flex items-center px-4 py-2 border border-gray-300 text-zinc-700 bg-white rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-1 shadow-sm"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDeleteBook(book.id, book.title)}
                          className="inline-flex items-center px-4 py-2 border border-red-300 text-red-700 bg-white rounded-lg hover:bg-red-50 hover:border-red-400 transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 shadow-sm"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg leading-6 font-medium text-gray-900 mt-4">Delete Course</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete "<span className="font-semibold">{showDeleteConfirm.title}</span>"? 
                  This action cannot be undone and will permanently remove all chapters and content.
                </p>
              </div>
              <div className="items-center px-4 py-3">
                <div className="flex space-x-3 justify-center">
                  <button
                    onClick={cancelDeleteBook}
                    className="px-4 py-2 bg-gray-300 text-zinc-700 text-base font-medium rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDeleteBook}
                    disabled={deletingBooks.has(showDeleteConfirm.bookId)}
                    className="px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {deletingBooks.has(showDeleteConfirm.bookId) ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}