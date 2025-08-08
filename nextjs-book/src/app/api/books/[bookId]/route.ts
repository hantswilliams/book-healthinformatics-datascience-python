import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
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
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { bookId } = await context.params;

  const book = await prisma.book.findFirst({
      where: {
    id: bookId,
        // allow owner/admin/instructor within org; learners only if published
        OR: [
          { organizationId: session.user.organizationId },
          { organizationId: null }
        ]
      },
      include: {
        chapters: {
          orderBy: { order: 'asc' },
          include: {
            sections: {
              orderBy: { order: 'asc' }
            }
          }
        }
      }
    });

    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    // basic authorization: only org members can view org book drafts
    if (!book.isPublished && book.organizationId && book.organizationId !== session.user.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      book: {
        ...book,
        tags: book.tags ? JSON.parse(book.tags) : []
      }
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
    const session = await getServerSession(authOptions);
    if (!session?.user || !['OWNER', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { bookId } = await context.params;

    const body = await request.json();
    const validated = updateBookSchema.parse(body);

    // ensure book belongs to org
    const existing = await prisma.book.findFirst({
      where: { id: bookId, organizationId: session.user.organizationId }
    });
    if (!existing) {
      return NextResponse.json({ error: 'Book not found in your organization' }, { status: 404 });
    }

    const updated = await prisma.book.update({
      where: { id: bookId },
      data: {
        title: validated.title ?? existing.title,
        description: validated.description !== undefined ? validated.description : existing.description,
        difficulty: validated.difficulty ?? existing.difficulty,
        category: validated.category ?? existing.category,
        estimatedHours: validated.estimatedHours ?? existing.estimatedHours,
        tags: validated.tags ? JSON.stringify(validated.tags) : existing.tags
      },
      select: {
        id: true,
        title: true,
        description: true,
        difficulty: true,
        category: true,
        estimatedHours: true,
        tags: true,
        updatedAt: true
      }
    });

    return NextResponse.json({
      success: true,
      book: { ...updated, tags: updated.tags ? JSON.parse(updated.tags) : [] },
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
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !['OWNER', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const bookId = params.bookId;

    // Verify the book belongs to the user's organization
    const book = await prisma.book.findFirst({
      where: {
        id: bookId,
        organizationId: session.user.organizationId
      },
      include: {
        chapters: true
      }
    });

    if (!book) {
      return NextResponse.json(
        { error: 'Book not found in your organization' },
        { status: 404 }
      );
    }

    // Delete the book and all related chapters (cascade delete)
    await prisma.book.delete({
      where: { id: bookId }
    });

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