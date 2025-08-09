import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only organization owners, admins, and instructors can edit books
    if (!['OWNER', 'ADMIN', 'INSTRUCTOR'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Only organization owners, admins, and instructors can edit books' },
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    const bookId = resolvedParams.bookId;

    // Get the book with full chapter and section data
    const book = await prisma.book.findUnique({
      where: {
        id: bookId
      },
      include: {
        chapters: {
          include: {
            sections: {
              orderBy: {
                order: 'asc'
              }
            }
          },
          orderBy: {
            order: 'asc'
          }
        }
      }
    });

    if (!book) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      );
    }

    // Check if user has access to this book
    if (book.organizationId !== session.user.organizationId) {
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
      estimatedHours: book.estimatedHours || 1,
      tags: book.tags ? JSON.parse(book.tags) : [],
      chapters: book.chapters.map(chapter => ({
        id: chapter.id,
        title: chapter.title,
        emoji: chapter.emoji,
        order: chapter.order - 1, // Convert to 0-based index for UI
        defaultExecutionMode: chapter.defaultExecutionMode?.toLowerCase() || 'shared',
        sections: chapter.sections.map(section => ({
          id: section.id,
          type: section.type.toLowerCase() as 'markdown' | 'python',
          title: section.title || '',
          content: section.content,
          order: section.order - 1, // Convert to 0-based index for UI
          executionMode: section.executionMode?.toLowerCase() || 'inherit',
          dependsOn: section.dependsOn ? JSON.parse(section.dependsOn) : [],
          isEditing: false
        }))
      }))
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