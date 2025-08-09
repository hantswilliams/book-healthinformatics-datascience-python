import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ bookId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only organization owners, admins, and instructors can update books
    if (!['OWNER', 'ADMIN', 'INSTRUCTOR'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Only organization owners, admins, and instructors can update books' },
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    const bookId = resolvedParams.bookId;
    const bookData = await request.json();
    
    console.log('Update Enhanced Book - Book ID:', bookId);
    console.log('Update Enhanced Book - Data:', JSON.stringify(bookData, null, 2));

    // Verify book exists and user has access
    const existingBook = await prisma.book.findUnique({
      where: { id: bookId },
      include: {
        chapters: {
          include: {
            sections: true
          }
        }
      }
    });

    if (!existingBook) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      );
    }

    if (existingBook.organizationId !== session.user.organizationId) {
      return NextResponse.json(
        { error: 'You do not have access to this book' },
        { status: 403 }
      );
    }

    // Start transaction to update book, chapters, and sections
    const updatedBook = await prisma.$transaction(async (tx) => {
      // Update book metadata
      const book = await tx.book.update({
        where: { id: bookId },
        data: {
          title: bookData.title,
          description: bookData.description || null,
          difficulty: bookData.difficulty,
          category: bookData.category,
          estimatedHours: bookData.estimatedHours || null,
          tags: JSON.stringify(bookData.tags || [])
        }
      });

      // Get existing chapters for ID preservation
      const existingChapters = await tx.chapter.findMany({
        where: { bookId: bookId },
        include: { sections: true }
      });

      // Create a map of existing chapters by order for ID preservation
      const existingChaptersByOrder = new Map();
      existingChapters.forEach(ch => {
        existingChaptersByOrder.set(ch.order - 1, ch); // Convert to 0-based for comparison
      });

      // Generate book slug for predictable IDs
      const bookSlug = book.title.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      // Delete existing chapters and sections (we'll recreate with proper IDs)
      await tx.section.deleteMany({
        where: {
          chapter: {
            bookId: bookId
          }
        }
      });
      await tx.chapter.deleteMany({
        where: { bookId: bookId }
      });

      // Create new chapters and sections with preserved or predictable IDs
      for (const chapterData of bookData.chapters) {
        console.log('Creating chapter:', chapterData.title, 'with execution mode:', chapterData.defaultExecutionMode);
        
        // Use existing chapter ID if available, otherwise create predictable ID
        const existingChapter = existingChaptersByOrder.get(chapterData.order);
        const chapterId = existingChapter?.id || chapterData.id || `${bookSlug}-chapter-${chapterData.order + 1}`;
        
        const chapter = await tx.chapter.create({
          data: {
            id: chapterId,
            title: chapterData.title,
            emoji: chapterData.emoji,
            order: chapterData.order + 1, // Convert back to 1-based
            markdownUrl: '', // Required field, empty for enhanced chapters
            pythonUrl: '', // Required field, empty for enhanced chapters  
            defaultExecutionMode: (chapterData.defaultExecutionMode || 'shared').toString().toUpperCase() as 'SHARED' | 'ISOLATED',
            bookId: bookId
          }
        });

        // Create sections for this chapter
        for (const sectionData of chapterData.sections) {
          console.log('Creating section:', sectionData.title, 'with type:', sectionData.type, 'execution mode:', sectionData.executionMode);
          
          await tx.section.create({
            data: {
              title: sectionData.title || null,
              content: sectionData.content,
              type: (sectionData.type || 'markdown').toString().toUpperCase() as 'MARKDOWN' | 'PYTHON',
              order: sectionData.order + 1, // Convert back to 1-based
              executionMode: (sectionData.executionMode || 'inherit').toString().toUpperCase() as 'SHARED' | 'ISOLATED' | 'INHERIT',
              dependsOn: sectionData.dependsOn?.length > 0 ? JSON.stringify(sectionData.dependsOn) : null,
              chapterId: chapter.id
            }
          });
        }
      }

      return book;
    });

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