'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useOrgSlug } from '@/lib/useOrgSlug';
import EnhancedChapterBuilder from '@/components/EnhancedChapterBuilder';
import { useSupabase } from '@/lib/SupabaseProvider';

// Enhanced interfaces that match our new schema
interface EnhancedSection {
  id?: string;
  type: 'markdown' | 'python';
  title: string;
  content: string;
  executionMode: 'shared' | 'isolated' | 'inherit';
  order: number;
  dependsOn?: string[];
  isEditing?: boolean;
}

interface EnhancedChapter {
  id?: string;
  title: string;
  emoji: string;
  defaultExecutionMode: 'shared' | 'isolated';
  sections: EnhancedSection[];
  packages?: string[];
  order: number;
}

interface BookForm {
  title: string;
  description: string;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  category: string;
  estimatedHours: number;
  tags: string;
}

interface EnhancedBookData {
  id: string;
  slug: string;
  title: string;
  description: string;
  difficulty: string;
  category: string;
  estimatedHours: number;
  tags: string[];
  chapters: EnhancedChapter[];
}

export default function EditEnhancedPage() {
  const { user, userProfile, organization, loading: authLoading } = useSupabase();
  const router = useRouter();
  const params = useParams();
  const orgSlug = useOrgSlug();
  const bookId = params?.bookId as string;
  
  const [step, setStep] = useState(1); // 1: Book Info, 2: Chapter Builder, 3: Review & Update
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [bookForm, setBookForm] = useState<BookForm>({
    title: '',
    description: '',
    difficulty: 'BEGINNER',
    category: 'GENERAL',
    estimatedHours: 1,
    tags: ''
  });

  const [chapters, setChapters] = useState<EnhancedChapter[]>([]);
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [originalBookId, setOriginalBookId] = useState('');
  const [isClient, setIsClient] = useState(false);
  const [chapterIdCounter, setChapterIdCounter] = useState(0);

  const fetchBookData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const res = await fetch(`/api/books/${bookId}/full`);
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to load book data');
      }
      
      const book = data.book;
      console.log('Loaded book data:', book);
      console.log('Book chapters:', book.chapters);
      book.chapters?.forEach((chapter: any, index: number) => {
        console.log(`Chapter ${index}:`, chapter.title, 'packages:', chapter.packages);
      });
      
      setOriginalBookId(book.id);
      
      // Set book form data
      setBookForm({
        title: book.title,
        description: book.description || '',
        difficulty: book.difficulty,
        category: book.category,
        estimatedHours: book.estimatedHours || 1,
        tags: book.tags.join(', ')
      });
      
      // Set chapters data
      setChapters(book.chapters || []);
      
    } catch (e: any) {
      console.error('Error fetching book data:', e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [bookId]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || authLoading) return;
    if (!user || !userProfile || !organization) {
      router.push('/login');
      return;
    }
    if (!['OWNER', 'ADMIN', 'INSTRUCTOR'].includes(userProfile.role)) {
      router.push(`/org/${orgSlug}/dashboard/content`);
      return;
    }
    fetchBookData();
  }, [isClient, authLoading, user?.id, bookId, orgSlug, router, fetchBookData]);

  const addNewChapter = () => {
    setChapterIdCounter(prev => prev + 1);
    const newChapter: EnhancedChapter = {
      id: `chapter-new-${chapterIdCounter + 1}`,
      title: `Chapter ${chapters.length + 1}`,
      emoji: '📖',
      defaultExecutionMode: 'shared',
      sections: [],
      packages: [],
      order: chapters.length
    };
    setChapters([...chapters, newChapter]);
    setCurrentChapterIndex(chapters.length);
  };

  const updateChapter = useCallback((updatedChapter: EnhancedChapter) => {
    setChapters(prevChapters => 
      prevChapters.map(chapter => 
        chapter.id === updatedChapter.id ? updatedChapter : chapter
      )
    );
  }, []);

  const removeChapter = (chapterId: string) => {
    const updatedChapters = chapters
      .filter(chapter => chapter.id !== chapterId)
      .map((chapter, index) => ({ ...chapter, order: index }));
    setChapters(updatedChapters);
    
    if (currentChapterIndex >= updatedChapters.length) {
      setCurrentChapterIndex(Math.max(0, updatedChapters.length - 1));
    }
  };

  const updateBook = async () => {
    try {
      setIsLoading(true);
      setError('');

      if (!bookForm.title || chapters.length === 0) {
        setError('Please provide a course title and create at least one chapter');
        return;
      }

      // Validate that all chapters have at least one section
      const emptyChapters = chapters.filter(chapter => chapter.sections.length === 0);
      if (emptyChapters.length > 0) {
        setError(`Chapters "${emptyChapters.map(c => c.title).join('", "')}" must have at least one section`);
        return;
      }

      // Convert to API format
      const chaptersData = chapters
        .sort((a, b) => a.order - b.order)
        .map((chapter, index) => ({
          title: chapter.title,
          emoji: chapter.emoji,
          order: index,
          defaultExecutionMode: chapter.defaultExecutionMode,
          packages: chapter.packages || [],
          sections: chapter.sections
            .sort((a, b) => a.order - b.order)
            .map((section, sectionIndex) => ({
              title: section.title || `Section ${sectionIndex + 1}`,
              type: section.type,
              content: section.content,
              order: sectionIndex,
              executionMode: section.executionMode,
              dependsOn: section.dependsOn || []
            }))
        }));

      const bookData = {
        ...bookForm,
        tags: bookForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        chapters: chaptersData
      };

      const response = await fetch(`/api/books/${bookId}/update-enhanced`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update course');
      }

      router.push(`/org/${orgSlug}/dashboard/content`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update course');
    } finally {
      setIsLoading(false);
    }
  };

  // Check permissions and client-side rendering
  if (!isClient || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!user || !userProfile || !organization || !['OWNER', 'ADMIN', 'INSTRUCTOR'].includes(userProfile.role)) {
    router.push(`/org/${orgSlug}/dashboard/content`);
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Loading book data...</div>
      </div>
    );
  }

  if (error && !bookForm.title) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white p-6 rounded-lg shadow">
          <p className="text-red-600 text-sm mb-4">{error}</p>
          <Link 
            href={`/org/${orgSlug}/dashboard/content`} 
            className="text-blue-600 text-sm hover:underline"
          >
            Back to Content
          </Link>
        </div>
      </div>
    );
  }

  const difficultyOptions = [
    { value: 'BEGINNER', label: 'Beginner' },
    { value: 'INTERMEDIATE', label: 'Intermediate' },
    { value: 'ADVANCED', label: 'Advanced' },
    { value: 'EXPERT', label: 'Expert' }
  ];

  const categoryOptions = [
    { value: 'GENERAL', label: 'General' },
    { value: 'DATA_SCIENCE', label: 'Data Science' },
    { value: 'WEB_DEVELOPMENT', label: 'Web Development' },
    { value: 'MACHINE_LEARNING', label: 'Machine Learning' },
    { value: 'HEALTHCARE', label: 'Healthcare' },
    { value: 'FINANCE', label: 'Finance' },
    { value: 'GEOSPATIAL', label: 'Geospatial' },
    { value: 'AUTOMATION', label: 'Automation' },
    { value: 'API_DEVELOPMENT', label: 'API Development' }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-900">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-800 shadow-sm border-b border-gray-200 dark:border-zinc-700 px-5">
        <div className="max-w-6xl mx-auto py-5">
          <div className="flex justify-between items-center">
            <div>
              <nav className="mb-2">
                <Link 
                  href={`/org/${orgSlug}/dashboard`}
                  className="text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-300 no-underline text-sm"
                >
                  Dashboard
                </Link>
                <span className="text-gray-500 dark:text-zinc-400 mx-2">/</span>
                <Link 
                  href={`/org/${orgSlug}/dashboard/content`}
                  className="text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-300 no-underline text-sm"
                >
                  Content
                </Link>
                <span className="text-gray-500 dark:text-zinc-400 mx-2">/</span>
                <span className="text-gray-500 dark:text-zinc-400 text-sm">Edit Course</span>
              </nav>
              <h1 className="m-0 text-2xl font-bold text-gray-900 dark:text-zinc-100">
                Enhanced Course Editor
              </h1>
              <p className="mt-1 text-gray-500 dark:text-zinc-400 text-sm">
                Step {step} of 3: {
                  step === 1 ? 'Course Information' : 
                  step === 2 ? 'Edit Chapters' : 
                  'Review & Update'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        {error && (
          <div style={{
            background: '#fee2e2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '20px',
            color: '#dc2626',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        {/* Step 1: Course Information */}
        {step === 1 && (
          <div style={{
            background: 'white',
            boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
            borderRadius: '12px',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '20px',
              borderBottom: '1px solid #e5e7eb',
              background: '#f9fafb'
            }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
                Course Information
              </h3>
            </div>
            
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'grid', gap: '20px' }}>
                <div>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '14px', 
                    fontWeight: '500', 
                    marginBottom: '6px',
                    color: '#16191dff'
                  }}>
                    Course Title *
                  </label>
                  <input
                    type="text"
                    value={bookForm.title}
                    onChange={(e) => setBookForm(prev => ({ ...prev, title: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '16px',
                      boxSizing: 'border-box',
                      color: '#111827'
                    }}
                    placeholder="Enter course title"
                  />
                </div>

                <div>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '14px', 
                    fontWeight: '500', 
                    marginBottom: '6px',
                    color: '#374151'
                  }}>
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={bookForm.description}
                    onChange={(e) => setBookForm(prev => ({ ...prev, description: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '16px',
                      boxSizing: 'border-box',
                      resize: 'vertical',
                      color: '#111827'
                    }}
                    placeholder="Brief description of the course"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      fontSize: '14px', 
                      fontWeight: '500', 
                      marginBottom: '6px',
                      color: '#374151'
                    }}>
                      Difficulty
                    </label>
                    <select
                      value={bookForm.difficulty}
                      onChange={(e) => setBookForm(prev => ({ ...prev, difficulty: e.target.value as any }))}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '16px',
                        boxSizing: 'border-box',
                        color: '#111827'
                      }}
                    >
                      {difficultyOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ 
                      display: 'block', 
                      fontSize: '14px', 
                      fontWeight: '500', 
                      marginBottom: '6px',
                      color: '#374151'
                    }}>
                      Category
                    </label>
                    <select
                      value={bookForm.category}
                      onChange={(e) => setBookForm(prev => ({ ...prev, category: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '16px',
                        boxSizing: 'border-box',
                        color: '#111827'
                      }}
                    >
                      {categoryOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ 
                      display: 'block', 
                      fontSize: '14px', 
                      fontWeight: '500', 
                      marginBottom: '6px',
                      color: '#374151'
                    }}>
                      Estimated Hours
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={bookForm.estimatedHours}
                      onChange={(e) => setBookForm(prev => ({ ...prev, estimatedHours: parseInt(e.target.value) }))}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '16px',
                        boxSizing: 'border-box',
                        color: '#111827'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '14px', 
                    fontWeight: '500', 
                    marginBottom: '6px',
                    color: '#374151'
                  }}>
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={bookForm.tags}
                    onChange={(e) => setBookForm(prev => ({ ...prev, tags: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '16px',
                      boxSizing: 'border-box',
                      color: '#111827'
                    }}
                    placeholder="python, data analysis, beginner"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button
                  onClick={() => setStep(2)}
                  disabled={!bookForm.title}
                  style={{
                    background: bookForm.title ? '#3b82f6' : '#9ca3af',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '500',
                    cursor: bookForm.title ? 'pointer' : 'not-allowed'
                  }}
                >
                  Next: Edit Chapters
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Chapter Builder */}
        {step === 2 && (
          <div>
            {/* Chapter Tabs */}
            <div style={{
              background: 'white',
              boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
              borderRadius: '12px',
              marginBottom: '20px',
              overflow: 'hidden'
            }}>
              <div style={{
                padding: '20px',
                borderBottom: '1px solid #e5e7eb',
                background: '#f9fafb'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
                    Edit Chapters
                  </h3>
                  <button
                    onClick={addNewChapter}
                    style={{
                      background: '#10b981',
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    + Add Chapter
                  </button>
                </div>
              </div>
              
              {chapters.length > 0 && (
                <div style={{ 
                  display: 'flex', 
                  overflowX: 'auto',
                  padding: '16px',
                  gap: '8px'
                }}>
                  {chapters.map((chapter, index) => (
                    <button
                      key={chapter.id}
                      onClick={() => {
                        console.log('Switching to chapter index:', index, 'Chapter:', chapter.title);
                        setCurrentChapterIndex(index);
                      }}
                      style={{
                        padding: '8px 16px',
                        border: currentChapterIndex === index ? '2px solid #3b82f6' : '1px solid #d1d5db',
                        borderRadius: '8px',
                        background: currentChapterIndex === index ? '#eff6ff' : 'white',
                        color: currentChapterIndex === index ? '#3b82f6' : '#374151',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        minWidth: '120px'
                      }}
                    >
                      {chapter.emoji} {chapter.title}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Chapter Builder */}
            {chapters.length === 0 ? (
              <div style={{
                background: 'white',
                boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
                borderRadius: '12px',
                padding: '60px 20px',
                textAlign: 'center'
              }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', color: '#6b7280' }}>
                  No chapters yet
                </h3>
                <p style={{ margin: '0 0 20px 0', color: '#9ca3af', fontSize: '14px' }}>
                  Click "Add Chapter" to create your first chapter
                </p>
                <button
                  onClick={addNewChapter}
                  style={{
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Create First Chapter
                </button>
              </div>
            ) : (
              <div>
                <div style={{ padding: '10px', backgroundColor: '#f0f0f0', marginBottom: '10px', fontSize: '12px' }}>
                  Debug: Current chapter index: {currentChapterIndex}, Chapter: {chapters[currentChapterIndex]?.title}, ID: {chapters[currentChapterIndex]?.id}
                </div>
                <EnhancedChapterBuilder
                  key={chapters[currentChapterIndex]?.id} // Force re-render when chapter changes
                  initialChapter={chapters[currentChapterIndex]}
                  onChapterUpdate={updateChapter}
                />
              </div>
            )}

            {/* Navigation */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '20px',
              padding: '20px',
              background: 'white',
              boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
              borderRadius: '12px'
            }}>
              <button
                onClick={() => setStep(1)}
                style={{
                  background: '#6b7280',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Back
              </button>
              
              <div style={{ color: '#6b7280', fontSize: '14px' }}>
                {chapters.length} chapter{chapters.length !== 1 ? 's' : ''} • Editing existing course
              </div>
              
              <button
                onClick={() => setStep(3)}
                disabled={chapters.length === 0}
                style={{
                  background: chapters.length > 0 ? '#3b82f6' : '#9ca3af',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '500',
                  cursor: chapters.length > 0 ? 'pointer' : 'not-allowed'
                }}
              >
                Next: Review Changes
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Review & Update */}
        {step === 3 && (
          <div style={{
            background: 'white',
            boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
            borderRadius: '12px',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '20px',
              borderBottom: '1px solid #e5e7eb',
              background: '#f9fafb'
            }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#111827' }}>
                Review & Update
              </h3>
              <p style={{ margin: '4px 0 0 0', color: '#111827', fontSize: '14px' }}>
                Review your course changes before updating
              </p>
            </div>
            
            <div style={{ padding: '24px' }}>
              {/* Course Summary */}
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '500', color: '#111827' }}>
                  Course Details
                </h4>
                <div style={{
                  background: '#f9fafb',
                  padding: '16px',
                  borderRadius: '8px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '12px',
                  fontSize: '14px',
                  color: '#111827'
                }}>
                  <div><strong>Title:</strong> {bookForm.title}</div>
                  <div><strong>Difficulty:</strong> {bookForm.difficulty}</div>
                  <div><strong>Category:</strong> {bookForm.category}</div>
                  <div><strong>Estimated Hours:</strong> {bookForm.estimatedHours}</div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <strong>Description:</strong> {bookForm.description || 'None'}
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <strong>Tags:</strong> {bookForm.tags || 'None'}
                  </div>
                </div>
              </div>

              {/* Chapter Structure */}
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '500', color: '#111827' }}>
                  Chapter Structure ({chapters.length} chapters, {chapters.reduce((sum, ch) => sum + ch.sections.length, 0)} sections)
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {chapters.map((chapter, index) => (
                    <div key={chapter.id} style={{
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      padding: '16px'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        marginBottom: '8px',
                        fontSize: '14px',
                        color: '#111827'
                      }}>
                        <span style={{ fontSize: '18px', marginRight: '8px' }}>{chapter.emoji}</span>
                        <span style={{ fontWeight: '600' }}>
                          Chapter {index + 1}: {chapter.title}
                        </span>
                        <span style={{
                          marginLeft: 'auto',
                          color: '#6b7280',
                          fontSize: '12px'
                        }}>
                          {chapter.sections.length} section{chapter.sections.length !== 1 ? 's' : ''} • {chapter.packages?.length || 0} package{chapter.packages?.length !== 1 ? 's' : ''} • {chapter.defaultExecutionMode} mode
                        </span>
                      </div>
                      {chapter.sections.length > 0 && (
                        <div style={{ marginLeft: '26px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {chapter.sections.map((section, sectionIndex) => (
                            <div key={section.id} style={{
                              display: 'flex',
                              alignItems: 'center',
                              fontSize: '13px',
                              color: '#111827'
                            }}>
                              <span style={{ fontSize: '16px', marginRight: '8px' }}>
                                {section.type === 'python' ? '🐍' : '📝'}
                              </span>
                              <span>{sectionIndex + 1}. {section.title}</span>
                              <span style={{
                                marginLeft: 'auto',
                                fontSize: '11px',
                                padding: '2px 6px',
                                background: section.executionMode === 'shared' ? '#dbeafe' : 
                                           section.executionMode === 'isolated' ? '#d1fae5' : '#f3f4f6',
                                color: section.executionMode === 'shared' ? '#3b82f6' : 
                                       section.executionMode === 'isolated' ? '#10b981' : '#6b7280',
                                borderRadius: '4px'
                              }}>
                                {section.executionMode}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button
                  onClick={() => setStep(2)}
                  style={{
                    background: '#6b7280',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Back
                </button>
                <button
                  onClick={updateBook}
                  disabled={isLoading}
                  style={{
                    background: isLoading ? '#9ca3af' : '#f59e0b',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '500',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  {isLoading && (
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid transparent',
                      borderTop: '2px solid white',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                  )}
                  {isLoading ? 'Updating Course...' : 'Update Course'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}