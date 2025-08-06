import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function PATCH(
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
    const body = await request.json();
    const { isPublished } = body;

    if (typeof isPublished !== 'boolean') {
      return NextResponse.json(
        { error: 'isPublished must be a boolean' },
        { status: 400 }
      );
    }

    // Verify the book belongs to the user's organization
    const book = await prisma.book.findFirst({
      where: {
        id: bookId,
        organizationId: session.user.organizationId
      }
    });

    if (!book) {
      return NextResponse.json(
        { error: 'Book not found in your organization' },
        { status: 404 }
      );
    }

    // Update the book's publish status
    const updatedBook = await prisma.book.update({
      where: { id: bookId },
      data: { isPublished },
      select: {
        id: true,
        title: true,
        isPublished: true
      }
    });

    return NextResponse.json({ 
      success: true,
      book: updatedBook,
      message: `Book ${isPublished ? 'published' : 'unpublished'} successfully`
    });

  } catch (error) {
    console.error('Error updating book publish status:', error);
    return NextResponse.json(
      { error: 'Failed to update book publish status' },
      { status: 500 }
    );
  }
}