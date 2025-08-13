import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, createClient } from '@/lib/supabase-server';
import { z } from 'zod';

const updateBookSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).nullable().optional(),
  difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']).optional(),
  category: z.enum([
    'GENERAL',
    'DATA_SCIENCE',
    'WEB_DEVELOPMENT',
    'MACHINE_LEARNING',
    'HEALTHCARE',
    'FINANCE',
    'GEOSPATIAL',
    'AUTOMATION',
    'API_DEVELOPMENT'
  ]).optional(),
  estimatedHours: z.number().min(1).max(100).nullable().optional(),
  tags: z.array(z.string()).optional()
});

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ bookId: string }> }
) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { bookId } = await context.params;
    const supabase = await createClient();

    // Get the book with chapters and sections
    const { data: book, error: bookError } = await supabase
      .from('books')
      .select(`
        id,
        slug,
        title,
        description,
        cover_image,
        difficulty,
        estimated_hours,
        category,
        tags,
        is_published,
        is_public,
        display_order,
        organization_id,
        created_by,
        created_at,
        updated_at,
        chapters (
          id,
          title,
          emoji,
          display_order,
          estimated_minutes,
          is_published,
          default_execution_mode,
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
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    // Check authorization: user must be in same organization or book must be public
    const canAccess = book.is_public || 
                     (book.organization_id === user.organization_id) ||
                     (book.organization_id === null);

    if (!canAccess) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // If book is unpublished, only org members can view it
    if (!book.is_published && book.organization_id && book.organization_id !== user.organization_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Transform data to match expected format
    const transformedBook = {
      ...book,
      isPublished: book.is_published,
      isPublic: book.is_public,
      organizationId: book.organization_id,
      createdBy: book.created_by,
      createdAt: book.created_at,
      updatedAt: book.updated_at,
      estimatedHours: book.estimated_hours,
      coverImage: book.cover_image,
      order: book.display_order,
      tags: book.tags ? JSON.parse(book.tags) : [],
      chapters: (book.chapters || [])
        .sort((a: any, b: any) => a.display_order - b.display_order)
        .map((chapter: any) => ({
          ...chapter,
          order: chapter.display_order,
          isPublished: chapter.is_published,
          estimatedMinutes: chapter.estimated_minutes,
          defaultExecutionMode: chapter.default_execution_mode,
          sections: (chapter.sections || [])
            .sort((a: any, b: any) => a.display_order - b.display_order)
            .map((section: any) => ({
              ...section,
              order: section.display_order,
              executionMode: section.execution_mode,
              dependsOn: section.depends_on ? JSON.parse(section.depends_on) : []
            }))
        }))
    };

    return NextResponse.json({
      success: true,
      book: transformedBook
    });
  } catch (error) {
    console.error('Error fetching book:', error);
    return NextResponse.json({ error: 'Failed to fetch book' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ bookId: string }> }
) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError || !user || !['OWNER', 'ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { bookId } = await context.params;
    const supabase = await createClient();

    const body = await request.json();
    const validated = updateBookSchema.parse(body);

    // Ensure book belongs to user's organization
    const { data: existing, error: findError } = await supabase
      .from('books')
      .select('*')
      .eq('id', bookId)
      .eq('organization_id', user.organization_id)
      .single();

    if (findError || !existing) {
      return NextResponse.json({ error: 'Book not found in your organization' }, { status: 404 });
    }

    // Update the book
    const { data: updated, error: updateError } = await supabase
      .from('books')
      .update({
        title: validated.title ?? existing.title,
        description: validated.description !== undefined ? validated.description : existing.description,
        difficulty: validated.difficulty ?? existing.difficulty,
        category: validated.category ?? existing.category,
        estimated_hours: validated.estimatedHours ?? existing.estimated_hours,
        tags: validated.tags ? JSON.stringify(validated.tags) : existing.tags,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookId)
      .select('id, title, description, difficulty, category, estimated_hours, tags, updated_at')
      .single();

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      book: { 
        ...updated, 
        tags: updated.tags ? JSON.parse(updated.tags) : [],
        estimatedHours: updated.estimated_hours,
        updatedAt: updated.updated_at
      },
      message: 'Book updated successfully'
    });
  } catch (error) {
    console.error('Error updating book:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update book' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { bookId: string } }
) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    
    if (authError || !user || !['OWNER', 'ADMIN'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const bookId = params.bookId;
    const supabase = await createClient();

    // Verify the book belongs to the user's organization
    const { data: book, error: findError } = await supabase
      .from('books')
      .select('id, title, organization_id')
      .eq('id', bookId)
      .eq('organization_id', user.organization_id)
      .single();

    if (findError || !book) {
      return NextResponse.json(
        { error: 'Book not found in your organization' },
        { status: 404 }
      );
    }

    // Delete the book (cascade delete will handle chapters and sections)
    const { error: deleteError } = await supabase
      .from('books')
      .delete()
      .eq('id', bookId);

    if (deleteError) {
      throw deleteError;
    }

    return NextResponse.json({ 
      success: true,
      message: `Book "${book.title}" and all its chapters have been deleted successfully`
    });

  } catch (error) {
    console.error('Error deleting book:', error);
    return NextResponse.json(
      { error: 'Failed to delete book' },
      { status: 500 }
    );
  }
}