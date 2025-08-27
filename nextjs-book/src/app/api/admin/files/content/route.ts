import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/lib/supabase-types';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
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

    // Get user profile to check role
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile || userProfile.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('path');
    
    if (!filePath) {
      return NextResponse.json({ error: 'Missing file path' }, { status: 400 });
    }

    const publicPath = path.join(process.cwd(), 'public');
    const fullPath = path.join(publicPath, filePath);
    
    // Ensure the path is within the public directory
    if (!fullPath.startsWith(publicPath)) {
      return NextResponse.json({ error: 'Invalid file path' }, { status: 400 });
    }

    if (!fs.existsSync(fullPath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const stats = fs.statSync(fullPath);
    if (stats.isDirectory()) {
      return NextResponse.json({ error: 'Cannot read directory as file' }, { status: 400 });
    }

    const content = fs.readFileSync(fullPath, 'utf-8');
    const fileInfo = {
      name: path.basename(fullPath),
      size: stats.size,
      modified: stats.mtime.toISOString(),
      type: path.extname(fullPath).toLowerCase().substring(1) || 'txt'
    };

    return NextResponse.json({ content, fileInfo });
    
  } catch (error) {
    console.error('Error reading file:', error);
    return NextResponse.json(
      { error: 'Error reading file' }, 
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

    const { path: filePath, content } = await request.json();
    
    if (!filePath || content === undefined) {
      return NextResponse.json({ error: 'Missing file path or content' }, { status: 400 });
    }

    const publicPath = path.join(process.cwd(), 'public');
    const fullPath = path.join(publicPath, filePath);
    
    // Ensure the path is within the public directory
    if (!fullPath.startsWith(publicPath)) {
      return NextResponse.json({ error: 'Invalid file path' }, { status: 400 });
    }

    // Create directory if it doesn't exist
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Write the file
    fs.writeFileSync(fullPath, content, 'utf-8');

    const stats = fs.statSync(fullPath);
    const fileInfo = {
      name: path.basename(fullPath),
      size: stats.size,
      modified: stats.mtime.toISOString(),
      type: path.extname(fullPath).toLowerCase().substring(1) || 'txt'
    };

    return NextResponse.json({ success: true, fileInfo });
    
  } catch (error) {
    console.error('Error writing file:', error);
    return NextResponse.json(
      { error: 'Error writing file' }, 
      { status: 500 }
    );
  }
}