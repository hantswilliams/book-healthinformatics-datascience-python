'use client';

import { useState, useRef, useEffect } from 'react';

interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  language?: 'python' | 'markdown' | 'javascript' | 'json';
  readOnly?: boolean;
  height?: string;
  placeholder?: string;
}

export default function CodeEditor({ 
  value, 
  onChange, 
  language = 'python', 
  readOnly = false, 
  height = '400px',
  placeholder = 'Enter your code here...'
}: CodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [lineNumbers, setLineNumbers] = useState<number[]>([]);

  useEffect(() => {
    updateLineNumbers();
  }, [value]);

  const updateLineNumbers = () => {
    const lines = value.split('\n');
    setLineNumbers(Array.from({ length: lines.length }, (_, i) => i + 1));
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange?.(newValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    
    // Handle Tab key for indentation
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue = value.substring(0, start) + '    ' + value.substring(end);
      onChange?.(newValue);
      
      // Set cursor position after the inserted tab
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 4;
      }, 0);
    }
    
    // Handle Enter key for auto-indentation
    if (e.key === 'Enter') {
      const lines = value.substring(0, textarea.selectionStart).split('\n');
      const currentLine = lines[lines.length - 1];
      const indentMatch = currentLine.match(/^(\s*)/);
      const currentIndent = indentMatch ? indentMatch[1] : '';
      
      // Add extra indent for Python blocks
      let extraIndent = '';
      if (language === 'python' && currentLine.trim().endsWith(':')) {
        extraIndent = '    ';
      }
      
      setTimeout(() => {
        const newIndent = currentIndent + extraIndent;
        if (newIndent) {
          const start = textarea.selectionStart;
          const newValue = value.substring(0, start) + newIndent + value.substring(start);
          onChange?.(newValue);
          
          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = start + newIndent.length;
          }, 0);
        }
      }, 0);
    }
  };

  const getLanguageClass = () => {
    switch (language) {
      case 'python': return 'language-python';
      case 'markdown': return 'language-markdown';
      case 'javascript': return 'language-javascript';
      case 'json': return 'language-json';
      default: return 'language-text';
    }
  };

  const getLanguageIcon = () => {
    switch (language) {
      case 'python': return '🐍';
      case 'markdown': return '📝';
      case 'javascript': return '⚛️';
      case 'json': return '📄';
      default: return '📄';
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-sm">{getLanguageIcon()}</span>
          <span className="text-sm font-medium text-zinc-700 capitalize">{language}</span>
          {readOnly && (
            <span className="px-2 py-1 bg-gray-200 text-zinc-600 text-xs rounded">Read Only</span>
          )}
        </div>
        <div className="flex items-center space-x-2 text-xs text-zinc-500">
          <span>Lines: {lineNumbers.length}</span>
          <span>Chars: {value.length}</span>
        </div>
      </div>

      {/* Editor */}
      <div className="relative" style={{ height }}>
        <div className="absolute inset-0 flex">
          {/* Line Numbers */}
          <div className="bg-gray-50 border-r border-gray-200 px-2 py-4 text-xs text-zinc-500 font-mono select-none min-w-[50px]">
            {lineNumbers.map((lineNum) => (
              <div key={lineNum} className="leading-5 text-right pr-2">
                {lineNum}
              </div>
            ))}
          </div>
          
          {/* Code Area */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={value}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              readOnly={readOnly}
              placeholder={placeholder}
              className={`absolute inset-0 w-full h-full p-4 font-mono text-sm leading-5 resize-none border-none focus:outline-none focus:ring-0 bg-transparent ${getLanguageClass()}`}
              style={{
                lineHeight: '1.25rem',
                tabSize: 4,
                whiteSpace: 'pre',
                overflowWrap: 'normal',
                overflowX: 'auto'
              }}
              spellCheck={false}
            />
            
            {/* Syntax highlighting overlay would go here in a real implementation */}
            {/* For now, we'll rely on the textarea's basic functionality */}
          </div>
        </div>
      </div>
      
      {/* Footer with helpful shortcuts */}
      {!readOnly && (
        <div className="bg-gray-50 px-4 py-2 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <div className="flex items-center space-x-4">
              <span>Tab: Indent</span>
              <span>Ctrl+Z: Undo</span>
              {language === 'python' && <span>: Auto-indent</span>}
            </div>
            <div>
              {language === 'python' && 'Python syntax highlighting'}
              {language === 'markdown' && 'Markdown formatting'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}