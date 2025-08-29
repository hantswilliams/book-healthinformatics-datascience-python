'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from '@/lib/SupabaseProvider';
import MonacoCodeBlock from './MonacoCodeBlock';
import PackageSelector from './PackageSelector';

// Enhanced interfaces with execution modes
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
    if (initialChapter && initialChapter.id !== chapter.id) {
      console.log('EnhancedChapterBuilder switching from', chapter.title, 'to', initialChapter.title);
      console.log('New chapter packages:', initialChapter.packages);
      setChapter(initialChapter);
    }
  }, [initialChapter, chapter.id]);

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

  const addSection = (type: 'markdown' | 'python', targetIndex?: number) => {
    const newSection: EnhancedSection = {
      id: generateSectionId(),
      type,
      title: type === 'markdown' ? 'New Content Section' : 'New Code Exercise',
      content: type === 'markdown' 
        ? '# New Section\n\nAdd your content here...'
        : '# New exercise\nprint("Hello, World!")\n\n# Your code here:\n',
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

  const detectContentType = (content: string): 'markdown' | 'python' => {
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
    const newSection: EnhancedSection = {
      id: generateSectionId(),
      type,
      title: `Pasted ${type === 'markdown' ? 'Content' : 'Code'}`,
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
        const packagesArray = Array.isArray(chapter.packages) ? chapter.packages : 
                             typeof chapter.packages === 'string' ? JSON.parse(chapter.packages || '[]') : [];
        return packagesArray.length > 0 && (
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
              {packagesArray.map((pkg) => (
                <span
                  key={pkg}
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
                {section.type === 'python' ? '🐍' : '📝'}
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
              {section.isEditing ? (
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