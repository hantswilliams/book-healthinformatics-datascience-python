'use client';

import { useState, useEffect } from 'react';
import { chapters, getChapterById } from '@/data/chapters';
import type { Chapter } from '@/types';

interface ChapterSection {
  type: 'markdown' | 'python';
  url: string;
  title?: string;
}

interface ChapterBuilderProps {
  onChapterUpdate?: (chapter: Chapter) => void;
}

export default function ChapterBuilder({ onChapterUpdate }: ChapterBuilderProps) {
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [editingSections, setEditingSections] = useState<ChapterSection[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [newSectionType, setNewSectionType] = useState<'markdown' | 'python'>('markdown');
  const [templates] = useState({
    markdown: {
      introduction: '# Introduction\n\nWelcome to this section!\n\n## Key Concepts\n\n- Concept 1\n- Concept 2\n\n## What You\'ll Learn\n\n1. Topic 1\n2. Topic 2',
      summary: '# Chapter Summary\n\n## What You\'ve Learned\n\n✅ **Key Concept 1**\n- Details about concept 1\n\n✅ **Key Concept 2**  \n- Details about concept 2\n\n## Coming Up Next\n\nIn the next chapter, we\'ll explore...',
      concept: '# [Section Title]\n\n## Overview\n\nThis section covers...\n\n## Key Points\n\n- Important point 1\n- Important point 2\n\n## Examples\n\nHere are some examples...'
    },
    python: {
      basic: '# [Section Title]\n# Practice with basic Python concepts\n\nprint("Hello, World!")\n\n# Your code here:\n',
      exercise: '# [Exercise Title]\n# Complete the following exercises\n\n# Exercise 1: [Description]\n# TODO: Write your code here\n\n# Exercise 2: [Description]\n# TODO: Write your code here\n\nprint("Exercises completed!")',
      demo: '# [Demo Title]\n# Demonstration of key concepts\n\nimport pandas as pd\nimport matplotlib.pyplot as plt\n\n# Create sample data\ndata = {"A": [1, 2, 3], "B": [4, 5, 6]}\ndf = pd.DataFrame(data)\n\nprint("Sample DataFrame:")\nprint(df)\n\n# Your analysis here:'
    }
  });

  useEffect(() => {
    if (chapters.length > 0) {
      setSelectedChapter(chapters[0]);
      setEditingSections([...chapters[0].sections]);
    }
  }, []);

  const handleChapterSelect = (chapterId: string) => {
    const chapter = getChapterById(chapterId);
    if (chapter) {
      setSelectedChapter(chapter);
      setEditingSections([...chapter.sections]);
      setIsEditing(false);
    }
  };

  const addSection = (templateType?: string) => {
    let template;
    if (templateType) {
      if (newSectionType === 'markdown') {
        template = templates.markdown[templateType as keyof typeof templates.markdown] || templates.markdown.concept;
      } else {
        template = templates.python[templateType as keyof typeof templates.python] || templates.python.basic;
      }
    } else {
      template = newSectionType === 'markdown' ? templates.markdown.concept : templates.python.basic;
    }

    const newSection: ChapterSection = {
      type: newSectionType,
      url: `/docs/new-section-${Date.now()}.${newSectionType === 'markdown' ? 'md' : 'py'}`,
      title: `New ${newSectionType === 'markdown' ? 'Content' : 'Exercise'} Section`
    };

    setEditingSections([...editingSections, newSection]);
  };

  const removeSection = (index: number) => {
    const newSections = editingSections.filter((_, i) => i !== index);
    setEditingSections(newSections);
  };

  const moveSectionUp = (index: number) => {
    if (index === 0) return;
    const newSections = [...editingSections];
    [newSections[index], newSections[index - 1]] = [newSections[index - 1], newSections[index]];
    setEditingSections(newSections);
  };

  const moveSectionDown = (index: number) => {
    if (index === editingSections.length - 1) return;
    const newSections = [...editingSections];
    [newSections[index], newSections[index + 1]] = [newSections[index + 1], newSections[index]];
    setEditingSections(newSections);
  };

  const updateSection = (index: number, updates: Partial<ChapterSection>) => {
    const newSections = [...editingSections];
    newSections[index] = { ...newSections[index], ...updates };
    setEditingSections(newSections);
  };

  const saveChapter = () => {
    if (!selectedChapter) return;
    
    const updatedChapter: Chapter = {
      ...selectedChapter,
      sections: editingSections
    };
    
    onChapterUpdate?.(updatedChapter);
    setIsEditing(false);
    alert('Chapter structure saved! Note: You still need to create/update the actual files.');
  };

  const cancelEditing = () => {
    if (selectedChapter) {
      setEditingSections([...selectedChapter.sections]);
    }
    setIsEditing(false);
  };

  const getSectionIcon = (type: 'markdown' | 'python') => {
    return type === 'markdown' ? '📝' : '🐍';
  };

  const getFileExtension = (type: 'markdown' | 'python') => {
    return type === 'markdown' ? '.md' : '.py';
  };

  return (
    <div className="space-y-6">
      {/* Chapter Selector */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-zinc-900 mb-4">Chapter Builder</h2>
        
        <div className="flex items-center space-x-4 mb-4">
          <label className="text-sm font-medium text-zinc-700">Select Chapter:</label>
          <select
            value={selectedChapter?.id || ''}
            onChange={(e) => handleChapterSelect(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {chapters.map((chapter) => (
              <option key={chapter.id} value={chapter.id}>
                {chapter.emoji} {chapter.title}
              </option>
            ))}
          </select>
          
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`px-4 py-2 text-sm rounded-md ${
              isEditing 
                ? 'bg-gray-100 text-zinc-700' 
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            {isEditing ? 'Cancel' : 'Edit Structure'}
          </button>
        </div>

        {selectedChapter && (
          <div className="bg-gray-50 rounded-md p-4">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-2xl">{selectedChapter.emoji}</span>
              <h3 className="text-lg font-semibold text-zinc-900">{selectedChapter.title}</h3>
            </div>
            <p className="text-sm text-zinc-600">
              {editingSections.length} sections • Order: {selectedChapter.order}
            </p>
          </div>
        )}
      </div>

      {/* Section Management */}
      {selectedChapter && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-zinc-900">Chapter Sections</h3>
              
              {isEditing && (
                <div className="flex items-center space-x-2">
                  <select
                    value={newSectionType}
                    onChange={(e) => setNewSectionType(e.target.value as 'markdown' | 'python')}
                    className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                  >
                    <option value="markdown">📝 Markdown</option>
                    <option value="python">🐍 Python</option>
                  </select>
                  
                  <div className="relative">
                    <button
                      onClick={() => addSection()}
                      className="bg-green-600 text-white px-3 py-1 rounded-md text-sm hover:bg-green-700"
                    >
                      + Add Section
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sections List */}
          <div className="divide-y divide-gray-200">
            {editingSections.map((section, index) => (
              <div key={index} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    <span className="text-xl">{getSectionIcon(section.type)}</span>
                    
                    {isEditing ? (
                      <div className="flex-1 grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={section.title || ''}
                          onChange={(e) => updateSection(index, { title: e.target.value })}
                          placeholder="Section title..."
                          className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                        />
                        <input
                          type="text"
                          value={section.url}
                          onChange={(e) => updateSection(index, { url: e.target.value })}
                          placeholder="File path..."
                          className="border border-gray-300 rounded-md px-3 py-2 text-sm font-mono"
                        />
                      </div>
                    ) : (
                      <div className="flex-1">
                        <div className="font-medium text-zinc-900">
                          {section.title || 'Untitled Section'}
                        </div>
                        <div className="text-sm text-zinc-500 font-mono">
                          {section.url}
                        </div>
                      </div>
                    )}
                  </div>

                  {isEditing && (
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => moveSectionUp(index)}
                        disabled={index === 0}
                        className="p-1 text-zinc-400 hover:text-zinc-600 disabled:opacity-50"
                      >
                        ⬆️
                      </button>
                      <button
                        onClick={() => moveSectionDown(index)}
                        disabled={index === editingSections.length - 1}
                        className="p-1 text-zinc-400 hover:text-zinc-600 disabled:opacity-50"
                      >
                        ⬇️
                      </button>
                      <button
                        onClick={() => removeSection(index)}
                        className="p-1 text-red-400 hover:text-red-600"
                      >
                        🗑️
                      </button>
                    </div>
                  )}
                </div>

                {isEditing && (
                  <div className="mt-2 text-xs text-zinc-500">
                    {section.type === 'markdown' ? 'Markdown content section' : 'Interactive Python exercise'}
                  </div>
                )}
              </div>
            ))}
            
            {editingSections.length === 0 && (
              <div className="p-8 text-center text-zinc-500">
                <span className="text-4xl block mb-2">📄</span>
                <p>No sections yet. Add your first section to get started.</p>
              </div>
            )}
          </div>

          {/* Save/Cancel Actions */}
          {isEditing && (
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <p className="text-sm text-zinc-600">
                  Changes will update the chapter structure. Remember to create/edit actual files using the File Browser.
                </p>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={cancelEditing}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveChapter}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700"
                  >
                    Save Chapter Structure
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick Templates */}
      {isEditing && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-zinc-900 mb-4">Quick Templates</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-zinc-700 mb-2">📝 Markdown Templates</h4>
              <div className="space-y-2">
                {Object.keys(templates.markdown).map((templateKey) => (
                  <button
                    key={templateKey}
                    onClick={() => {
                      setNewSectionType('markdown');
                      addSection(templateKey);
                    }}
                    className="block w-full text-left px-3 py-2 text-sm border border-gray-200 rounded hover:bg-gray-50"
                  >
                    {templateKey.charAt(0).toUpperCase() + templateKey.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-zinc-700 mb-2">🐍 Python Templates</h4>
              <div className="space-y-2">
                {Object.keys(templates.python).map((templateKey) => (
                  <button
                    key={templateKey}
                    onClick={() => {
                      setNewSectionType('python');
                      addSection(templateKey);
                    }}
                    className="block w-full text-left px-3 py-2 text-sm border border-gray-200 rounded hover:bg-gray-50"
                  >
                    {templateKey.charAt(0).toUpperCase() + templateKey.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}