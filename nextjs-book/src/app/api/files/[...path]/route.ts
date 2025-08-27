import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/lib/supabase-types';
import { getFileContent } from '@/lib/file-storage';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const cookieStore = await cookies();
    
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;

    // Reconstruct the file path
    const filePath = path.join('uploads', 'books', ...resolvedParams.path);
    
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