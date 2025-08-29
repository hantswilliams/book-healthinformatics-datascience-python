import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, createClient } from '@/lib/supabase-server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookId: string }> }
) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only organization owners, admins, and instructors can edit books
    if (!['OWNER', 'ADMIN', 'INSTRUCTOR'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Only organization owners, admins, and instructors can edit books' },
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    const bookId = resolvedParams.bookId;
    const supabase = await createClient();

    // Get the book with full chapter and section data
    const { data: book, error: bookError } = await supabase
      .from('books')
      .select(`
        id,
        slug,
        title,
        description,
        difficulty,
        category,
        estimated_hours,
        tags,
        organization_id,
        chapters (
          id,
          title,
          emoji,
          display_order,
          default_execution_mode,
          packages,
          sections (
            id,
            title,
            type,
            content,
            display_order,
            execution_mode,
            depends_on
          )
        )
      `)
      .eq('id', bookId)
      .single();

    if (bookError || !book) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      );
    }

    // Check if user has access to this book
    if (book.organization_id !== user.organization_id) {
      return NextResponse.json(
        { error: 'You do not have access to this book' },
        { status: 403 }
      );
    }

    // Transform the data to match our Enhanced Chapter Builder format
    const enhancedBook = {
      id: book.id,
      slug: book.slug,
      title: book.title,
      description: book.description || '',
      difficulty: book.difficulty,
      category: book.category,
      estimatedHours: book.estimated_hours || 1,
      tags: book.tags ? JSON.parse(book.tags) : [],
      chapters: (book.chapters || [])
        .sort((a: any, b: any) => a.display_order - b.display_order)
        .map((chapter: any) => {
          console.log('API: Processing chapter:', chapter.title, 'packages from DB:', chapter.packages);
          return {
            id: chapter.id,
            title: chapter.title,
            emoji: chapter.emoji,
            order: chapter.display_order - 1, // Convert to 0-based index for UI
            defaultExecutionMode: chapter.default_execution_mode?.toLowerCase() || 'shared',
            packages: chapter.packages || [],
            sections: (chapter.sections || [])
              .sort((a: any, b: any) => a.display_order - b.display_order)
              .map((section: any) => ({
                id: section.id,
                type: section.type.toLowerCase() as 'markdown' | 'python',
                title: section.title || '',
                content: section.content,
                order: section.display_order - 1, // Convert to 0-based index for UI
                executionMode: section.execution_mode?.toLowerCase() || 'inherit',
                dependsOn: section.depends_on ? JSON.parse(section.depends_on) : [],
                isEditing: false
              }))
          };
        })
    };

    return NextResponse.json({ book: enhancedBook });

  } catch (error) {
    console.error('Error fetching full book data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch book data' },
      { status: 500 }
    );
  }
}