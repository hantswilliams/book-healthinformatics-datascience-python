'use client';

import { useState, useEffect, useCallback } from 'react';
import type { PyodideInstance } from '@/types';

export const usePyodide = () => {
  const [pyodide, setPyodide] = useState<PyodideInstance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPyodide = async () => {
      try {
        // Load Pyodide script dynamically
        if (!window.loadPyodide) {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js';
          script.onload = async () => {
            const pyodideInstance = await window.loadPyodide();
            await pyodideInstance.loadPackage('micropip');
            await pyodideInstance.loadPackage(['pandas', 'matplotlib', 'numpy']);
            
            // Replace input() with JS prompt()
            pyodideInstance.globals.set('input', (promptText: string) => 
              prompt(promptText) || ''
            );
            
            setPyodide(pyodideInstance);
            setIsLoading(false);
          };
          script.onerror = () => {
            setError('Failed to load Pyodide');
            setIsLoading(false);
          };
          document.head.appendChild(script);
        } else {
          const pyodideInstance = await window.loadPyodide();
          await pyodideInstance.loadPackage('micropip');
          await pyodideInstance.loadPackage(['pandas', 'matplotlib', 'numpy']);
          
          pyodideInstance.globals.set('input', (promptText: string) => 
            prompt(promptText) || ''
          );
          
          setPyodide(pyodideInstance);
          setIsLoading(false);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setIsLoading(false);
      }
    };

    loadPyodide();
  }, []);

  const runPython = useCallback(async (code: string): Promise<{ output: string; error?: string }> => {
    if (!pyodide) {
      return { output: '', error: 'Pyodide not loaded' };
    }

    try {
      // Setup output capture
      await pyodide.runPython(`
        import sys
        from io import StringIO

        class OutputCapture:
            def __init__(self):
                self.output = StringIO()
                self.original_stdout = sys.stdout

            def capture(self):
                sys.stdout = self.output

            def release(self):
                sys.stdout = self.original_stdout
                content = self.output.getvalue()
                self.output = StringIO()
                return content

        _output_capture = OutputCapture()
        _output_capture.capture()
      `);

      // Execute user code
      const result = await pyodide.runPythonAsync(code);

      // Get captured output
      const output = pyodide.runPython(`
        _output_capture.release()
      `) as string;

      let finalOutput = output || '';
      if (result !== undefined && result !== null) {
        finalOutput += (finalOutput ? '\n' : '') + String(result);
      }

      return { output: finalOutput };
    } catch (err) {
      return { 
        output: '', 
        error: err instanceof Error ? err.message : 'Execution error' 
      };
    }
  }, [pyodide]);

  return {
    pyodide,
    isLoading,
    error,
    runPython
  };
};