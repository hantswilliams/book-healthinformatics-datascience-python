import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
  size?: number;
  modified?: string;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const publicPath = path.join(process.cwd(), 'public');
    const contentDirs = ['docs', 'python'];
    
    const buildFileTree = (dirPath: string, relativePath: string = ''): FileNode[] => {
      try {
        const items = fs.readdirSync(dirPath);
        const nodes: FileNode[] = [];

        for (const item of items) {
          const fullPath = path.join(dirPath, item);
          const itemRelativePath = path.join(relativePath, item).replace(/\\/g, '/');
          
          try {
            const stats = fs.statSync(fullPath);
            
            if (stats.isDirectory()) {
              const children = buildFileTree(fullPath, itemRelativePath);
              nodes.push({
                name: item,
                path: itemRelativePath,
                type: 'directory',
                children,
                modified: stats.mtime.toISOString()
              });
            } else {
              // Only include relevant file types
              const ext = path.extname(item).toLowerCase();
              if (['.md', '.py', '.js', '.ts', '.json', '.txt'].includes(ext)) {
                nodes.push({
                  name: item,
                  path: itemRelativePath,
                  type: 'file',
                  size: stats.size,
                  modified: stats.mtime.toISOString()
                });
              }
            }
          } catch (error) {
            console.error(`Error processing ${fullPath}:`, error);
          }
        }

        return nodes.sort((a, b) => {
          // Directories first, then files, alphabetically
          if (a.type !== b.type) {
            return a.type === 'directory' ? -1 : 1;
          }
          return a.name.localeCompare(b.name);
        });
      } catch (error) {
        console.error(`Error reading directory ${dirPath}:`, error);
        return [];
      }
    };

    const fileTree: FileNode[] = [];
    
    for (const dir of contentDirs) {
      const dirPath = path.join(publicPath, dir);
      if (fs.existsSync(dirPath)) {
        const children = buildFileTree(dirPath, dir);
        fileTree.push({
          name: dir,
          path: dir,
          type: 'directory',
          children
        });
      }
    }

    return NextResponse.json({ files: fileTree });
    
  } catch (error) {
    console.error('Error in files API:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { path: filePath, type, name } = await request.json();
    
    if (!filePath || !type || !name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const publicPath = path.join(process.cwd(), 'public');
    const fullPath = path.join(publicPath, filePath, name);
    
    // Ensure the path is within the public directory
    if (!fullPath.startsWith(publicPath)) {
      return NextResponse.json({ error: 'Invalid file path' }, { status: 400 });
    }

    if (type === 'directory') {
      fs.mkdirSync(fullPath, { recursive: true });
    } else {
      // Ensure parent directory exists
      fs.mkdirSync(path.dirname(fullPath), { recursive: true });
      
      // Create file with template content based on extension
      const ext = path.extname(name).toLowerCase();
      let content = '';
      
      if (ext === '.md') {
        content = `# ${name.replace(/\.md$/, '')}\n\nContent goes here...\n`;
      } else if (ext === '.py') {
        content = `# ${name.replace(/\.py$/, '')}\n# Python code goes here\n\nprint("Hello, World!")\n`;
      }
      
      fs.writeFileSync(fullPath, content);
    }

    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Error creating file/directory:', error);
    return NextResponse.json(
      { error: 'Error creating file/directory' }, 
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { path: filePath } = await request.json();
    
    if (!filePath) {
      return NextResponse.json({ error: 'Missing file path' }, { status: 400 });
    }

    const publicPath = path.join(process.cwd(), 'public');
    const fullPath = path.join(publicPath, filePath);
    
    // Ensure the path is within the public directory
    if (!fullPath.startsWith(publicPath)) {
      return NextResponse.json({ error: 'Invalid file path' }, { status: 400 });
    }

    if (fs.existsSync(fullPath)) {
      const stats = fs.statSync(fullPath);
      if (stats.isDirectory()) {
        fs.rmSync(fullPath, { recursive: true, force: true });
      } else {
        fs.unlinkSync(fullPath);
      }
    }

    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Error deleting file/directory:', error);
    return NextResponse.json(
      { error: 'Error deleting file/directory' }, 
      { status: 500 }
    );
  }
}