'use client';

import { useEffect, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import dynamic from 'next/dynamic';

interface MonacoCodeBlockProps {
  value: string;
  onChange?: (value: string) => void;
  language: 'markdown' | 'python';
  readOnly?: boolean;
  height?: number;
  placeholder?: string;
  showMinimap?: boolean;
  onRun?: () => void;
  executionMode?: 'shared' | 'isolated' | 'inherit';
  isRunning?: boolean;
}

export default function MonacoCodeBlock({
  value,
  onChange,
  language,
  readOnly = false,
  height = 200,
  placeholder,
  showMinimap = false,
  onRun,
  executionMode,
  isRunning = false
}: MonacoCodeBlockProps) {
  const [isClient, setIsClient] = useState(false);
  const editorRef = useRef<any>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Show loading until client-side
  if (!isClient) {
    return (
      <div 
        className="bg-gray-100 rounded-md border p-4 flex items-center justify-center"
        style={{ height: `${height}px` }}
      >
        <div className="text-gray-500">Loading editor...</div>
      </div>
    );
  }

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    
    // Add keyboard shortcuts
    if (onRun && monaco) {
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
        onRun();
      });
      
      editor.addCommand(monaco.KeyMod.Shift | monaco.KeyCode.Enter, () => {
        onRun();
      });
    }
  };

  const editorOptions = {
    theme: 'vs-dark',
    fontSize: 13,
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    lineNumbers: 'on',
    minimap: { enabled: showMinimap },
    scrollBeyondLastLine: false,
    automaticLayout: true,
    wordWrap: 'on',
    readOnly,
    renderWhitespace: 'selection',
    smoothScrolling: true,
    cursorBlinking: 'smooth',
    padding: { top: 12, bottom: 12 },
    suggest: {
      showKeywords: true,
      showSnippets: true,
    },
    quickSuggestions: {
      other: true,
      comments: true,
      strings: true,
    },
    tabSize: language === 'python' ? 4 : 2,
    insertSpaces: true,
  };

  // Remove custom theme setup to avoid SSR issues

  const getExecutionModeStyle = () => {
    if (!executionMode || executionMode === 'inherit') return {};
    
    const styles = {
      shared: { borderLeft: '3px solid #7aa2f7' },
      isolated: { borderLeft: '3px solid #9ece6a' }
    };
    
    return styles[executionMode] || {};
  };

  return (
    <div className="monaco-code-block">
      <style jsx>{`
        .monaco-code-block {
          border: 1px solid #23305d;
          border-radius: 12px;
          overflow: hidden;
          background: #0d1428;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .code-block-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          background: rgba(18, 26, 51, 0.7);
          border-bottom: 1px solid #23305d;
          font-size: 12px;
        }

        .language-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 8px;
          background: rgba(122, 162, 247, 0.15);
          border: 1px solid rgba(122, 162, 247, 0.3);
          border-radius: 6px;
          color: #7aa2f7;
          font-weight: 600;
        }

        .execution-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .execution-badge.shared {
          background: rgba(122, 162, 247, 0.2);
          color: #7aa2f7;
        }

        .execution-badge.isolated {
          background: rgba(158, 206, 106, 0.2);
          color: #9ece6a;
        }

        .code-actions {
          display: flex;
          gap: 6px;
        }

        .action-btn {
          background: transparent;
          border: 1px solid #2a3769;
          border-radius: 6px;
          padding: 4px 8px;
          color: #a6b0d6;
          cursor: pointer;
          font-size: 11px;
          transition: all 0.2s ease;
        }

        .action-btn:hover {
          border-color: #7aa2f7;
          color: #e8ecff;
          background: rgba(122, 162, 247, 0.1);
        }

        .action-btn.primary {
          background: rgba(122, 162, 247, 0.15);
          border-color: rgba(122, 162, 247, 0.4);
          color: #7aa2f7;
        }

        .action-btn.primary:hover {
          background: rgba(122, 162, 247, 0.25);
        }

        .action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .editor-container {
          position: relative;
        }

        .placeholder-overlay {
          position: absolute;
          top: 12px;
          left: 60px;
          color: #a6b0d6;
          opacity: 0.7;
          pointer-events: none;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 13px;
          z-index: 1;
        }

        .shortcuts-hint {
          position: absolute;
          bottom: 8px;
          right: 12px;
          color: #a6b0d6;
          font-size: 10px;
          opacity: 0.6;
          pointer-events: none;
        }
      `}</style>

      <div className="code-block-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="language-badge">
            <span>{language === 'python' ? '🐍' : '📝'}</span>
            <span>{language === 'python' ? 'Python' : 'Markdown'}</span>
          </div>
          
          {executionMode && executionMode !== 'inherit' && (
            <div className={`execution-badge ${executionMode}`}>
              {executionMode === 'shared' ? '🔗' : '🔒'}
              {executionMode}
            </div>
          )}
        </div>

        <div className="code-actions">
          {language === 'python' && onRun && (
            <button
              className="action-btn primary"
              onClick={onRun}
              disabled={isRunning}
              title="Run code (Ctrl/Cmd + Enter)"
            >
              {isRunning ? '⏳' : '▶️'} Run
            </button>
          )}
          
          <button
            className="action-btn"
            onClick={() => {
              if (editorRef.current) {
                const selection = editorRef.current.getSelection();
                const selectedText = selection 
                  ? editorRef.current.getModel()?.getValueInRange(selection) || value
                  : value;
                navigator.clipboard.writeText(selectedText);
              }
            }}
            title="Copy code"
          >
            📋 Copy
          </button>
          
          <button
            className="action-btn"
            onClick={() => onChange?.('')}
            title="Clear content"
            disabled={readOnly}
          >
            🗑️ Clear
          </button>
        </div>
      </div>

      <div className="editor-container" style={getExecutionModeStyle()}>
        {placeholder && !value && (
          <div className="placeholder-overlay">
            {placeholder}
          </div>
        )}
        
        <Editor
          height={height}
          language={language === 'python' ? 'python' : 'markdown'}
          value={value}
          onChange={(val) => onChange?.(val || '')}
          onMount={handleEditorDidMount}
          options={editorOptions}
          theme="custom-dark"
        />
        
        {language === 'python' && onRun && !readOnly && (
          <div className="shortcuts-hint">
            Ctrl/Cmd + Enter to run
          </div>
        )}
      </div>
    </div>
  );
}