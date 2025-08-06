import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Only OWNER can reset organization
    if (!session?.user || session.user.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Unauthorized. Only organization owners can reset organization data.' },
        { status: 403 }
      );
    }

    if (!session.user.organizationId) {
      return NextResponse.json(
        { error: 'No organization found for this user' },
        { status: 404 }
      );
    }

    const organizationId = session.user.organizationId;

    // Get count of books to be deleted for logging
    const booksCount = await prisma.book.count({
      where: { organizationId }
    });

    const chaptersCount = await prisma.chapter.count({
      where: { 
        book: { 
          organizationId 
        }
      }
    });

    console.log(`Starting organization reset for ${organizationId}: ${booksCount} books, ${chaptersCount} chapters`);

    // Delete all books (and chapters will be deleted via cascade)
    // This will also delete all related chapters, progress, bookAccess, etc.
    const deletedBooks = await prisma.book.deleteMany({
      where: {
        organizationId
      }
    });

    console.log(`Organization reset completed for ${organizationId}: ${deletedBooks.count} books deleted`);

    return NextResponse.json({ 
      success: true,
      message: `Successfully reset organization. Deleted ${deletedBooks.count} books and all associated content.`,
      deletedBooks: deletedBooks.count,
      deletedChapters: chaptersCount
    });

  } catch (error) {
    console.error('Error resetting organization:', error);
    return NextResponse.json(
      { error: 'Failed to reset organization data' },
      { status: 500 }
    );
  }
}