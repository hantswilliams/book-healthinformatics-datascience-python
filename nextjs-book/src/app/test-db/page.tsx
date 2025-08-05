'use client';

import { useEffect, useState } from 'react';

interface User {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName: string;
  role: string;
  createdAt: string;
}

interface Chapter {
  id: string;
  title: string;
  emoji: string;
  order: number;
  markdownUrl: string;
  pythonUrl: string;
}

interface Exercise {
  id: string;
  title: string;
  code: string;
  isCorrect: boolean;
  attempts: number;
  createdAt: string;
  user: {
    username: string;
    firstName?: string;
    lastName: string;
  };
  chapter: {
    title: string;
  };
}

export default function TestDbPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch all data in parallel
        const [usersRes, chaptersRes, exercisesRes] = await Promise.all([
          fetch('/api/users'),
          fetch('/api/chapters'),
          fetch('/api/exercises')
        ]);

        if (!usersRes.ok || !chaptersRes.ok || !exercisesRes.ok) {
          throw new Error('Failed to fetch data');
        }

        const [usersData, chaptersData, exercisesData] = await Promise.all([
          usersRes.json(),
          chaptersRes.json(),
          exercisesRes.json()
        ]);

        setUsers(usersData.users);
        setChapters(chaptersData.chapters);
        setExercises(exercisesData.exercises);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <h1 className="text-xl font-bold text-red-800 mb-2">Database Test Failed</h1>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">🧪 Database Test Results</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Users Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">👥 Users ({users.length})</h2>
          <div className="space-y-3">
            {users.map((user) => (
              <div key={user.id} className="border border-gray-200 rounded p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-900">{user.username}</p>
                    <p className="text-sm text-gray-600">{user.email}</p>
                    {user.firstName && (
                      <p className="text-sm text-gray-600">
                        {user.firstName} {user.lastName}
                      </p>
                    )}
                  </div>
                  <span className={`px-2 py-1 text-xs rounded ${
                    user.role === 'ADMIN' ? 'bg-red-100 text-red-800' :
                    user.role === 'INSTRUCTOR' ? 'bg-blue-100 text-blue-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {user.role}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chapters Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">📚 Chapters ({chapters.length})</h2>
          <div className="space-y-3">
            {chapters.map((chapter) => (
              <div key={chapter.id} className="border border-gray-200 rounded p-3">
                <div className="flex items-start">
                  <span className="text-lg mr-3">{chapter.emoji}</span>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{chapter.title}</p>
                    <p className="text-sm text-gray-600">Order: {chapter.order}</p>
                    <p className="text-xs text-gray-500 mt-1">ID: {chapter.id}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Exercises Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">🏃‍♂️ Exercises ({exercises.length})</h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {exercises.map((exercise) => (
              <div key={exercise.id} className="border border-gray-200 rounded p-3">
                <div className="flex justify-between items-start mb-2">
                  <p className="font-medium text-gray-900 text-sm">{exercise.title}</p>
                  <div className="flex items-center space-x-2">
                    <span className={`w-2 h-2 rounded-full ${
                      exercise.isCorrect ? 'bg-green-400' : 'bg-red-400'
                    }`}></span>
                    <span className="text-xs text-gray-500">×{exercise.attempts}</span>
                  </div>
                </div>
                <p className="text-xs text-gray-600 mb-2">
                  by {exercise.user.firstName || exercise.user.username} • {exercise.chapter.title}
                </p>
                <div className="bg-gray-50 rounded p-2">
                  <code className="text-xs text-gray-800 break-all">
                    {exercise.code.length > 50 
                      ? exercise.code.substring(0, 50) + '...'
                      : exercise.code
                    }
                  </code>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mt-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg p-6 text-white">
        <h2 className="text-xl font-semibold mb-4">📊 Database Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{users.length}</div>
            <div className="text-sm opacity-90">Total Users</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{chapters.length}</div>
            <div className="text-sm opacity-90">Chapters</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{exercises.length}</div>
            <div className="text-sm opacity-90">Exercises</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">
              {exercises.filter(ex => ex.isCorrect).length}
            </div>
            <div className="text-sm opacity-90">Correct Solutions</div>
          </div>
        </div>
      </div>

      {/* Database Commands */}
      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">🛠️ Database Commands</h2>
        <div className="bg-gray-50 rounded p-4">
          <p className="text-sm text-gray-600 mb-2">Useful commands for database management:</p>
          <div className="space-y-1 text-sm font-mono">
            <div><span className="text-green-600">npm run db:studio</span> - Open Prisma Studio</div>
            <div><span className="text-green-600">npm run db:seed</span> - Reseed database</div>
            <div><span className="text-green-600">npm run db:reset</span> - Reset and reseed database</div>
          </div>
        </div>
      </div>
    </div>
  );
}