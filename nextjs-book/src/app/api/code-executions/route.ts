import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, createClient } from '@/lib/supabase-server';
import { z } from 'zod';

const createExecutionSchema = z.object({
  chapterId: z.string().uuid(),
  sectionId: z.string().min(1),
  codeContent: z.string().min(1),
  executionResult: z.string().optional(),
  executionStatus: z.enum(['success', 'error', 'timeout']),
  errorMessage: z.string().optional(),
  executionMode: z.enum(['shared', 'isolated']),
  contextId: z.string().min(1),
  sessionId: z.string().uuid().optional()
});

export async function POST(request: NextRequest) {
  try {
    // Extract organization slug from the referer header
    const referer = request.headers.get('referer');
    let orgSlug: string | undefined = undefined;
    
    if (referer) {
      const urlMatch = referer.match(/\/org\/([^\/]+)/);
      if (urlMatch && urlMatch[1]) {
        orgSlug = urlMatch[1];
      }
    }

    // Get authenticated user using the helper function
    const { user, error: authError } = await getAuthenticatedUser(orgSlug);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createExecutionSchema.parse(body);

    // Verify user has access to the chapter
    const { data: chapterAccess, error: chapterError } = await supabase
      .from('chapters')
      .select('id, book_id')
      .eq('id', validatedData.chapterId)
      .single();

    if (chapterError || !chapterAccess) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
    }

    // Check if user has access to this book
    const { data: bookAccess, error: bookAccessError } = await supabase
      .from('books')
      .select('id')
      .eq('id', chapterAccess.book_id)
      .or(`organization_id.eq.${user.organization_id},is_public.eq.true`)
      .single();

    if (bookAccessError || !bookAccess) {
      return NextResponse.json({ error: 'Access denied to this content' }, { status: 403 });
    }

    // Insert code execution record
    const { data: execution, error: insertError } = await supabase
      .from('code_executions')
      .insert({
        user_id: user.id,
        organization_id: user.organization_id,
        chapter_id: validatedData.chapterId,
        section_id: validatedData.sectionId,
        code_content: validatedData.codeContent,
        execution_result: validatedData.executionResult,
        execution_status: validatedData.executionStatus,
        error_message: validatedData.errorMessage,
        execution_mode: validatedData.executionMode,
        context_id: validatedData.contextId,
        session_id: validatedData.sessionId
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting code execution:', insertError);
      return NextResponse.json({ error: 'Failed to save execution' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: execution
    });

  } catch (error) {
    console.error('Code execution API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Invalid request data',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Extract organization slug from the referer header
    const referer = request.headers.get('referer');
    let orgSlug: string | undefined = undefined;
    
    if (referer) {
      const urlMatch = referer.match(/\/org\/([^\/]+)/);
      if (urlMatch && urlMatch[1]) {
        orgSlug = urlMatch[1];
      }
    }

    // Get authenticated user using the helper function
    const { user, error: authError } = await getAuthenticatedUser(orgSlug);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const chapterId = searchParams.get('chapterId');
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
    let query = supabase
      .from('code_executions')
      .select(`
        *,
        users!inner(first_name, last_name, email),
        chapters!inner(title)
      `)
      .eq('organization_id', user.organization_id)
      .order('executed_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Add filters
    if (chapterId) {
      query = query.eq('chapter_id', chapterId);
    }

    // If not admin/instructor, only show own executions
    if (!['OWNER', 'ADMIN', 'INSTRUCTOR'].includes(user.role)) {
      query = query.eq('user_id', user.id);
    } else if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: executions, error: queryError } = await query;

    if (queryError) {
      console.error('Error fetching code executions:', queryError);
      return NextResponse.json({ error: 'Failed to fetch executions' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: executions || [],
      pagination: {
        limit,
        offset,
        hasMore: (executions?.length || 0) === limit
      }
    });

  } catch (error) {
    console.error('Code execution GET API error:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}