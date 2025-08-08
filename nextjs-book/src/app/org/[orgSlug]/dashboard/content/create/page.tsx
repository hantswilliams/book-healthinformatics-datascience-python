'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useOrgSlug } from '@/lib/useOrgSlug';

interface UploadedFile {
  id: string;
  file: File;
  name: string;
  type: 'markdown' | 'python';
  content: string;
  order: number;
  chapterId?: string; // Which chapter this belongs to
  sectionTitle?: string; // Custom section title
}

interface Chapter {
  id: string;
  title: string;
  emoji: string;
  order: number;
  sections: UploadedFile[];
}

interface BookForm { // backend model remains 'book'
  title: string;
  description: string;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  category: string;
  estimatedHours: number;
  tags: string;
}

export default function CreateBook() { // component name kept; UI text will say Course
  const { data: session } = useSession();
  const router = useRouter();
  const orgSlug = useOrgSlug();
  
  const [step, setStep] = useState(1); // 1: Course Info, 2: Upload Files, 3: Organize Chapters, 4: Review
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

  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [draggedItem, setDraggedItem] = useState<number | null>(null);
  const [draggedChapter, setDraggedChapter] = useState<number | null>(null);
  const [unassignedFiles, setUnassignedFiles] = useState<UploadedFile[]>([]);

  // Check permissions
  if (!session || !['OWNER', 'ADMIN'].includes(session.user.role)) {
    router.push('/dashboard');
    return null;
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newFiles: UploadedFile[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isMarkdown = file.name.endsWith('.md');
      const isPython = file.name.endsWith('.py');
      
      if (!isMarkdown && !isPython) {
        setError(`File ${file.name} is not supported. Please upload .md or .py files only.`);
        continue;
      }

      try {
        const content = await file.text();
        const uploadedFile: UploadedFile = {
          id: `file-${Date.now()}-${i}`,
          file,
          name: file.name,
          type: isMarkdown ? 'markdown' : 'python',
          content,
          order: uploadedFiles.length + newFiles.length
        };
        newFiles.push(uploadedFile);
      } catch (err) {
        setError(`Failed to read file ${file.name}`);
      }
    }

    setUploadedFiles(prev => [...prev, ...newFiles]);
    setUnassignedFiles(prev => [...prev, ...newFiles]);
    setError('');
  };

  const removeFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
    setUnassignedFiles(prev => prev.filter(f => f.id !== id));
    // Remove from chapters if assigned
    setChapters(prev => prev.map(chapter => ({
      ...chapter,
      sections: chapter.sections.filter(f => f.id !== id)
    })));
  };

  const createNewChapter = () => {
    const newChapter: Chapter = {
      id: `chapter-${Date.now()}`,
      title: `Chapter ${chapters.length + 1}`,
      emoji: '📖',
      order: chapters.length,
      sections: []
    };
    setChapters(prev => [...prev, newChapter]);
  };

  const updateChapterTitle = (chapterId: string, title: string) => {
    setChapters(prev => prev.map(chapter => 
      chapter.id === chapterId ? { ...chapter, title } : chapter
    ));
  };

  const updateChapterEmoji = (chapterId: string, emoji: string) => {
    setChapters(prev => prev.map(chapter => 
      chapter.id === chapterId ? { ...chapter, emoji } : chapter
    ));
  };

  const deleteChapter = (chapterId: string) => {
    const chapter = chapters.find(c => c.id === chapterId);
    if (chapter) {
      // Move sections back to unassigned
      setUnassignedFiles(prev => [...prev, ...chapter.sections]);
    }
    setChapters(prev => prev.filter(c => c.id !== chapterId));
  };

  const assignFileToChapter = (fileId: string, chapterId: string) => {
    const file = unassignedFiles.find(f => f.id === fileId);
    if (!file) return;

    setUnassignedFiles(prev => prev.filter(f => f.id !== fileId));
    setChapters(prev => prev.map(chapter => 
      chapter.id === chapterId 
        ? { ...chapter, sections: [...chapter.sections, { ...file, chapterId, order: chapter.sections.length }] }
        : chapter
    ));
  };

  const moveFileToUnassigned = (fileId: string, fromChapterId: string) => {
    const chapter = chapters.find(c => c.id === fromChapterId);
    const file = chapter?.sections.find(s => s.id === fileId);
    if (!file) return;

    setUnassignedFiles(prev => [...prev, { ...file, chapterId: undefined }]);
    setChapters(prev => prev.map(chapter => 
      chapter.id === fromChapterId
        ? { ...chapter, sections: chapter.sections.filter(s => s.id !== fileId) }
        : chapter
    ));
  };

  const updateSectionTitle = (fileId: string, chapterId: string, title: string) => {
    setChapters(prev => prev.map(chapter => 
      chapter.id === chapterId
        ? {
            ...chapter,
            sections: chapter.sections.map(section => 
              section.id === fileId ? { ...section, sectionTitle: title } : section
            )
          }
        : chapter
    ));
  };

  const reorderSectionsInChapter = (chapterId: string, startIndex: number, endIndex: number) => {
    setChapters(prev => prev.map(chapter => {
      if (chapter.id !== chapterId) return chapter;
      
      const newSections = [...chapter.sections];
      const [reorderedSection] = newSections.splice(startIndex, 1);
      newSections.splice(endIndex, 0, reorderedSection);
      
      // Update order numbers
      newSections.forEach((section, index) => {
        section.order = index;
      });
      
      return { ...chapter, sections: newSections };
    }));
  };

  const reorderChapters = (startIndex: number, endIndex: number) => {
    const newChapters = [...chapters];
    const [reorderedChapter] = newChapters.splice(startIndex, 1);
    newChapters.splice(endIndex, 0, reorderedChapter);
    
    // Update order numbers
    newChapters.forEach((chapter, index) => {
      chapter.order = index;
    });
    
    setChapters(newChapters);
  };

  const handleDragStart = (index: number) => {
    setDraggedItem(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedItem === null) return;

    const reorderedFiles = [...uploadedFiles];
    const draggedFile = reorderedFiles[draggedItem];
    reorderedFiles.splice(draggedItem, 1);
    reorderedFiles.splice(dropIndex, 0, draggedFile);

    // Update order numbers
    reorderedFiles.forEach((file, index) => {
      file.order = index;
    });

    setUploadedFiles(reorderedFiles);
    setDraggedItem(null);
  };

  const createBook = async () => {
    try {
      setIsLoading(true);
      setError('');

      if (!bookForm.title || chapters.length === 0) {
        setError('Please provide a course title and create at least one chapter');
        return;
      }

      if (unassignedFiles.length > 0) {
        setError(`You have ${unassignedFiles.length} unassigned file(s). Please assign all files to chapters or remove them.`);
        return;
      }

      // Convert our chapter structure to API format
      const chaptersData = chapters
        .sort((a, b) => a.order - b.order)
        .map((chapter, index) => ({
          title: chapter.title,
          emoji: chapter.emoji,
          order: index + 1,
          sections: chapter.sections
            .sort((a, b) => a.order - b.order)
            .map((section, sectionIndex) => ({
              title: section.sectionTitle || section.name.replace(/\.(md|py)$/, ''),
              type: section.type.toUpperCase() as 'MARKDOWN' | 'PYTHON',
              content: section.content,
              order: sectionIndex + 1
            }))
        }));

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

      router.push('/dashboard/content');
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
                      <Link href={`/org/${orgSlug}/dashboard/content`} className="ml-1 text-gray-500 hover:text-zinc-700">
                        Content
                      </Link>
                    </div>
                  </li>
                  <li>
                    <div className="flex items-center">
                      <svg className="flex-shrink-0 h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="ml-1 text-gray-500">Create Course</span>
                    </div>
                  </li>
                </ol>
              </nav>
              <h1 className="mt-2 text-3xl font-bold text-gray-900">Create New Course</h1>
              <p className="mt-1 text-sm text-gray-600">
                Step {step} of 4: {step === 1 ? 'Course Information' : step === 2 ? 'Upload Files' : step === 3 ? 'Organize Chapters' : 'Review & Create'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-sm text-red-800">{error}</div>
          </div>
        )}

  {/* Step 1: Course Information */}
        {step === 1 && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Course Information</h3>
            </div>
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-zinc-700">
                    Course Title *
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={bookForm.title}
                    onChange={(e) => setBookForm(prev => ({ ...prev, title: e.target.value }))}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter course title"
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-zinc-700">
                    Description
                  </label>
                  <textarea
                    id="description"
                    rows={3}
                    value={bookForm.description}
                    onChange={(e) => setBookForm(prev => ({ ...prev, description: e.target.value }))}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Brief description of the course"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="difficulty" className="block text-sm font-medium text-zinc-700">
                      Difficulty
                    </label>
                    <select
                      id="difficulty"
                      value={bookForm.difficulty}
                      onChange={(e) => setBookForm(prev => ({ ...prev, difficulty: e.target.value as any }))}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      {difficultyOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-zinc-700">
                      Category
                    </label>
                    <select
                      id="category"
                      value={bookForm.category}
                      onChange={(e) => setBookForm(prev => ({ ...prev, category: e.target.value }))}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      {categoryOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="estimatedHours" className="block text-sm font-medium text-zinc-700">
                      Estimated Hours
                    </label>
                    <input
                      type="number"
                      id="estimatedHours"
                      min="1"
                      max="100"
                      value={bookForm.estimatedHours}
                      onChange={(e) => setBookForm(prev => ({ ...prev, estimatedHours: parseInt(e.target.value) }))}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="tags" className="block text-sm font-medium text-zinc-700">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    id="tags"
                    value={bookForm.tags}
                    onChange={(e) => setBookForm(prev => ({ ...prev, tags: e.target.value }))}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="python, data analysis, beginner"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setStep(2)}
                  disabled={!bookForm.title}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  Next: Upload Files
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Upload Files */}
        {step === 2 && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Upload Chapter Files</h3>
              <p className="text-sm text-gray-600 mt-1">
                Upload .md (Markdown) or .py (Python) files that will become chapters
              </p>
            </div>
            <div className="px-6 py-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="mt-4">
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <span className="mt-2 block text-sm font-medium text-gray-900">
                      Drop files here or click to upload
                    </span>
                    <span className="mt-1 block text-sm text-gray-500">
                      Supports .md and .py files
                    </span>
                  </label>
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    multiple
                    accept=".md,.py"
                    className="sr-only"
                    onChange={handleFileUpload}
                  />
                </div>
              </div>

              {uploadedFiles.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">
                    Uploaded Files ({uploadedFiles.length})
                  </h4>
                  <div className="space-y-2">
                    {uploadedFiles.map((file) => (
                      <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                        <div className="flex items-center">
                          <span className="text-lg mr-3">
                            {file.type === 'python' ? '🐍' : '📄'}
                          </span>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{file.name}</div>
                            <div className="text-xs text-gray-500">
                              {file.type === 'python' ? 'Python' : 'Markdown'} • {file.content.length} characters
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => removeFile(file.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 flex justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="bg-gray-300 text-zinc-700 px-4 py-2 rounded-md hover:bg-gray-400"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={uploadedFiles.length === 0}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  Next: Organize Chapters
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Organize Chapters */}
        {step === 3 && (
          <div className="space-y-6">
            {/* Chapter Management */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Organize Chapters</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Create chapters and assign your uploaded files to them as sections
                    </p>
                  </div>
                  <button
                    onClick={createNewChapter}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm"
                  >
                    + Add Chapter
                  </button>
                </div>
              </div>
              
              <div className="px-6 py-4">
                {/* Unassigned Files */}
                {unassignedFiles.length > 0 && (
                  <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                    <h4 className="text-sm font-medium text-yellow-800 mb-3">
                      Unassigned Files ({unassignedFiles.length})
                    </h4>
                    <p className="text-xs text-yellow-700 mb-3">
                      Drag these files into chapters or assign them using the dropdown
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {unassignedFiles.map((file) => (
                        <div key={file.id} className="flex items-center justify-between p-2 bg-white border border-yellow-300 rounded">
                          <div className="flex items-center">
                            <span className="text-lg mr-2">
                              {file.type === 'python' ? '🐍' : '📄'}
                            </span>
                            <span className="text-sm font-medium text-gray-900">{file.name}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            {chapters.length > 0 && (
                              <select
                                onChange={(e) => e.target.value && assignFileToChapter(file.id, e.target.value)}
                                className="text-xs border border-gray-300 rounded px-2 py-1"
                                defaultValue=""
                              >
                                <option value="">Assign to...</option>
                                {chapters.map((chapter) => (
                                  <option key={chapter.id} value={chapter.id}>
                                    {chapter.emoji} {chapter.title}
                                  </option>
                                ))}
                              </select>
                            )}
                            <button
                              onClick={() => removeFile(file.id)}
                              className="text-red-600 hover:text-red-800 text-xs"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Chapters */}
                <div className="space-y-4">
                  {chapters.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>No chapters created yet. Click "Add Chapter" to get started.</p>
                    </div>
                  ) : (
                    chapters.map((chapter, chapterIndex) => (
                      <div key={chapter.id} className="border border-gray-300 rounded-lg">
                        {/* Chapter Header */}
                        <div className="bg-gray-50 px-4 py-3 border-b border-gray-300">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3 flex-1">
                              <input
                                type="text"
                                value={chapter.emoji}
                                onChange={(e) => updateChapterEmoji(chapter.id, e.target.value)}
                                className="w-12 text-center text-lg border border-gray-300 rounded px-1 py-1"
                                maxLength={2}
                              />
                              <input
                                type="text"
                                value={chapter.title}
                                onChange={(e) => updateChapterTitle(chapter.id, e.target.value)}
                                className="flex-1 text-sm font-medium text-gray-900 border border-gray-300 rounded px-3 py-1"
                                placeholder="Chapter title"
                              />
                              <span className="text-xs text-gray-500">Order: {chapter.order + 1}</span>
                            </div>
                            <button
                              onClick={() => deleteChapter(chapter.id)}
                              className="text-red-600 hover:text-red-800 text-sm ml-4"
                            >
                              Delete
                            </button>
                          </div>
                        </div>

                        {/* Chapter Sections */}
                        <div className="px-4 py-3">
                          {chapter.sections.length === 0 ? (
                            <div className="text-center py-4 text-gray-400 text-sm">
                              No sections assigned. Assign files from the unassigned list above.
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {chapter.sections.map((section, sectionIndex) => (
                                <div key={section.id} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded">
                                  <div className="flex items-center space-x-3 flex-1">
                                    <span className="text-lg">
                                      {section.type === 'python' ? '🐍' : '📄'}
                                    </span>
                                    <div className="flex-1">
                                      <input
                                        type="text"
                                        value={section.sectionTitle || section.name.replace(/\.(md|py)$/, '')}
                                        onChange={(e) => updateSectionTitle(section.id, chapter.id, e.target.value)}
                                        className="w-full text-sm font-medium text-gray-900 border border-gray-300 rounded px-2 py-1"
                                        placeholder="Section title"
                                      />
                                      <div className="text-xs text-gray-500 mt-1">
                                        {section.name} • {section.type} • {section.content.length} chars
                                      </div>
                                    </div>
                                    <span className="text-xs text-gray-500">#{sectionIndex + 1}</span>
                                  </div>
                                  <div className="flex items-center space-x-2 ml-4">
                                    <button
                                      onClick={() => moveFileToUnassigned(section.id, chapter.id)}
                                      className="text-blue-600 hover:text-blue-800 text-xs"
                                    >
                                      Unassign
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between">
              <button
                onClick={() => setStep(2)}
                className="bg-gray-300 text-zinc-700 px-4 py-2 rounded-md hover:bg-gray-400"
              >
                Back
              </button>
              <button
                onClick={() => setStep(4)}
                disabled={chapters.length === 0 || unassignedFiles.length > 0}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                Next: Review
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Review & Create */}
        {step === 4 && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Review & Create</h3>
              <p className="text-sm text-gray-600 mt-1">
                Review your course structure before creating
              </p>
            </div>
            <div className="px-6 py-4">
              {/* Book Summary */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Course Details</h4>
                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><strong>Title:</strong> {bookForm.title}</div>
                    <div><strong>Difficulty:</strong> {bookForm.difficulty}</div>
                    <div><strong>Category:</strong> {bookForm.category}</div>
                    <div><strong>Estimated Hours:</strong> {bookForm.estimatedHours}</div>
                    <div className="col-span-2"><strong>Description:</strong> {bookForm.description || 'None'}</div>
                    <div className="col-span-2"><strong>Tags:</strong> {bookForm.tags || 'None'}</div>
                  </div>
                </div>
              </div>

              {/* Chapter Structure */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-900 mb-3">
                  Chapter Structure ({chapters.length} chapters, {chapters.reduce((sum, ch) => sum + ch.sections.length, 0)} sections)
                </h4>
                <div className="space-y-3">
                  {chapters.map((chapter, index) => (
                    <div key={chapter.id} className="border border-gray-200 rounded-md p-3">
                      <div className="flex items-center mb-2">
                        <span className="text-lg mr-2">{chapter.emoji}</span>
                        <span className="font-medium text-gray-900">Chapter {index + 1}: {chapter.title}</span>
                        <span className="ml-auto text-xs text-gray-500">
                          {chapter.sections.length} section{chapter.sections.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      {chapter.sections.length > 0 && (
                        <div className="ml-6 space-y-1">
                          {chapter.sections.map((section, sectionIndex) => (
                            <div key={section.id} className="flex items-center text-sm text-gray-600">
                              <span className="text-base mr-2">
                                {section.type === 'python' ? '🐍' : '📄'}
                              </span>
                              <span>{sectionIndex + 1}. {section.sectionTitle || section.name.replace(/\.(md|py)$/, '')}</span>
                              <span className="ml-auto text-xs">({section.type})</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setStep(3)}
                  className="bg-gray-300 text-zinc-700 px-4 py-2 rounded-md hover:bg-gray-400"
                >
                  Back
                </button>
                <button
                  onClick={createBook}
                  disabled={isLoading}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating Course...
                    </>
                  ) : (
                    'Create Course'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}