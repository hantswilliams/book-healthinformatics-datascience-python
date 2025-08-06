import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

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