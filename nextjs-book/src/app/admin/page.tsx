'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface User {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName: string;
  role: string;
  createdAt: string;
}

interface Book {
  id: string;
  slug: string;
  title: string;
  description?: string;
  difficulty: string;
  isPublished: boolean;
  order: number;
  chapters: { id: string; title: string }[];
  _count: { bookAccess: number };
}

interface BookAccess {
  id: string;
  user: {
    id: string;
    username: string;
    email: string;
    firstName?: string;
    lastName: string;
  };
  book: {
    id: string;
    title: string;
  };
  accessType: string;
  grantedAt: string;
}

interface Stats {
  totalUsers: number;
  totalStudents: number;
  totalInstructors: number;
  totalAdmins: number;
  totalBooks: number;
  totalChapters: number;
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [bookAccess, setBookAccess] = useState<BookAccess[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'books' | 'access'>('overview');
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalStudents: 0,
    totalInstructors: 0,
    totalAdmins: 0,
    totalBooks: 0,
    totalChapters: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [updatingAccess, setUpdatingAccess] = useState<string>('');

  useEffect(() => {
    if (session?.user?.role === 'ADMIN') {
      fetchData();
    }
  }, [session]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchUsers(),
        fetchBooks(),
        fetchBookAccess()
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
        
        // Calculate stats
        const userStats = data.users.reduce((acc: Stats, user: User) => {
          acc.totalUsers++;
          if (user.role === 'STUDENT') acc.totalStudents++;
          else if (user.role === 'INSTRUCTOR') acc.totalInstructors++;
          else if (user.role === 'ADMIN') acc.totalAdmins++;
          return acc;
        }, {
          totalUsers: 0,
          totalStudents: 0,
          totalInstructors: 0,
          totalAdmins: 0,
          totalBooks: 0,
          totalChapters: 0
        });
        
        setStats(prev => ({ ...prev, ...userStats }));
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchBooks = async () => {
    try {
      const response = await fetch('/api/admin/books');
      if (response.ok) {
        const data = await response.json();
        setBooks(data.books || []);
        
        const totalChapters = data.books.reduce((sum: number, book: Book) => sum + book.chapters.length, 0);
        setStats(prev => ({ 
          ...prev, 
          totalBooks: data.books.length,
          totalChapters
        }));
      }
    } catch (error) {
      console.error('Error fetching books:', error);
    }
  };

  const fetchBookAccess = async () => {
    try {
      const response = await fetch('/api/admin/book-access');
      if (response.ok) {
        const data = await response.json();
        setBookAccess(data.bookAccess || []);
      }
    } catch (error) {
      console.error('Error fetching book access:', error);
    }
  };

  const toggleBookAccess = async (userId: string, bookId: string, hasAccess: boolean) => {
    const accessKey = `${userId}-${bookId}`;
    setUpdatingAccess(accessKey);
    
    try {
      if (hasAccess) {
        // Remove access
        const accessRecord = bookAccess.find(ba => ba.user.id === userId && ba.book.id === bookId);
        if (accessRecord) {
          const response = await fetch(`/api/admin/book-access/${accessRecord.id}`, {
            method: 'DELETE'
          });
          if (response.ok) {
            setBookAccess(prev => prev.filter(ba => ba.id !== accessRecord.id));
          }
        }
      } else {
        // Grant access
        const response = await fetch('/api/admin/book-access', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userId,
            bookId,
            accessType: 'READ'
          })
        });
        if (response.ok) {
          await fetchBookAccess(); // Refresh the data
        }
      }
    } catch (error) {
      console.error('Error toggling book access:', error);
    } finally {
      setUpdatingAccess('');
    }
  };

  const getUserBookAccess = (userId: string, bookId: string) => {
    return bookAccess.some(ba => ba.user.id === userId && ba.book.id === bookId);
  };

  const getUserAccessibleBooks = (userId: string) => {
    const userAccess = bookAccess.filter(ba => ba.user.id === userId);
    return userAccess.map(ba => ba.book);
  };

  if (status === 'loading' || loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="max-w-6xl mx-auto text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Please Sign In</h1>
        <p className="text-gray-600 mb-6">You need to be signed in to access the admin panel.</p>
        <Link
          href="/login"
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Sign In
        </Link>
      </div>
    );
  }

  if (session.user.role !== 'ADMIN') {
    return (
      <div className="max-w-6xl mx-auto text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
        <p className="text-gray-600 mb-6">You don&apos;t have permission to access the admin panel.</p>
        <Link
          href="/"
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Go Home
        </Link>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-100 text-red-800';
      case 'INSTRUCTOR':
        return 'bg-blue-100 text-blue-800';
      case 'STUDENT':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Manage users, books, and access control</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'users', label: 'User Management', icon: '👥' },
            { id: 'books', label: 'Books', icon: '📚' },
            { id: 'access', label: 'Access Control', icon: '🔐' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'overview' && (
        <>
          {/* Stats Overview */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">👥</span>
                </div>
                <div className="ml-4">
                  <h3 className="text-2xl font-bold text-gray-900">{stats.totalUsers}</h3>
                  <p className="text-sm text-gray-600">Total Users</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">🎓</span>
                </div>
                <div className="ml-4">
                  <h3 className="text-2xl font-bold text-gray-900">{stats.totalStudents}</h3>
                  <p className="text-sm text-gray-600">Students</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">📚</span>
                </div>
                <div className="ml-4">
                  <h3 className="text-2xl font-bold text-gray-900">{stats.totalBooks}</h3>
                  <p className="text-sm text-gray-600">Total Books</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">📄</span>
                </div>
                <div className="ml-4">
                  <h3 className="text-2xl font-bold text-gray-900">{stats.totalChapters}</h3>
                  <p className="text-sm text-gray-600">Total Chapters</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <Link
                href="/test-db"
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
              >
                <span className="text-2xl mr-3">🗄️</span>
                <div>
                  <h3 className="font-medium text-gray-900">Database Test</h3>
                  <p className="text-sm text-gray-600">Test database connectivity</p>
                </div>
              </Link>
              
              <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors">
                <span className="text-2xl mr-3">📊</span>
                <div>
                  <h3 className="font-medium text-gray-900">Export Data</h3>
                  <p className="text-sm text-gray-600">Download user and progress data</p>
                </div>
              </button>
              
              <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors">
                <span className="text-2xl mr-3">🔄</span>
                <div>
                  <h3 className="font-medium text-gray-900">Reset Database</h3>
                  <p className="text-sm text-gray-600">Reset and reseed database</p>
                </div>
              </button>
            </div>
          </div>
        </>
      )}

      {activeTab === 'users' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">User Management</h2>
            <p className="text-sm text-gray-600 mt-1">View and manage all platform users</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Book Access
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((user) => {
                  const userBooks = getUserAccessibleBooks(user.id);
                  return (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-indigo-600">
                              {user.username.substring(0, 2).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.firstName && user.lastName 
                                ? `${user.firstName} ${user.lastName}`
                                : user.username
                              }
                            </div>
                            <div className="text-sm text-gray-500">@{user.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                          {user.role.charAt(0) + user.role.slice(1).toLowerCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-sm text-gray-900 mr-2">{userBooks.length} books</span>
                          {userBooks.length > 0 && (
                            <div className="flex -space-x-1">
                              {userBooks.slice(0, 3).map((book) => (
                                <div
                                  key={book.id}
                                  className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center border-2 border-white"
                                  title={book.title}
                                >
                                  <span className="text-xs">📚</span>
                                </div>
                              ))}
                              {userBooks.length > 3 && (
                                <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center border-2 border-white">
                                  <span className="text-xs text-gray-600">+{userBooks.length - 3}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button 
                          onClick={() => {
                            setActiveTab('access');
                            setSelectedUser(user.id);
                          }}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Manage Access
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'books' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">Book Management</h2>
            <p className="text-sm text-gray-600 mt-1">Manage learning paths and course materials</p>
          </div>
          <div className="p-6">
            <div className="grid gap-6">
              {books.map((book) => (
                <div key={book.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">📚</span>
                      <div>
                        <h3 className="font-semibold text-gray-900">{book.title}</h3>
                        <p className="text-sm text-gray-600">{book.description}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            book.difficulty === 'BEGINNER' ? 'bg-green-100 text-green-800' :
                            book.difficulty === 'INTERMEDIATE' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {book.difficulty}
                          </span>
                          <span className="text-xs text-gray-500">
                            {book.chapters.length} chapters
                          </span>
                          <span className="text-xs text-gray-500">
                            {book._count.bookAccess} users have access
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        book.isPublished ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {book.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'access' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Access Control Center</h2>
              <p className="text-sm text-gray-600 mt-1">Control which users can access specific learning paths</p>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                {users.map((user) => {
                  const userBooks = getUserAccessibleBooks(user.id);
                  const isExpanded = selectedUser === user.id;
                  
                  return (
                    <div key={user.id} className="border border-gray-200 rounded-lg">
                      {/* User Header */}
                      <div className="p-4 bg-gray-50 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-indigo-600">
                                {user.username.substring(0, 2).toUpperCase()}
                              </span>
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">
                                {user.firstName && user.lastName 
                                  ? `${user.firstName} ${user.lastName}`
                                  : user.username
                                }
                              </div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                            <span className={`ml-4 px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                              {user.role.charAt(0) + user.role.slice(1).toLowerCase()}
                            </span>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <div className="text-sm font-medium text-gray-900">{userBooks.length} of {books.length} books</div>
                              <div className="text-xs text-gray-500">Access granted</div>
                            </div>
                            <button
                              onClick={() => setSelectedUser(isExpanded ? '' : user.id)}
                              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                              <svg className={`w-5 h-5 transform transition-transform ${
                                isExpanded ? 'rotate-90' : ''
                              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      {/* Book Access Controls */}
                      {isExpanded && (
                        <div className="p-4">
                          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {books.map((book) => {
                              const hasAccess = getUserBookAccess(user.id, book.id);
                              const accessKey = `${user.id}-${book.id}`;
                              const isUpdating = updatingAccess === accessKey;
                              
                              return (
                                <div key={book.id} className={`p-4 border rounded-lg transition-colors ${
                                  hasAccess ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
                                }`}>
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center flex-1">
                                      <span className="text-lg mr-2">📚</span>
                                      <div className="flex-1">
                                        <div className="text-sm font-medium text-gray-900">{book.title}</div>
                                        <div className="text-xs text-gray-500">
                                          {book.difficulty} • {book.chapters.length} chapters
                                        </div>
                                      </div>
                                    </div>
                                    <div className="ml-3">
                                      <button
                                        onClick={() => toggleBookAccess(user.id, book.id, hasAccess)}
                                        disabled={isUpdating}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                                          hasAccess ? 'bg-indigo-600' : 'bg-gray-200'
                                        } ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                        title={hasAccess ? 'Remove access' : 'Grant access'}
                                      >
                                        <span
                                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                            hasAccess ? 'translate-x-6' : 'translate-x-1'
                                          }`}
                                        />
                                        {isUpdating && (
                                          <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="animate-spin h-3 w-3 border border-gray-300 rounded-full border-t-gray-600"></div>
                                          </div>
                                        )}
                                      </button>
                                    </div>
                                  </div>
                                  
                                  {hasAccess && (
                                    <div className="mt-2 text-xs text-green-700">
                                      ✓ Access granted
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          
                          {/* Bulk Actions */}
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Bulk Actions:</span>
                              <div className="space-x-2">
                                <button
                                  onClick={() => {
                                    books.forEach(book => {
                                      if (!getUserBookAccess(user.id, book.id)) {
                                        toggleBookAccess(user.id, book.id, false);
                                      }
                                    });
                                  }}
                                  className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                                >
                                  Grant All
                                </button>
                                <button
                                  onClick={() => {
                                    books.forEach(book => {
                                      if (getUserBookAccess(user.id, book.id)) {
                                        toggleBookAccess(user.id, book.id, true);
                                      }
                                    });
                                  }}
                                  className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                                >
                                  Revoke All
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}