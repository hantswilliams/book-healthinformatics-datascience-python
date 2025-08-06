import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getFileContent } from '@/lib/file-storage';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Reconstruct the file path
    const filePath = path.join('uploads', 'books', ...params.path);
    
    // Basic security check - ensure path is within uploads/books
    if (!filePath.startsWith('uploads/books/')) {
      return NextResponse.json({ error: 'Invalid file path' }, { status: 400 });
    }

    // Get file content
    const content = await getFileContent(filePath);
    
    // Determine content type based on file extension
    const extension = path.extname(filePath);
    let contentType = 'text/plain';
    
    if (extension === '.md') {
      contentType = 'text/markdown';
    } else if (extension === '.py') {
      contentType = 'text/x-python';
    }

    return new NextResponse(content, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600'
      }
    });

  } catch (error) {
    console.error('File serving error:', error);
    return NextResponse.json(
      { error: 'File not found' },
      { status: 404 }
    );
  }
}