'use client';

import { useState, useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { usePyodide } from '@/lib/usePyodide';

interface PythonEditorProps {
  initialCode?: string;
  onCodeRun?: (code: string, success: boolean) => void;
  chapterId?: string; // For loading chapter-specific packages
}

export default function PythonEditor({ 
  initialCode = '', 
  onCodeRun,
  chapterId
}: PythonEditorProps) {
  const [code, setCode] = useState(initialCode);
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [currentlyLoadingPackage, setCurrentlyLoadingPackage] = useState<string>('');
  const editorRef = useRef<{ addAction: (action: { id: string; label: string; keybindings: number[]; run: () => void }) => void } | null>(null);
  
  // Configure Pyodide with chapter-specific packages
  const { runPython, isLoading: pyodideLoading, loadingState } = usePyodide({
    chapterId,
    onPackageLoadStart: (packageName: string) => {
      setCurrentlyLoadingPackage(packageName);
    },
    onPackageLoadComplete: (packageName: string, success: boolean, error?: string) => {
      setCurrentlyLoadingPackage('');
      if (!success && error) {
        setOutput(prev => prev + `\nWarning: Failed to load ${packageName}: ${error}`);
      }
    }
  });

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
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-900">Output Console</h4>
          {loadingState.loadedPackages.length > 0 && (
            <div className="flex items-center space-x-2 text-xs text-green-600">
              <span>📦</span>
              <span>{loadingState.loadedPackages.length} packages loaded</span>
            </div>
          )}
        </div>

        {/* Package Loading Status */}
        {(pyodideLoading || currentlyLoadingPackage || loadingState.loadingPackages.length > 0) && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-3">
            <div className="flex items-center space-x-2 text-sm text-blue-800">
              <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
              {pyodideLoading && !currentlyLoadingPackage ? (
                <span>Initializing Python environment...</span>
              ) : currentlyLoadingPackage ? (
                <span>Loading {currentlyLoadingPackage}...</span>
              ) : loadingState.loadingPackages.length > 0 ? (
                <span>Loading packages: {loadingState.loadingPackages.join(', ')}</span>
              ) : (
                <span>Getting ready...</span>
              )}
            </div>
            
            {loadingState.totalEstimatedTime > 0 && (
              <div className="mt-2">
                <div className="w-full bg-blue-200 rounded-full h-1.5">
                  <div 
                    className="bg-blue-600 h-1.5 rounded-full transition-all duration-500" 
                    style={{ 
                      width: `${Math.min(100, (loadingState.currentProgress / loadingState.totalEstimatedTime) * 100)}%` 
                    }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Failed Packages Warning */}
        {loadingState.failedPackages.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-3">
            <div className="text-sm text-yellow-800">
              <span className="font-medium">Warning:</span> Some packages failed to load:
            </div>
            <ul className="mt-1 text-xs text-yellow-700">
              {loadingState.failedPackages.map((pkg, index) => (
                <li key={index}>• {pkg.name}: {pkg.error}</li>
              ))}
            </ul>
          </div>
        )}

        <pre className="bg-white border border-gray-200 rounded-md p-4 text-sm font-mono text-gray-800 overflow-auto max-h-48 whitespace-pre-wrap">
          {pyodideLoading || loadingState.loadingPackages.length > 0 ? 
            'Python environment is loading...' : 
            output || 'No output yet. Run some code!'
          }
        </pre>
      </div>
    </div>
  );
}