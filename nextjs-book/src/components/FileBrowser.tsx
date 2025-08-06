'use client';

import { useState, useEffect } from 'react';

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
  content?: string;
  size?: number;
  modified?: string;
}

interface FileBrowserProps {
  onFileSelect?: (file: FileNode) => void;
  onFileEdit?: (file: FileNode, content: string) => void;
  allowEdit?: boolean;
}

export default function FileBrowser({ onFileSelect, onFileEdit, allowEdit = true }: FileBrowserProps) {
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [editingFile, setEditingFile] = useState<FileNode | null>(null);
  const [fileContent, setFileContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchFileTree();
  }, []);

  const fetchFileTree = async () => {
    try {
      const response = await fetch('/api/admin/files');
      if (response.ok) {
        const data = await response.json();
        setFileTree(data.files || []);
        // Auto-expand main directories
        setExpandedDirs(new Set(['docs', 'python']));
      }
    } catch (error) {
      console.error('Error fetching file tree:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFileContent = async (file: FileNode) => {
    try {
      const response = await fetch(`/api/admin/files/content?path=${encodeURIComponent(file.path)}`);
      if (response.ok) {
        const data = await response.json();
        setFileContent(data.content || '');
        setSelectedFile(file);
        onFileSelect?.(file);
      }
    } catch (error) {
      console.error('Error fetching file content:', error);
    }
  };

  const saveFile = async () => {
    if (!editingFile) return;
    
    setSaving(true);
    try {
      const response = await fetch('/api/admin/files/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: editingFile.path,
          content: fileContent
        })
      });

      if (response.ok) {
        onFileEdit?.(editingFile, fileContent);
        setEditingFile(null);
        alert('File saved successfully!');
      } else {
        alert('Error saving file');
      }
    } catch (error) {
      console.error('Error saving file:', error);
      alert('Error saving file');
    } finally {
      setSaving(false);
    }
  };

  const toggleDirectory = (dirPath: string) => {
    const newExpanded = new Set(expandedDirs);
    if (newExpanded.has(dirPath)) {
      newExpanded.delete(dirPath);
    } else {
      newExpanded.add(dirPath);
    }
    setExpandedDirs(newExpanded);
  };

  const getFileIcon = (file: FileNode) => {
    if (file.type === 'directory') {
      return expandedDirs.has(file.path) ? '📂' : '📁';
    }
    
    const ext = file.name.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'md': return '📝';
      case 'py': return '🐍';
      case 'js':
      case 'ts':
      case 'tsx':
      case 'jsx': return '⚛️';
      case 'json': return '📄';
      default: return '📄';
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const renderFileTree = (nodes: FileNode[], depth = 0) => {
    return nodes.map((node) => (
      <div key={node.path}>
        <div
          className={`flex items-center px-2 py-1 text-sm cursor-pointer hover:bg-gray-100 ${
            selectedFile?.path === node.path ? 'bg-blue-50 border-r-2 border-blue-500' : ''
          }`}
          style={{ paddingLeft: `${depth * 20 + 8}px` }}
          onClick={() => {
            if (node.type === 'directory') {
              toggleDirectory(node.path);
            } else {
              fetchFileContent(node);
            }
          }}
        >
          <span className="mr-2">{getFileIcon(node)}</span>
          <span className="flex-1 truncate">{node.name}</span>
          {node.type === 'file' && node.size && (
            <span className="text-xs text-zinc-500 ml-2">
              {formatFileSize(node.size)}
            </span>
          )}
        </div>
        
        {node.type === 'directory' && expandedDirs.has(node.path) && node.children && (
          <div>
            {renderFileTree(node.children, depth + 1)}
          </div>
        )}
      </div>
    ));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[600px]">
      {/* File Tree */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <h3 className="text-sm font-medium text-zinc-900 flex items-center">
            <span className="mr-2">📁</span>
            Content Files
          </h3>
        </div>
        <div className="overflow-y-auto h-full text-zinc-700">
          {fileTree.length > 0 ? (
            renderFileTree(fileTree)
          ) : (
            <div className="p-4 text-center text-zinc-500">
              No files found
            </div>
          )}
        </div>
      </div>

      {/* File Content/Editor */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="mr-2">{selectedFile ? getFileIcon(selectedFile) : '📄'}</span>
              <h3 className="text-sm font-medium text-zinc-900">
                {selectedFile ? selectedFile.name : 'Select a file'}
              </h3>
            </div>
            {selectedFile && allowEdit && (
              <div className="flex items-center space-x-2">
                {editingFile ? (
                  <>
                    <button
                      onClick={() => {
                        setEditingFile(null);
                        fetchFileContent(selectedFile);
                      }}
                      className="px-2 py-1 text-xs bg-gray-100 text-zinc-700 rounded hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveFile}
                      disabled={saving}
                      className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setEditingFile(selectedFile)}
                    className="px-2 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700"
                  >
                    Edit
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="h-full overflow-hidden">
          {selectedFile ? (
            <div className="h-full">
              {editingFile ? (
                <textarea
                  value={fileContent}
                  onChange={(e) => setFileContent(e.target.value)}
                  className="w-full h-full p-4 font-mono text-sm resize-none border-none focus:outline-none focus:ring-0"
                  placeholder="File content..."
                />
              ) : (
                <div className="h-full overflow-y-auto">
                  <pre className="p-4 text-sm font-mono whitespace-pre-wrap">
                    {fileContent}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-zinc-500">
              <div className="text-center">
                <span className="text-4xl mb-2 block">📁</span>
                <p>Select a file to view its contents</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}