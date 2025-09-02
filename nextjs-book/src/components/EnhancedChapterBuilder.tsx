'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from '@/lib/SupabaseProvider';
import MonacoCodeBlock from './MonacoCodeBlock';
import PackageSelector from './PackageSelector';

// Enhanced interfaces with execution modes
interface EnhancedSection {
  id: string;
  type: 'markdown' | 'python' | 'youtube' | 'image';
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

interface EnhancedChapterBuilderProps {
  initialChapter?: EnhancedChapter;
  onChapterUpdate?: (chapter: EnhancedChapter) => void;
  onSave?: (chapter: EnhancedChapter) => Promise<void>;
}

export default function EnhancedChapterBuilder({ 
  initialChapter, 
  onChapterUpdate, 
  onSave 
}: EnhancedChapterBuilderProps) {
  const { user, userProfile, loading } = useSupabase();
  const router = useRouter();

  // State management
  const [chapter, setChapter] = useState<EnhancedChapter>(
    initialChapter || {
      id: `chapter-default`,
      title: 'New Chapter',
      emoji: '📖',
      defaultExecutionMode: 'shared',
      sections: [],
      packages: [],
      order: 0
    }
  );

  const [isEditing, setIsEditing] = useState(false);
  const [draggedSectionId, setDraggedSectionId] = useState<string | null>(null);
  const [showPasteDialog, setShowPasteDialog] = useState(false);
  const [pasteContent, setPasteContent] = useState('');
  const [pasteTargetIndex, setPasteTargetIndex] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);
  const [showPackageManager, setShowPackageManager] = useState(false);

  // Helper functions
  const [sectionIdCounter, setSectionIdCounter] = useState(0);

  // Sync with initialChapter prop changes (when different chapter is selected)
  useEffect(() => {
    if (initialChapter && initialChapter.id && initialChapter.id !== chapter.id) {
      console.log('EnhancedChapterBuilder switching from', chapter.title, 'to', initialChapter.title);
      console.log('New chapter packages:', initialChapter.packages);
      setChapter(initialChapter);
    }
  }, [initialChapter?.id, chapter?.id]);

