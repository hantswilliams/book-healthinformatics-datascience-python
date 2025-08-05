'use client';

import { useEffect, useState } from 'react';
import { notFound } from 'next/navigation';
import { useSession } from 'next-auth/react';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import PythonEditor from '@/components/PythonEditor';
import { getChapterById } from '@/data/chapters';
import type { Chapter } from '@/types';

interface ChapterPageProps {
  params: Promise<{ chapterId: string }>;
}

export default function ChapterPage({ params }: ChapterPageProps) {
  const { data: session } = useSession();
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [initialCode, setInitialCode] = useState<string>('');
  const [chapterId, setChapterId] = useState<string>('');
  const [isCompleting, setIsCompleting] = useState<boolean>(false);

  useEffect(() => {
    const loadChapter = async () => {
      const resolvedParams = await params;
      const foundChapter = getChapterById(resolvedParams.chapterId);
      
      if (!foundChapter) {
        notFound();
        return;
      }

      setChapter(foundChapter);
      setChapterId(resolvedParams.chapterId);

      // Load initial Python code
      try {
        const response = await fetch(foundChapter.pythonUrl);
        if (response.ok) {
          const code = await response.text();
          setInitialCode(code);
        }
      } catch (error) {
        console.error('Error loading Python code:', error);
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
    if (!session?.user?.id || !chapterId || isCompleting) return;
    
    setIsCompleting(true);
    
    try {
      const response = await fetch('/api/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: session.user.id,
          chapterId,
          completed: true
        })
      });

      if (response.ok) {
        alert('Congratulations! This chapter has been marked as completed.');
      } else {
        const error = await response.json();
        console.error('Error marking chapter as completed:', error);
        alert('There was an error marking the chapter as completed. Please try again.');
      }
    } catch (error) {
      console.error('Error marking chapter as completed:', error);
      alert('There was an error marking the chapter as completed. Please try again.');
    } finally {
      setIsCompleting(false);
    }
  };

  if (!chapter) {
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

  return (
    <div className="-mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 xl:-mx-12 xl:px-12 space-y-8">
      {/* Learning Content */}
      <div className="bg-white shadow-sm rounded-xl overflow-hidden">
        <div className="border-b border-gray-100 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900">{chapter.title}</h2>
        </div>
        <div className="p-6">
          <MarkdownRenderer src={chapter.markdownUrl} />
        </div>
      </div>

      {/* Interactive Code Editor */}
      <PythonEditor
        initialCode={initialCode}
        onCodeRun={handleCodeRun}
      />

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