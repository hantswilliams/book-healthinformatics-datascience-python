'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase-client';
import type { PyodideInstance } from '@/types';

interface PyodideConfig {
  chapterId?: string;
  packages?: string[];
  onPackageLoadStart?: (packageName: string) => void;
  onPackageLoadComplete?: (packageName: string, success: boolean, error?: string) => void;
}

interface PyodideLoadingState {
  isLoading: boolean;
  loadingPackages: string[];
  loadedPackages: string[];
  failedPackages: { name: string; error: string }[];
  totalEstimatedTime: number;
  currentProgress: number;
}

export const usePyodide = (config?: PyodideConfig) => {
  const [pyodide, setPyodide] = useState<PyodideInstance | null>(null);
  const [loadingState, setLoadingState] = useState<PyodideLoadingState>({
    isLoading: true,
    loadingPackages: [],
    loadedPackages: [],
    failedPackages: [],
    totalEstimatedTime: 0,
    currentProgress: 0
  });
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  // Load chapter packages from database
  const loadChapterPackages = useCallback(async (chapterId: string): Promise<string[]> => {
    try {
      const { data, error } = await supabase
        .from('chapters')
        .select('packages')
        .eq('id', chapterId)
        .single();

      if (error) throw error;

      return data?.packages || [];
    } catch (err) {
      console.error('Error loading chapter packages:', err);
      return [];
    }
  }, [supabase]);

  // Load packages dynamically
  const loadPackages = useCallback(async (
    pyodideInstance: PyodideInstance, 
    packages: string[]
  ) => {
    const startTime = Date.now();
    
    setLoadingState(prev => ({
      ...prev,
      loadingPackages: [...packages],
      totalEstimatedTime: packages.reduce((sum, pkg) => {
        // Estimate load time based on package
        const estimateMap: { [key: string]: number } = {
          'pandas': 3000, 'matplotlib': 3000, 'numpy': 2000, 'scipy': 4000,
          'scikit-learn': 5000, 'plotly': 2000, 'seaborn': 2000
        };
        return sum + (estimateMap[pkg] || 1000);
      }, 0)
    }));

    for (const packageName of packages) {
      try {
        config?.onPackageLoadStart?.(packageName);
        
        setLoadingState(prev => ({
          ...prev,
          loadingPackages: prev.loadingPackages.filter(name => name !== packageName),
          currentProgress: Date.now() - startTime
        }));

        // Try to load from Pyodide first, then fall back to micropip
        try {
          await pyodideInstance.loadPackage(packageName);
        } catch {
          // If Pyodide package loading fails, try micropip
          await pyodideInstance.loadPackage('micropip');
          const micropip = pyodideInstance.pyimport('micropip');
          await micropip.install(packageName);
        }

        setLoadingState(prev => ({
          ...prev,
          loadedPackages: [...prev.loadedPackages, packageName]
        }));

        config?.onPackageLoadComplete?.(packageName, true);

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        
        setLoadingState(prev => ({
          ...prev,
          loadingPackages: prev.loadingPackages.filter(name => name !== packageName),
          failedPackages: [...prev.failedPackages, { name: packageName, error: errorMessage }]
        }));

        config?.onPackageLoadComplete?.(packageName, false, errorMessage);

        console.warn(`Failed to load package ${packageName}:`, errorMessage);
      }
    }
  }, [config, supabase]);

  useEffect(() => {
    const loadPyodide = async () => {
      try {
        setLoadingState(prev => ({ ...prev, isLoading: true }));

        // Load Pyodide script dynamically
        let pyodideInstance: PyodideInstance;
        
        if (!window.loadPyodide) {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js';
          
          await new Promise<void>((resolve, reject) => {
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load Pyodide'));
            document.head.appendChild(script);
          });
        }

        pyodideInstance = await window.loadPyodide();
        
        // Always load micropip
        await pyodideInstance.loadPackage('micropip');
        
        // Replace input() with JS prompt()
        pyodideInstance.globals.set('input', (promptText: string) => 
          prompt(promptText) || ''
        );

        // Determine which packages to load
        let packagesToLoad: string[] = [];

        if (config?.packages) {
          // Use explicitly provided packages
          packagesToLoad = config.packages;
        } else if (config?.chapterId) {
          // Load packages for specific chapter
          packagesToLoad = await loadChapterPackages(config.chapterId);
        } else {
          // Default packages (backward compatibility)
          packagesToLoad = ['numpy', 'pandas', 'matplotlib'];
        }

        // Load packages
        if (packagesToLoad.length > 0) {
          await loadPackages(pyodideInstance, packagesToLoad);
        }

        setPyodide(pyodideInstance);
        setLoadingState(prev => ({
          ...prev,
          isLoading: false,
          loadingPackages: [],
          currentProgress: prev.totalEstimatedTime
        }));

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLoadingState(prev => ({ ...prev, isLoading: false }));
      }
    };

    loadPyodide();
  }, [config?.chapterId, loadChapterPackages, loadPackages]);

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
    isLoading: loadingState.isLoading,
    loadingState,
    error,
    runPython
  };
};