'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useOrgSlug } from '@/lib/useOrgSlug';
import { useSupabase } from '@/lib/SupabaseProvider';

interface BookProgress {
  bookId: string;
  bookTitle: string;
  bookSlug: string;
  totalChapters: number;
  completedChapters: number;
  progressPercentage: number;
  lastActivity: number | null;
  hasAccess?: boolean; // For allBooksProgress to indicate if user has access
}

interface UserProgress {
  id: string;
  firstName?: string;
  lastName: string;
  email: string;
  role: string;
  joinedAt: string;
  lastLoginAt?: string;
  totalChapters: number;
  completedChapters: number;
  progressPercentage: number;
  totalTimeSpent: number;
  bookProgress: BookProgress[];
  allBooksProgress?: BookProgress[]; // ALL organization books with access status
  recentActivity: any[];
  accessibleBooksCount?: number; // Number of books user has access to
}

interface OrganizationStats {
  totalUsers: number;
  totalBooks: number;
  totalChapters: number;
  averageProgress: number;
  totalTimeSpent: number;
  activeUsers: number;
}

interface ProgressData {
  organizationStats: OrganizationStats;
  userProgress: UserProgress[];
  books: Array<{
    id: string;
    title: string;
    slug: string;
    totalChapters: number;
  }>;
}

