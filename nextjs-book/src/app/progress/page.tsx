'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { chapters } from '@/data/chapters';

interface Progress {
  id: string;
  chapterId: string;
  completed: boolean;
  completedAt?: string;
}

interface Exercise {
  id: string;
  chapterId: string;
  title: string;
  isCorrect: boolean;
  attempts: number;
  createdAt: string;
}

export default function ProgressPage() {
  const { data: session, status } = useSession();
  const [progress, setProgress] = useState<Progress[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user) {
      fetchProgress();
      fetchExercises();
    }
  }, [session]);

  const fetchProgress = async () => {
    if (!session?.user?.id) return;
    
    try {
      const response = await fetch(`/api/progress?userId=${session.user.id}`);
      if (response.ok) {
        const data = await response.json();
        setProgress(data.progress || []);
      }
    } catch (error) {
      console.error('Error fetching progress:', error);
    }
  };

  const fetchExercises = async () => {
    try {
      const response = await fetch('/api/exercises');
      if (response.ok) {
        const data = await response.json();
        setExercises(data.exercises || []);
      }
    } catch (error) {
      console.error('Error fetching exercises:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Please Sign In</h1>
        <p className="text-gray-600 mb-6">You need to be signed in to view your progress.</p>
        <Link
          href="/login"
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Sign In
        </Link>
      </div>
    );
  }

  const getProgressForChapter = (chapterId: string) => {
    return progress.find(p => p.chapterId === chapterId);
  };

  const getExercisesForChapter = (chapterId: string) => {
    return exercises.filter(e => e.chapterId === chapterId);
  };

  const completedChapters = progress.filter(p => p.completed).length;
  const totalExercises = exercises.length;
  const correctExercises = exercises.filter(e => e.isCorrect).length;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Progress</h1>
        <p className="text-gray-600">
          Track your learning journey through the Python for Healthcare course
        </p>
      </div>

      {/* Progress Overview */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">✅</span>
            </div>
            <div className="ml-4">
              <h3 className="text-2xl font-bold text-gray-900">{completedChapters}</h3>
              <p className="text-sm text-gray-600">Chapters Completed</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🏃‍♂️</span>
            </div>
            <div className="ml-4">
              <h3 className="text-2xl font-bold text-gray-900">{totalExercises}</h3>
              <p className="text-sm text-gray-600">Total Exercises</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🎯</span>
            </div>
            <div className="ml-4">
              <h3 className="text-2xl font-bold text-gray-900">
                {totalExercises > 0 ? Math.round((correctExercises / totalExercises) * 100) : 0}%
              </h3>
              <p className="text-sm text-gray-600">Success Rate</p>
            </div>
          </div>
        </div>
      </div>

      {/* Chapter Progress */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Chapter Progress</h2>
        <div className="space-y-4">
          {chapters.map((chapter) => {
            const chapterProgress = getProgressForChapter(chapter.id);
            const chapterExercises = getExercisesForChapter(chapter.id);
            const isCompleted = chapterProgress?.completed || false;
            const hasStarted = chapterProgress !== undefined;

            return (
              <div
                key={chapter.id}
                className={`flex items-center justify-between p-4 border rounded-lg ${
                  isCompleted 
                    ? 'border-green-200 bg-green-50' 
                    : hasStarted 
                    ? 'border-blue-200 bg-blue-50' 
                    : 'border-gray-200'
                }`}
              >
                <div className="flex items-center">
                  <span className="text-2xl mr-4">{chapter.emoji}</span>
                  <div>
                    <h3 className="font-semibold text-gray-900">{chapter.title}</h3>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className={`text-sm px-2 py-1 rounded ${
                        isCompleted 
                          ? 'bg-green-100 text-green-800' 
                          : hasStarted 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {isCompleted ? 'Completed' : hasStarted ? 'In Progress' : 'Not Started'}
                      </span>
                      {chapterExercises.length > 0 && (
                        <span className="text-sm text-gray-600">
                          {chapterExercises.filter(e => e.isCorrect).length}/{chapterExercises.length} exercises correct
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {isCompleted && (
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                  <Link
                    href={`/chapter/${chapter.id}`}
                    className="text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    {isCompleted ? 'Review' : hasStarted ? 'Continue' : 'Start'}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Exercises */}
      {exercises.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mt-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Exercises</h2>
          <div className="space-y-3">
            {exercises.slice(0, 5).map((exercise) => (
              <div key={exercise.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">{exercise.title}</h4>
                  <p className="text-sm text-gray-600">
                    Chapter {exercise.chapterId.replace('chapter', '')} • {exercise.attempts} attempt{exercise.attempts !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className={`px-2 py-1 rounded text-sm ${
                  exercise.isCorrect 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {exercise.isCorrect ? 'Correct' : 'Needs Work'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}