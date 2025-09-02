'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Editor from '@monaco-editor/react';

// Global shared Pyodide instances per execution context
const sharedPyodideInstances: Record<string, unknown> = {};
const isolatedPyodideInstances: Record<string, unknown> = {};

interface ExecutionAwarePythonEditorProps {
  initialCode?: string;
  executionMode: 'shared' | 'isolated';
  contextId: string; // Chapter ID for shared mode, unique ID for isolated
  sectionId: string; // Unique identifier for this section
  chapterId?: string; // Chapter ID for tracking purposes
  onCodeRun?: (code: string, success: boolean) => void;
}

export default function ExecutionAwarePythonEditor({ 
  initialCode = '', 
  executionMode,
  contextId,
  sectionId,
  chapterId,
  onCodeRun
}: ExecutionAwarePythonEditorProps) {
  const [code, setCode] = useState(initialCode);
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isLoadingPyodide, setIsLoadingPyodide] = useState(false);
  const editorRef = useRef<any>(null);
  const sessionId = useRef<string>(`${crypto.randomUUID()}`);

  // Track code execution
  const trackExecution = async (
    code: string, 
    result: string, 
    status: 'success' | 'error', 
    errorMessage?: string
  ) => {
    // Only track if we have a chapterId
    if (!chapterId) return;

    try {
      await fetch('/api/code-executions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chapterId,
          sectionId,
          codeContent: code,
          executionResult: result,
          executionStatus: status,
          errorMessage,
          executionMode,
          contextId,
          sessionId: sessionId.current
        }),
      });
    } catch (error) {
      // Silently fail - don't disrupt user experience if tracking fails
      console.warn('Failed to track code execution:', error);
    }
  };

  useEffect(() => {
    if (initialCode) {
      setCode(initialCode);
    }
  }, [initialCode]);

  const getPyodideInstance = useCallback(async () => {
    const instanceKey = executionMode === 'shared' ? contextId : sectionId;
    const instanceStore = executionMode === 'shared' ? sharedPyodideInstances : isolatedPyodideInstances;

    if (instanceStore[instanceKey]) {
      return instanceStore[instanceKey];
    }

    setIsLoadingPyodide(true);
    try {
      // Load Pyodide
      const pyodideScript = document.createElement('script');
      pyodideScript.src = 'https://cdn.jsdelivr.net/pyodide/v0.26.2/full/pyodide.js';
      
      if (!document.querySelector('script[src*="pyodide.js"]')) {
        document.head.appendChild(pyodideScript);
        await new Promise((resolve, reject) => {
          pyodideScript.onload = resolve;
          pyodideScript.onerror = reject;
        });
      }

      // Wait for loadPyodide to be available
      while (typeof (window as any).loadPyodide === 'undefined') {
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const pyodide = await (window as any).loadPyodide({
        stdout: () => {}, // Will be set per execution
        stderr: () => {}  // Will be set per execution
      });

      // Load essential packages
      await pyodide.loadPackage(['pandas', 'numpy', 'matplotlib']);

      // Setup common imports and configurations
      await pyodide.runPythonAsync(`
import sys, warnings, pandas as pd, numpy as np
import matplotlib.pyplot as plt
warnings.filterwarnings("ignore")
pd.set_option("display.width", 100)
pd.set_option("display.max_colwidth", 80)
print("Python environment ready!")
      `);

      instanceStore[instanceKey] = pyodide;
      return pyodide;
    } finally {
      setIsLoadingPyodide(false);
    }
  }, [executionMode, contextId, sectionId]);

  const handleEditorDidMount = (editor: unknown, monaco: unknown) => {
    editorRef.current = editor;
    
    // Add keyboard shortcut
    editor.addAction({
      id: 'run-python-code',
      label: 'Run Python Code',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
      run: handleRunCode
    });

    editor.onKeyDown((e: any) => {
      if ((e.ctrlKey || e.metaKey) && e.keyCode === monaco.KeyCode.Enter) {
        e.preventDefault();
        e.stopPropagation();
        handleRunCode();
      }
    });
  };

  const handleRunCode = async () => {
    if (!code.trim() || isRunning || isLoadingPyodide) return;

    setIsRunning(true);
    setOutput('Running...');

    try {
      const pyodide = await getPyodideInstance();
      let outputBuffer = '';

      // Helper function to convert Pyodide output to text
      const toText = (s: any): string => {
        if (typeof s === 'string') return s;
        
        // Handle Uint8Array or array of character codes
        if (s instanceof Uint8Array) {
          return new TextDecoder().decode(s);
        }
        
        // Handle individual character codes (common in some Pyodide versions)
        if (typeof s === 'number' && s > 0 && s < 65536) {
          return String.fromCharCode(s);
        }
        
        // Handle arrays of character codes
        if (Array.isArray(s)) {
          return String.fromCharCode(...s);
        }
        
        return String(s);
      };

      // Capture output with proper text conversion
      pyodide.setStdout({ 
        raw: (text: any) => {
          const converted = toText(text);
          outputBuffer += converted;
        }
      });
      pyodide.setStderr({ 
        raw: (text: any) => {
          const converted = toText(text);
          outputBuffer += converted;
        }
      });

      // Execute the code
      await pyodide.runPythonAsync(code);

      // Reset stdout/stderr
      pyodide.setStdout();
      pyodide.setStderr();

      const result = outputBuffer || 'Code executed successfully (no output)';
      setOutput(result);
      onCodeRun?.(code, true);
      
      // Track successful execution
      await trackExecution(code, result, 'success');

    } catch (err: any) {
      const errorMessage = err?.message || String(err);
      const result = `Error: ${errorMessage}`;
      setOutput(result);
      onCodeRun?.(code, false);
      
      // Track failed execution
      await trackExecution(code, result, 'error', errorMessage);
    } finally {
      setIsRunning(false);
    }
  };

  const clearConsole = () => {
    setOutput('');
  };

  const getExecutionModeInfo = () => {
    if (executionMode === 'shared') {
      return {
        color: '#3b82f6',
        bgColor: '#eff6ff',
        icon: '🔗',
        label: 'Shared State',
        description: 'Variables are shared between Python cells in this chapter'
      };
    } else {
      return {
        color: '#10b981',
        bgColor: '#ecfdf5',
        icon: '🔒',
        label: 'Isolated State',
        description: 'This Python cell runs independently with its own variables'
      };
    }
  };

  const modeInfo = getExecutionModeInfo();

  return (
    <div style={{
      background: '#121a33',
      border: '1px solid #23305d',
      borderRadius: '14px',
      overflow: 'hidden',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        background: 'rgba(18, 26, 51, 0.7)',
        borderBottom: '1px solid #23305d'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 8px',
            background: 'rgba(122, 162, 247, 0.15)',
            border: '1px solid rgba(122, 162, 247, 0.3)',
            borderRadius: '6px',
            color: '#7aa2f7',
            fontSize: '12px',
            fontWeight: '600'
          }}>
            <span>🐍</span>
            <span>Python</span>
          </div>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 8px',
            background: modeInfo.bgColor,
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: '600',
            color: modeInfo.color
          }}>
            <span>{modeInfo.icon}</span>
            <span>{modeInfo.label}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={clearConsole}
            disabled={isRunning || isLoadingPyodide}
            style={{
              background: 'transparent',
              border: '1px solid #2a3769',
              borderRadius: '6px',
              padding: '6px 12px',
              color: '#a6b0d6',
              cursor: 'pointer',
              fontSize: '12px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#7aa2f7';
              e.currentTarget.style.background = 'rgba(122, 162, 247, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#2a3769';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            🗑️ Clear
          </button>
          
          <button
            onClick={handleRunCode}
            disabled={isRunning || isLoadingPyodide || !code.trim()}
            style={{
              background: 'rgba(122, 162, 247, 0.15)',
              border: '1px solid rgba(122, 162, 247, 0.4)',
              borderRadius: '6px',
              padding: '6px 12px',
              color: '#7aa2f7',
              cursor: isRunning || isLoadingPyodide || !code.trim() ? 'not-allowed' : 'pointer',
              fontSize: '12px',
              fontWeight: '600',
              opacity: isRunning || isLoadingPyodide || !code.trim() ? 0.5 : 1,
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (!isRunning && !isLoadingPyodide && code.trim()) {
                e.currentTarget.style.background = 'rgba(122, 162, 247, 0.25)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(122, 162, 247, 0.15)';
            }}
          >
            {isRunning ? '⏳ Running...' : isLoadingPyodide ? '📦 Loading...' : '▶️ Run'}
          </button>
        </div>
      </div>

      {/* Code Editor */}
      <div style={{ height: '200px' }}>
        <Editor
          height="100%"
          defaultLanguage="python"
          value={code}
          onChange={(value) => setCode(value || '')}
          onMount={handleEditorDidMount}
          theme="vs-dark"
          options={{
            fontSize: 13,
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            lineNumbers: 'on',
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            wordWrap: 'on',
            renderWhitespace: 'selection',
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            padding: { top: 12, bottom: 12 },
            tabSize: 4,
            insertSpaces: true
          }}
        />
      </div>

      {/* Execution Mode Info */}
      <div style={{
        padding: '8px 16px',
        background: '#0d1428',
        borderTop: '1px solid #23305d',
        fontSize: '11px',
        color: '#a6b0d6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <span>{modeInfo.description}</span>
        <span style={{ opacity: 0.6 }}>Ctrl/Cmd + Enter to run</span>
      </div>

      {/* Output Console */}
      {output && (
        <div style={{
          borderTop: '1px solid #23305d',
          background: '#0d1428'
        }}>
          <div style={{
            padding: '8px 16px',
            background: 'rgba(18, 26, 51, 0.8)',
            color: '#a6b0d6',
            fontSize: '11px',
            fontWeight: '600',
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
            borderBottom: '1px solid #23305d'
          }}>
            Output
          </div>
          <div style={{
            padding: '12px 16px',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            fontSize: '13px',
            color: '#e8ecff',
            whiteSpace: 'pre-wrap',
            maxHeight: '200px',
            overflowY: 'auto',
            lineHeight: 1.5
          }}>
            {output}
          </div>
        </div>
      )}
    </div>
  );
}