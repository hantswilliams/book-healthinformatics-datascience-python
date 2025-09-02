'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSupabase } from '@/lib/SupabaseProvider';

interface Progress {
  id: string;
  chapterId: string;
  completed: boolean;
  completedAt?: string;
}

interface Book {
  id: string;
  slug: string;
  title: string;
  description?: string;  
  difficulty: string;
  chapters: {
    id: string;
    title: string;
    emoji: string;
  }[];
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
  const { user, organization, loading: authLoading } = useSupabase();
  const [progress, setProgress] = useState<Progress[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && organization) {
      fetchProgress();
      fetchExercises();
      fetchBooks();
    }
  }, [user, organization]);

  const fetchProgress = async () => {
    if (!user) return;
    
    try {
      const response = await fetch('/api/progress');
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
    }
  };

  const fetchBooks = async () => {
    try {
      const response = await fetch('/api/user-books');
      if (response.ok) {
        const data = await response.json();
        setBooks(data.books || []);
      }
    } catch (error) {
      console.error('Error fetching books:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
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

  if (!user || !organization) {
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
  const totalChapters = books.reduce((total, book) => total + book.chapters.length, 0);
  const completedBooks = books.filter(book => {
    const bookChapterIds = book.chapters.map(c => c.id);
    const completedBookChapters = progress.filter(p => p.completed && bookChapterIds.includes(p.chapterId));
    return completedBookChapters.length === book.chapters.length && book.chapters.length > 0;
  }).length;
  const totalExercises = exercises.length;
  const correctExercises = exercises.filter(e => e.isCorrect).length;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Progress</h1>
        <p className="text-gray-600">
          Track your learning journey through the Python courses
        </p>
      </div>

      {/* Progress Overview */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-6 rounded-xl shadow-sm border border-indigo-200">
          <div className="text-center">
            <h3 className="text-3xl font-bold text-indigo-700">{completedBooks}</h3>
            <p className="text-sm font-medium text-indigo-600 mt-1">Books Completed</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl shadow-sm border border-green-200">
          <div className="text-center">
            <h3 className="text-3xl font-bold text-green-700">{completedChapters}</h3>
            <p className="text-sm font-medium text-green-600 mt-1">Chapters Completed</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl shadow-sm border border-blue-200">
          <div className="text-center">
            <h3 className="text-3xl font-bold text-blue-700">{totalExercises}</h3>
            <p className="text-sm font-medium text-blue-600 mt-1">Total Exercises</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl shadow-sm border border-purple-200">
          <div className="text-center">
            <h3 className="text-3xl font-bold text-purple-700">
              {totalExercises > 0 ? Math.round((correctExercises / totalExercises) * 100) : 0}
            </h3>
            <p className="text-sm font-medium text-purple-600 mt-1">Success Rate</p>
          </div>
        </div>
      </div>

      {/* Book Progress */}
      <div className="space-y-6">
        {books.length > 0 ? (
          books.map((book) => {
            const bookChapterIds = book.chapters.map(c => c.id);
            const bookProgress = progress.filter(p => bookChapterIds.includes(p.chapterId));
            const completedBookChapters = bookProgress.filter(p => p.completed);
            const isBookCompleted = completedBookChapters.length === book.chapters.length && book.chapters.length > 0;
            const bookCompletionPercentage = book.chapters.length > 0 ? Math.round((completedBookChapters.length / book.chapters.length) * 100) : 0;

            return (
              <div key={book.id} className="bg-white rounded-xl shadow-sm border border-gray-100">
                {/* Book Header */}
                <div className={`p-6 border-b border-gray-200 ${
                  isBookCompleted ? 'bg-green-50' : bookProgress.length > 0 ? 'bg-blue-50' : 'bg-gray-50'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <svg className="w-8 h-8 text-indigo-600 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">{book.title}</h2>
                        <p className="text-sm text-gray-600 mt-1">{book.description}</p>
                        <div className="flex items-center space-x-4 mt-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            book.difficulty === 'BEGINNER' ? 'bg-green-100 text-green-800' :
                            book.difficulty === 'INTERMEDIATE' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {book.difficulty}
                          </span>
                          <span className={`text-sm px-2 py-1 rounded ${
                            isBookCompleted 
                              ? 'bg-green-100 text-green-800' 
                              : bookProgress.length > 0 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {isBookCompleted ? 'Completed' : bookProgress.length > 0 ? 'In Progress' : 'Not Started'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">{bookCompletionPercentage}%</div>
                      <div className="text-sm text-gray-600">{completedBookChapters.length}/{book.chapters.length} chapters</div>
                      {isBookCompleted && (
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mt-2 ml-auto">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          isBookCompleted ? 'bg-green-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${bookCompletionPercentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Chapters */}
                <div className="p-6">
                  <div className="space-y-3">
                    {book.chapters.map((chapter) => {
                      const chapterProgress = getProgressForChapter(chapter.id);
                      const chapterExercises = getExercisesForChapter(chapter.id);
                      const isCompleted = chapterProgress?.completed || false;
                      const hasStarted = chapterProgress !== undefined;

                      return (
                        <div
                          key={chapter.id}
                          className={`flex items-center justify-between p-3 border rounded-lg ${
                            isCompleted 
                              ? 'border-green-200 bg-green-50' 
                              : hasStarted 
                              ? 'border-blue-200 bg-blue-50' 
                              : 'border-gray-200'
                          }`}
                        >
                          <div className="flex items-center">
                            <svg className="w-5 h-5 text-gray-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
                            <div>
                              <h3 className="font-medium text-gray-900">{chapter.title}</h3>
                              <div className="flex items-center space-x-3 mt-1">
                                <span className={`text-xs px-2 py-1 rounded ${
                                  isCompleted 
                                    ? 'bg-green-100 text-green-800' 
                                    : hasStarted 
                                    ? 'bg-blue-100 text-blue-800' 
                                    : 'bg-gray-100 text-gray-600'
                                }`}>
                                  {isCompleted ? 'Completed' : hasStarted ? 'In Progress' : 'Not Started'}
                                </span>
                                {/* Show section completion status based on chapter completion */}
                                {isCompleted && (
                                  <span className="text-xs text-green-600">
                                    All sections completed
                                  </span>
                                )}
                                {!isCompleted && chapterExercises.length > 0 && (
                                  <span className="text-xs text-gray-600">
                                    {chapterExercises.filter(e => e.isCorrect).length}/{chapterExercises.length} exercises correct
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {isCompleted && (
                              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            )}
                            <Link
                              href={`/chapter/${chapter.id}`}
                              className="text-indigo-600 hover:text-indigo-700 font-medium text-sm"
                            >
                              {isCompleted ? 'Review' : hasStarted ? 'Continue' : 'Start'}
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Books Available</h3>
            <p className="text-gray-600">Contact your administrator to get access to learning materials.</p>
          </div>
        )}
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