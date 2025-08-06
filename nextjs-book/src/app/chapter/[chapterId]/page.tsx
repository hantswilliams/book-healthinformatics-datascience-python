'use client';

import { useEffect, useState } from 'react';
import { notFound } from 'next/navigation';
import { useSession } from 'next-auth/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import PythonEditor from '@/components/PythonEditor';
import type { Chapter } from '@/types';

interface ChapterPageProps {
  params: Promise<{ chapterId: string }>;
}

export default function ChapterPage({ params }: ChapterPageProps) {
  const { data: session } = useSession();
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [chapterId, setChapterId] = useState<string>('');
  const [isCompleting, setIsCompleting] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const loadChapter = async () => {
      try {
        setLoading(true);
        setError('');
        
        const resolvedParams = await params;
        const chapterIdValue = resolvedParams.chapterId;
        setChapterId(chapterIdValue);
        
        const response = await fetch(`/api/chapters/${chapterIdValue}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            notFound();
            return;
          }
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to load chapter');
        }
        
        const data = await response.json();
        setChapter(data.chapter);
        
      } catch (err) {
        console.error('Error loading chapter:', err);
        setError(err instanceof Error ? err.message : 'Failed to load chapter');
      } finally {
        setLoading(false);
      }
    };

    loadChapter();
  }, [params]);

  const handleCodeRun = (code: string, success: boolean) => {
    // Track exercise attempt (in a real app, you'd send this to your backend)
    console.log('Exercise attempt:', {
      chapterId,
      code,
      success,
      timestamp: new Date().toISOString()
    });
  };

  const handleMarkCompleted = async () => {
    if (!session?.user || !chapterId || isCompleting) return;
    
    setIsCompleting(true);
    
    try {
      const response = await fetch('/api/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chapterId,
          completed: true
        })
      });

      const result = await response.json();

      if (response.ok) {
        alert(`Congratulations! ${result.message || 'This chapter has been marked as completed.'}`);
      } else {
        console.error('Error marking chapter as completed:', result);
        alert(result.error || 'There was an error marking the chapter as completed. Please try again.');
      }
    } catch (error) {
      console.error('Error marking chapter as completed:', error);
      alert('There was an error marking the chapter as completed. Please try again.');
    } finally {
      setIsCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="-mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 xl:-mx-12 xl:px-12">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="bg-white shadow-sm rounded-xl p-6">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="-mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 xl:-mx-12 xl:px-12">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-red-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.502 0L4.32 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h3 className="text-sm font-medium text-red-800">
              Unable to load chapter
            </h3>
          </div>
          <div className="mt-2">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!chapter) {
    return (
      <div className="-mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 xl:-mx-12 xl:px-12">
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center">
          <p className="text-gray-600">Chapter not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="-mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 xl:-mx-12 xl:px-12 space-y-8">
      {/* Chapter Header */}
      <div className="bg-white shadow-sm rounded-xl p-6">
        <div className="flex items-center space-x-2 mb-2">
          <span className="text-2xl">{chapter.emoji}</span>
          <h1 className="text-2xl font-bold text-gray-900">{chapter.title}</h1>
        </div>
        {chapter.bookTitle && (
          <p className="text-sm text-gray-600">From: {chapter.bookTitle}</p>
        )}
        {chapter.estimatedMinutes && (
          <p className="text-sm text-gray-500">
            Estimated time: {chapter.estimatedMinutes} minutes
          </p>
        )}
      </div>

      {/* Chapter Sections */}
      {chapter.sections.map((section, index) => (
        <div key={section.id} className="bg-white shadow-sm rounded-xl overflow-hidden">
          {section.title && (
            <div className="border-b border-gray-100 bg-white p-6">
              <h2 className="text-lg font-semibold text-zinc-900">
                {section.title}
              </h2>
            </div>
          )}
          <div className="p-6">
            {section.type === 'markdown' ? (
              <div className="prose prose-zinc max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code: ({ className, children, ...props }) => {
                      const isInline = !className;
                      return isInline ? (
                        <code
                          className="bg-gray-100 text-zinc-800 px-1 py-0.5 rounded text-sm font-mono"
                          {...props}
                        >
                          {children}
                        </code>
                      ) : (
                        <code
                          className="block bg-gray-900 text-zinc-100 p-4 rounded-md overflow-x-auto text-sm font-mono"
                          {...props}
                        >
                          {children}
                        </code>
                      );
                    },
                    h1: ({ children }) => (
                      <h1 className="text-3xl font-bold text-zinc-900 mb-6 border-b border-gray-200 pb-2">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-2xl font-semibold text-zinc-900 mt-8 mb-4">
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-xl font-semibold text-zinc-900 mt-6 mb-3">
                        {children}
                      </h3>
                    )
                  }}
                >
                  {section.content}
                </ReactMarkdown>
              </div>
            ) : (
              <PythonEditor
                initialCode={section.content || '# No code provided'}
                onCodeRun={handleCodeRun}
              />
            )}
          </div>
        </div>
      ))}

      {/* Mark as Completed Button */}
      <div className="text-center">
        <button
          onClick={handleMarkCompleted}
          disabled={isCompleting || !session?.user?.id}
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
          {isCompleting ? 'Marking as Completed...' : 'Mark Chapter as Completed'}
        </button>
      </div>
    </div>
  );
}