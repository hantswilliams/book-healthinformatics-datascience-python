import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chapterId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const chapterId = resolvedParams.chapterId;

    // Get the chapter with book and access information
    const chapter = await prisma.chapter.findUnique({
      where: {
        id: chapterId
      },
      include: {
        book: {
          select: {
            id: true,
            title: true,
            organizationId: true,
            isPublished: true,
            isPublic: true
          }
        },
        sections: {
          orderBy: {
            order: 'asc'
          }
        }
      }
    });

    if (!chapter) {
      return NextResponse.json(
        { error: 'Chapter not found' },
        { status: 404 }
      );
    }

    // Check if the book is published
    if (!chapter.book.isPublished) {
      return NextResponse.json(
        { error: 'This chapter is not yet published' },
        { status: 403 }
      );
    }

    // Check access permissions
    let hasAccess = false;

    // If it's a public book, allow access
    if (chapter.book.isPublic) {
      hasAccess = true;
    } 
    // If it's an organization book, check organization membership and book access
    else if (chapter.book.organizationId) {
      // Check if user belongs to the same organization
      if (session.user.organizationId === chapter.book.organizationId) {
        // Check if there's specific book access granted
        const bookAccess = await prisma.bookAccess.findFirst({
          where: {
            organizationId: session.user.organizationId,
            bookId: chapter.book.id,
            userId: session.user.id
          }
        });

        // Grant access if:
        // 1. User has explicit book access, OR
        // 2. User is OWNER/ADMIN (they can access all org books), OR
        // 3. No specific access control exists (default org access)
        if (bookAccess || 
            ['OWNER', 'ADMIN'].includes(session.user.role) ||
            (await prisma.bookAccess.count({ 
              where: { 
                organizationId: session.user.organizationId, 
                bookId: chapter.book.id 
              } 
            })) === 0) {
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
      order: chapter.order,
      estimatedMinutes: chapter.estimatedMinutes,
      bookTitle: chapter.book.title,
      sections: chapter.sections.map(section => ({
        id: section.id,
        title: section.title,
        type: section.type.toLowerCase(), // Convert MARKDOWN/PYTHON to markdown/python
        content: section.content,
        order: section.order
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