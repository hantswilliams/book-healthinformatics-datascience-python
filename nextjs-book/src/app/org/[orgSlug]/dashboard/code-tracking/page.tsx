'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useOrgSlug } from '@/lib/useOrgSlug';
import { useSupabase } from '@/lib/SupabaseProvider';
import type { CodeExecution, CodeExecutionStats } from '@/types';

interface CodeExecutionData {
  userStats: CodeExecutionStats[];
  organizationStats: {
    totalExecutions: number;
    successfulExecutions: number;
    errorExecutions: number;
    successRate: number;
    todayExecutions: number;
  };
}

interface DetailedExecution extends CodeExecution {
  users: {
    first_name?: string;
    last_name: string;
    email: string;
    username: string;
  };
  chapters: {
    title: string;
  };
}

export default function CodeTrackingDashboard() {
  const { user, userProfile, organization, loading: authLoading } = useSupabase();
  const router = useRouter();
  const orgSlug = useOrgSlug();
  const [statsData, setStatsData] = useState<CodeExecutionData | null>(null);
  const [detailedExecutions, setDetailedExecutions] = useState<DetailedExecution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'executions'>('overview');
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [selectedChapter, setSelectedChapter] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      router.push('/login');
      return;
    }

    // Check permissions - Only OWNER, ADMIN, and INSTRUCTOR can view code tracking
    if (!user || !userProfile || !organization || !['OWNER', 'ADMIN', 'INSTRUCTOR'].includes(userProfile.role)) {
      router.push(`/org/${orgSlug}/dashboard`);
      return;
    }

    fetchData();
  }, [user, userProfile, organization, authLoading, router, activeTab, selectedUser, selectedChapter, selectedStatus]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      if (activeTab === 'overview') {
        // Fetch stats
        const response = await fetch('/api/admin/code-executions?view=stats');
        if (!response.ok) throw new Error('Failed to load code execution stats');
        
        const result = await response.json();
        setStatsData(result.data);
      } else {
        // Fetch detailed executions with filters
        const params = new URLSearchParams();
        if (selectedUser !== 'all') params.append('userId', selectedUser);
        if (selectedChapter !== 'all') params.append('chapterId', selectedChapter);
        if (selectedStatus !== 'all') params.append('status', selectedStatus);
        params.append('limit', '50');

        const response = await fetch(`/api/admin/code-executions?view=detailed&${params}`);
        if (!response.ok) throw new Error('Failed to load code executions');
        
        const result = await response.json();
        setDetailedExecutions(result.data);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleString();
  };

  const truncateCode = (code: string | undefined, maxLength = 100) => {
    if (!code) return 'No code content';
    if (code.length <= maxLength) return code;
    return code.substring(0, maxLength) + '...';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'timeout': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      const params = new URLSearchParams();
      params.append('format', format);
      if (selectedUser !== 'all') params.append('userId', selectedUser);
      if (selectedChapter !== 'all') params.append('chapterId', selectedChapter);
      if (selectedStatus !== 'all') params.append('status', selectedStatus);

      const response = await fetch(`/api/admin/code-executions/export?${params}`);
      if (!response.ok) throw new Error('Export failed');

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `code-executions-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      setError('Failed to export data');
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading code tracking data...</p>
        </div>
      </div>
    );
  }

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
                      <span className="ml-1 text-gray-500">Code Tracking</span>
                    </div>
                  </li>
                </ol>
              </nav>
              <h1 className="mt-2 text-3xl font-bold text-gray-900">Code Execution Tracking</h1>
              <p className="mt-1 text-sm text-gray-600">
                Monitor and analyze learner code executions across all chapters
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => handleExport('csv')}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Export CSV
              </button>
              <button
                onClick={() => handleExport('json')}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Export JSON
              </button>
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

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => {
                  setActiveTab('overview');
                  fetchData();
                }}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Overview & Stats
              </button>
              <button
                onClick={() => {
                  setActiveTab('executions');
                  fetchData();
                }}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'executions'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Code Executions
              </button>
            </nav>
          </div>
        </div>

        {activeTab === 'overview' && statsData && (
          <>
            {/* Organization Stats */}
            <div className="mb-8 grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl shadow-sm border border-blue-200">
                <div className="text-center">
                  <h3 className="text-3xl font-bold text-blue-700">{statsData.organizationStats.totalExecutions}</h3>
                  <p className="text-sm font-medium text-blue-600 mt-1">Total Executions</p>
                </div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl shadow-sm border border-green-200">
                <div className="text-center">
                  <h3 className="text-3xl font-bold text-green-700">{statsData.organizationStats.successfulExecutions}</h3>
                  <p className="text-sm font-medium text-green-600 mt-1">Successful</p>
                </div>
              </div>
              <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-xl shadow-sm border border-red-200">
                <div className="text-center">
                  <h3 className="text-3xl font-bold text-red-700">{statsData.organizationStats.errorExecutions}</h3>
                  <p className="text-sm font-medium text-red-600 mt-1">Errors</p>
                </div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl shadow-sm border border-purple-200">
                <div className="text-center">
                  <h3 className="text-3xl font-bold text-purple-700">{statsData.organizationStats.successRate}</h3>
                  <p className="text-sm font-medium text-purple-600 mt-1">Success Rate</p>
                </div>
              </div>
              <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-6 rounded-xl shadow-sm border border-indigo-200">
                <div className="text-center">
                  <h3 className="text-3xl font-bold text-indigo-700">{statsData.organizationStats.todayExecutions}</h3>
                  <p className="text-sm font-medium text-indigo-600 mt-1">Today</p>
                </div>
              </div>
            </div>

            {/* User Stats Table */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  Learner Code Execution Summary
                </h3>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Learner
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Chapter
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Executions
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Success Rate
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Activity
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {statsData.userStats.map((stat, index) => (
                      <tr key={`${stat.userId || 'user'}-${stat.chapterId || 'chapter'}-${stat.sectionId || 'section'}-${index}`} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {stat.firstName ? `${stat.firstName} ${stat.lastName}` : stat.email}
                            </div>
                            <div className="text-sm text-gray-500">{stat.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{stat.chapterTitle}</div>
                          <div className="text-sm text-gray-500">Section: {stat.sectionId}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{stat.totalExecutions}</div>
                          <div className="text-xs text-gray-500">
                            {stat.successfulExecutions} success, {stat.errorExecutions} errors
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-16 bg-gray-200 rounded-full h-2 mr-3">
                              <div 
                                className="bg-green-600 h-2 rounded-full" 
                                style={{ 
                                  width: `${stat.totalExecutions > 0 ? (stat.successfulExecutions / stat.totalExecutions) * 100 : 0}%` 
                                }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-900">
                              {stat.totalExecutions > 0 ? Math.round((stat.successfulExecutions / stat.totalExecutions) * 100) : 0}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(stat.lastExecution)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {statsData.userStats.length === 0 && (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Code Executions Yet</h3>
                  <p className="text-gray-600">Learners haven't started executing code in the learning modules.</p>
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'executions' && (
          <>
            {/* Filters */}
            <div className="mb-6 bg-white p-4 rounded-lg shadow">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="user-filter" className="block text-sm font-medium text-gray-700 mb-1">
                    Filter by User
                  </label>
                  <select
                    id="user-filter"
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option key="all-users" value="all">All Users</option>
                    {Array.from(new Set(statsData?.userStats.map(stat => stat.userId))).map((userId) => {
                      const stat = statsData?.userStats.find(s => s.userId === userId);
                      return (
                        <option key={userId} value={userId}>
                          {stat?.firstName ? `${stat.firstName} ${stat.lastName}` : stat?.email}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div>
                  <label htmlFor="chapter-filter" className="block text-sm font-medium text-gray-700 mb-1">
                    Filter by Chapter
                  </label>
                  <select
                    id="chapter-filter"
                    value={selectedChapter}
                    onChange={(e) => setSelectedChapter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Chapters</option>
                    {Array.from(new Set(statsData?.userStats.map(s => s.chapterId))).map((chapterId) => {
                      const stat = statsData?.userStats.find(s => s.chapterId === chapterId);
                      return (
                        <option key={chapterId} value={chapterId}>
                          {stat?.chapterTitle || 'Unknown Chapter'}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div>
                  <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
                    Filter by Status
                  </label>
                  <select
                    id="status-filter"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option key="all" value="all">All Statuses</option>
                    <option key="success" value="success">Success</option>
                    <option key="error" value="error">Error</option>
                    <option key="timeout" value="timeout">Timeout</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Detailed Executions */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  Recent Code Executions ({detailedExecutions.length})
                </h3>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User & Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Chapter & Section
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Code Preview
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Mode
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {detailedExecutions.map((execution) => (
                      <tr key={execution.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {execution.users.first_name ? 
                                `${execution.users.first_name} ${execution.users.last_name}` : 
                                execution.users.username
                              }
                            </div>
                            <div className="text-sm text-gray-500">{formatDate(execution.executedAt)}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{execution.chapters.title}</div>
                          <div className="text-sm text-gray-500">Section: {execution.sectionId}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-mono text-gray-900 bg-gray-50 p-2 rounded max-w-xs overflow-hidden">
                            {truncateCode(execution.codeContent)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(execution.executionStatus)}`}>
                            {execution.executionStatus}
                          </span>
                          {execution.errorMessage && (
                            <div className="text-xs text-red-600 mt-1 max-w-xs truncate">
                              {execution.errorMessage}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            execution.executionMode === 'shared' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {execution.executionMode}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {detailedExecutions.length === 0 && (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Executions Found</h3>
                  <p className="text-gray-600">No code executions match the current filters.</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}