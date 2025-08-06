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

    // Get books that the user has access to
    const userBooks = await prisma.bookAccess.findMany({
      where: {
        userId: session.user.id
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

    // Transform the data to a more convenient format
    const books = userBooks.map(({ book, accessType }) => ({
      ...book,
      accessType,
      chapters: book.chapters
    }));

    return NextResponse.json({ books });
  } catch (error) {
    console.error('Error fetching user books:', error);
    return NextResponse.json(
      { error: 'Failed to fetch books' },
      { status: 500 }
    );
  }
}