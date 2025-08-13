import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, createClient } from '@/lib/supabase-server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chapterId: string }> }
) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const chapterId = resolvedParams.chapterId;

    // Get Supabase client
    const supabase = await createClient();

    // Get the chapter with book and sections information
    const { data: chapter, error: chapterError } = await supabase
      .from('chapters')
      .select(`
        id,
        title,
        emoji,
        display_order,
        estimated_minutes,
        default_execution_mode,
        book:books!inner(
          id,
          title,
          organization_id,
          is_published,
          is_public
        ),
        sections!inner(
          id,
          title,
          type,
          content,
          display_order,
          execution_mode,
          depends_on
        )
      `)
      .eq('id', chapterId)
      .single();

    if (chapterError || !chapter) {
      return NextResponse.json(
        { error: 'Chapter not found' },
        { status: 404 }
      );
    }

    // Check if the book is published
    if (!chapter.book.is_published) {
      return NextResponse.json(
        { error: 'This chapter is not yet published' },
        { status: 403 }
      );
    }

    // Check access permissions
    let hasAccess = false;

    // If it's a public book, allow access
    if (chapter.book.is_public) {
      hasAccess = true;
    } 
    // If it's an organization book, check organization membership and book access
    else if (chapter.book.organization_id) {
      // Check if user belongs to the same organization
      if (user.organization_id === chapter.book.organization_id) {
        // Check if there's specific book access granted
        const { data: bookAccess, error: bookAccessError } = await supabase
          .from('book_access')
          .select('*')
          .eq('organization_id', user.organization_id)
          .eq('book_id', chapter.book.id)
          .eq('user_id', user.id)
          .single();

        // Check if there are any access controls for this book
        const { count: accessControlCount } = await supabase
          .from('book_access')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', user.organization_id)
          .eq('book_id', chapter.book.id);

        // Grant access if:
        // 1. User has explicit book access, OR
        // 2. User is OWNER/ADMIN (they can access all org books), OR
        // 3. No specific access control exists (default org access)
        if (bookAccess || 
            ['OWNER', 'ADMIN'].includes(user.role) ||
            (accessControlCount === 0)) {
          hasAccess = true;
        }
      }
    }

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'You do not have access to this chapter' },
        { status: 403 }
      );
    }

    // Transform the data to match the expected format
    const chapterData = {
      id: chapter.id,
      title: chapter.title,
      emoji: chapter.emoji,
      order: chapter.display_order,
      estimatedMinutes: chapter.estimated_minutes,
      defaultExecutionMode: chapter.default_execution_mode?.toLowerCase() || 'shared',
      bookTitle: chapter.book.title,
      sections: chapter.sections
        .sort((a: any, b: any) => a.display_order - b.display_order)
        .map((section: any) => ({
          id: section.id,
          title: section.title,
          type: section.type.toLowerCase(), // Convert MARKDOWN/PYTHON to markdown/python
          content: section.content,
          order: section.display_order,
          executionMode: section.execution_mode?.toLowerCase() || 'inherit',
          dependsOn: section.depends_on ? JSON.parse(section.depends_on) : []
        }))
    };

    return NextResponse.json({ chapter: chapterData });

  } catch (error) {
    console.error('Error fetching chapter:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chapter' },
      { status: 500 }
    );
  }
}