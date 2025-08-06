'use client';

import { useState, useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { usePyodide } from '@/lib/usePyodide';

interface PythonEditorProps {
  initialCode?: string;
  onCodeRun?: (code: string, success: boolean) => void;
}

export default function PythonEditor({ 
  initialCode = '', 
  onCodeRun
}: PythonEditorProps) {
  const [code, setCode] = useState(initialCode);
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const editorRef = useRef<{ addAction: (action: { id: string; label: string; keybindings: number[]; run: () => void }) => void } | null>(null);
  const { runPython, isLoading: pyodideLoading } = usePyodide();

  useEffect(() => {
    if (initialCode) {
      setCode(initialCode);
    }
  }, [initialCode]);

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    
    // Add keyboard shortcut using Monaco's proper API
    editor.addAction({
      id: 'run-python-code',
      label: 'Run Python Code',
      keybindings: [
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter
      ],
      contextMenuGroupId: 'navigation',
      contextMenuOrder: 1.5,
      run: function() {
        console.log('Running code via keyboard shortcut');
        handleRunCode();
        return null;
      }
    });

    // Also add a direct key listener as fallback
    editor.onKeyDown((e: any) => {
      if ((e.ctrlKey || e.metaKey) && e.keyCode === monaco.KeyCode.Enter) {
        e.preventDefault();
        e.stopPropagation();
        console.log('Direct key handler triggered');
        handleRunCode();
      }
    });
  };

  const handleRunCode = async () => {
    if (!code.trim() || isRunning || pyodideLoading) return;

    setIsRunning(true);
    setOutput('');

    try {
      const result = await runPython(code);
      
      if (result.error) {
        setOutput(`Error: ${result.error}`);
        onCodeRun?.(code, false);
      } else {
        setOutput(result.output || 'Code executed successfully (no output)');
        onCodeRun?.(code, true);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setOutput(`Error: ${errorMessage}`);
      onCodeRun?.(code, false);
    } finally {
      setIsRunning(false);
    }
  };

  const clearConsole = () => {
    setOutput('');
  };

  return (
    <div className="bg-white shadow-sm rounded-xl overflow-hidden">
      <div className="border-b border-gray-100 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Interactive Python Editor</h3>
            <p className="mt-1 text-sm text-gray-500">Write and execute Python code in real-time</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={clearConsole}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-zinc-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              disabled={isRunning}
            >
              Clear Console
            </button>
            <button
              onClick={handleRunCode}
              disabled={isRunning || pyodideLoading || !code.trim()}
              className="inline-flex items-center px-4 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isRunning ? 'Running...' : 'Run Code ⌘+Enter'}
            </button>
          </div>
        </div>
      </div>
      
      <div className="h-64 border-b border-gray-100">
        <Editor
          height="100%"
          defaultLanguage="python"
          theme="vs-dark"
          value={code}
          onChange={(value) => setCode(value || '')}
          onMount={handleEditorDidMount}
          options={{
            automaticLayout: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            fontSize: 14,
            tabSize: 4,
            insertSpaces: true,
          }}
        />
      </div>
      
      <div className="p-6 bg-gray-50">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Output Console</h4>
        <pre className="bg-white border border-gray-200 rounded-md p-4 text-sm font-mono text-gray-800 overflow-auto max-h-48 whitespace-pre-wrap">
          {pyodideLoading ? 'Loading Python environment...' : output || 'No output yet. Run some code!'}
        </pre>
      </div>
    </div>
  );
}