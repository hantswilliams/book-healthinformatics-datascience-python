import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, createClient } from '@/lib/supabase-server';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ bookId: string }> }
) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only organization owners, admins, and instructors can update books
    if (!['OWNER', 'ADMIN', 'INSTRUCTOR'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Only organization owners, admins, and instructors can update books' },
        { status: 403 }
      );
    }

    const supabase = await createClient();

    const resolvedParams = await params;
    const bookId = resolvedParams.bookId;
    const bookData = await request.json();
    
    console.log('Update Enhanced Book - Book ID:', bookId);
    console.log('Update Enhanced Book - Data:', JSON.stringify(bookData, null, 2));

    // Verify book exists and user has access
    const { data: existingBook, error: bookError } = await supabase
      .from('books')
      .select(`
        id,
        title,
        organization_id,
        chapters (
          id,
          title,
          display_order,
          sections (
            id,
            title,
            display_order
          )
        )
      `)
      .eq('id', bookId)
      .single();

    if (bookError || !existingBook) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      );
    }

    if (existingBook.organization_id !== user.organization_id) {
      return NextResponse.json(
        { error: 'You do not have access to this book' },
        { status: 403 }
      );
    }

    // Update book metadata first
    const { data: updatedBook, error: updateError } = await supabase
      .from('books')
      .update({
        title: bookData.title,
        description: bookData.description || null,
        difficulty: bookData.difficulty,
        category: bookData.category,
        estimated_hours: bookData.estimatedHours || null,
        tags: JSON.stringify(bookData.tags || []),
        updated_at: new Date().toISOString()
      })
      .eq('id', bookId)
      .select('*')
      .single();

    if (updateError) {
      throw updateError;
    }

    // Create a map of existing chapters by order for ID preservation
    const existingChaptersByOrder = new Map();
    (existingBook.chapters || []).forEach((ch: any) => {
      existingChaptersByOrder.set(ch.display_order - 1, ch); // Convert to 0-based for comparison
    });

    // Generate book slug for predictable IDs
    const bookSlug = updatedBook.title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Delete existing sections first (due to foreign key constraints)
    const { error: deleteSectionsError } = await supabase
      .from('sections')
      .delete()
      .in('chapter_id', (existingBook.chapters || []).map((ch: any) => ch.id));

    if (deleteSectionsError) {
      console.error('Error deleting sections:', deleteSectionsError);
    }

    // Delete existing chapters
    const { error: deleteChaptersError } = await supabase
      .from('chapters')
      .delete()
      .eq('book_id', bookId);

    if (deleteChaptersError) {
      console.error('Error deleting chapters:', deleteChaptersError);
    }

    // Create new chapters and sections
    for (const chapterData of bookData.chapters) {
      console.log('Creating chapter:', chapterData.title, 'with execution mode:', chapterData.defaultExecutionMode);
      
      // Use existing chapter ID if available, otherwise create predictable ID
      const existingChapter = existingChaptersByOrder.get(chapterData.order);
      const chapterId = existingChapter?.id || chapterData.id || `${bookSlug}-chapter-${chapterData.order + 1}`;
      
      const { data: chapter, error: chapterError } = await supabase
        .from('chapters')
        .insert({
          id: chapterId,
          title: chapterData.title,
          emoji: chapterData.emoji,
          display_order: chapterData.order + 1, // Convert back to 1-based
          markdown_url: '', // Required field, empty for enhanced chapters
          python_url: '', // Required field, empty for enhanced chapters  
          default_execution_mode: (chapterData.defaultExecutionMode || 'shared').toString().toUpperCase(),
          packages: JSON.stringify(chapterData.packages || []),
          book_id: bookId
        })
        .select('*')
        .single();

      if (chapterError) {
        throw chapterError;
      }

      // Create sections for this chapter
      for (const sectionData of chapterData.sections) {
        console.log('Creating section:', sectionData.title, 'with type:', sectionData.type, 'execution mode:', sectionData.executionMode);
        
        const { error: sectionError } = await supabase
          .from('sections')
          .insert({
            title: sectionData.title || null,
            content: sectionData.content,
            type: (sectionData.type || 'markdown').toString().toUpperCase(),
            display_order: sectionData.order + 1, // Convert back to 1-based
            execution_mode: (sectionData.executionMode || 'inherit').toString().toUpperCase(),
            depends_on: sectionData.dependsOn?.length > 0 ? JSON.stringify(sectionData.dependsOn) : null,
            chapter_id: chapter.id
          });

        if (sectionError) {
          throw sectionError;
        }
      }
    }

    return NextResponse.json({ 
      message: 'Book updated successfully',
      book: updatedBook 
    });

  } catch (error) {
    console.error('Error updating enhanced book:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to update book';
    
    return NextResponse.json(
      { 
        error: 'Failed to update book',
        details: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}