  // Update parent when chapter changes (debounced to prevent infinite loops)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onChapterUpdate?.(chapter);
    }, 100); // Debounce to prevent rapid updates
    
    return () => clearTimeout(timeoutId);
  }, [chapter, onChapterUpdate]);

  // Check permissions after hooks
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!user || !userProfile || !['OWNER', 'ADMIN', 'INSTRUCTOR'].includes(userProfile.role)) {
    router.push('/dashboard');
    return null;
  }
  const generateSectionId = () => {
    const newId = `section-new-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    return newId;
  };

  const extractYouTubeVideoId = (url: string): string | null => {
    if (!url) return null;
    
    // Handle different YouTube URL formats
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/.*[?&]v=([a-zA-Z0-9_-]{11})/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    return null;
  };

  const getYouTubeEmbedUrl = (url: string): string | null => {
    const videoId = extractYouTubeVideoId(url);
    if (!videoId) return null;
    return `https://www.youtube-nocookie.com/embed/${videoId}`;
  };

  const addSection = (type: 'markdown' | 'python' | 'youtube' | 'image', targetIndex?: number) => {
    const getDefaultContent = (sectionType: typeof type) => {
      switch (sectionType) {
        case 'markdown':
          return '# New Section\n\nAdd your content here...';
        case 'python':
          return '# New exercise\nprint("Hello, World!")\n\n# Your code here:\n';
        case 'youtube':
          return 'https://www.youtube.com/watch?v=';
        case 'image':
          return '';
        default:
          return '';
      }
    };

    const getDefaultTitle = (sectionType: typeof type) => {
      switch (sectionType) {
        case 'markdown':
          return 'New Content Section';
        case 'python':
          return 'New Code Exercise';
        case 'youtube':
          return 'New Video';
        case 'image':
          return 'New Image';
        default:
          return 'New Section';
      }
    };

    const newSection: EnhancedSection = {
      id: generateSectionId(),
      type,
      title: getDefaultTitle(type),
      content: getDefaultContent(type),
      executionMode: 'inherit',
      order: targetIndex !== undefined ? targetIndex : chapter.sections.length,
      isEditing: true
    };

    const updatedSections = [...chapter.sections];
    if (targetIndex !== undefined) {
      updatedSections.splice(targetIndex, 0, newSection);
      // Reorder sections
      updatedSections.forEach((section, index) => {
        section.order = index;
      });
    } else {
      updatedSections.push(newSection);
    }

    setChapter({ ...chapter, sections: updatedSections });
  };

  const updateSection = (sectionId: string, updates: Partial<EnhancedSection>) => {
    const updatedSections = chapter.sections.map(section =>
      section.id === sectionId ? { ...section, ...updates } : section
    );
    setChapter({ ...chapter, sections: updatedSections });
  };

  const removeSection = (sectionId: string) => {
    const updatedSections = chapter.sections
      .filter(section => section.id !== sectionId)
      .map((section, index) => ({ ...section, order: index }));
    setChapter({ ...chapter, sections: updatedSections });
  };

  const reorderSections = (startIndex: number, endIndex: number) => {
    const updatedSections = [...chapter.sections];
    const [movedSection] = updatedSections.splice(startIndex, 1);
    updatedSections.splice(endIndex, 0, movedSection);
    
    // Update order numbers
    updatedSections.forEach((section, index) => {
      section.order = index;
    });

    setChapter({ ...chapter, sections: updatedSections });
  };

  const detectContentType = (content: string): 'markdown' | 'python' | 'youtube' | 'image' => {
    // Check for YouTube URLs first (more comprehensive check)
    if (extractYouTubeVideoId(content)) {
      return 'youtube';
    }
    
    // Check for image URLs
    if (content.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) || content.startsWith('data:image/')) {
      return 'image';
    }
    
    // Simple heuristics to detect content type
    const pythonIndicators = [
      'import ', 'def ', 'class ', 'print(', 'pandas', 'numpy', '#', 'pd.', 'np.'
    ];
    const markdownIndicators = ['#', '##', '###', '**', '*', '- ', '1. ', '[', ']'];
    
    const pythonScore = pythonIndicators.reduce((score, indicator) => 
      score + (content.includes(indicator) ? 1 : 0), 0);
    const markdownScore = markdownIndicators.reduce((score, indicator) => 
      score + (content.includes(indicator) ? 1 : 0), 0);
    
    return pythonScore > markdownScore ? 'python' : 'markdown';
  };

  const handlePaste = () => {
    if (!pasteContent.trim()) return;

    const type = detectContentType(pasteContent);
    const getPasteTitle = (sectionType: typeof type) => {
      switch (sectionType) {
        case 'markdown':
          return 'Pasted Content';
        case 'python':
          return 'Pasted Code';
        case 'youtube':
          return 'Pasted Video';
        case 'image':
          return 'Pasted Image';
        default:
          return 'Pasted Content';
      }
    };

    const newSection: EnhancedSection = {
      id: generateSectionId(),
      type,
      title: getPasteTitle(type),
      content: pasteContent.trim(),
      executionMode: 'inherit',
      order: pasteTargetIndex,
      isEditing: true
    };

    const updatedSections = [...chapter.sections];
    updatedSections.splice(pasteTargetIndex, 0, newSection);
    
    // Reorder sections
    updatedSections.forEach((section, index) => {
      section.order = index;
    });

    setChapter({ ...chapter, sections: updatedSections });
    setShowPasteDialog(false);
    setPasteContent('');
  };

  const handleSave = async () => {
    if (!onSave) return;
    
    setIsSaving(true);
    try {
      await onSave(chapter);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save chapter:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const getExecutionModeDisplay = (section: EnhancedSection) => {
    const mode = section.executionMode === 'inherit' ? chapter.defaultExecutionMode : section.executionMode;
    return {
      shared: { icon: '🔗', label: 'Shared State', color: 'bg-blue-100 text-blue-800' },
      isolated: { icon: '🔒', label: 'Isolated State', color: 'bg-green-100 text-green-800' }
    }[mode];
  };

  // Package management functions
  const handlePackagesChange = (packages: string[]) => {
    console.log('EnhancedChapterBuilder: Packages changed to:', packages);
    const updatedChapter = { ...chapter, packages };
    setChapter(updatedChapter);
    
    // Notify parent component of the change
    if (onChapterUpdate) {
      onChapterUpdate(updatedChapter);
    }
  };

  return (
    <div className="enhanced-chapter-builder">
      {/* Custom CSS Variables */}
      <style jsx>{`
        .enhanced-chapter-builder {
          --bg: #0b1020;
          --panel: #121a33;
          --panel-darker: #0d1428;
          --ink: #e8ecff;
          --muted: #a6b0d6;
          --accent: #7aa2f7;
          --warn: #ff6b6b;
          --border: #23305d;
          --border-light: #2a3769;
          --success: #9ece6a;
          
          background: var(--bg);
          color: var(--ink);
          min-height: 100vh;
          padding: 20px;
        }

        .chapter-header {
          background: var(--panel);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 20px;
          margin-bottom: 20px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .chapter-controls {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 16px;
        }

        .emoji-input {
          width: 50px;
          text-align: center;
          font-size: 20px;
          background: var(--panel-darker);
          border: 1px solid var(--border-light);
          border-radius: 8px;
          padding: 8px;
          color: var(--ink);
        }

        .title-input {
          flex: 1;
          background: var(--panel-darker);
          border: 1px solid var(--border-light);
          border-radius: 8px;
          padding: 12px;
          color: var(--ink);
          font-size: 18px;
          font-weight: 600;
        }

        .execution-mode-selector {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .mode-button {
          background: var(--panel-darker);
          border: 1px solid var(--border-light);
          border-radius: 8px;
          padding: 8px 12px;
          color: var(--ink);
          cursor: pointer;
          font-size: 12px;
          transition: all 0.2s ease;
        }

        .mode-button:hover {
          border-color: var(--accent);
          background: rgba(122, 162, 247, 0.1);
        }

        .mode-button.active {
          background: rgba(122, 162, 247, 0.15);
          border-color: rgba(122, 162, 247, 0.4);
        }

        .section-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .section-card {
          background: var(--panel);
          border: 1px solid var(--border);
          border-radius: 14px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .section-header {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 12px;
          border-bottom: 1px solid var(--border);
          background: rgba(18, 26, 51, 0.7);
        }

        .section-type-icon {
          font-size: 18px;
        }

        .section-title {
          flex: 1;
          background: transparent;
          border: none;
          color: var(--ink);
          font-size: 14px;
          font-weight: 600;
        }

        .section-actions {
          display: flex;
          gap: 8px;
        }

        .action-button {
          background: transparent;
          border: 1px solid var(--border-light);
          border-radius: 8px;
          padding: 6px 10px;
          color: var(--ink);
          cursor: pointer;
          font-size: 12px;
          transition: all 0.2s ease;
        }

        .action-button:hover {
          border-color: var(--accent);
          background: rgba(122, 162, 247, 0.1);
        }

        .action-button.primary {
          background: rgba(122, 162, 247, 0.15);
          border-color: rgba(122, 162, 247, 0.4);
        }

        .action-button.danger {
          border-color: var(--warn);
          color: var(--warn);
        }

        .action-button.danger:hover {
          background: rgba(255, 107, 107, 0.1);
        }

        .section-content {
          padding: 16px;
        }

        .content-editor {
          width: 100%;
          min-height: 120px;
          background: var(--panel-darker);
          border: 1px solid var(--border-light);
          border-radius: 8px;
          padding: 12px;
          color: var(--ink);
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 13px;
          line-height: 1.5;
          resize: vertical;
        }

        .content-preview {
          background: var(--panel-darker);
          border: 1px solid var(--border-light);
          border-radius: 8px;
          padding: 12px;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 13px;
          line-height: 1.5;
          white-space: pre-wrap;
          max-height: 200px;
          overflow-y: auto;
        }

        .execution-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
        }

        .add-section-area {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 20px;
          background: var(--panel);
          border: 1px dashed var(--border-light);
          border-radius: 14px;
          text-align: center;
        }

        .add-buttons {
          display: flex;
          justify-content: center;
          gap: 12px;
        }

        .save-controls {
          position: sticky;
          bottom: 20px;
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 16px;
          background: var(--panel);
          border: 1px solid var(--border);
          border-radius: 14px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .paste-dialog {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(11, 16, 32, 0.9);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .paste-dialog-content {
          background: var(--panel);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 24px;
          max-width: 600px;
          width: 90%;
          max-height: 80vh;
          overflow-y: auto;
        }

        .paste-textarea {
          width: 100%;
          height: 200px;
          background: var(--panel-darker);
          border: 1px solid var(--border-light);
          border-radius: 8px;
          padding: 12px;
          color: var(--ink);
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 13px;
          line-height: 1.5;
          resize: vertical;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      {/* Chapter Header */}
      <div className="chapter-header">
        <div className="chapter-controls">
          <input
            type="text"
            value={chapter.emoji}
            onChange={(e) => setChapter({ ...chapter, emoji: e.target.value })}
            className="emoji-input"
            maxLength={2}
          />
          <input
            type="text"
            value={chapter.title}
            onChange={(e) => setChapter({ ...chapter, title: e.target.value })}
            className="title-input"
            placeholder="Chapter title..."
          />
          
          <div className="execution-mode-selector">
            <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Default Mode:</span>
            <button
              className={`mode-button ${chapter.defaultExecutionMode === 'shared' ? 'active' : ''}`}
              onClick={() => setChapter({ ...chapter, defaultExecutionMode: 'shared' })}
            >
              🔗 Shared
            </button>
            <button
              className={`mode-button ${chapter.defaultExecutionMode === 'isolated' ? 'active' : ''}`}
              onClick={() => setChapter({ ...chapter, defaultExecutionMode: 'isolated' })}
            >
              🔒 Isolated
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '13px', color: 'var(--muted)' }}>
            {chapter.sections.length} sections • {chapter.packages?.length || 0} packages • Default execution: {chapter.defaultExecutionMode}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="action-button"
              onClick={() => setShowPackageManager(!showPackageManager)}
            >
              📦 Packages ({chapter.packages?.length || 0})
            </button>
            <button
              className="action-button primary"
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? 'Preview' : 'Edit'}
            </button>
          </div>
        </div>
      </div>

      {/* Current Packages Display */}
      {(() => {
        let packagesArray = [];
        try {
          if (Array.isArray(chapter.packages)) {
            packagesArray = chapter.packages;
          } else if (typeof chapter.packages === 'string') {
            packagesArray = chapter.packages ? JSON.parse(chapter.packages) : [];
          } else if (chapter.packages) {
            console.warn('Unexpected packages format:', typeof chapter.packages, chapter.packages);
            packagesArray = [];
          }
        } catch (error) {
          console.error('Error parsing packages:', error);
          packagesArray = [];
        }
        
        return Array.isArray(packagesArray) && packagesArray.length > 0 && (
          <div style={{ 
            background: '#f8fafc', 
            padding: '12px 16px', 
            border: '1px solid #e2e8f0', 
            borderRadius: '8px',
            marginBottom: '16px'
          }}>
            <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#374151' }}>
              Required Packages:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {packagesArray.map((pkg, index) => (
                <span
                  key={`pkg-${index}-${pkg}`}
                  style={{
                    background: '#e0e7ff',
                    color: '#3730a3',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '13px',
                    fontWeight: '500'
                  }}
                >
                  📦 {pkg}
                </span>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Package Manager */}
      {showPackageManager && (
        <div className="chapter-header">
          <PackageSelector
            selectedPackages={chapter.packages || []}
            onPackagesChange={handlePackagesChange}
          />
        </div>
      )}

      {/* Sections */}
      <div className="section-list">
        {chapter.sections.map((section, index) => (
          <div key={section.id} className="section-card">
            <div className="section-header">
              <span className="section-type-icon">
                {section.type === 'python' ? '🐍' : 
                 section.type === 'youtube' ? '📺' :
                 section.type === 'image' ? '🖼️' : '📝'}
              </span>
              
              {section.isEditing ? (
                <input
                  type="text"
                  value={section.title}
                  onChange={(e) => updateSection(section.id, { title: e.target.value })}
                  className="section-title"
                  placeholder="Section title..."
                />
              ) : (
                <span className="section-title">{section.title}</span>
              )}

              <div className={`execution-badge ${getExecutionModeDisplay(section).color}`}>
                <span>{getExecutionModeDisplay(section).icon}</span>
                <span>{getExecutionModeDisplay(section).label}</span>
              </div>

              <div className="section-actions">
                {section.isEditing ? (
                  <>
                    <select
                      value={section.executionMode}
                      onChange={(e) => updateSection(section.id, { 
                        executionMode: e.target.value as 'shared' | 'isolated' | 'inherit' 
                      })}
                      className="action-button"
                      style={{ padding: '4px 8px' }}
                    >
                      <option value="inherit">Inherit ({chapter.defaultExecutionMode})</option>
                      <option value="shared">🔗 Shared</option>
                      <option value="isolated">🔒 Isolated</option>
                    </select>
                    <button
                      className="action-button"
                      onClick={() => updateSection(section.id, { isEditing: false })}
                    >
                      ✓ Save
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="action-button"
                      onClick={() => updateSection(section.id, { isEditing: true })}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      className="action-button"
                      onClick={() => {
                        setPasteTargetIndex(index + 1);
                        setShowPasteDialog(true);
                      }}
                    >
                      📋 Paste
                    </button>
                  </>
                )}
                
                <button
                  className="action-button danger"
                  onClick={() => removeSection(section.id)}
                >
                  🗑️
                </button>
              </div>
            </div>

            <div className="section-content">
              {section.type === 'youtube' ? (
                section.isEditing ? (
                  <div>
                    <input
                      type="url"
                      value={section.content}
                      onChange={(e) => updateSection(section.id, { content: e.target.value })}
                      placeholder="Enter YouTube URL (e.g., https://www.youtube.com/watch?v=dQw4w9WgXcQ or https://youtu.be/dQw4w9WgXcQ)"
                      style={{
                        width: '100%',
                        background: 'var(--panel-darker)',
                        border: '1px solid var(--border-light)',
                        borderRadius: '8px',
                        padding: '12px',
                        color: 'var(--ink)',
                        fontSize: '14px',
                        marginBottom: '12px'
                      }}
                    />
                    {/* Live preview while editing */}
                    {(() => {
                      const embedUrl = getYouTubeEmbedUrl(section.content);
                      return embedUrl ? (
                        <div>
                          <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '8px' }}>
                            Preview:
                          </div>
                          <div style={{ position: 'relative', width: '100%', paddingBottom: '56.25%', height: 0, opacity: 0.8 }}>
                            <iframe
                              src={embedUrl}
                              frameBorder="0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                              allowFullScreen
                              style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                borderRadius: '8px'
                              }}
                            />
                          </div>
                        </div>
                      ) : section.content ? (
                        <div style={{ 
                          padding: '12px', 
                          fontSize: '12px',
                          color: 'var(--warn)',
                          background: 'rgba(255, 107, 107, 0.1)',
                          borderRadius: '6px',
                          border: '1px solid var(--warn)'
                        }}>
                          Invalid YouTube URL format
                        </div>
                      ) : null;
                    })()}
                  </div>
                ) : (
                  <div>
                    {(() => {
                      const embedUrl = getYouTubeEmbedUrl(section.content);
                      return embedUrl ? (
                        <div style={{ position: 'relative', width: '100%', paddingBottom: '56.25%', height: 0 }}>
                          <iframe
                            src={embedUrl}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                            style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              height: '100%',
                              borderRadius: '8px'
                            }}
                          />
                        </div>
                      ) : (
                        <div style={{ 
                          padding: '20px', 
                          textAlign: 'center', 
                          color: 'var(--muted)',
                          background: 'var(--panel-darker)',
                          borderRadius: '8px',
                          border: '1px solid var(--border-light)'
                        }}>
                          {section.content ? 
                            `Invalid YouTube URL: ${section.content}` : 
                            'No YouTube URL provided'
                          }
                        </div>
                      );
                    })()}
                  </div>
                )
              ) : section.type === 'image' ? (
                section.isEditing ? (
                  <div>
                    <input
                      type="url"
                      value={section.content}
                      onChange={(e) => updateSection(section.id, { content: e.target.value })}
                      placeholder="Enter image URL"
                      style={{
                        width: '100%',
                        background: 'var(--panel-darker)',
                        border: '1px solid var(--border-light)',
                        borderRadius: '8px',
                        padding: '12px',
                        color: 'var(--ink)',
                        fontSize: '14px',
                        marginBottom: '12px'
                      }}
                    />
                    
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '12px',
                      marginBottom: '12px',
                      fontSize: '13px',
                      color: 'var(--muted)'
                    }}>
                      <span>or</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            try {
                              // Show loading state
                              updateSection(section.id, { content: 'uploading...' });
                              
                              const formData = new FormData();
                              formData.append('file', file);
                              
                              const response = await fetch('/api/upload/image', {
                                method: 'POST',
                                body: formData
                              });
                              
                              if (!response.ok) {
                                const errorData = await response.json();
                                throw new Error(errorData.error || 'Upload failed');
                              }
                              
                              const result = await response.json();
                              
                              // Update both content and title in a single call to avoid race conditions
                              const updates: Partial<EnhancedSection> = { content: result.url };
                              if (section.title === 'New Image') {
                                updates.title = file.name.replace(/\.[^/.]+$/, '');
                              }
                              updateSection(section.id, updates);
                            } catch (error) {
                              console.error('Image upload error:', error);
                              updateSection(section.id, { content: '' });
                              alert(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`);
                            }
                          }
                        }}
                        style={{ display: 'none' }}
                        id={`file-upload-${section.id}`}
                      />
                      <label
                        htmlFor={`file-upload-${section.id}`}
                        style={{
                          background: 'var(--accent)',
                          color: 'white',
                          padding: '8px 16px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: '500',
                          border: 'none'
                        }}
                      >
                        📁 Upload Image
                      </label>
                    </div>

                    {/* Live preview while editing */}
                    {section.content && (
                      <div>
                        <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '8px' }}>
                          Preview:
                        </div>
                        <div style={{ textAlign: 'center', opacity: 0.8 }}>
                          {section.content === 'uploading...' ? (
                            <div style={{
                              padding: '40px',
                              background: 'var(--panel-darker)',
                              borderRadius: '8px',
                              border: '1px solid var(--border-light)',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: '12px'
                            }}>
                              <div style={{
                                width: '32px',
                                height: '32px',
                                border: '3px solid var(--border-light)',
                                borderTop: '3px solid var(--accent)',
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite'
                              }}></div>
                              <span style={{ color: 'var(--muted)', fontSize: '14px' }}>
                                Uploading image...
                              </span>
                            </div>
                          ) : (
                            <img
                              src={section.content}
                              alt={section.title}
                              style={{
                                maxWidth: '100%',
                                maxHeight: '200px',
                                height: 'auto',
                                borderRadius: '8px',
                                border: '1px solid var(--border-light)'
                              }}
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          )}
                        </div>
                      </div>
                    )}

                    <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '8px' }}>
                      Add image annotations or captions in the title field above
                    </div>
                  </div>
                ) : (
                  <div>
                    {console.log('Image section content:', section.content, 'Title:', section.title)}
                    {section.content && section.content !== 'uploading...' ? (
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ position: 'relative', display: 'inline-block', maxWidth: '100%' }}>
                          <img
                            src={section.content}
                            alt={section.title}
                            style={{
                              maxWidth: '100%',
                              height: 'auto',
                              borderRadius: '8px',
                              border: '1px solid var(--border-light)',
                              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                            }}
                            onLoad={() => console.log('Image loaded successfully:', section.content)}
                            onError={(e) => {
                              console.error('Image failed to load:', section.content);
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement?.parentElement;
                              if (parent) {
                                parent.innerHTML = `
                                  <div style="
                                    padding: 20px; 
                                    text-align: center; 
                                    color: var(--muted);
                                    background: var(--panel-darker);
                                    border-radius: 8px;
                                    border: 1px solid var(--border-light);
                                  ">
                                    Failed to load image: ${section.content}
                                  </div>
                                `;
                              }
                            }}
                          />
                        </div>
                        {section.title !== 'New Image' && section.title && (
                          <div style={{ 
                            marginTop: '12px', 
                            fontSize: '14px', 
                            color: 'var(--ink)',
                            fontWeight: '500',
                            background: 'var(--panel-darker)',
                            padding: '8px 12px',
                            borderRadius: '6px',
                            border: '1px solid var(--border-light)',
                            display: 'inline-block'
                          }}>
                            {section.title}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ 
                        padding: '20px', 
                        textAlign: 'center', 
                        color: 'var(--muted)',
                        background: 'var(--panel-darker)',
                        borderRadius: '8px',
                        border: '1px solid var(--border-light)'
                      }}>
                        {section.content === 'uploading...' ? 'Uploading image...' : 'No image URL provided'}
                        {section.content && <div style={{ fontSize: '11px', marginTop: '8px', wordBreak: 'break-all' }}>
                          Debug: {section.content}
                        </div>}
                      </div>
                    )}
                  </div>
                )
              ) : (
                section.isEditing ? (
                  <MonacoCodeBlock
                    value={section.content}
                    onChange={(content) => updateSection(section.id, { content })}
                    language={section.type}
                    height={180}
                    placeholder={section.type === 'python' 
                      ? 'Enter Python code...' 
                      : 'Enter markdown content...'
                    }
                    executionMode={section.executionMode === 'inherit' ? chapter.defaultExecutionMode : section.executionMode}
                  />
                ) : (
                  <MonacoCodeBlock
                    value={section.content}
                    language={section.type}
                    height={140}
                    readOnly
                    showMinimap={false}
                    executionMode={section.executionMode === 'inherit' ? chapter.defaultExecutionMode : section.executionMode}
                  />
                )
              )}
            </div>
          </div>
        ))}

        {/* Add Section Area */}
        <div className="add-section-area">
          <div style={{ color: 'var(--muted)', marginBottom: '8px' }}>
            Add new section
          </div>
          <div className="add-buttons">
            <button
              className="action-button primary"
              onClick={() => addSection('markdown')}
            >
              📝 Add Markdown
            </button>
            <button
              className="action-button primary"
              onClick={() => addSection('python')}
            >
              🐍 Add Python
            </button>
            <button
              className="action-button primary"
              onClick={() => addSection('youtube')}
            >
              📺 Add YouTube Video
            </button>
            <button
              className="action-button primary"
              onClick={() => addSection('image')}
            >
              🖼️ Add Image
            </button>
            <button
              className="action-button"
              onClick={() => {
                setPasteTargetIndex(chapter.sections.length);
                setShowPasteDialog(true);
              }}
            >
              📋 Paste Content
            </button>
          </div>
        </div>
      </div>

      {/* Save Controls */}
      <div className="save-controls">
        <button
          className="action-button"
          onClick={() => setChapter({ ...chapter, sections: [] })}
          disabled={chapter.sections.length === 0}
        >
          Clear All
        </button>
        {onSave && (
          <button
            className="action-button primary"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Chapter'}
          </button>
        )}
      </div>

      {/* Paste Dialog */}
      {showPasteDialog && (
        <div className="paste-dialog" onClick={() => setShowPasteDialog(false)}>
          <div className="paste-dialog-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 16px 0', color: 'var(--ink)' }}>
              Paste Content
            </h3>
            <p style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: '16px' }}>
              Paste your markdown or Python code. Content type will be auto-detected.
            </p>
            <MonacoCodeBlock
              value={pasteContent}
              onChange={(content) => setPasteContent(content)}
              language={detectContentType(pasteContent)}
              height={200}
              placeholder="Paste your content here..."
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
              <button
                className="action-button"
                onClick={() => setShowPasteDialog(false)}
              >
                Cancel
              </button>
              <button
                className="action-button primary"
                onClick={handlePaste}
                disabled={!pasteContent.trim()}
              >
                Add Section
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}