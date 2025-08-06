import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get books that the user's organization has access to
    const orgBooks = await prisma.bookAccess.findMany({
      where: {
        organizationId: user.organizationId
      },
      include: {
        book: {
          include: {
            chapters: {
              orderBy: {
                order: 'asc'
              }
            }
          }
        }
      },
      orderBy: {
        book: {
          order: 'asc'
        }
      }
    });

    // Also get books created by this organization
    const orgCreatedBooks = await prisma.book.findMany({
      where: {
        organizationId: user.organizationId
      },
      include: {
        chapters: {
          orderBy: {
            order: 'asc'
          }
        }
      },
      orderBy: {
        order: 'asc'
      }
    });

    // Combine and deduplicate books
    const bookMap = new Map();
    
    // Add books from BookAccess
    orgBooks.forEach(({ book, accessType }) => {
      bookMap.set(book.id, {
        ...book,
        accessType,
        chapters: book.chapters
      });
    });

    // Add organization-created books (they have full access)
    orgCreatedBooks.forEach(book => {
      if (!bookMap.has(book.id)) {
        bookMap.set(book.id, {
          ...book,
          accessType: 'ADMIN',
          chapters: book.chapters
        });
      }
    });

    const books = Array.from(bookMap.values());

    return NextResponse.json({ books });
  } catch (error) {
    console.error('Error fetching user books:', error);
    return NextResponse.json(
      { error: 'Failed to fetch books' },
      { status: 500 }
    );
  }
}