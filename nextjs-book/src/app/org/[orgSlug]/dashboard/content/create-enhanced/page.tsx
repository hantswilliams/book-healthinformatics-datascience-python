'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useOrgSlug } from '@/lib/useOrgSlug';
import EnhancedChapterBuilder from '@/components/EnhancedChapterBuilder';
import { useSupabase } from '@/lib/SupabaseProvider';

// Enhanced interfaces that match our new schema
interface EnhancedSection {
  id: string;
  type: 'markdown' | 'python';
  title: string;
  content: string;
  executionMode: 'shared' | 'isolated' | 'inherit';
  order: number;
  dependsOn?: string[];
  isEditing?: boolean;
}

interface EnhancedChapter {
  id: string;
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

export default function CreateEnhancedBook() {
  const { user, userProfile, organization } = useSupabase();
  const router = useRouter();
  const orgSlug = useOrgSlug();
  
  const [step, setStep] = useState(1); // 1: Book Info, 2: Chapter Builder, 3: Review & Create
  const [isLoading, setIsLoading] = useState(false);
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

  // Check permissions
  if (!user || !userProfile || !organization || !['OWNER', 'ADMIN'].includes(userProfile.role)) {
    router.push('/dashboard');
    return null;
  }

  const addNewChapter = () => {
    const newChapter: EnhancedChapter = {
      id: `chapter-${Date.now()}`,
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

  const updateChapter = (updatedChapter: EnhancedChapter) => {
    const updatedChapters = chapters.map(chapter => 
      chapter.id === updatedChapter.id ? updatedChapter : chapter
    );
    setChapters(updatedChapters);
  };

  const removeChapter = (chapterId: string) => {
    const updatedChapters = chapters
      .filter(chapter => chapter.id !== chapterId)
      .map((chapter, index) => ({ ...chapter, order: index }));
    setChapters(updatedChapters);
    
    if (currentChapterIndex >= updatedChapters.length) {
      setCurrentChapterIndex(Math.max(0, updatedChapters.length - 1));
    }
  };

  const createBook = async () => {
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
      console.log('Frontend: Preparing chapters for API:', chapters);
      const chaptersData = chapters
        .sort((a, b) => a.order - b.order)
        .map((chapter, index) => {
          console.log(`Frontend: Chapter ${index}:`, chapter.title, 'packages:', chapter.packages);
          return {
            title: chapter.title,
            emoji: chapter.emoji,
            order: index + 1,
            defaultExecutionMode: chapter.defaultExecutionMode.toUpperCase() as 'SHARED' | 'ISOLATED',
            packages: chapter.packages || [],
            sections: chapter.sections
            .sort((a, b) => a.order - b.order)
            .map((section, sectionIndex) => ({
              title: section.title || `Section ${sectionIndex + 1}`,
              type: section.type.toUpperCase() as 'MARKDOWN' | 'PYTHON',
              content: section.content,
              order: sectionIndex + 1,
              executionMode: section.executionMode.toUpperCase() as 'SHARED' | 'ISOLATED' | 'INHERIT',
              dependsOn: section.dependsOn || []
            }))
          };
        });

      const bookData = {
        ...bookForm,
        tags: bookForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        chapters: chaptersData
      };

      const response = await fetch('/api/books/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create course');
      }

      router.push(`/org/${orgSlug}/dashboard/content`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create course');
    } finally {
      setIsLoading(false);
    }
  };

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
    <div style={{ minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ 
        background: 'white', 
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        padding: '0 20px'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <nav style={{ marginBottom: '8px' }}>
                <Link 
                  href={`/org/${orgSlug}/dashboard`}
                  style={{ color: '#6b7280', textDecoration: 'none', fontSize: '14px' }}
                >
                  Dashboard
                </Link>
                <span style={{ color: '#6b7280', margin: '0 8px' }}>/</span>
                <Link 
                  href={`/org/${orgSlug}/dashboard/content`}
                  style={{ color: '#6b7280', textDecoration: 'none', fontSize: '14px' }}
                >
                  Content
                </Link>
                <span style={{ color: '#6b7280', margin: '0 8px' }}>/</span>
                <span style={{ color: '#6b7280', fontSize: '14px' }}>Enhanced Builder</span>
              </nav>
              <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 'bold' }}>
                Enhanced Course Builder
              </h1>
              <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '14px' }}>
                Step {step} of 3: {
                  step === 1 ? 'Course Information' : 
                  step === 2 ? 'Build Chapters' : 
                  'Review & Create'
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
                    color: '#374151'
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
                      boxSizing: 'border-box'
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
                      resize: 'vertical'
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
                        boxSizing: 'border-box'
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
                        boxSizing: 'border-box'
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
                        boxSizing: 'border-box'
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
                      boxSizing: 'border-box'
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
                  Next: Build Chapters
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
                    Build Chapters
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
                      onClick={() => setCurrentChapterIndex(index)}
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
              <EnhancedChapterBuilder
                initialChapter={chapters[currentChapterIndex]}
                onChapterUpdate={updateChapter}
              />
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
                {chapters.length} chapter{chapters.length !== 1 ? 's' : ''} created
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
                Next: Review
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Review & Create */}
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
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
                Review & Create
              </h3>
              <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '14px' }}>
                Review your course structure before creating
              </p>
            </div>
            
            <div style={{ padding: '24px' }}>
              {/* Course Summary */}
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '500' }}>
                  Course Details
                </h4>
                <div style={{
                  background: '#f9fafb',
                  padding: '16px',
                  borderRadius: '8px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '12px',
                  fontSize: '14px'
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
                <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '500' }}>
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
                        fontSize: '14px'
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
                          {chapter.sections.length} section{chapter.sections.length !== 1 ? 's' : ''} • {chapter.defaultExecutionMode} mode
                        </span>
                      </div>
                      {chapter.sections.length > 0 && (
                        <div style={{ marginLeft: '26px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {chapter.sections.map((section, sectionIndex) => (
                            <div key={section.id} style={{
                              display: 'flex',
                              alignItems: 'center',
                              fontSize: '13px',
                              color: '#6b7280'
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
                  onClick={createBook}
                  disabled={isLoading}
                  style={{
                    background: isLoading ? '#9ca3af' : '#10b981',
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
                  {isLoading ? 'Creating Course...' : 'Create Course'}
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