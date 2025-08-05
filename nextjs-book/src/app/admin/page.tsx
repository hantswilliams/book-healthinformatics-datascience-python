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

interface Stats {
  totalUsers: number;
  totalStudents: number;
  totalInstructors: number;
  totalAdmins: number;
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalStudents: 0,
    totalInstructors: 0,
    totalAdmins: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.role === 'ADMIN') {
      fetchUsers();
    }
  }, [session]);

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
          totalAdmins: 0
        });
        
        setStats(userStats);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
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
        <p className="text-gray-600">Manage users and monitor platform activity</p>
      </div>

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
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">👨‍🏫</span>
            </div>
            <div className="ml-4">
              <h3 className="text-2xl font-bold text-gray-900">{stats.totalInstructors}</h3>
              <p className="text-sm text-gray-600">Instructors</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">⚡</span>
            </div>
            <div className="ml-4">
              <h3 className="text-2xl font-bold text-gray-900">{stats.totalAdmins}</h3>
              <p className="text-sm text-gray-600">Admins</p>
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">All Users</h2>
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
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((user) => (
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-indigo-600 hover:text-indigo-900 mr-3">
                      View
                    </button>
                    <button className="text-red-600 hover:text-red-900">
                      Disable
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mt-8">
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
    </div>
  );
}