export default function ProgressDashboard() {
  const { user, userProfile, organization, loading: authLoading } = useSupabase();
  const router = useRouter();
  const orgSlug = useOrgSlug();
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedBook, setSelectedBook] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'progress' | 'activity'>('progress');
  const [selectedUser, setSelectedUser] = useState<UserProgress | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      router.push('/login');
      return;
    }

    // Check permissions - Only OWNER, ADMIN, and INSTRUCTOR can view progress
    if (!user || !userProfile || !organization || !['OWNER', 'ADMIN', 'INSTRUCTOR'].includes(userProfile.role)) {
      router.push(`/org/${orgSlug}/dashboard`);
      return;
    }

    fetchProgressData();
  }, [user, userProfile, organization, authLoading, router]);

  const fetchProgressData = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/organizations/progress');
      if (!response.ok) {
        throw new Error('Failed to load progress data');
      }

      const result = await response.json();
      setProgressData(result.data);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load progress data');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimeSpent = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const formatLastActivity = (timestamp: string | undefined) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const getSortedUsers = () => {
    if (!progressData) return [];
    
    let users = [...progressData.userProgress];
    
    // Filter by selected book if not 'all'
    if (selectedBook !== 'all') {
      users = users.map(user => ({
        ...user,
        bookProgress: user.bookProgress.filter(bp => bp.bookId === selectedBook)
      }));
    }

    // Sort users
    users.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
        case 'progress':
          return b.progressPercentage - a.progressPercentage;
        case 'activity':
          const aActivity = a.lastLoginAt ? new Date(a.lastLoginAt).getTime() : 0;
          const bActivity = b.lastLoginAt ? new Date(b.lastLoginAt).getTime() : 0;
          return bActivity - aActivity;
        default:
          return 0;
      }
    });

    return users;
  };

  const handleUserClick = (user: UserProgress) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'OWNER': return 'bg-red-100 text-red-800';
      case 'ADMIN': return 'bg-purple-100 text-purple-800';
      case 'INSTRUCTOR': return 'bg-blue-100 text-blue-800';
      case 'LEARNER': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading progress data...</p>
        </div>
      </div>
    );
  }

  if (!progressData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No progress data available</p>
        </div>
      </div>
    );
  }

  const sortedUsers = getSortedUsers();

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
                      <span className="ml-1 text-gray-500">Progress</span>
                    </div>
                  </li>
                </ol>
              </nav>
              <h1 className="mt-2 text-3xl font-bold text-gray-900">Learning Progress</h1>
              <p className="mt-1 text-sm text-gray-600">
                Track your team's learning progress and engagement
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-sm text-red-800">{error}</div>
          </div>
        )}

        {/* Organization Stats */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-blue-600">{progressData.organizationStats.totalUsers}</div>
            <div className="text-sm text-gray-600">Total Users</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-green-600">{progressData.organizationStats.activeUsers}</div>
            <div className="text-sm text-gray-600">Active Users</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-purple-600">{progressData.organizationStats.totalBooks}</div>
            <div className="text-sm text-gray-600">Available Courses</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-orange-600">{progressData.organizationStats.totalChapters}</div>
            <div className="text-sm text-gray-600">Total Chapters</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-indigo-600">{progressData.organizationStats.averageProgress}%</div>
            <div className="text-sm text-gray-600">Avg Progress</div>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="mb-6 bg-white p-4 rounded-lg shadow">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex space-x-4">
              <div>
                <label htmlFor="book-filter" className="block text-sm font-medium text-zinc-700 mb-1">
                  Filter by Book
                </label>
                <select
                  id="book-filter"
                  value={selectedBook}
                  onChange={(e) => setSelectedBook(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Books</option>
                  {progressData.books.map((book) => (
                    <option key={book.id} value={book.id}>
                      {book.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="sort-by" className="block text-sm font-medium text-zinc-700 mb-1">
                  Sort by
                </label>
                <select
                  id="sort-by"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'name' | 'progress' | 'activity')}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="progress">Progress</option>
                  <option value="name">Name</option>
                  <option value="activity">Last Activity</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* User Progress Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Team Progress ({sortedUsers.length} users)
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Course Access
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Chapters
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Activity
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedUsers.map((user) => (
                  <tr 
                    key={user.id} 
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleUserClick(user)}
                    title={user.progressPercentage > 100 ? "Click to see detailed progress breakdown" : "Click for detailed progress"}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 bg-gray-300 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-zinc-700">
                              {user.firstName?.[0] || user.email[0].toUpperCase()}
                              {user.lastName[0].toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <span className="text-lg mr-2">📚</span>
                        <span className="font-medium">{user.accessibleBooksCount || user.bookProgress.length}</span>
                        <span className="text-gray-500 ml-1">books</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-3">
                          <div 
                            className={`h-2 rounded-full ${user.progressPercentage > 100 ? 'bg-green-600' : 'bg-blue-600'}`}
                            style={{ width: `${Math.min(100, user.progressPercentage)}%` }}
                          ></div>
                        </div>
                        <span className={`text-sm ${user.progressPercentage > 100 ? 'text-green-600 font-semibold' : 'text-gray-900'}`}>
                          {user.progressPercentage}%
                          {user.progressPercentage > 100 && <span className="text-xs ml-1">📊</span>}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.completedChapters} / {user.totalChapters}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatLastActivity(user.lastLoginAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {sortedUsers.length === 0 && (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No progress data</h3>
              <p className="mt-1 text-sm text-gray-500">Users haven't started any content yet.</p>
            </div>
          )}
        </div>

        {/* Progress Details Modal */}
        {isModalOpen && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">
                  Progress Details - {selectedUser.firstName} {selectedUser.lastName}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
                {/* User Summary */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {selectedUser.accessibleBooksCount || selectedUser.bookProgress.length}
                      </div>
                      <div className="text-sm text-gray-600">Accessible Books</div>
                      {selectedUser.allBooksProgress && (
                        <div className="text-xs text-gray-500 mt-1">
                          of {selectedUser.allBooksProgress.length} total
                        </div>
                      )}
                    </div>
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${selectedUser.progressPercentage > 100 ? 'text-green-600' : 'text-blue-600'}`}>
                        {selectedUser.progressPercentage}%
                      </div>
                      <div className="text-sm text-gray-600">Overall Progress</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {selectedUser.completedChapters}/{selectedUser.totalChapters}
                      </div>
                      <div className="text-sm text-gray-600">Chapters</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {formatTimeSpent(selectedUser.totalTimeSpent)}
                      </div>
                      <div className="text-sm text-gray-600">Time Spent</div>
                    </div>
                  </div>
                </div>

                {/* Book-by-Book Progress */}
                <div className="space-y-4">
                  <h4 className="text-md font-semibold text-gray-900 mb-4">Progress by Course (All Organization Courses)</h4>
                  {(selectedUser.allBooksProgress || selectedUser.bookProgress).length > 0 ? (
                    (selectedUser.allBooksProgress || selectedUser.bookProgress)
                      .sort((a, b) => {
                        // Sort by access status first (accessible first), then by progress
                        if (a.hasAccess !== undefined && b.hasAccess !== undefined) {
                          if (a.hasAccess && !b.hasAccess) return -1;
                          if (!a.hasAccess && b.hasAccess) return 1;
                        }
                        return b.progressPercentage - a.progressPercentage;
                      })
                      .map((book) => (
                      <div key={book.bookId} className={`border rounded-lg p-4 ${book.hasAccess === false ? 'border-gray-300 bg-gray-50' : 'border-gray-200 bg-white'}`}>
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <h5 className={`font-medium ${book.hasAccess === false ? 'text-gray-600' : 'text-gray-900'}`}>
                                {book.bookTitle}
                              </h5>
                              {book.hasAccess === false && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                  🔒 No Access
                                </span>
                              )}
                              {book.hasAccess === true && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                  ✓ Access Granted
                                </span>
                              )}
                            </div>
                            <div className={`text-sm ${book.hasAccess === false ? 'text-gray-400' : 'text-gray-500'}`}>
                              {book.completedChapters} of {book.totalChapters} chapters completed
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-lg font-semibold ${
                              book.progressPercentage > 100 
                                ? 'text-green-600' 
                                : book.hasAccess === false 
                                  ? 'text-gray-500' 
                                  : 'text-blue-600'
                            }`}>
                              {book.progressPercentage}%
                            </div>
                            {book.lastActivity && (
                              <div className="text-xs text-gray-500">
                                Last activity: {formatLastActivity(new Date(book.lastActivity).toISOString())}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              book.progressPercentage > 100 
                                ? 'bg-green-600' 
                                : book.hasAccess === false 
                                  ? 'bg-gray-400' 
                                  : 'bg-blue-600'
                            }`}
                            style={{ width: `${Math.min(100, book.progressPercentage)}%` }}
                          ></div>
                        </div>
                        {book.progressPercentage > 100 && (
                          <div className="mt-2 text-xs text-orange-600">
                            ⚠️ User completed chapters from this course when it was accessible
                          </div>
                        )}
                        {book.hasAccess === false && book.progressPercentage === 0 && (
                          <div className="mt-2 text-xs text-gray-500">
                            📚 Course not accessible to this user
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <p>No progress data available for accessible courses.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}